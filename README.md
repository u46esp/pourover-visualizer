# Pourover Physics Visualizer (Web, Three.js)

Interactive browser visualization of pourover coffee physics, inspired by:
- *The Physics of Filter Coffee*
- Coffee ad Astra: [The Four Rules of Optimal Coffee Percolation](https://coffeeadastra.com/2021/03/04/the-four-rules-of-optimal-coffee-percolation/)

This project prioritizes **educational, controllable approximations** over full physical realism.

## Project Goal

Build an interactive simulation that helps users understand how brewing choices change:
- flow and drawdown behavior
- slurry/bed dynamics (disturbance, settling, channeling risk)
- extraction trends (qualitative/relative, not lab-grade prediction)

The goal is to make coffee physics visible and explorable in real time.

## Modeling Philosophy

This is **not** a full CFD + particle-physics solver. A complete fluid-particle simulation with realistic scale is not practical for smooth browser performance.

Instead, the simulator uses:
- simplified flow fields and resistance models
- coarse bed state approximations
- parameterized heuristics grounded in known brewing behavior

Focus: **plausible behavior, visual intuition, and interaction speed**.

## Key Features (Planned)

- **Interactive brew controls**
  - pour rate, pulse schedule, kettle height/dispersion
  - grind size and distribution width
  - dose, bed depth, filter/permeability assumptions
- **Visual physics cues**
  - local flow concentration and weak-flow zones
  - bed permeability changes over time
  - likely channeling/clogging regions
- **Output panels**
  - drawdown curve vs time
  - proxy extraction map/score trends
  - diagnostic indicators for uneven percolation

## Important Focus Area: Grind Size, Fines Migration, and Clogging

A central objective is to represent grind effects beyond a single "average grind size" slider.

Planned approximation approach:
- track a coarse particle distribution (boulders -> fines)
- model fines migration as a function of local flow and agitation
- increase local hydraulic resistance where fines accumulate
- reflect resulting effects in:
  - slower drawdown
  - increased bypass/channeling tendency
  - less even extraction

This is a heuristic model, but the intent is to match the **direction and pattern** of observed brewing behavior.

## Non-Goals (for now)

- Exact prediction of extraction yield (EY/TDS) for arbitrary recipes
- Full Navier-Stokes + discrete element method simulation
- Hardware-level precision calibration

## Development Roadmap

1. **MVP visualization**
   - basic bed geometry, pouring input, drawdown feedback
2. **Permeability and flow map**
   - local resistance field + channeling visualization
3. **Fines migration layer**
   - dynamic clogging behavior tied to grind and agitation
4. **Educational presets**
   - scenario presets inspired by published coffee-physics guidance
5. **Calibration pass**
   - tune heuristics against qualitative real-world brew outcomes

## Tech

- Three.js (rendering and interaction)
- Browser-first architecture for fast iteration
- GitHub Pages deployment target

## Status

Early-stage concept/prototype. The immediate objective is to establish a robust approximation framework and clear visual language before adding complexity.

