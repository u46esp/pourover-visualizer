# Agent instructions: Pourover Visualizer

## Conventions

See [Architecture.md](Architecture.md) for simulation time (seconds), fixed tick `SIMULATION_DT`, and Three.js defaults.

## Architecture direction

Grow the visualizer as **many independent pages** (separate HTML entry points or routes), each focused on one concept or demo, rather than a single monolithic canvas application.

## Shared code (reuse boundaries)

Place reusable logic in **clear modules**; names and folder layout may evolve, but keep these concerns separated:

- **Physics / bed model** — Flow fields, resistance, fines migration heuristics, time stepping, parameters, and anything that describes state independent of how it is drawn.
- **Visual / Three.js** — Scene setup, materials, instancing helpers, debug overlays, and other rendering that consumes model state.
- **Shared UI primitives** (optional, when needed) — Sliders, panels, layout pieces duplicated across pages only; avoid pulling page-specific copy or wiring into this layer.

## How to add features

- Prefer **a new page with thin wiring** over expanding a single entry like `src/main.ts`.
- When behavior is reused across pages, **extend shared modules** (physics or visual) instead of copying.
- Keep **page-specific glue** separate from core model and visual code: routing, instructional copy, one-off controls, and experiment-only UI belong with the page.

## BA workflow (requirements-first)

- For new features, default to a **Business Analyst pace**:
  1. clarify scope and constraints,
  2. write/update a requirement spec in `req/PVIZ-XXX.md`,
  3. wait for explicit approval before implementation.
- Do not implement code immediately after initial feature requests unless the user clearly asks to start implementation.
- Keep requirements concrete and testable: objective, in-scope, out-of-scope, units, acceptance criteria, and extension points.

## Deployment note

The project targets **GitHub Pages**. When adding pages, align with the build setup (for example Vite multi-page entries) so each page is reachable from the deployed site.
