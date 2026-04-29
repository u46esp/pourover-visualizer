import type { GroundParticle } from "./groundParticles";

/**
 * Visual + physics radius shared between simulator and renderer.
 *
 * Maps `size` (relative visual unit, clamped roughly to [0.25, 1.8]) to a
 * pixel radius. Designed so the smallest particles (`size ≈ 0.25`) render at
 * roughly `0.25x..0.5x` the radius of the largest particles (`size ≈ 1.8`):
 * `radius(0.25) ≈ 1.75 px`, `radius(1.8) ≈ 6.4 px` (ratio ≈ 0.27).
 */
export function particleRadiusFromSize(size: number): number {
  return 1 + size * 3;
}

export interface PaperConeGeometry {
  leftTop: { x: number; y: number };
  rightTop: { x: number; y: number };
  tip: { x: number; y: number };
}

export interface PackedGroundParticle {
  x: number;
  y: number;
  radius: number;
  size: number;
}

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  invMass: number;
}

interface Wall {
  nx: number;
  ny: number;
  px: number;
  py: number;
}

const GRAVITY = 1500;
const DT = 1 / 120;
const MAX_STEPS = 900;
const VELOCITY_DAMPING = 0.965;
const TOUCH_GAP = 0.4;
const RESTITUTION = 0.04;
const COLLISION_ITERS = 3;
const SETTLE_ENERGY = 0.05;
const PARTICLE_DENSITY = 1;

function makeInwardWall(
  from: { x: number; y: number },
  to: { x: number; y: number },
  normalSign: 1 | -1,
): Wall {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(Math.hypot(dx, dy), 1e-6);
  return {
    nx: (normalSign * dy) / length,
    ny: (-normalSign * dx) / length,
    px: from.x,
    py: from.y,
  };
}

function applyWall(body: Body, wall: Wall): void {
  const distance = (body.x - wall.px) * wall.nx + (body.y - wall.py) * wall.ny;
  if (distance < body.r) {
    const push = body.r - distance;
    body.x += wall.nx * push;
    body.y += wall.ny * push;
    const vn = body.vx * wall.nx + body.vy * wall.ny;
    if (vn < 0) {
      body.vx -= (1 + RESTITUTION) * vn * wall.nx;
      body.vy -= (1 + RESTITUTION) * vn * wall.ny;
    }
  }
}

function applyPair(a: Body, b: Body): void {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let d = Math.hypot(dx, dy);
  const minDistance = a.r + b.r + TOUCH_GAP;

  if (d < 1e-6) {
    dx = 0.01;
    dy = 0;
    d = 0.01;
  }

  if (d < minDistance) {
    const overlap = minDistance - d;
    const nx = dx / d;
    const ny = dy / d;
    const totalInvMass = a.invMass + b.invMass;
    if (totalInvMass <= 0) return;

    const aShare = a.invMass / totalInvMass;
    const bShare = b.invMass / totalInvMass;
    a.x -= nx * overlap * aShare;
    a.y -= ny * overlap * aShare;
    b.x += nx * overlap * bShare;
    b.y += ny * overlap * bShare;

    const relativeNormalVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relativeNormalVelocity < 0) {
      const impulse = (-(1 + RESTITUTION) * relativeNormalVelocity) / totalInvMass;
      a.vx -= nx * impulse * a.invMass;
      a.vy -= ny * impulse * a.invMass;
      b.vx += nx * impulse * b.invMass;
      b.vy += ny * impulse * b.invMass;
    }
  }
}

function paperHalfWidthAtY(paper: PaperConeGeometry, y: number): number {
  const fullHeight = Math.max(paper.tip.y - paper.leftTop.y, 1);
  const t = Math.max(0, Math.min(1, (y - paper.leftTop.y) / fullHeight));
  const halfWidthTop = (paper.rightTop.x - paper.leftTop.x) / 2;
  return Math.max(0, halfWidthTop * (1 - t));
}

/**
 * Settle coffee grounds inside the paper cone using a simple semi-implicit
 * Euler integrator with mass-weighted disk-disk collisions and inward-normal
 * wall constraints. Mass is proportional to particle area (πr²·density), so
 * larger particles displace less and tend to sit lower.
 */
export function packGroundParticles(
  particles: GroundParticle[],
  paper: PaperConeGeometry,
): PackedGroundParticle[] {
  const n = particles.length;
  if (n === 0) return [];

  const leftWall = makeInwardWall(paper.leftTop, paper.tip, 1);
  const rightWall = makeInwardWall(paper.rightTop, paper.tip, -1);
  const walls: Wall[] = [leftWall, rightWall];

  const centerX = (paper.leftTop.x + paper.rightTop.x) / 2;
  const spawnTopY = paper.leftTop.y + 4;
  const spawnBottomY = paper.tip.y - 4;

  const bodies: Body[] = particles.map((p) => {
    const r = particleRadiusFromSize(p.size);
    const mass = PARTICLE_DENSITY * Math.PI * r * r;
    const y = spawnTopY + p.yNorm * (spawnBottomY - spawnTopY);
    const halfW = Math.max(0, paperHalfWidthAtY(paper, y) - r - 1);
    const x = centerX + (p.xNorm * 2 - 1) * halfW;
    return { x, y, vx: 0, vy: 0, r, invMass: 1 / mass };
  });

  for (let step = 0; step < MAX_STEPS; step += 1) {
    for (let i = 0; i < n; i += 1) {
      const b = bodies[i];
      b.vy += GRAVITY * DT;
      b.vx *= VELOCITY_DAMPING;
      b.vy *= VELOCITY_DAMPING;
      b.x += b.vx * DT;
      b.y += b.vy * DT;
    }

    for (let iter = 0; iter < COLLISION_ITERS; iter += 1) {
      for (let i = 0; i < n; i += 1) {
        for (let j = i + 1; j < n; j += 1) {
          applyPair(bodies[i], bodies[j]);
        }
      }
      for (let i = 0; i < n; i += 1) {
        for (let w = 0; w < walls.length; w += 1) {
          applyWall(bodies[i], walls[w]);
        }
      }
    }

    if (step > 60 && step % 20 === 0) {
      let energy = 0;
      for (let i = 0; i < n; i += 1) {
        const b = bodies[i];
        energy += b.vx * b.vx + b.vy * b.vy;
      }
      if (energy / n < SETTLE_ENERGY) break;
    }
  }

  return particles.map((p, i) => ({
    x: bodies[i].x,
    y: bodies[i].y,
    radius: bodies[i].r,
    size: p.size,
  }));
}
