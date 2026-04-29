import type { GrinderProfileId } from "../model/grinderProfile";

export const SIMULATION_DT_SEC = 1 / 60;
export const SIMULATION_DURATION_SEC = 90;

export const DEFAULT_POUROVER_PARAMS = {
  pourRateGPerSec: 6,
  waterAmountG: 300,
  bedResistance: 0.45,
  clogTendency: 0.35,
  bedDepth: 0.5,
  paperResistance: 0.4,
  grinderProfile: "uniform-grinder" as GrinderProfileId,
} as const;

export const GROUND_PARTICLE_DEFAULTS = {
  requestedMainParticles: 200,
  seed: 42,
  sizeClampMin: 0.4,
  sizeClampMax: 1.8,
  uniform: {
    mean: 1.0,
    stdDev: 0.22,
  },
  bad: {
    fineHillWeight: 0.5,
    coarseHillWeight: 0.5,
    fineMean: 0.72,
    fineStdDev: 0.1,
    coarseMean: 1.32,
    coarseStdDev: 0.16,
  },
  fineSpike: {
    ratio: 0.25,
    mean: 0.62,
    stdDev: 0.06,
  },
} as const;

export const PARAM_LIMITS = {
  pourRateGPerSec: { min: 0, max: 12, step: 0.5, unit: "g/s" },
  waterAmountG: { min: 120, max: 500, step: 10, unit: "g" },
  bedResistance: { min: 0, max: 1, step: 0.01, unit: "" },
  clogTendency: { min: 0, max: 1, step: 0.01, unit: "" },
  bedDepth: { min: 0, max: 1, step: 0.01, unit: "" },
  paperResistance: { min: 0, max: 1, step: 0.01, unit: "" },
} as const;
