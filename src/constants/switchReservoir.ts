/**
 * Hario V60 **switch** (brewer) chamber — water inventory scale for visualization + simulation (PVIZ-002).
 *
 * **Model:** One gram of water has **≈ 1 mL** volume (ρ ≈ 1 g/mL at typical brew temps; small temperature effects ignored for this sim).
 * The 2D view is the **axial cross-section** of a cone. **Filling 300 g** (≈ 300 mL) is defined to correspond to
 * a **brim-full** fill in the drawn cone, i.e. `inventory = 300 g` ⟺ **full** on-screen; `0 g` is empty.
 *
 * The visual fill height is **not** linear in mass: for a right cone, volume scales with the **cube** of
 * the fill height from the **apex** (V ∝ h³), so
 *   `h / h_max = cbrt( inventory / 300 g )`.
 * See `src/physics/switchReservoirModel.ts` for the calculation used by the water mesh.
 */
export const FULL_V60_INVENTORY_G = 300
