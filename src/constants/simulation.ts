export const SIMULATION_DT_SEC = 1 / 60;
export const SIMULATION_DURATION_SEC = 90;

export const DEFAULT_POUROVER_PARAMS = {
  pourRateGPerSec: 6,
  waterAmountG: 300,
  bedResistance: 0.45,
  clogTendency: 0.35,
  bedDepth: 0.5,
  paperResistance: 0.4,
} as const;

export const PARAM_LIMITS = {
  pourRateGPerSec: { min: 0, max: 12, step: 0.5, unit: "g/s" },
  waterAmountG: { min: 120, max: 500, step: 10, unit: "g" },
  bedResistance: { min: 0, max: 1, step: 0.01, unit: "" },
  clogTendency: { min: 0, max: 1, step: 0.01, unit: "" },
  bedDepth: { min: 0, max: 1, step: 0.01, unit: "" },
  paperResistance: { min: 0, max: 1, step: 0.01, unit: "" },
} as const;
