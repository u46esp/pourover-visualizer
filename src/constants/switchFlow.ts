/**
 * V60 switch outflow (PVIZ-002): single **max** rate for now (no separate “default” / nominal model).
 * Inventory uses `g`, time `s`. UI shows measured outflow on the Observations panel.
 * Future: user-configured rate would still be clamped to this max.
 * @see req/PVIZ-002.md
 */
export const V60_SWITCH_MAX_FLOW_G_PER_S = 30
