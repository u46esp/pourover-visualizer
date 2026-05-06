# PVIZ-006 Requirements: Pourover Water Stream Width And Smooth Flow-Out

**Status:** Draft  
**Area:** Visualization / animation polish  
**Architecture:** [Architecture.md](../Architecture.md)

## Goal

Improve water-stream readability with a small scoped update:

- flow-in and flow-out stream widths must visually correspond to their flow rates;
- flow-out animation must appear smooth (no jumpy/stuttery thickness or droplet motion).

## In Scope

- Width mapping for input stream based on `inflowRateGPerSec`.
- Width mapping for output stream based on `outflowRateGPerSec`.
- Temporal smoothing for flow-out visual signal used by stream thickness and droplet animation.
- Flow-in stream must be straight line (not curve)
- Keep existing scene style and layout.

## Out Of Scope

- New physics model for water.
- Changes to core pourover heuristic equations.
- New UI controls for stream style tuning.
- Method-specific variations beyond pourover.

## Functional Requirements

### FR1. Flow-Rate-Coupled Width

- Flow-in stream width increases with `inflowRateGPerSec` and decreases when inflow drops.
- Flow-out stream width increases with `outflowRateGPerSec` and decreases when outflow drops.
- Width mapping must be monotonic and clamped to safe visual bounds.

### FR2. Smooth Flow-Out Animation

- Flow-out rendering uses a smoothed signal, not raw per-frame jitter.
- Smoothed flow-out drives:
  - output stream thickness;
  - droplet size;
  - droplet travel speed/progress.
- Transition should be responsive but visually continuous during normal playback.

### FR3. Deterministic Playback

- Given identical parameters and playback time, rendered flow-out state is reproducible.
- Smoothing behavior must be deterministic (no random jitter source).

## Units And Formulas

- Source rates remain in `g/s` from simulation state:
  - `inflowRate = state.inflowRateGPerSec`
  - `outflowRate = state.outflowRateGPerSec`
- Normalize each stream rate:
  - `inNorm = clamp01(inflowRate / inRefRate)`
  - `outNormRaw = clamp01(outflowRate / outRefRate)`
- Width mapping:
  - `inWidthPx = lerp(inMinWidthPx, inMaxWidthPx, inNorm)`
  - `outWidthPx = lerp(outMinWidthPx, outMaxWidthPx, outNormSmooth)`
- Flow-out smoothing (EMA):
  - `alpha = 1 - exp(-dtSec / tauSec)`
  - `outNormSmooth = outNormSmooth + alpha * (outNormRaw - outNormSmooth)`

## MVP Defaults (V1)

- `inRefRate = 10 g/s`
- `outRefRate = 10 g/s`
- `inMinWidthPx = 2.0`, `inMaxWidthPx = 8.0`
- `outMinWidthPx = 1.4`, `outMaxWidthPx = 6.5`
- `tauSec = 0.16` for flow-out smoothing
- Droplet count remains unchanged unless required for smoothness.

## Acceptance Criteria

- Increasing pour rate visibly thickens flow-in stream.
- Decreasing pour rate visibly thins flow-in stream.
- Increasing outflow visibly thickens flow-out stream.
- Flow-out thickness and droplet motion remain smooth during continuous playback and parameter changes.
- No obvious one-frame pop/spike in flow-out thickness under normal scrubbing and play.
- All changes preserve existing FPS/scene responsiveness for MVP.

## Extension Points

- Separate smoothing constants for thickness vs droplet speed.
- Nonlinear width curves (e.g., gamma/ease) for perceived realism.
- Aspect-dependent stream styling for flow vs pressure views.

