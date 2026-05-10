# PVIZ-009 Requirements: Bed And Filter Resistance Coupling

**Status:** Draft  
**Area:** Simulation / permeability and resistance  
**Architecture:** [Architecture.md](../Architecture.md)  
**Theory:** [Theory.md](../Theory.md)

## Goal

Add a small requirement slice that makes grind and bed-state variables influence hydraulic resistance through named coefficients.

## Depends On

- [PVIZ-008.md](PVIZ-008.md)

## In Scope

- Effective permeability function with named factors.
- Optional series resistance split (`R_bed`, `R_filter`).
- Directional constraints for grind-size behavior.

## Out Of Scope

- Extraction ODE behavior (PVIZ-010).
- Temperature-dependent viscosity (PVIZ-011).

## Functional Requirements

### FR1. Named Coupling Function

- Hydraulics uses a documented coupling function equivalent to:
  - `k_eff = k0 * f_size(d_char) * f_clog(phi_fines) * f_compaction(phi_pack)`
- Each factor must map to a named control/state variable.

### FR2. Directional Sanity

- Finer grind must not increase permeability unless explicitly overridden by documented condition.
- Increasing fines/clog state must not increase permeability.
- Increasing compaction/packing severity must not increase permeability.

### FR3. Optional Resistance Split

- If implemented, bed and filter resistances are separate named terms and combine in series.
- If not split, a single effective resistance term remains explicitly documented.

## Units And Formulas

- Must stay traceable to Darcy variables (`k`, `A`, `L`, `mu`, `DeltaP`).
- If normalized factors are used (`0..1` or bounded multipliers), bounds are documented.

## MVP Defaults (V1)

- Use bounded multipliers to avoid numerical extremes.
- Use characteristic particle size from existing grinder profile state.

## User-Facing Observables (MVP)

- `EffectivePermeabilityIndex` (normalized): how open the bed is after size/fines/packing effects.
- `ResistanceBedIndex` (normalized): bed contribution to resistance.
- `ResistanceFilterIndex` (normalized, optional): filter contribution when split model is enabled.
- `FineLoadIndex` (normalized): fines/clog severity used by hydraulic coupling.
- `HydraulicLimiter` (enum): which term currently limits flow (`bed`, `filter`, `outlet`, or `none`).

## Expected Observable Behavior In The Simulation

- Moving grind toward finer settings should reduce `EffectivePermeabilityIndex` and lower flow under the same head.
- Increasing fines/clog inputs should progressively increase `ResistanceBedIndex` and/or `ResistanceFilterIndex`.
- At fixed pour and head, higher resistance should produce lower `OutflowRateGPerSec`.
- If split resistance is enabled, users should see whether bed or filter is the dominant limiter via `HydraulicLimiter`.
- Small control changes should produce directional but continuous output changes, not unstable oscillations.
- Repeating identical parameter paths should reproduce the same resistance and flow traces.

## Acceptance Criteria

- Changing grind settings visibly changes outflow via hydraulic path.
- Increasing fines/clog tendency reduces outflow under same head pressure.
- Same seed/inputs/time yields deterministic resistance outputs.

## Extension Points

- Use particle-distribution aggregate (Sauter mean or fine-fraction weighting) instead of single `d_char`.
- Separate dynamic filter loading from bed clogging.
