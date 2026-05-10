# PVIZ-007 Requirements: Temperature Control Aspect For Pourover

**Status:** Done  
**Area:** Simulation / thermal input and readout  
**Architecture:** [Architecture.md](../Architecture.md)

## Goal

Add a simple temperature-control aspect centered on pour-water temperature and dripper-water temperature readout.

This ticket intentionally uses a minimal thermal model for MVP:
- kettle input temperature is user-controlled;
- no thermal loss to environment;
- no heat capacity from dripper, paper, or coffee solids;
- dripper temperature is computed from water-only mixing.

## In Scope

- Kettle temperature input for pour stream.
- Input range constraint: `80C..100C`.
- Dripper temperature state update using only inflow water and remaining water in dripper.
- User-facing dripper readout labeled as `CoffeeBedTempC`.

## Out Of Scope

- Heat transfer to dripper walls, paper, coffee grounds, or air.
- Thermal loss over time during hold/drawdown.
- Method-specific thermal calibration or advanced thermodynamics.

## Functional Requirements

### FR1. Kettle Temperature Input

- Add a pour-water temperature input `kettleTempC` with allowed range `80..100`.
- Input updates affect incoming water temperature immediately for subsequent inflow.
- Out-of-range values must be clamped or rejected with clear UI behavior.

### FR2. Water-Only Dripper Temperature Model

- Dripper thermal state uses only water mass in control volume.
- At each update, dripper temperature is computed by mixing:
  - remaining water in dripper from previous step;
  - newly added inflow water at `kettleTempC`.
- No external loss term is applied (`Q_loss = 0` in MVP assumptions).

### FR3. Coffee Bed Temperature Readout

- Expose dripper-mix temperature to UI as `CoffeeBedTempC`.
- Readout cadence matches simulation updates (same timing convention as flow in/out state).
- Readout remains deterministic for same input timeline and timestep policy.

### FR4. Integration With Flow Signals

- Thermal update must consume existing flow-related quantities (inflow and retained water inventory).
- If no inflow and no loss, temperature remains unchanged between steps.
- If no water remains in dripper, next inflow initializes dripper temperature from inflow temperature.

## Units And Formulas

- Temperature unit: `C`.
- Mass unit for mixing: consistent with existing water inventory state (`g` preferred).
- Reference water-only mixing equation:
  - `T_next = (m_prev * T_prev + m_in * T_in) / max(m_prev + m_in, eps)`
  - where:
    - `T_in = kettleTempC`
    - `T_prev` is previous dripper water temperature
    - `m_prev` is remaining dripper water mass
    - `m_in` is inflow mass for timestep

## MVP Defaults (V1)

- `kettleTempC_default = 92`
- `kettleTempC_min = 80`
- `kettleTempC_max = 100`
- `Q_loss = 0` (no thermal loss)
- thermal masses for dripper, paper, and grounds are ignored

## User-Facing Observables (MVP)

- `KettleTempC` (`C`): current user-selected pour temperature.
- `InflowTempC` (`C`): effective temperature of incoming water stream.
- `CoffeeBedTempC` (`C`): dripper mixed-water temperature readout.
- `TempDeltaInMinusBedC` (`C`): `InflowTempC - CoffeeBedTempC` to show mixing convergence.

## Expected Observable Behavior In The Simulation

- Raising kettle temperature increases `InflowTempC` immediately.
- During active pour, `CoffeeBedTempC` moves toward `InflowTempC` based on inflow amount vs remaining water mass.
- With constant kettle setting and continued pour, `CoffeeBedTempC` converges toward the kettle value.
- With no inflow and no thermal loss, `CoffeeBedTempC` remains constant (flat over time).
- Replaying the same pour/temperature timeline reproduces the same temperature traces.

## Acceptance Criteria

- UI enforces kettle input range `80..100C`.
- `CoffeeBedTempC` updates from water-only mixing and respects no-loss assumptions.
- `CoffeeBedTempC` and `InflowTempC` are visible/readable to users during playback.
- Deterministic replay: same parameters and timeline produce identical temperature outputs.

## Extension Points

- Add thermal loss to environment and vessel materials in a future ticket.
- Add separate `WaterLayerTempC` vs `CoffeeBedTempC` if layered thermal state is needed.
