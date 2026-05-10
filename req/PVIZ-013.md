# PVIZ-013 Requirements: Extraction Data Contract For Aspects

**Status:** Draft  
**Area:** Simulation state / aspect integration  
**Architecture:** [Architecture.md](../Architecture.md)  
**Theory:** [Theory.md](../Theory.md)

## Goal

Define a small integration contract so new hydraulics/extraction/outflow fields are consumable by `extraction` and `combined` aspects without ambiguity.

## Depends On

- [PVIZ-008.md](PVIZ-008.md)
- [PVIZ-009.md](PVIZ-009.md)
- [PVIZ-010.md](PVIZ-010.md)
- [PVIZ-012.md](PVIZ-012.md)

## In Scope

- Shared simulation-state field contract.
- Required aspect dependencies for extraction and combined views.
- Deterministic playback/scrub expectations for new fields.

## Out Of Scope

- Visual styling redesign.
- Method-specific scene changes outside state wiring.

## Functional Requirements

### FR1. Shared State Fields

- Simulation state includes explicit extraction-related fields with documented units/norms.
- Field naming distinguishes liquid flow vs extractives flow.

### FR2. Aspect Data Dependencies

- `extraction` aspect reads extraction progression and outflow extractives fields.
- `combined` aspect includes these fields with defined precedence so overlays remain interpretable.

### FR3. Deterministic Time Access

- Scrubbing to same time and parameters yields same extraction/outflow aspect inputs.
- No hidden renderer-only random sources alter extraction aspect behavior.

## Units And Naming

- Keep `*GPerSec` suffix for mass-rate fields.
- Keep concentration fields explicitly named as concentration.

## MVP Defaults (V1)

- Keep contract minimal and forward-compatible.
- Prefer additive state fields over breaking renames.

## User-Facing Observables (MVP)

- `ExtractionCurve` (time-series): user-facing chart of `ExtractionYieldPercent` or `ExtractedMassG` vs time.
- `OutflowStrengthCurve` (time-series): `OutflowExtractivesConcentration` vs time for flavor-intensity intuition.
- `FlowVsExtractionOverlay` (paired readout): `OutflowRateGPerSec` and `ExtractionRateGPerSec` shown together.
- `CurrentLimiterTag` (badge): current dominant limiter from hydraulic model (`bed`, `filter`, `outlet`).
- `DeterminismFingerprint` (optional hash/version): confirms same params + same time maps to same state snapshot.

## Expected Observable Behavior In The Simulation

- `ExtractionCurve` should be flat before extraction start, then increase with a diminishing slope.
- `OutflowStrengthCurve` should show early strength build-up followed by gradual decline during later brew stages.
- `FlowVsExtractionOverlay` should make trade-offs visible (for example, high flow with low contact can reduce extraction rate).
- `CurrentLimiterTag` should switch coherently when the dominant bottleneck changes (for example from bed resistance to outlet cap).
- Scrubbing to a timestamp and returning should reproduce the same plotted point values and badges.
- If enabled, `DeterminismFingerprint` should remain identical for same inputs and simulation time.

## Acceptance Criteria

- Extraction and combined aspects can render from state without additional ad-hoc calculations.
- Ambiguous names like plain `outflowRate` are avoided when extractives flow is present.
- State snapshots serialize with all required fields for deterministic replay.

## Extension Points

- Add per-layer extraction fields for richer overlays.
- Add method-capability flags when future brew methods partially support extraction transport.
