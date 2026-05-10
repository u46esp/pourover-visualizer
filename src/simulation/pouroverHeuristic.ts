import { DEFAULT_POUROVER_PARAMS, PARAM_LIMITS } from "../constants/simulation";
import type { KettleTipState, PouroverParams, PouroverSimulationState } from "../model/simulationState";

interface InternalState {
  timeSec: number;
  pouredWaterG: number;
  waterInBrewerG: number;
  brewedCoffeeG: number;
  brewerWaterTempC: number;
  inflowRateGPerSec: number;
  outflowRateGPerSec: number;
  bedSaturation: number;
  cloggingFactor: number;
  earlyExtractionIntensity: number;
  lateExtractionIntensity: number;
  flowIntensity: number;
  pressureIntensity: number;
  dripIntensity: number;
  kettleTip: KettleTipState;
}

export interface PouroverSimulator {
  readonly timeSec: number;
  reset(): void;
  step(params: PouroverParams, dtSec: number): void;
  setKettleTip(tip: KettleTipState): void;
  getState(params: PouroverParams): PouroverSimulationState;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const MASS_EPS_G = 1e-9;

function clampKettleTempC(kettleTempC: number): number {
  const { min, max } = PARAM_LIMITS.kettleTempC;
  return Math.max(min, Math.min(max, kettleTempC));
}

function mixWaterTempsC(massPrevG: number, tempPrevC: number, massInG: number, tempInC: number): number {
  const m = massPrevG + massInG;
  if (m < MASS_EPS_G) {
    return tempInC;
  }
  return (massPrevG * tempPrevC + massInG * tempInC) / m;
}

function createInitialState(): InternalState {
  return {
    timeSec: 0,
    pouredWaterG: 0,
    waterInBrewerG: 0,
    brewedCoffeeG: 0,
    brewerWaterTempC: DEFAULT_POUROVER_PARAMS.kettleTempC,
    inflowRateGPerSec: 0,
    outflowRateGPerSec: 0,
    bedSaturation: 0,
    cloggingFactor: 0,
    earlyExtractionIntensity: 0,
    lateExtractionIntensity: 0,
    flowIntensity: 0,
    pressureIntensity: 0,
    dripIntensity: 0,
    kettleTip: { xNorm: 0.5, yNorm: 0.1 },
  };
}

export function createPouroverSimulator(): PouroverSimulator {
  let state = createInitialState();

  return {
    get timeSec() {
      return state.timeSec;
    },
    reset() {
      state = createInitialState();
    },
    step(params, dtSec) {
      if (dtSec <= 0) {
        return;
      }
      stepPourover(state, params, dtSec);
    },
    setKettleTip(tip) {
      state.kettleTip = {
        xNorm: clamp01(tip.xNorm),
        yNorm: clamp01(tip.yNorm),
      };
    },
    getState(params) {
      return toPublicState(state, params);
    },
  };
}

function stepPourover(state: InternalState, params: PouroverParams, dtSec: number): void {
  const inputG = params.pourRateGPerSec * dtSec;
  const tIn = clampKettleTempC(params.kettleTempC);
  const m0 = state.waterInBrewerG;
  const t0 = state.brewerWaterTempC;
  const mAfterIn = m0 + inputG;
  const tAfterIn = mixWaterTempsC(m0, t0, inputG, tIn);

  state.inflowRateGPerSec = inputG / dtSec;
  state.pouredWaterG += inputG;
  state.waterInBrewerG = mAfterIn;

  const normalizedWater = clamp01(state.waterInBrewerG / Math.max(params.waterAmountG * 0.48, 1));
  const bedResistance = 0.45 + params.bedResistance * 1.75 + params.bedDepth * 0.55;
  const paperResistance = 0.25 + params.paperResistance * 1.1;
  const clogResistance = state.cloggingFactor * (0.55 + params.clogTendency * 2.4);
  const totalResistance = bedResistance + paperResistance + clogResistance;

  const headPush = Math.pow(normalizedWater, 0.72);
  const saturationBoost = lerp(0.35, 1, state.bedSaturation);
  const outflowRateGPerSec = ((4 + headPush * 22) * saturationBoost) / totalResistance;
  const outputG = Math.min(state.waterInBrewerG, outflowRateGPerSec * dtSec);
  state.outflowRateGPerSec = outputG / dtSec;
  state.waterInBrewerG -= outputG;
  state.brewedCoffeeG += outputG;

  state.brewerWaterTempC = tAfterIn;
  if (state.waterInBrewerG < MASS_EPS_G) {
    state.brewerWaterTempC = tIn;
  }

  const wettingRate = inputG > 0 || outputG > 0 ? 1.4 : 0.18;
  state.bedSaturation = clamp01(
    state.bedSaturation + wettingRate * dtSec * (0.18 + normalizedWater * 0.7),
  );

  const flowStress = clamp01(outputG / Math.max(dtSec * 18, 1));
  const clogGain = params.clogTendency * flowStress * (0.0025 + params.bedResistance * 0.003);
  const clogRelease = state.waterInBrewerG <= 0.5 ? 0.0012 : 0;
  state.cloggingFactor = clamp01(state.cloggingFactor + clogGain - clogRelease);

  const pourProgress = clamp01(state.pouredWaterG / Math.max(params.waterAmountG, 1));
  const brewProgress = clamp01(state.brewedCoffeeG / Math.max(params.waterAmountG, 1));
  const earlyPeak = Math.sin(Math.PI * clamp01(pourProgress * 1.15));
  state.earlyExtractionIntensity = clamp01(
    lerp(state.earlyExtractionIntensity, earlyPeak * state.bedSaturation, dtSec * 2.8),
  );

  const slowZoneSignal = clamp01((params.bedResistance + state.cloggingFactor + params.bedDepth) / 2.4);
  const lateSignal = clamp01(Math.max(0, brewProgress - 0.35) * 1.55 * slowZoneSignal);
  state.lateExtractionIntensity = clamp01(
    lerp(state.lateExtractionIntensity, lateSignal, dtSec * 1.4),
  );

  state.flowIntensity = clamp01(outputG / Math.max(dtSec * 20, 1));
  state.pressureIntensity = clamp01(normalizedWater * (0.45 + totalResistance / 3.7));
  state.dripIntensity = clamp01(outputG / Math.max(dtSec * 12, 1));
  state.timeSec += dtSec;
}

function toPublicState(
  state: InternalState,
  params: PouroverParams,
): PouroverSimulationState {
  const tIn = clampKettleTempC(params.kettleTempC);
  const hasWater = state.waterInBrewerG > MASS_EPS_G;
  const coffeeBedTempC = hasWater ? state.brewerWaterTempC : tIn;

  return {
    timeSec: state.timeSec,
    pouredWaterG: state.pouredWaterG,
    waterInBrewerG: state.waterInBrewerG,
    brewedCoffeeG: state.brewedCoffeeG,
    inflowRateGPerSec: state.inflowRateGPerSec,
    outflowRateGPerSec: state.outflowRateGPerSec,
    waterLevel: clamp01(state.waterInBrewerG / Math.max(params.waterAmountG * 0.48, 1)),
    inflowTempC: tIn,
    coffeeBedTempC,
    tempDeltaInMinusBedC: tIn - coffeeBedTempC,
    flowIntensity: state.flowIntensity,
    pressureIntensity: state.pressureIntensity,
    bedSaturation: state.bedSaturation,
    cloggingFactor: state.cloggingFactor,
    earlyExtractionIntensity: state.earlyExtractionIntensity,
    lateExtractionIntensity: state.lateExtractionIntensity,
    dripIntensity: state.dripIntensity,
    kettleTip: state.kettleTip,
  };
}
