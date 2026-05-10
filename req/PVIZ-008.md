# PVIZ-008 Requirements: Darcy Hydraulics Core

**Status:** Draft  
**Area:** Simulation / hydraulics core  
**Architecture:** [Architecture.md](../Architecture.md)  
**Theory:** [Theory.md](../Theory.md)

## Goal

Introduce a small, deterministic hydraulics core using Darcy-based flow so downstream tickets can depend on stable flow and pressure signals.

## Depends On

- Theory reference only (no prior PVIZ dependency).

## In Scope

- Pressure-head signal from water height.
- Effective pressure drop with non-negative clamp.
- Through-bed Darcy flow and optional outlet clamp.
- Conversion from volumetric flow to mass flow (`g/s`) used by app state.

## Out Of Scope

- Particle-size coupling to permeability (handled in PVIZ-009).
- Extraction kinetics (handled in PVIZ-010).
- Thermal effects (handled in PVIZ-011).

## Functional Requirements

### FR1. Pressure And Darcy Flow Outputs

- Compute and expose `pressureHeadPa` from slurry/water head.
- Compute `effectivePressurePa = max(pressureHeadPa - pressureLossPa, 0)`.
- Compute through-bed flow from Darcy formulation consistent with [Theory.md](../Theory.md).

### FR2. Optional Outlet Restriction

- If outlet-limited behavior is enabled, cap flow by a named outlet limit (`qOutletMax`).
- Output path must still be deterministic for same inputs/time.

### FR3. State Fields And Units

- Expose at minimum:
  - `outflowRateGPerSec`
  - `pressureHeadPa` (or documented normalized proxy)
  - `effectivePressurePa` (or documented normalized proxy)
- If normalized proxies are used in rendering state, mapping from physical values must be documented.

## Units And Formulas

- Darcy form: `q = (k * A / (mu * L)) * DeltaP`.
- Head pressure: `DeltaP_head = rho * g * h_water`.
- Mass-flow conversion: `mDot = rho * q` and convert to `g/s` for shared state.

## MVP Defaults (V1)

- Use water density approximation appropriate for educational model.
- Use a single effective bed path (`k_eff`, `A_eff`, `L_eff`) before resistance splitting.
- Keep all coefficients explicit and named.

## User-Facing Observables (MVP)

- `WaterHeadCm` (cm): current slurry/water head above bed; explains pressure changes.
- `PressureHeadKPa` (kPa or normalized bar): gravity-driven pressure term.
- `EffectivePressureKPa` (kPa or normalized): pressure after modeled losses and floor at zero.
- `OutflowRateGPerSec` (`g/s`): modeled drain rate from slurry to cup path.
- `OutletLimited` (boolean badge): indicates when outlet cap, not bed flow, is the active limiter.

## Expected Observable Behavior In The Simulation

- During active pour, `WaterHeadCm` rises and `OutflowRateGPerSec` should increase after a short hydraulic response, not jump randomly frame-to-frame.
- If inflow exceeds outflow, bed water level continues rising; if outflow catches up, level growth slows or plateaus.
- When pour rate is reduced or stopped, `WaterHeadCm` falls and `OutflowRateGPerSec` decays smoothly during drawdown.
- Increasing resistance/loss settings at fixed pour lowers `EffectivePressureKPa` impact and produces lower `OutflowRateGPerSec`.
- When outlet cap is the limiter, increasing head further should not raise outflow proportionally; `OutletLimited` remains true.
- Replaying identical parameters and timeline should reproduce the same head and flow traces.

## Acceptance Criteria

- Increasing water head increases output flow (with other terms fixed).
- Increasing pressure losses decreases output flow.
- Re-running same params/time produces identical hydraulic outputs.
- Output units are documented and consistent with state names.

## Extension Points

- Split resistance into bed and filter components.
- Replace static losses with geometry-dependent loss term.
