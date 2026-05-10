# PVIZ-004 Requirements: Coffee Brewing Visualizer Big Goal

**Status:** Done  
**Area:** Product / simulation / visualization  
**Architecture:** [Architecture.md](../Architecture.md)

## Big Goal

Build an interactive web tool that helps people visualize and understand coffee brewing. The app should reveal brewing behavior that is normally hard to see: water flow, water pressure, paper or bed clogging, early extraction, late extraction, immersion behavior, resistance, and method-specific mechanics.

The long-term product should support:

1. Pourover
2. Aeropress
3. French Press
4. Moka Pot

Users should be able to choose a brew method, choose a visual aspect, adjust parameters, and watch an interactive 2D visualization respond. The product is educational first: it should make cause and effect legible, even when the first models are heuristic approximations rather than physically complete simulations.

## MVP Goal

Deliver the first working version around Pourover only, while keeping the app structure ready for the other brew methods. The MVP should prove the core interaction pattern:

- choose a brew method;
- choose an aspect to study;
- adjust brewing parameters;
- play, pause, scrub, and reset time;
- understand the brewing system through visual feedback.

## In Scope For MVP

- Web app visible in a browser.
- 2D interactive Pourover visualization.
- Educational heuristic model for Pourover behavior.
- Method selector with Pourover enabled and future methods represented as planned extensions.
- Aspect selector for flow, pressure, clogging, extraction, and combined view.
- User controls for key parameters.
- Time controls for play, pause, scrub, and reset.
- Lo-fi output first, then hi-fi polish.
- Written assumptions, units, and simplified formulas.

## Out Of Scope For MVP

- Research-grade computational fluid dynamics.
- Exact extraction chemistry or validated TDS prediction.
- Full Aeropress, French Press, or Moka Pot implementations.
- Real coffee recipe persistence or sharing.
- Manufacturer-certified equipment or filter calibration.
- Mobile-native app packaging.
- Backend services or accounts.

## Requirement Breakdown

### R1. App Shell

The app must present a single web page with:

- title and short explanation;
- method selector;
- aspect selector;
- parameter controls;
- playback controls;
- 2D visualization area;
- short educational readout for the selected aspect.

Acceptance criteria:

- The page loads in a browser.
- Pourover can be selected.
- Future methods are visible as disabled or "coming later" options.
- The selected aspect changes the explanatory text and visual emphasis.

### R2. Pourover Method

The MVP must model Pourover as the first active method.

Required visual objects:

- brewer cone;
- paper filter;
- coffee bed;
- water surface or water volume;
- flow stream or particles;
- drip/output below the brewer.

Acceptance criteria:

- The user can identify the Pourover equipment shape without reading code.
- Water and coffee bed are visually distinct.
- The output drip responds to simulated flow intensity.

### R3. Visual Aspects

The MVP must support these aspect views:

- `Water flow`: emphasizes water movement through the brewer.
- `Water pressure`: emphasizes water height, head pressure, and resistance.
- `Paper clogging`: emphasizes increasing resistance from fines or clog tendency.
- `Early & late extraction`: emphasizes where extraction starts and where slower/stagnant extraction persists.
- `Combined`: shows a balanced overview of all major signals.

Acceptance criteria:

- Each aspect has a unique visual emphasis.
- Each aspect includes a short explanation in the UI.
- Switching aspects does not reset the simulation unless the user explicitly resets it.

### R4. User Controls

The MVP must include controls that visibly affect the simulation.

Required controls:

- pour rate;
- water amount;
- grind size or bed resistance;
- fines/clog tendency;
- brew time scrubber;
- play/pause;
- reset.

Optional controls if implementation stays simple:

- bed depth;
- paper speed/resistance;
- agitation or turbulence.

Acceptance criteria:

- Changing pour rate affects flow intensity and water level behavior.
- Changing water amount affects pressure/head and total visual duration.
- Increasing bed resistance reduces flow and increases pressure emphasis.
- Increasing clog tendency makes clogging more visible over time and reduces flow.

### R5. Educational Heuristic Model

The MVP model must be deterministic and simple enough to explain.

Suggested heuristic fields:

- `waterLevel`
- `flowIntensity`
- `pressureIntensity`
- `bedSaturation`
- `cloggingFactor`
- `earlyExtractionIntensity`
- `lateExtractionIntensity`
- `dripIntensity`

Suggested relationships:

- water level rises with pour input and falls with outflow;
- pressure increases with water level and bed resistance;
- flow increases with water level and pour rate, but decreases with resistance and clogging;
- clogging increases gradually with fines/clog tendency and flow history;
- early extraction is strongest near first wetting and high-flow zones;
- late extraction is strongest in slow, saturated, or high-resistance zones.

Acceptance criteria:

- The model produces smooth visual changes over time.
- The same parameters and time produce the same visual state.
- Simplified relationships are documented as educational heuristics.

### R6. 2D Visualization

The visualization must use a 2D canvas scene for the interactive view.

Acceptance criteria:

- The scene renders without requiring a framework-specific graphics wrapper.
- The scene resizes with the page.
- Animation remains smooth for the MVP scene.
- Scene resources can be disposed or replaced when future method scenes are added.

### R7. Extensibility

The MVP must not hard-code every concept directly into the Pourover scene.

Acceptance criteria:

- Brew method IDs are defined separately from the Pourover scene.
- Aspect IDs are defined separately from the visual implementation.
- Simulation output is represented as shared state that UI and scene code can consume.
- Future brew methods can be added by introducing method metadata, a simulation adapter, and a scene adapter.

## Lo-Fi To Hi-Fi Output Breakdown

### Lo-Fi Output

Goal: prove the learning loop with simple shapes and obvious feedback.

Expected output:

- basic page layout;
- simple 2D cone cutaway, filter, bed, water fill, and drip;
- parameter sliders wired to simulation state;
- aspect selector changes colors, labels, and simple overlays;
- play/pause/reset and time scrubber work;
- future methods appear as disabled options.

Acceptance criteria:

- A user can tell what parameter changes do within a few seconds.
- The visualization is understandable even if it is not polished.
- The implementation is modular enough to continue into the hi-fi stage.

### Mid-Fi Output

Goal: make the Pourover explanation clearer and more satisfying.

Expected output:

- smoother flow particles;
- pressure arrows or gradient;
- visible clogging buildup on the paper or bed;
- extraction gradient across the coffee bed;
- better educational copy for each aspect;
- responsive layout and readable controls.

Acceptance criteria:

- Each visual aspect communicates a distinct brewing concept.
- Parameter changes feel continuous rather than jumpy.
- The combined view remains readable instead of visually cluttered.

### Hi-Fi Output

Goal: turn the MVP into a polished educational visualization.

Expected output:

- more realistic brewer proportions;
- richer materials for glass, paper, water, and coffee bed;
- animated pouring stream;
- layered overlays that can be toggled or blended;
- camera controls or guided view presets;
- method-ready scene factory for adding Aeropress, French Press, and Moka Pot.

Acceptance criteria:

- The app feels intentionally designed rather than like a prototype.
- The educational model remains transparent despite visual polish.
- Adding a second method does not require rewriting the Pourover MVP.

## Future Method Requirement Breakdown

### Aeropress

Future requirements should cover:

- immersion phase;
- plunger pressure;
- filter resistance;
- inverted vs standard setup if needed;
- extraction during steeping and pressing.

### French Press

Future requirements should cover:

- full immersion extraction;
- grounds suspension and settling;
- mesh plunge behavior;
- sediment/fines carryover;
- time-based over-extraction.

### Moka Pot

Future requirements should cover:

- lower chamber water heating;
- pressure buildup;
- flow through coffee basket;
- upper chamber collection;
- late-stage sputtering or overheating warnings.

## Units And Assumptions

- Simulation time is measured in seconds.
- Water amount may be controlled in grams or milliliters, treating `1 g` as approximately `1 ml` for MVP explanation.
- Pressure is shown as relative educational intensity, not calibrated absolute pressure.
- Flow is shown as relative educational intensity, not a validated real-world flow rate.
- Extraction is shown as visual intensity over time and space, not as TDS or EY prediction.
- Clogging is shown as a heuristic resistance factor, not a measured permeability model.

## Overall Acceptance Criteria

- The MVP runs as a browser-visible 2D app.
- Pourover is the only active brew method in the first build.
- The app clearly communicates water flow, pressure, clogging, and early/late extraction as separate aspects.
- User controls visibly change the simulation.
- Lo-fi output can be delivered first without blocking later hi-fi polish.
- The architecture preserves a clear extension path to Aeropress, French Press, and Moka Pot.
