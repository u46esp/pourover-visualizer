# PVIZ-005 Requirements: Pourover Coffee Grounds As Particles

**Status:** Done  
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

- `uniform-grinder` / **Zero Fines**: right-skewed main hill with fines excluded.
- `uniform-with-fine-spike` / **Uniform**: right-skewed main hill plus extra fine-end spike.
- `bad-grinder` / **Typical Grinder**: two normal hills, one fine and one coarse.

### FR4. Fines Handling

- Fines introduced by profile-specific behavior are additive to `N_main`.
- Added fines must stay in a fine-size band and be visually distinguishable as smaller particles.
- Total particle count should stay performant for real-time animation.

### FR5. Determinism

- Same seed + same profile + same parameters must generate the same particle field.
- Changing profile or parameters must visibly alter the distribution result.

### FR6. Fine Classification And Optional Highlighting

- The simulation layer classifies each generated particle as either `fine` or `normal`.
- Fine classification is based on relative particle size, not rendering color.
- Fine highlighting is controlled by an explicit user input and is off by default.
- When enabled, fine particles use a more distinctive coffee-themed color while preserving the overall visual style.
- Fine classification should be available for future simulation features beyond visual highlighting.

## Units And Formulas

- Particle size uses relative visual simulation units (dimensionless), not microns.
- `uniform-grinder` / **Zero Fines**: sample all `N_main` from a right-skewed normal distribution (Azzalini skew-normal with skew parameter `alpha`) and truncate below the fine threshold.
- `uniform-with-fine-spike` / **Uniform**: sample `N_main` from the right-skewed main hill and add `N_fine_spike = round(N_main * fineSpikeRatio)` in the fine band.
- `bad-grinder` / **Typical Grinder**: split `N_main` into fine/coarse hills using normalized weights (`fineHillWeight + coarseHillWeight = 1`).
- Apply min/max visual size clamping to prevent unstable rendering.
- Visual draw radius is derived from size with a formula that gives the smallest particles roughly `0.25x..0.5x` the radius of the largest particles.
- Fine particles are defined as particles with `size <= fineSizeThreshold`.

## Visual Radius Mapping

- Draw radius (in pixels): `radius(size) = 1 + size * 3`.
- At `sizeClampMin = 0.25`: `radius ≈ 1.75` px.
- At `sizeClampMax = 1.8`: `radius ≈ 6.4` px.
- Smallest-to-largest radius ratio ≈ `0.27` (within `0.25x..0.5x` requirement).

## MVP Defaults (V1)

- `requestedMainParticles = 200` (fixed in MVP controls).
- `N_main = 200` by default, still enforced by `N_main = min(requestedMainParticles, 200)`.
- `defaultSeed = 42` for deterministic generation unless user randomizes seed later.
- `highlightFines = false` by default.
- `fineSizeThreshold = 0.58`.
- `sizeClampMin = 0.25`, `sizeClampMax = 1.8` in relative visual units.
- `uniform-grinder` / **Zero Fines** defaults:
  - `mean = 1.0`
  - `stdDev = 0.22`
  - `skewAlpha = 2.0` (right skew; longer coarse-end tail)
- `uniform-with-fine-spike` / **Uniform** defaults:
  - base hill uses Zero Fines defaults before additive fine spike
  - `fineSpikeRatio = 0.25`
  - fine spike band centered near `0.40` with `stdDev = 0.08`
- `bad-grinder` / **Typical Grinder** defaults:
  - `fineHillWeight = 0.5`
  - `coarseHillWeight = 0.5`
  - `fineMean = 0.5`, `fineStdDev = 0.10`
  - `coarseMean = 1.32`, `coarseStdDev = 0.16`
- Suggested MVP particle budget target:
  - `N_total_target <= 260` (main hill plus additive fines) to preserve smooth real-time rendering.

## Acceptance Criteria

- Coffee bed is visibly composed of many separate particles with varied sizes.
- Main-hill particle count never exceeds `200`.
- Profile switching changes observed size distribution shape.
- **Zero Fines** does not generate particles classified as `fine`.
- **Typical Grinder** shows two visible clusters.
- **Uniform** shows a clear fine-end increase.
- Re-running with identical seed/profile/inputs reproduces the same arrangement.
- Default profile parameters above can be used directly without additional tuning for first implementation.
- Fine particles are classified in generated particle data even when highlighting is off.
- Fine highlighting can be toggled on/off without changing particle positions or physics.

## Extension Points

- Add profile presets (named grinders) without changing renderer contract.
- Add controls for hill weights, spike ratio, and variance in advanced mode.
- Add measured PSD import in future versions.