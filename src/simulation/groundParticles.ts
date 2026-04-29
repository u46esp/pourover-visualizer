import { GROUND_PARTICLE_DEFAULTS } from "../constants/simulation";
import type { GrinderProfileId } from "../model/grinderProfile";

export interface GroundParticle {
  xNorm: number;
  yNorm: number;
  size: number;
}

interface NormalSpec {
  mean: number;
  stdDev: number;
}

const MAX_MAIN_PARTICLES = 200;

// Initial spawn band inside the paper cone. The settling physics in
// `packGroundParticles` is the source of truth for the final bed shape; this
// only controls where particles start before gravity + collisions resolve.
const BED_TOP_Y_NORM = 0.05;
const BED_BOTTOM_Y_NORM = 0.92;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Sample y so density per unit area is roughly uniform inside the wedge formed
// by a narrowing cone (width shrinks linearly toward the tip). Without this
// weighting, a uniform y would over-pack particles near the narrow tip.
function sampleSettledY(rng: () => number): number {
  const top = BED_TOP_Y_NORM;
  const bottom = BED_BOTTOM_Y_NORM;
  const a = (1 - top) * (1 - top);
  const b = (1 - bottom) * (1 - bottom);
  return 1 - Math.sqrt(a - rng() * (a - b));
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function sampleNormal(rng: () => number, spec: NormalSpec): number {
  const u1 = Math.max(rng(), 1e-8);
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return spec.mean + z0 * spec.stdDev;
}

// Azzalini skew-normal sampler. alpha=0 reduces to the standard normal.
// Positive alpha skews the distribution to the right (longer coarse-end tail),
// which matches a "good grinder" PSD where most particles cluster near the
// target size with a thinner tail of slightly larger boulders.
function sampleSkewNormal(
  rng: () => number,
  mean: number,
  stdDev: number,
  alpha: number,
): number {
  const u1 = Math.max(rng(), 1e-8);
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  const z0 = r * Math.cos(2 * Math.PI * u2);
  const z1 = r * Math.sin(2 * Math.PI * u2);
  const delta = alpha / Math.sqrt(1 + alpha * alpha);
  const epsilon = delta * Math.abs(z0) + Math.sqrt(1 - delta * delta) * z1;
  return mean + stdDev * epsilon;
}

function buildSamples(profile: GrinderProfileId, rng: () => number): number[] {
  const defaults = GROUND_PARTICLE_DEFAULTS;
  const mainCount = Math.min(defaults.requestedMainParticles, MAX_MAIN_PARTICLES);

  if (profile === "bad-grinder") {
    const fineCount = Math.round(mainCount * defaults.bad.fineHillWeight);
    const coarseCount = Math.max(0, mainCount - fineCount);
    const samples: number[] = [];
    for (let index = 0; index < fineCount; index += 1) {
      samples.push(sampleNormal(rng, { mean: defaults.bad.fineMean, stdDev: defaults.bad.fineStdDev }));
    }
    for (let index = 0; index < coarseCount; index += 1) {
      samples.push(sampleNormal(rng, { mean: defaults.bad.coarseMean, stdDev: defaults.bad.coarseStdDev }));
    }
    return samples;
  }

  const samples: number[] = [];
  for (let index = 0; index < mainCount; index += 1) {
    samples.push(
      sampleSkewNormal(
        rng,
        defaults.uniform.mean,
        defaults.uniform.stdDev,
        defaults.uniform.skewAlpha,
      ),
    );
  }

  if (profile === "uniform-with-fine-spike") {
    const fineSpikeCount = Math.round(mainCount * defaults.fineSpike.ratio);
    for (let index = 0; index < fineSpikeCount; index += 1) {
      samples.push(sampleNormal(rng, { mean: defaults.fineSpike.mean, stdDev: defaults.fineSpike.stdDev }));
    }
  }

  return samples;
}

export function generateGroundParticles(profile: GrinderProfileId, seed = GROUND_PARTICLE_DEFAULTS.seed): GroundParticle[] {
  const rng = createRng(seed + profile.length * 131);
  const rawSizes = buildSamples(profile, rng);

  const particles = rawSizes.map((size) => {
    // Settled "shaken flat" bed: flat top surface, particles fill the wedge
    // wall-to-wall at each y, density even per unit area.
    const yNorm = sampleSettledY(rng);
    const xNorm = clamp(rng(), 0.02, 0.98);
    return {
      xNorm,
      yNorm,
      size: clamp(size, GROUND_PARTICLE_DEFAULTS.sizeClampMin, GROUND_PARTICLE_DEFAULTS.sizeClampMax),
    };
  });

  particles.sort((a, b) => a.yNorm - b.yNorm);
  return particles;
}
