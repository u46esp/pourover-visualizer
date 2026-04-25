/**
 * 2D cross-section of the V60 **glass outline** in **local** mesh space (Y up, units arbitrary but consistent).
 * The tip is the **bottom** of the cross-section; water fills from the tip **up** toward the rim.
 */
export const V60_CONE2D = {
  tipX: 0,
  /** Apex of the conical section (lowest Y). */
  tipY: -0.05,
  /** Open rim. */
  topY: 0.5,
  topLeftX: -0.3,
  topRightX: 0.3,
} as const
