# PVIZ-002 Requirements: Hario Switch Flow Control

## Goal

Add a Hario Switch model that starts filled with water and releases water when opened, with adjustable outflow behavior and visible water-level decrease.

## In Scope

- Drawing the Hario Switch in the visualizer.
- UI control to toggle switch state (`open` / `closed`).
- Water level in the switch visibly going down over time while draining.
- Adjustable flow-rate control with a hard maximum.
- Code extension point reserved for future paper-filter behavior.

## Functional Requirements

### 1) Switch State

- The simulation MUST model at least two switch states:
  - `closed`: no water exits the switch.
  - `open`: water exits according to flow-rate rules.
- Initial state MUST begin with water present in the switch reservoir.

### 2) Water Inventory and Water Level

- The switch MUST track internal water mass (`g`) as inventory.
- While switch is `open`, emitted water per tick MUST be subtracted from inventory.
- Inventory MUST never drop below `0 g`.
- Visual water level MUST monotonically decrease while emitted flow > 0.
- When inventory reaches `0 g`, outflow MUST become `0 g/s`.

### 3) Flow Rate Behavior

- Outflow rate unit MUST be `g/s`.
- Opening the switch MUST produce outflow based on configurable "normal switch flow rate."
- Actual emitted amount per tick MUST be constrained by:
  - configured flow rate (`g/s`),
  - remaining inventory (`g`),
  - simulation timestep (`s`).

### 4) Max Flow Rate Constraint (Adjustable)

- The maximum selectable flow-rate value MUST be capped at `10 g/s`.
- The configured switch flow rate MUST be user-adjustable but MUST NOT exceed `10 g/s`.
- Default configured rate SHOULD represent a typical practical switch flow and remain <= `10 g/s`.

### 5) Time/Units Consistency

- Flow calculations MUST use:
  - flow rate: `g/s`
  - mass/volume inventory: `g`
  - simulation time: `s`
- Per-tick emitted amount MUST be computed as:
  - `emittedG = flowRateGPerSec * dtSec` (before inventory and future filter constraints are applied).

## Extensibility Requirement (Paper Filter Placeholder)

- The implementation MUST include an explicit hook/interface placeholder for future paper-filter limiting behavior.
- In PVIZ-002, the placeholder MUST default to pass-through behavior (no added restriction).
- Future paper-filter logic MUST be pluggable without rewriting core switch open/close or reservoir drain logic.

## Acceptance Criteria

- Hario Switch geometry/representation is rendered in the scene.
- User can toggle switch `open`/`closed` from UI.
- With switch `closed`, outflow is `0 g/s`.
- With switch `open` and inventory > `0 g`, outflow follows configured rate with timestep/inventory constraints.
- Configured flow rate cannot be set above `10 g/s`.
- Visible water level decreases over time while draining and reaches empty state.
- Paper-filter extension point exists in code but does not yet apply additional resistance.

## Out of Scope

- Detailed paper filter permeability/clogging physics.
- Advanced bed/slurry interaction and extraction model changes beyond switch drain behavior.
