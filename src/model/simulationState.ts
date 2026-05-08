import type { GrinderProfileId } from "./grinderProfile";

export interface PouroverParams {
  pourRateGPerSec: number;
  waterAmountG: number;
  bedResistance: number;
  clogTendency: number;
  bedDepth: number;
  paperResistance: number;
  grinderProfile: GrinderProfileId;
  highlightFines: boolean;
}

export interface KettleTipState {
  xNorm: number;
  yNorm: number;
}

export interface PouroverSimulationState {
  timeSec: number;
  pouredWaterG: number;
  waterInBrewerG: number;
  brewedCoffeeG: number;
  inflowRateGPerSec: number;
  outflowRateGPerSec: number;
  waterLevel: number;
  flowIntensity: number;
  pressureIntensity: number;
  bedSaturation: number;
  cloggingFactor: number;
  earlyExtractionIntensity: number;
  lateExtractionIntensity: number;
  dripIntensity: number;
  kettleTip: KettleTipState;
}
