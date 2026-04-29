# PVIZ-003 Requirements: Paper Filter Darcy Flow

**Status:** Draft  
**Area:** Physics / filter flow model  
**Depends on:** PVIZ-002  
**Conventions:** [Architecture.md](../Architecture.md) (seconds, `SIMULATION_DT`, Three.js)

## Goal

Model water draining through a paper filter using Darcy's law, starting with a full water inventory already loaded into the brewer. This iteration covers **paper filter only**: no coffee bed, no clogging, no pouring input, and no extraction behavior.

## In Scope

- Paper filter drawing within the visualization.
- A paper-filter flow limiter that replaces or constrains the fixed-rate placeholder from PVIZ-002.
- Darcy-law calculation of instantaneous outflow from the water head above the filter.
- Water inventory decreasing over time from an initially full reservoir.
- Defaulting to a Hario V60 tabbed paper profile.
- Explicit units for pressure head, filter geometry, permeability, viscosity, and flow rate.
- JSON-style configuration for paper profiles so faster papers can be added later without changing simulation logic.
- Extension points for later coffee bed resistance, clogging, and pouring input.

## Out of Scope

- Coffee bed permeability, puck resistance, fines migration, channeling, or clogging.
- Pouring, pulse recipes, bypass water, or added inflow after the initial fill.
- Temperature-dependent viscosity changes.
- Detailed filter deformation or nonuniform filter wetting.
- Extraction, concentration, TDS, or taste model behavior.
- Exact manufacturer-certified permeability values; defaults are first-pass simulation parameters and may be calibrated later.

## Functional Requirements

### 1. Initial State

- The simulation MUST begin with water already present in the brewer reservoir.
- There MUST be no pouring input during this ticket; inflow is always `0 g/s`.
- Initial water inventory MUST be represented as both mass (`g`) and equivalent volume (`m^3`) using water density.
- The filter starts fully available for flow with no clogging or time-dependent resistance.
- The default Hario V60 tabbed profile MUST be calibrated to target a 15 second drawdown from the default full-water starting condition.

### 2. Darcy-Law Flow

- Paper-filter outflow MUST be calculated from Darcy's law:

  `Q = (k * A * DeltaP) / (mu * L)`

- Where:
  - `Q` is volumetric flow rate (`m^3/s`).
  - `k` is paper permeability (`m^2`).
  - `A` is effective wetted filter area (`m^2`).
  - `DeltaP` is pressure difference across the filter (`Pa`).
  - `mu` is dynamic viscosity of water (`Pa*s`).
  - `L` is effective paper thickness (`m`).
- Mass flow MUST be derived from volumetric flow:

  `flowRateGPerSec = Q * rhoWater * 1000`

- Where `rhoWater` is water density in `kg/m^3`; multiplying by `1000` converts `kg/s` to `g/s`.

### 3. Pressure Head

- Pressure difference across the paper filter MUST be modeled from hydrostatic head:

  `DeltaP = rhoWater * g * h`

- Where:
  - `g` is gravitational acceleration (`m/s^2`).
  - `h` is water height above the relevant filter outlet/reference plane (`m`).
- As water drains and `h` decreases, Darcy flow MUST decrease accordingly.
- When water height reaches `0 m`, pressure difference and outflow MUST become `0`.

### 4. Water Inventory and Timestep

- The reservoir MUST track remaining water inventory in grams (`g`).
- Each simulation tick MUST compute emitted water as:

  `emittedG = min(flowRateGPerSec * dtSec, remainingWaterG)`

- Remaining water MUST never drop below `0 g`.
- Flow calculations MUST use the project simulation timestep conventions from [Architecture.md](../Architecture.md).
- Visual water level, if shown, MUST be derived from remaining inventory and geometry rather than from an independent timer.

### 5. Geometry and Parameters

- The model MUST define explicit configurable parameters for:
  - initial water mass (`g`);
  - water density (`kg/m^3`);
  - dynamic viscosity (`Pa*s`);
  - gravitational acceleration (`m/s^2`);
  - effective paper permeability (`m^2`);
  - effective wetted filter area (`m^2`);
  - effective paper thickness (`m`);
  - reservoir area or geometry needed to convert volume to water height (`m`, `m^2`, or equivalent).
- Defaults SHOULD be simple and documented, even if they are approximate.
- Defaults SHOULD approximate real-world values.
- Parameters SHOULD be centralized so later tickets can calibrate the model without rewriting flow logic.
- Effective paper area MUST be treated as already wet and available from the start of the simulation. This ticket does not model dry-to-wet transition, bloom wetting, or time-varying wetted area.
- Reservoir geometry MUST use a simple conical approximation for this ticket. It MUST NOT include V60 ribs, bypass channels, paper lift, or capillary effects.

### 6. Paper Filter Visualization

- The visualization MUST draw a paper filter inside the brewer/switch representation.
- The default visual paper shape MUST represent a Hario V60 tabbed conical paper, not a flat disk.
- The paper drawing SHOULD show:
  - conical filter body;
  - tab/fold indication or label sufficient to distinguish the default tabbed Hario profile;
  - a visually distinct paper material/color from water and brewer glass/plastic.
- The water surface/level SHOULD remain visually separate from the paper so draining behavior is readable.
- The paper visual MUST be driven from the selected paper profile where practical, especially cone angle, height, and effective radius values.

### 7. Paper Profile Configuration

- Paper filter parameters MUST be represented as JSON-style data: serializable fields, no functions, and no hard-coded values hidden inside the flow formula.
- The default selected paper profile MUST be Hario V60 tabbed paper.
- The configuration MUST allow additional paper profiles such as Cafec T-90, Sibarist, or Hario Meteor to be added by inserting new profile objects.
- Profile identifiers SHOULD be stable strings suitable for UI selection and persisted state in later tickets.
- Profiles MUST include both simulation fields and display fields when the visualization needs paper-specific geometry.

## Required Default Values

The first implementation MUST provide these defaults. Values are intentionally approximate, SHOULD approximate real-world behavior, and should be easy to recalibrate once measured drawdown behavior exists.

```json
{
  "initialWaterMassG": 300,
  "water": {
    "densityKgPerM3": 997,
    "dynamicViscosityPaS": 0.00089
  },
  "gravityMPerS2": 9.80665,
  "reservoir": {
    "heightModel": "simple-cone",
    "coneAngleDeg": 60,
    "maxHeightM": 0.095,
    "outletRadiusM": 0
  },
  "paperProfiles": {
    "defaultProfileId": "hario-v60-tabbed-02",
    "profiles": [
      {
        "id": "hario-v60-tabbed-02",
        "label": "Hario V60 tabbed paper 02",
        "family": "Hario V60",
        "variant": "Tabbed",
        "size": "02",
        "flowClass": "standard",
        "targetDrawdownSec": 15,
        "permeabilityM2": 3e-13,
        "thicknessM": 0.00018,
        "effectiveWettedAreaM2": 0.019,
        "geometry": {
          "shape": "cone",
          "coneAngleDeg": 60,
          "heightM": 0.095,
          "topRadiusM": 0.055,
          "bottomRadiusM": 0,
          "hasTab": true
        },
        "display": {
          "color": "#f2eee6",
          "opacity": 0.55
        }
      }
    ]
  }
}
```

- `initialWaterMassG = 300` represents the "water has dumped in full" starting condition.
- `targetDrawdownSec = 15` is the default calibration target for the Hario V60 tabbed paper profile.
- `reservoir.heightModel = "simple-cone"` means water height is computed from a basic cone volume model. This intentionally ignores V60 ribs, paper contact details, bypass, and capillary effects.
- `coneAngleDeg = 60` and `maxHeightM = 0.095` give 300 g of water an initial height near the top of the simple cone using the default density.
- `effectiveWettedAreaM2` is constant because the paper is assumed to already be wet.
- `permeabilityM2`, `thicknessM`, and `effectiveWettedAreaM2` are calibration parameters for Darcy flow, not guaranteed manufacturer measurements.
- Faster papers SHOULD later use the same profile shape with higher `permeabilityM2`, larger `effectiveWettedAreaM2`, lower `thicknessM`, or some combination based on calibration.
- Example future profile IDs: `cafec-t90-02`, `sibarist-fast-flat-02`, `hario-meteor-02`.

## Units and Formulas

- Simulation time: seconds (`s`).
- Water inventory: grams (`g`), with volume conversion through density.
- Volume: cubic meters (`m^3`).
- Flow rate:
  - volumetric: `m^3/s`;
  - mass: `g/s`.
- Water height for the default simple-cone reservoir:

  `volumeM3 = (remainingWaterG / 1000) / rhoWater`

  `coneSlope = tan(coneAngleDeg / 2)`

  `h = cbrt((3 * volumeM3) / (pi * coneSlope^2))`

  `coneAngleDeg` is stored in degrees in config; implementations MUST convert it to radians before calling trigonometric functions.

- Effective wetted filter area:

  `A = effectiveWettedAreaM2`

  This value is constant in PVIZ-003 because the paper is assumed to already be wet.

- Hydrostatic pressure:

  `DeltaP = rhoWater * g * h`

- Darcy volumetric flow:

  `Q = (k * A * DeltaP) / (mu * L)`

- Darcy mass flow:

  `flowRateGPerSec = Q * rhoWater * 1000`

## Acceptance Criteria

- A paper-filter flow model exists and computes outflow from Darcy's law.
- With nonzero water height, outflow is positive and decreases as water height decreases.
- With zero remaining water or zero water height, outflow is exactly `0 g/s`.
- Water inventory decreases by no more than `flowRateGPerSec * dtSec` per tick and never below `0 g`.
- The default simulation starts from `initialWaterMassG = 300` and uses the required default water, reservoir, gravity, and paper profile values unless changed by configuration.
- The default Hario V60 tabbed profile targets a 15 second drawdown from the default starting state.
- Effective wetted paper area is constant for this ticket; there is no dry/wet transition model.
- Water height is computed from a simple conical reservoir model, with no ribs, bypass, paper lift, or capillary behavior.
- The visualization draws a Hario V60 tabbed paper filter inside the brewer/switch representation.
- Paper simulation and display parameters are provided through a JSON-style profile config with `hario-v60-tabbed-02` as the default profile.
- Adding a future fast paper profile can be done by adding a profile object without changing the Darcy flow calculation.
- No pouring, coffee bed, clogging, or extraction behavior is included in this ticket.
- Model parameters and units are documented in code or adjacent configuration.
- The paper-filter model remains pluggable so future coffee bed and clogging resistance can be added without rewriting switch/reservoir inventory logic.

## Extension Points

- Coffee bed resistance can later be combined with paper resistance as an additional hydraulic resistance term.
- Clogging can later reduce effective permeability `k` or effective area `A` over time.
- Pouring can later add an inflow term before per-tick inventory integration.
- Temperature can later alter dynamic viscosity `mu`.
- UI selection can later expose multiple paper profiles once there are two or more calibrated options.

## Resolved Assumptions

- Hario V60 tabbed defaults target a 15 second drawdown from the default full-water starting state.
- Paper is assumed to already be wet; there is no dry/wet transition or dynamic wetted-area model.
- Reservoir height uses a simple conical geometry approximation only; V60 ribs, bypass, paper lift, and capillary effects are intentionally ignored.