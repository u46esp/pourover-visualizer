import { FULL_V60_INVENTORY_G } from "../constants/switchReservoir"
import { V60_CONE2D } from "../model/v60Cone2dProfile"

/**
 * ## Mass → free-surface height in the cross-section
 *
 * **Assumption:** The brewer in profile is a **right circular cone** (revolved around a vertical centerline).
 * Water accumulates in a **smaller, similar** cone with the same apex and axis (fill from the tip up).
 * For a cone of full axial height H from the apex, volume to height h (from the apex) is
 *   V = (π/3) (r(h)/h)² h³  with  r(h)/h  constant  ⟹  V ∝ h³.
 * Therefore the **volume fraction** `V / V_max = (h / H)³` and
 *   **h = H · cbrt( V / V_max )**.
 * With 1 mL = 1 g, **V / V_max = m / 300 g** (see `FULL_V60_INVENTORY_G`).
 *
 * In the 2D mesh, axial height is mapped linearly: `y(h) = tipY + (h / H) · (topY - tipY)` with `H = topY - tipY`.
 * So for inventory mass `m` in grams:
 *   `y_surface = tipY + cbrt( m / 300 g ) * ( topY - tipY )`  (0 ≤ m ≤ 300).
 * At `m = 0`, the surface is at the **apex** (degenerate); the renderer can hide the fill.
 */
export function waterSurfaceYInCone2d(grams: number): number {
  const g = Math.min(Math.max(grams, 0), FULL_V60_INVENTORY_G)
  const { tipY, topY } = V60_CONE2D
  const hTotal = topY - tipY
  if (g <= 0) {
    return tipY
  }
  const volumeFraction = g / FULL_V60_INVENTORY_G
  return tipY + Math.cbrt(volumeFraction) * hTotal
}

export function isWaterVisible(grams: number): boolean {
  return grams > 0
}
