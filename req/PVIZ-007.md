# PVIZ-007 Requirements: Extraction Model, Particle Size, And Extracted Coffee In Outflow

**Status:** Draft  
**Area:** Simulation / extraction physics (heuristic layer)  
**Architecture:** [Architecture.md](../Architecture.md)  
**Theory:** [Theory.md](../Theory.md)

## Goal

Introduce an explicit **extraction model** that starts when brewing begins (water contacts the coffee bed and transport is active), produces an **extraction curve over simulation time**, exposes **particle-size effects on extraction rate and limiting mechanisms**, and yields a **representation of dissolved solids carried in the drip/outflow** suitable for visualization and educational overlays.

This document specifies **requirements only**. Equation-level contracts (Darcy’s law, permeability coupling, extraction ODE, outflow mass accounting) live in [Theory.md](../Theory.md); implementations should follow that reference unless a ticket explicitly overrides it.

## Definitions

- **Extraction (brew yield context):** Fraction or percentage of origin bean mass moved into the beverage phase within the modeled scope (bed + carried to outlet), expressed consistently with chosen accounting (mass basis preferred for MVP alignment with existing `g/s` flow signals).
- **Particle size:** Effective grind metric already implied by grinder profiles or discrete particle samples (e.g., characteristic diameter, distribution moments, or bin masses). Requirements treat size as an input that modulates surface-area scaling and transport pathways.
- **Outflow coffee:** Liquid leaving the brewer toward the cup; requirements distinguish **bulk flow rate** from **extractives flux** (dissolved solids carried by that flow).

## In Scope

- Time evolution of extraction state once water–coffee contact and hydraulic throughput support extraction (model **start conditions** and progression).
- A documented **extraction curve**: extraction vs time (and optionally vs cumulative brew mass), suitable for plotting or driving visual intensity.
- **Sensitivity of extraction** to particle size / grind distribution parameters within the existing heuristic philosophy (educational, not research-grade CFD).
- Coupling **extractives concentration or mass flux** in outflow to extraction progression and hydraulics (flow-through dilution, bypass conceptualization as applicable).
- Deterministic outputs given fixed inputs and timestep policy (consistent with Architecture validation expectations).

## Out Of Scope

- Full chemical speciation (individual acids, sugars, lipids) beyond aggregate “extractives” or tiered early/late proxies if needed later.
- Laboratory calibration to specific coffees or roast chemistry.
- Mesh-resolved multi-phase CFD or per-particle diffusion simulation unless explicitly added in a future requirement.
- UI polish beyond what existing aspects already provide (separate visualization tickets may reference outputs from this model).

## Functional Requirements

### FR1. Extraction Model Start And Progress

- Extraction state **remains inactive** until brewing conditions satisfy explicit start rules (e.g., minimum wetting/saturation, positive interstitial flow, or elapsed wetting delay—exact rule is an implementation detail but must be stated in simulation docs/comments).
- After start, extraction metrics **monotonically accumulate** subject to documented saturation/diminishing-return behavior (extraction rate may fall toward zero even while flow continues).
- The model exposes **at minimum**: instantaneous extraction rate, cumulative extraction metric, and normalized extraction suitable for an **extraction-vs-time curve**.

### FR2. Extraction Modeling Equation (Extraction Curve)

- Requirements must define the **outputs** of the extraction law, not only hidden internals:
  - `extractionMass` or equivalent cumulative scalar tracked over simulation time.
  - Optional normalized forms (`extractionYield`, `extractionPercent`) with explicit basis (dose vs beverage vs slurry—pick one primary basis for MVP and document it).
- The extraction curve must support **two-axis presentation**:
  - primary: extraction vs `t`;
  - optional secondary: extraction vs cumulative **outflow mass** or cumulative poured mass if those scalars exist in simulation state.
- The law must incorporate **explicit assumptions** in code-adjacent documentation: e.g., first-order toward a finite extractable pool, two-compartment fast/slow, or empirical logistic—**chosen representation must be justified briefly** for educators reading the source.

### FR3. Effects Of Particle Size On Extraction

- Particle size inputs must affect **at least one** of:
  - effective surface area per mass (finer → higher initial rate within hydraulic limits);
  - intra-bed resistance / permeability coupling (finer → higher resistance, potentially lowering throughput unless compensated);
  - fines-driven clogging interaction where already modeled (tie-in to clogging aspect without circular undefined references).
- The requirement set must specify **directional sanity**: within identical pour schedule and dose, **finer grind does not unconditionally produce lower extraction** unless justified by a simultaneous hydraulic penalty that is also surfaced as a measurable state (so the UI can explain “stall lowered contact efficiency”).
- If the app uses a distribution (not a single diameter), requirements demand **which aggregate** drives extraction scaling (e.g., Sauter mean, mass-weighted fine fraction).

### FR4. Modeling Extracted Coffee In Flow Out

- Outflow must carry an **extractives signal** compatible with visualization:
  - either **mass flux of extractives** [`g_extractives/s`] **or** **concentration** [`g_extractives / g_liquid`] paired with bulk `outflowRateGPerSec`.
- Extractives leaving via outflow must **mass-balance loosely** with cumulative extraction under stated assumptions (allow residual extractives in bed/porous media if documented).
- During phases with non-zero outflow, concentration behavior must avoid contradictory scenarios unless explicitly modeled (e.g., pure water drip late in a bypass-heavy regime—if represented, requirements must allow stratification/bypass channel assumptions).

### FR5. Integration With Existing Simulation State

- New fields integrate with `simulationState` (or successor) without breaking serialization/play determinism goals.
- Existing aspects (`flow`, `pressure`, `clogging`, `extraction`, `combined`) gain **defined data dependencies**: extraction aspect consumes the new extraction curve data; combined aspect defines precedence when signals overlap.

### FR6. Hydraulics Consistent With Theory

- Through-bed / filter-limited flow must be consistent with the **Darcy-based formulation** and variable contracts in [Theory.md](../Theory.md) (including mass-flow conversion when state uses `g/s`).
- Particle size and fines/clogging must affect **named** hydraulic coefficients (e.g. permeability, effective path length, or series resistance), not implicit timing-only hacks.
- Extraction rate composition, thermal coupling options, and outflow extractives bookkeeping must align with the same document unless superseded by a written requirement.

## Units And Naming

- Prefer **`g/s`** for bulk liquid flow consistent with current state naming (`*GPerSec`).
- Name extractives flux distinctly from water flux, e.g. `extractivesOutflowRateGPerSec` or pair `outflowExtractivesConcentration` with bulk rate—avoid ambiguous `outflowRate` reuse.

## MVP Defaults (Proposal — Confirm Before Implementation)

- Single **extractable pool** proportional to dose with first-order kinetics toward an asymptote, modulated by temperature/contact proxies already in heuristic model when available.
- Primary extraction basis: **percentage of dose** for user familiarity; internally keep mass consistent.
- Particle size effect: surface-area scaling \(\propto 1/\text{characteristic diameter}\) bounded by min/max multipliers to prevent numerical extremes.

## Acceptance Criteria

- With fixed inputs and deterministic timestep, repeated runs produce **identical** extraction curves and outflow extractives traces.
- Changing grind/particle-size controls produces **visible and explainable** changes to extraction curve shape **and** at least one hydraulic/clogging-adjacent signal when fines effects are engaged.
- At any simulation instant, **outflow extractives metrics** can be derived from [Theory.md](../Theory.md) (plus ticket-local overrides) without undocumented magic constants in code.
- Extraction **does not advance** before the documented start condition; after start, cumulative extraction advances until stopped or brew ends.

## Extension Points

- Multi-component extraction (acid vs sugar proxies) for “early/late” overlays already hinted in architecture state.
- Temperature decay lowering kinetic constants over brew time.
- Bypass fraction splitting outlet concentration between “weak channel” and “bed” sources.
- Calibration hooks mapping dimensionless model coefficients to user-visible “roast solubility” sliders.

## References

- [Theory.md](../Theory.md) — Darcy’s law, coupled equations, and mass-accounting conventions for implementers.
- Project skill: `.cursor/skills/coffee-brewing-physics/SKILL.md` (mental model alignment for teaching copy and parameter suggestions).
