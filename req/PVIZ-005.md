# PVIZ-005 Requirements: Pourover Coffee Grounds As Particles

**Status:** Draft  
**Area:** Simulation / visualization  
**Architecture:** [Architecture.md](../Architecture.md)

## Goal

Represent pourover coffee grounds as many discrete particles of varying sizes instead of one continuous puck, so grind distribution and fines behavior are visually legible.

## In Scope

- Coffee-bed representation using individual particles.
- Variable particle sizes driven by selectable grinder profile.
- Support for three initial grinder profile shapes:
  - single normal hill;
  - bimodal fine/coarse hills;
  - normal hill plus fine-end spike.
- Main normal-hill particle cap fixed at approximately `200`.
- Deterministic particle generation for a given seed and parameter set.

## Out Of Scope

- Physically validated real-world PSD from measured grinder output.
- 3D particle physics (collision/settling/packing solver).
- Micron-calibrated particle-size fidelity.
- Recipe persistence or grinder-profile library management.

## Functional Requirements

### FR1. Particle-Based Bed

- Grounds are rendered as many individual particles.
- Particles have varied size and position and visually form the coffee bed.
- Rendering must remain stable and readable in the default scene.

### FR2. Main Hill Cap

- The main normal-distribution hill is capped at `200` particles.
- Define `N_main = min(requestedMainParticles, 200)`.
- Main-hill cap remains enforced regardless of profile selection.

### FR3. Grinder Profiles

Support these profiles in MVP:

- `uniform-grinder`: one normal distribution spanning fine-to-coarse range.
- `bad-grinder`: two normal hills, one fine and one coarse.
- `uniform-with-fine-spike`: main normal hill plus extra fine-end spike.

### FR4. Fines Handling

- Fines introduced by profile-specific behavior are additive to `N_main`.
- Added fines must stay in a fine-size band and be visually distinguishable as smaller particles.
- Total particle count should stay performant for real-time animation.

### FR5. Determinism

- Same seed + same profile + same parameters must generate the same particle field.
- Changing profile or parameters must visibly alter the distribution result.

## Units And Formulas

- Particle size uses relative visual simulation units (dimensionless), not microns.
- `uniform-grinder`: sample all `N_main` from one normal distribution.
- `bad-grinder`: split `N_main` into fine/coarse hills using normalized weights (`fineHillWeight + coarseHillWeight = 1`).
- `uniform-with-fine-spike`: sample `N_main` from normal hill and add `N_fine_spike = round(N_main * fineSpikeRatio)` in fine band.
- Apply min/max visual size clamping to prevent unstable rendering.

## MVP Defaults (V1)

- `requestedMainParticles = 200` (fixed in MVP controls).
- `N_main = 200` by default, still enforced by `N_main = min(requestedMainParticles, 200)`.
- `defaultSeed = 42` for deterministic generation unless user randomizes seed later.
- `sizeClampMin = 0.4`, `sizeClampMax = 1.8` in relative visual units.
- `uniform-grinder` defaults:
  - `mean = 1.0`
  - `stdDev = 0.22`
- `bad-grinder` defaults:
  - `fineHillWeight = 0.5`
  - `coarseHillWeight = 0.5`
  - `fineMean = 0.72`, `fineStdDev = 0.10`
  - `coarseMean = 1.32`, `coarseStdDev = 0.16`
- `uniform-with-fine-spike` defaults:
  - base hill uses `uniform-grinder` defaults
  - `fineSpikeRatio = 0.25`
  - fine spike band centered near `0.62` with `stdDev = 0.06`
- Suggested MVP particle budget target:
  - `N_total_target <= 260` (main hill plus additive fines) to preserve smooth real-time rendering.

## Acceptance Criteria

- Coffee bed is visibly composed of many separate particles with varied sizes.
- Main-hill particle count never exceeds `200`.
- Profile switching changes observed size distribution shape.
- `bad-grinder` shows two visible clusters.
- `uniform-with-fine-spike` shows a clear fine-end increase.
- Re-running with identical seed/profile/inputs reproduces the same arrangement.
- Default profile parameters above can be used directly without additional tuning for first implementation.

## Extension Points

- Add profile presets (named grinders) without changing renderer contract.
- Add controls for hill weights, spike ratio, and variance in advanced mode.
- Add measured PSD import in future versions.
