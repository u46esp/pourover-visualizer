# Agent instructions: Pourover Visualizer

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

## Deployment note

The project targets **GitHub Pages**. When adding pages, align with the build setup (for example Vite multi-page entries) so each page is reachable from the deployed site.
