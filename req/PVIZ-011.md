# PVIZ-011 Requirements: Minimal Thermal Coupling

**Status:** Draft  
**Area:** Simulation / thermal effects  
**Architecture:** [Architecture.md](../Architecture.md)  
**Theory:** [Theory.md](../Theory.md)

## Goal

Add minimal temperature coupling so extraction and/or hydraulics respond directionally to slurry cooling without requiring a full thermal solver.

## Depends On

- [PVIZ-008.md](PVIZ-008.md)
- [PVIZ-010.md](PVIZ-010.md)

## In Scope

- Temperature state or proxy over brew time.
- One of:
  - thermal multiplier on extraction kinetics; or
  - temperature-dependent viscosity in hydraulics.
- Documented fallback cooling profile.

## Out Of Scope

- Full heat-transfer model across vessel walls and ambient.
- Method-specific thermal calibration.

## Functional Requirements

### FR1. Temperature Signal

- The simulation exposes a temperature signal (`slurryTempC` or normalized equivalent) over time.
- If direct simulation is unavailable, use documented simplified cooling profile.

### FR2. Coupling Path

- At least one coupling is mandatory:
  - `k_ext_eff = k_ext_ref * f_T(T)`; or
  - `mu = mu(T)` used in hydraulic flow term.
- Chosen path must be explicit in requirement notes and implementation comments.

### FR3. Deterministic Behavior

- Thermal evolution and coupling output are deterministic for fixed inputs/time.

## Units And Formulas

- Temperature unit is explicit (`C` preferred).
- If normalized thermal factor is used, min/max bounds are documented.

## MVP Defaults (V1)

- Simple exponential cooling profile is acceptable.
- Start with extraction-side coupling first unless hydraulic-side coupling is simpler in code.

## User-Facing Observables (MVP)

- `SlurryTempC` (`C`): modeled slurry temperature over time.
- `ThermalFactorIndex` (normalized): multiplier applied to kinetics and/or viscosity path.
- `CoolingRateCPerMin` (`C/min`, optional): readable cooling speed indicator.
- `ViscosityIndex` (normalized, if hydraulic thermal coupling is active): relative viscosity shift versus reference.
- `ThermalMode` (enum): active coupling path (`kinetics`, `viscosity`, or `both`).

## Expected Observable Behavior In The Simulation

- Higher initial brew temperature should increase early extraction speed and/or flow, depending on active `ThermalMode`.
- `SlurryTempC` should decline smoothly over time with the configured cooling profile.
- As temperature falls, `ThermalFactorIndex` should move toward weaker extraction contribution and/or higher viscosity effect.
- If viscosity coupling is active, later-stage flow should be slightly lower than an isothermal run with the same controls.
- If kinetics coupling is active, extraction curve slope should be steeper early and flatter later as slurry cools.
- Running the same initial temperature and timeline should reproduce identical thermal and extraction traces.

## Acceptance Criteria

- Raising initial temperature increases early extraction rate and/or flow under same setup.
- Cooling over time reduces thermal contribution predictably.
- No random thermal jitter appears between identical runs.

## Extension Points

- Separate slurry and bed-core temperatures.
- Add pour-temperature pulse effects for multi-pour schedules.
