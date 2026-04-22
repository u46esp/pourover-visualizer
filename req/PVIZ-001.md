# PVIZ-001 — Simulation time control + Three.js moving circle

**Status:** Draft  
**Area:** UI / time stepping, Three.js proof scene  
**Depends on:** None  
**Conventions:** [Architecture.md](../Architecture.md) (seconds, `SIMULATION_DT`, Three.js)

## Summary

Deliver **simulation time controls** on the main page—**scrubbable time**, **Play / Pause**, and **ping-pong playback** at the ends of the range—together with an in-scope **Three.js demo**: a **circle moving horizontally** so time and scrubbing are visibly correct. Time is expressed in **seconds** over **`[0, 30]`** for this iteration.

## Problem

Later simulations need one source of truth for “where we are in time,” in **real seconds**, that can be **scrubbed** and **advanced** under fixed-step assumptions. The first milestone should prove that pipeline with a minimal **Three.js** scene, not a throwaway non-WebGL hack.

## In scope (this ticket)

1. **Time UI** — Range control for simulation time, plus **Play / Pause**, behavior as specified under Goals.
2. **Moving circle (Three.js)** — A **circle** (mesh or equivalent) in a **Three.js** view moves **horizontally** as a **direct function of simulation time** over `[0, 30]` s (e.g. mapped to a clear left–right path in world or NDC space). This is a **first-class deliverable**, not an optional appendix.
3. **Fixed simulation tick** — Follow [Architecture.md](../Architecture.md): canonical **`SIMULATION_DT = 1/60`** s and integration pattern documented there (accumulator + whole steps per frame during play).

## Goals

1. **Simulation time in seconds** — Expose scalar **`simTime`** in **`[0, 30]`** seconds (first iteration). Slider and labels use this range.
2. **Scrubbing** — When playback is **paused**, the user can move the slider to any time in range and the **Three.js** scene updates immediately (circle position matches `simTime`).
3. **Playback** — When **playing**, `simTime` advances using the **fixed-step** policy in [Architecture.md](../Architecture.md) (`SIMULATION_DT = 1/60`), driven by wall-clock `deltaTime` via an accumulator so variable refresh rates stay sane.
4. **Ping-pong (back and forth)** — During playback, the integration **reverses direction** at **`0`** and **`30`** seconds so time oscillates without discontinuous jumps at the endpoints. The slider stays in sync with `simTime`.
5. **Play / Pause** — One primary control toggles playing vs paused; label or iconography makes the active mode obvious (e.g. “Pause” while playing, “Play” while paused).

## Out of scope (this ticket)

- Real brew physics, bed model, or multi-page routing.
- Keyframe editors, bookmarks, or export of time series.
- Playback speed presets (optional follow-up).

## Acceptance criteria

- [ ] **Range slider** bound to **`simTime`** over **`[0, 30]`** seconds (tick marks or numeric readout optional).
- [ ] With playback **paused**, dragging the slider sets **`simTime`** and the **Three.js** circle position updates **immediately** and **deterministically** from **`simTime`**.
- [ ] **Play** advances **`simTime`** in steps of **`SIMULATION_DT`** per [Architecture.md](../Architecture.md); at **`30`** s direction reverses toward **`0`**; at **`0`** s direction reverses toward **`30`** (ping-pong).
- [ ] **Pause** stops automatic advancement; **`simTime`** holds; scrubbing still works.
- [ ] **Three.js moving circle:** a circle moves **horizontally** in lockstep with **`simTime`** over the **`[0, 30]`** s window so scrubbing and ping-pong playback are **obviously** correct to a human viewer.

## Notes for implementation (non-normative)

- One **`requestAnimationFrame`** loop: integrate playhead when playing, then render Three.js from current **`simTime`**.
- Keep DOM controls from fully obscuring the WebGL canvas on small viewports.
