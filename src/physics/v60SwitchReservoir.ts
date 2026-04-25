import { V60_SWITCH_MAX_FLOW_G_PER_S } from "../constants/switchFlow"
import { FULL_V60_INVENTORY_G } from "../constants/switchReservoir"

export type V60SwitchReservoir = {
  /** Water remaining in the switch chamber, grams. */
  inventoryG: number
}

export function createV60SwitchReservoir(initialG = FULL_V60_INVENTORY_G): V60SwitchReservoir {
  return { inventoryG: Math.min(Math.max(initialG, 0), FULL_V60_INVENTORY_G) }
}

/** Context for future paper-filter / bed resistance; PVIZ-002 uses pass-through only. */
export type V60SwitchPaperFilterContext = {
  inventoryG: number
}

/**
 * Pluggable limiter after `flowRateGPerS * dt` and before inventory clamp. Defaults to no extra loss.
 * Future: permeability, clogging, or bed choking without rewriting open/close or drain entry points.
 */
export type V60SwitchPaperFilterFn = (
  candidateEmitG: number,
  ctx: V60SwitchPaperFilterContext,
) => number

export function v60SwitchPaperFilterPassThrough(
  candidateEmitG: number,
  _ctx: V60SwitchPaperFilterContext,
): number {
  return candidateEmitG
}

/**
 * Drain inventory when the switch is open: `candidate = flow * dt` → filter → `min` with stock.
 * Closed or `dt ≤ 0` or empty inventory: no emission.
 */
export function stepV60SwitchDrain(
  reservoir: V60SwitchReservoir,
  args: {
    switchOpen: boolean
    flowRateGPerSec: number
    dtSimSec: number
    paperFilter?: V60SwitchPaperFilterFn
  },
): { emittedG: number } {
  const paperFilter = args.paperFilter ?? v60SwitchPaperFilterPassThrough
  if (!args.switchOpen || args.dtSimSec <= 0) {
    return { emittedG: 0 }
  }
  if (reservoir.inventoryG <= 0) {
    return { emittedG: 0 }
  }
  const rate = Math.max(
    0,
    Math.min(args.flowRateGPerSec, V60_SWITCH_MAX_FLOW_G_PER_S),
  )
  let candidate = rate * args.dtSimSec
  const ctx: V60SwitchPaperFilterContext = { inventoryG: reservoir.inventoryG }
  candidate = paperFilter(candidate, ctx)
  if (!Number.isFinite(candidate) || candidate < 0) {
    candidate = 0
  }
  const emittedG = Math.min(candidate, reservoir.inventoryG)
  reservoir.inventoryG = Math.max(0, reservoir.inventoryG - emittedG)
  return { emittedG }
}
