# PVIZ-010 Requirements: Extraction Start Gate And Finite-Pool Kinetics

**Status:** Draft  
**Area:** Simulation / extraction kinetics  
**Architecture:** [Architecture.md](../Architecture.md)  
**Theory:** [Theory.md](../Theory.md)

## Goal

Define a minimal extraction model that is inactive before start conditions and then follows a finite-pool kinetic law with deterministic updates.

## Depends On

- [PVIZ-008.md](PVIZ-008.md)
- [PVIZ-009.md](PVIZ-009.md) (optional if kinetics references permeability)

## In Scope

- Explicit extraction start gate.
- Finite-pool extraction ODE and discrete timestep update.
- Core extraction outputs for charting and UI.

## Out Of Scope

- Thermal multiplier details (PVIZ-011).
- Outflow concentration/flux transport (PVIZ-012).

## Functional Requirements

### FR1. Start Gate

- Extraction stays inactive until documented conditions are true (for example wetting threshold and positive through-flow).
- Before start, `extractionMass` remains unchanged.

### FR2. Finite-Pool Kinetics

- Use finite-pool form consistent with [Theory.md](../Theory.md):
  - `dM_ext/dt = k_ext_eff * (M_ext_max - M_ext)`
- Update with deterministic timestep integration and clamp to `[0, M_ext_max]`.

### FR3. Required Outputs

- Expose at minimum:
  - `extractionRateGPerSec`
  - `extractionMassG`
  - `extractionYieldPercent` (or documented normalized equivalent)

## Units And Formulas

- Dose basis for yield must be explicit in docs/comments.
- If normalized extraction is shown in UI, conversion formula is documented.

## MVP Defaults (V1)

- Single extractable pool.
- One effective kinetic constant `k_ext_eff` (before thermal split).

## User-Facing Observables (MVP)

- `ExtractionStarted` (boolean): true only after start-gate conditions are met.
- `ExtractionRateGPerSec` (`g/s`): instantaneous dissolved-mass generation rate.
- `ExtractedMassG` (`g`): cumulative extracted mass in model scope.
- `ExtractionYieldPercent` (`%` dose basis): normalized extraction progress for easy recipe comparison.
- `TimeSinceExtractionStartSec` (`s`): helps users compare curves independent of bloom timing.

## Expected Observable Behavior In The Simulation

- Before start-gate conditions are met, `ExtractionStarted` remains false and extraction values stay flat.
- Once start conditions are met, `ExtractionStarted` flips true and `ExtractionRateGPerSec` rises above zero.
- `ExtractionRateGPerSec` should generally decline over time as the extractable pool is depleted.
- `ExtractedMassG` should be monotonic non-decreasing and approach a plateau near `M_ext_max`.
- `ExtractionYieldPercent` should show diminishing returns over long brew contact.
- Replaying the same brew timeline should reproduce the same extraction curve shape and values.

## Acceptance Criteria

- `extractionMassG` remains flat before start conditions.
- After start, `extractionMassG` is monotonic non-decreasing.
- `extractionMassG` never exceeds `M_ext_max`.
- Repeated runs with same inputs/time give identical extraction traces.

## Extension Points

- Two-pool fast/slow extraction.
- Spatial extraction fields in bed layers.
