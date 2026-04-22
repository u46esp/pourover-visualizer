# Architecture and conventions

This document records **cross-cutting decisions** so requirements and implementation stay aligned. Prefer updating this file when a convention changes, rather than scattering magic numbers across the codebase.

## Time model

- **Simulation time** is measured in **seconds** (not normalized `0…1`).
- **First iteration horizon:** interactive range **`[0, 30]`** seconds (slider min/max, ping-pong bounds, and default demo duration unless a ticket says otherwise).
- **Scrubbing** sets simulation time to any value in range immediately (not restricted to the discrete tick grid).
- **Playback** advances time in fixed quanta using `SIMULATION_DT` (see below), with direction reversing at `0` and at `30` (ping-pong).

## Simulation tick (`SIMULATION_DT`)

- Define a **single global constant** (exported or module-level) for the canonical simulation step:

  `SIMULATION_DT = 1 / 60` **seconds** (one tick at notional **60 Hz**).

- **Feasibility:** Fixed `dt` is standard for stable stepping and predictable behavior. With **variable display refresh**, advance simulation time by **integrating wall-clock `deltaTime`** and consuming it in **whole multiples** of `SIMULATION_DT` per frame (fixed timestep with accumulator), so faster monitors do not run the simulation faster than real time unless a ticket explicitly requests it.
- **Rendering** may still run every `requestAnimationFrame`; only **sim time integration during play** is quantized to `SIMULATION_DT`.

## Rendering

- **Three.js** is the default stack for **WebGL** views (scenes, meshes, materials). New demos and tickets should assume Three.js unless they call out an exception (for example purely DOM UI).
- Keep **page glue** (DOM controls, wiring) separate from **scene setup** where practical, consistent with [AGENTS.md](AGENTS.md).

## Repository layout (evolving)

- **`req/`** — Human-readable tickets and acceptance criteria.
- **`src/`** — Application code; shared simulation and visual modules should grow here as pages split.

When a decision is ticket-specific only, put it in `req/` and link here if it becomes a global rule.

## Version control (commits)

- Use **[Conventional Commits](https://www.conventionalcommits.org/)**: **`type(scope): description`** (scope optional but encouraged when it clarifies the area).
- **Types** commonly used here: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- **Subject:** imperative mood (“add”, not “added”), about **50–72 characters**, no trailing period.
- **Body:** optional; use for *why* or breaking changes. **Footer:** `BREAKING CHANGE:` or issue references when needed.
