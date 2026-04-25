/**
 * V60 switch outflow (PVIZ-002): internal model params, not end-user settings.
 * Inventory uses `g`, time `s`. UI shows **measured** outflow on the Observations panel.
 * @see req/PVIZ-002.md
 */
export const V60_SWITCH_MAX_FLOW_G_PER_S = 15

/**
 * Nominal requested rate when the switch is open (≤ `V60_SWITCH_MAX_FLOW_G_PER_S`); `stepV60SwitchDrain` clamps and applies inventory.
 * At 10 g/s and 300 g inventory, the chamber empties in 30 s of simulation time.
 */
export const V60_SWITCH_DEFAULT_FLOW_G_PER_S = 15
