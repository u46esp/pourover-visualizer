---
name: coffee-brewing-physics
description: Explains coffee brewing physics, reviews brew recipes using first-principles reasoning, and helps tune or implement brewing simulations. Use when discussing extraction, flow, grind, agitation, permeability, temperature, or pour-over modeling parameters.
disable-model-invocation: true
---

# Coffee Brewing Physics

## Use This Skill For

- Explaining why a brew behaved a certain way using physics and mass transfer.
- Reviewing recipes or brew plans and identifying likely failure modes.
- Suggesting parameter changes for grind, flow, temperature, agitation, or dose.
- Translating brewing behavior into simulation assumptions and model parameters.

## Response Style

- Keep responses concise and practical.
- Prioritize actionable changes over long theory.
- State assumptions briefly when data is missing.

## Core Model

Use this baseline mental model unless the user provides a different one:

1. **Hydraulics**: Flow is controlled by head pressure, bed permeability, viscosity, and outlet restriction.
2. **Mass transfer**: Extraction rate depends on surface area, diffusion path length, concentration gradient, and contact time.
3. **Thermal effects**: Temperature changes both solubility and kinetics; slurry cooling reduces extraction rate over time.
4. **Bed dynamics**: Swelling, migration of fines, and channel formation alter local permeability during brewing.

## Practical Heuristics

- **Grind finer**: Increases surface area and resistance; tends to raise extraction but can choke flow.
- **Higher pour rate**: Increases bed disturbance and hydraulic head; can increase bypass or channel risk if too aggressive.
- **More agitation**: Breaks local concentration gradients but can mobilize fines and increase clogging.
- **Higher temperature**: Speeds extraction kinetics; also changes viscosity and flow.
- **Longer contact time**: Often raises extraction until diminishing returns and bitterness/astringency risk.

## Recipe Review Workflow

When evaluating a recipe, follow this order:

1. Confirm inputs: brewer geometry, filter type, dose, grind, water profile, temperature, pour schedule, target beverage mass/time.
2. Identify limiting mechanism: hydraulic stall, under-contact, thermal drop, channeling, or over-agitation.
3. Propose 1-3 changes, each with expected directional effect and trade-off.
4. Give a short test plan: what to hold constant and what to vary first.

## Simulation/Code Guidance

When helping with brew simulation code:

- Map user controls to physical variables (e.g., pour rate -> inflow boundary condition).
- Prefer dimensionless or normalized internal variables where possible.
- Keep units explicit in variable names or comments.
- Separate geometry, state, and transport coefficients to simplify calibration.
- Validate model behavior with simple sanity checks before fine tuning.

## Output Template

Use this compact structure by default:

```markdown
Assumptions: ...
Likely cause: ...
Recommended changes:
- Change 1 (expected effect, trade-off)
- Change 2 (expected effect, trade-off)
Quick test:
- Hold ...
- Vary ...
```
