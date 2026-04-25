/** Canonical simulation step (Architecture.md). */
export const SIMULATION_DT = 1 / 60

export const SIM_TIME_MIN = 0
/**
 * Upper bound for simulation time; playback stops here at 1× speed.
 * ≥ 30 s so a full 300 g reservoir can drain at 10 g/s (PVIZ-002).
 */
export const SIM_TIME_MAX = 30
