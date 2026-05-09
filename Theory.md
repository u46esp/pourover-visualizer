# Brewing Simulation Theory

This document captures the **physics-oriented formulation** used to align implementation across modules and agents: porous-media hydraulics (Darcy), grind and bed-state coupling, extraction kinetics as a mass-transfer proxy, thermal effects, and extractives in outflow.

It is **not** a substitute for product requirements. Feature scope and acceptance criteria live in `req/` (for example [PVIZ-007](req/PVIZ-007.md)). The runtime model remains **educational and heuristic** per [Architecture.md](Architecture.md); equations here are reference contracts, not claims of laboratory accuracy.

## Relationship To Architecture

- [Architecture.md](Architecture.md) defines app structure, aspects, and validation expectations.
- **Theory.md** (this file) defines named quantities, units, and equation families so `pouroverHeuristic` (and future method adapters) can stay consistent.
- Requirements tickets may reference this file for “how” without duplicating full derivations in every PVIZ.

---

## 1. Darcy’s Law And Hydraulics

Flow through a saturated porous bed (coffee bed + filter lumped or split) is anchored in **Darcy’s law**:

\[
q = \frac{k\,A}{\mu\,L}\,\Delta P
\]

| Symbol | Meaning | Typical units |
|--------|---------|-----------------|
| \(q\) | Volumetric flow rate | \(\mathrm{m}^3/\mathrm{s}\) |
| \(k\) | Permeability | \(\mathrm{m}^2\) |
| \(A\) | Cross-sectional flow area | \(\mathrm{m}^2\) |
| \(\mu\) | Dynamic viscosity of the liquid | \(\mathrm{Pa\cdot s}\) |
| \(L\) | Effective path length (bed depth, filter thickness, or combined) | \(\mathrm{m}\) |
| \(\Delta P\) | Pressure drop across the path | \(\mathrm{Pa}\) |

### Head Pressure And Losses

Gravitational head contributes to driving pressure:

\[
\Delta P_\mathrm{head} = \rho\,g\,h_\mathrm{water}
\]

Effective driving pressure may subtract modeled losses (geometry, exit geometry, etc.):

\[
\Delta P = \max(\Delta P_\mathrm{head} - \Delta P_\mathrm{losses},\, 0)
\]

### Darcy Flow Through The Bed

\[
q_\mathrm{through} = \frac{k_\mathrm{eff}\,A_\mathrm{eff}}{\mu\,L_\mathrm{eff}}\,\Delta P
\]

Optional **outlet restriction** (if the drip hole or drain limits rate regardless of bed):

\[
q_\mathrm{out} = \min(q_\mathrm{through},\, q_\mathrm{outletMax})
\]

### Mass Flow And UI Rates

If the product exposes mass flow in \(\mathrm{g/s}\):

\[
\dot{m} = \rho\,q
\]

Document \(\rho\) (water density, or slurry approximation) wherever \(\mathrm{g/s}\) is derived from \(q\).

### Series Resistance (Bed + Filter)

Bed and filter may be composed as series resistances so that each term maps to a named coefficient:

\[
R_\mathrm{total} = R_\mathrm{bed} + R_\mathrm{filter}
\]

(Equivalent algebraic forms are fine as long as they remain traceable to permeability, area, length, and \(\Delta P\).)

---

## 2. Particle Size And Bed-State Coupling

Effective permeability should depend on grind and evolving bed state (fines, packing, clogging signals):

\[
k_\mathrm{eff} = k_0\,f_\mathrm{size}(d_\mathrm{char})\,f_\mathrm{clog}(\phi_\mathrm{fines})\,f_\mathrm{compaction}(\phi_\mathrm{pack})
\]

**Directional expectations** (for sane educational behavior):

- Finer grind tends to **reduce** permeability: \(f_\mathrm{size}\) non-increasing as \(d_\mathrm{char}\) decreases.
- Finer grind tends to **increase** surface-driven extraction rate (separate from \(k_\mathrm{eff}\)), unless hydraulics dominate.

If the model uses a particle **distribution**, define which aggregate drives \(f_\mathrm{size}\) (e.g. Sauter mean diameter, mass-weighted fine fraction).

---

## 3. Extraction Kinetics (Mass-Transfer Proxy)

A minimal finite-pool form:

\[
\frac{\mathrm{d}M_\mathrm{ext}}{\mathrm{d}t} = k_\mathrm{ext,eff}\,(M_\mathrm{ext,max} - M_\mathrm{ext})
\]

\(k_\mathrm{ext,eff}\) should compose at least:

- particle-size / surface-area influence;
- hydraulic or contact proxy (saturation, through-flow, residence);
- optional thermal multiplier \(f_T(T)\).

Discrete integration (explicit Euler sketch):

\[
M_\mathrm{ext}(t+\Delta t) = \mathrm{clamp}\bigl(M_\mathrm{ext}(t) + \tfrac{\mathrm{d}M_\mathrm{ext}}{\mathrm{d}t}\,\Delta t,\, 0,\, M_\mathrm{ext,max}\bigr)
\]

---

## 4. Thermal Coupling

Temperature affects extraction kinetics and optionally viscosity:

\[
k_\mathrm{ext,eff} = k_\mathrm{ext,ref}\,f_T(T), \qquad \mu = \mu(T)
\]

If full thermal simulation is absent, a documented simplified cooling profile (e.g. exponential decay of slurry temperature) is acceptable.

---

## 5. Extractives In Outflow

Two equivalent representations:

**Concentration-first:** \(C_\mathrm{out}\) [g extractives / g liquid],

\[
\dot{m}_\mathrm{ext,out} = C_\mathrm{out}\,\dot{m}_\mathrm{liquid,out}
\]

**Flux-first:**

\[
C_\mathrm{out} = \frac{\dot{m}_\mathrm{ext,out}}{\max(\dot{m}_\mathrm{liquid,out},\,\varepsilon)}
\]

**Mass accounting** (optional retained term must be explicit if used):

\[
M_\mathrm{ext} = M_\mathrm{ext,bed\,liquid} + M_\mathrm{ext,cup} + M_\mathrm{ext,retained}
\]

---

## References

- Project skill: [.cursor/skills/coffee-brewing-physics/SKILL.md](.cursor/skills/coffee-brewing-physics/SKILL.md)
- Extraction feature requirements: [req/PVIZ-007.md](req/PVIZ-007.md)
