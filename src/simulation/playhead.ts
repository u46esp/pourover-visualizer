import {
  SIMULATION_DT,
  SIM_TIME_MAX,
  SIM_TIME_MIN,
} from "../constants/simulation"

export type PlayheadState = {
  simTime: number
  accumulator: number
  playing: boolean
}

export function createPlayheadState(playing = true): PlayheadState {
  return {
    simTime: SIM_TIME_MIN,
    accumulator: 0,
    playing,
  }
}

/**
 * Advance `simTime` in whole `SIMULATION_DT` steps from wall-clock `deltaTime`
 * (fixed timestep + accumulator). Stops at `SIM_TIME_MAX` and sets `playing` false.
 */
export function stepPlayhead(state: PlayheadState, deltaTime: number): void {
  if (!state.playing) return

  state.accumulator += deltaTime
  const dt = SIMULATION_DT
  const max = SIM_TIME_MAX

  while (state.accumulator >= dt) {
    state.accumulator -= dt
    const next = state.simTime + dt
    if (next >= max) {
      state.simTime = max
      state.playing = false
      break
    }
    state.simTime = next
  }
}
