# PVIZ-012 Requirements: Outflow Extractives Transport And Accounting

**Status:** Draft  
**Area:** Simulation / outflow chemistry proxy  
**Architecture:** [Architecture.md](../Architecture.md)  
**Theory:** [Theory.md](../Theory.md)

## Goal

Define how extracted coffee is represented in outflow so UI and diagnostics can read concentration or extractives flux consistently.

## Depends On

- [PVIZ-010.md](PVIZ-010.md)
- [PVIZ-011.md](PVIZ-011.md) (optional)

## In Scope

- One explicit representation path:
  - concentration-first, or
  - flux-first.
- Derived secondary quantity (`C_out` or `mDot_ext_out`).
- Mass-accounting fields for extracted mass destinations.

## Out Of Scope

- Multi-component chemistry (acid/sugar/oil species).
- Empirical calibration to lab TDS/EY datasets.

## Functional Requirements

### FR1. Outflow Representation Choice

- Implementation must choose and document one primary representation:
  - `C_out` with derived `mDot_ext_out`, or
  - `mDot_ext_out` with derived `C_out`.
- Both values must be available to downstream visualization/state consumers.

### FR2. Robust Conversion

- Conversion must include a low-flow guard (`eps`) to avoid division spikes.
- Zero-liquid-outflow phase must not produce undefined concentration.

### FR3. Mass Accounting

- Track cumulative outflow extractives (`M_ext_out_cup`) and provide clear relationship to total extracted mass.
- If retained extractives are modeled, retained term is explicit and named.

## Units And Formulas

- `C_out` in `g_extractives / g_liquid`.
- `mDot_ext_out` in `g_extractives/s`.
- Accounting relation consistent with [Theory.md](../Theory.md).

## MVP Defaults (V1)

- Start with concentration-first representation.
- Keep retained term optional but explicit when enabled.

## User-Facing Observables (MVP)

- `OutflowExtractivesConcentration` (`g_extractives/g_liquid`): strength of liquid leaving the bed.
- `ExtractivesOutflowRateGPerSec` (`g/s`): extractives mass reaching cup path per second.
- `CumulativeExtractivesToCupG` (`g`): total extracted mass delivered to cup so far.
- `RetainedExtractivesG` (`g`, optional): extracted mass still retained in bed/liquid phase.
- `AccountingResidualG` (`g`, debug/readout): mass-balance gap; should stay near zero in normal runs.

## Expected Observable Behavior In The Simulation

- `OutflowExtractivesConcentration` should rise after extraction begins, then trend downward as extraction potential is depleted or diluted.
- `ExtractivesOutflowRateGPerSec` should reflect both concentration and liquid outflow; it can fall even when outflow remains non-zero.
- `CumulativeExtractivesToCupG` should be monotonic non-decreasing throughout brew progression.
- During zero-liquid-outflow intervals, extractives outflow rate should drop to zero (unless delayed-release mode is explicitly enabled).
- `AccountingResidualG` should remain near zero and should not drift over time in normal deterministic runs.
- Replaying the same timeline should reproduce identical concentration and extractives-flow traces.

## Acceptance Criteria

- For any timestep, `C_out` and `mDot_ext_out` are both derivable and finite.
- Outflow extractives cease when liquid outflow is zero (unless explicitly modeling delayed release with documented logic).
- Mass-accounting terms are documented and deterministic.

## Extension Points

- Bypass split: separate weak-channel and bed-contact concentration paths.
- Aspect-specific concentration smoothing for readability.
