import type { KettleTipState, PouroverParams, PouroverSimulationState } from "../model/simulationState";
import { WATER_STREAM_VISUAL_DEFAULTS } from "../constants/simulation";
import {
  packGroundParticles,
  type PackedGroundParticle,
  type PaperConeGeometry,
} from "../simulation/groundParticleLayout";
import { generateGroundParticles, type GroundParticle } from "../simulation/groundParticles";

interface Point {
  x: number;
  y: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const toDisplayedFlowRate = (valueGPerSec: number) => Number(valueGPerSec.toFixed(1));

interface StreamVisualState {
  inNormRaw: number;
  inWidthPx: number;
  inDisplayedRateGPerSec: number;
  outWidthPx: number;
  outNormRaw: number;
  outNormSmooth: number;
  outDisplayedRateGPerSec: number;
}

export class PouroverScene {
  private readonly canvas = document.createElement("canvas");
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  private particleKey = "";
  private groundParticlesRaw: GroundParticle[] = [];
  private groundParticles: PackedGroundParticle[] = [];
  private lastParticlePackKey = "";
  private outNormSmooth = 0;
  private lastStateTimeSec = 0;
  private isDraggingKettle = false;
  private dragPointerId: number | null = null;
  private dragOffset: Point = { x: 0, y: 0 };
  private lastState: PouroverSimulationState | null = null;
  private lastParams: PouroverParams | null = null;
  private wheelDeltaAccumulator = 0;
  private touchAdjustMode = false;
  private touchAdjustAccumulator = 0;
  private readonly touchPointerIds = new Set<number>();
  private readonly pointerPositions = new Map<number, Point>();
  private longPressTimerId: number | null = null;
  private longPressPointerId: number | null = null;
  private longPressStartPoint: Point | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly options: {
      onKettleTipChange?: (tip: KettleTipState) => void;
      onPourRateNudge?: (deltaSteps: number) => void;
    } = {},
  ) {
    const context = this.canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D rendering is not available");
    }

    this.ctx = context;
    this.canvas.setAttribute("aria-label", "2D Pourover brewing cutaway");
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    host.append(this.canvas);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  update(state: PouroverSimulationState, params: PouroverParams): void {
    this.lastState = state;
    this.lastParams = params;
    this.ensureGroundParticles(params);
    this.refreshPackedGroundParticles(params);
    this.clear();
    this.drawScene(state, params);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.cancelLongPress();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.host.replaceChildren();
  }

  private resize(): void {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, this.host.clientWidth);
    this.height = Math.max(1, this.host.clientHeight);
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.lastParticlePackKey = "";
  }

  private clear(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, "#f8efe4");
    gradient.addColorStop(1, "#dcc2a2");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawScene(state: PouroverSimulationState, params: PouroverParams): void {
    const bounds = this.getBounds();
    const cone = this.getConePoints(bounds);
    const water = this.getWaterPoints(bounds, state.waterLevel);
    const mug = this.getMugRect(bounds);
    const streams = this.getStreamVisualState(state);
    const kettleTip = this.kettleTipToPoint(state.kettleTip);
    this.drawKettle(kettleTip);
    this.drawCutawayCone(cone);
    this.drawPaperFilter(cone);
    this.drawCoffeeGrounds(bounds, cone, state, params);
    this.drawWater(water);
    this.drawInputStream(kettleTip, water, state, streams);
    this.drawOutputStream(bounds, mug, state, streams);
    this.drawMug(mug, state);
    this.drawLabels(state);
  }

  private getStreamVisualState(state: PouroverSimulationState): StreamVisualState {
    const inflowRateGPerSec = toDisplayedFlowRate(state.inflowRateGPerSec);
    const inNorm = clamp01(
      inflowRateGPerSec / WATER_STREAM_VISUAL_DEFAULTS.inRefRateGPerSec,
    );
    // Use the same one-decimal granularity as the UI readout so when flow-out
    // is shown as 0.0 g/s, output stream visuals are fully hidden.
    const outflowRateGPerSec = toDisplayedFlowRate(state.outflowRateGPerSec);
    const outNormRaw = clamp01(
      outflowRateGPerSec / WATER_STREAM_VISUAL_DEFAULTS.outRefRateGPerSec,
    );

    const dtSec = Math.max(0, state.timeSec - this.lastStateTimeSec);
    if (outNormRaw <= 1e-6) {
      this.outNormSmooth = 0;
    } else if (dtSec <= 0 || state.timeSec < this.lastStateTimeSec) {
      this.outNormSmooth = outNormRaw;
    } else {
      const alpha =
        1 -
        Math.exp(-dtSec / Math.max(1e-6, WATER_STREAM_VISUAL_DEFAULTS.outSmoothingTauSec));
      this.outNormSmooth += alpha * (outNormRaw - this.outNormSmooth);
    }
    this.lastStateTimeSec = state.timeSec;

    return {
      inNormRaw: inNorm,
      inWidthPx: lerp(
        WATER_STREAM_VISUAL_DEFAULTS.inMinWidthPx,
        WATER_STREAM_VISUAL_DEFAULTS.inMaxWidthPx,
        inNorm,
      ),
      inDisplayedRateGPerSec: inflowRateGPerSec,
      outWidthPx: lerp(
        WATER_STREAM_VISUAL_DEFAULTS.outMinWidthPx,
        WATER_STREAM_VISUAL_DEFAULTS.outMaxWidthPx,
        this.outNormSmooth,
      ),
      outNormRaw,
      outNormSmooth: this.outNormSmooth,
      outDisplayedRateGPerSec: outflowRateGPerSec,
    };
  }

  private ensureGroundParticles(params: PouroverParams): void {
    const nextKey = params.grinderProfile;
    if (this.particleKey === nextKey && this.groundParticlesRaw.length > 0) {
      return;
    }
    this.groundParticlesRaw = generateGroundParticles(params.grinderProfile);
    this.particleKey = nextKey;
    this.lastParticlePackKey = "";
  }

  private refreshPackedGroundParticles(params: PouroverParams): void {
    if (this.groundParticlesRaw.length === 0) {
      this.groundParticles = [];
      return;
    }
    const packKey = `${Math.round(this.width)}x${Math.round(this.height)}x${params.grinderProfile}`;
    if (packKey === this.lastParticlePackKey && this.groundParticles.length > 0) {
      return;
    }
    const bounds = this.getBounds();
    const cone = this.getConePoints(bounds);
    const paper = this.getPaperConeGeometry(cone);
    this.groundParticles = packGroundParticles(this.groundParticlesRaw, paper);
    this.lastParticlePackKey = packKey;
  }

  private getPaperConeGeometry(
    cone: ReturnType<PouroverScene["getConePoints"]>,
  ): PaperConeGeometry {
    return {
      leftTop: { x: cone.leftTop.x + 22, y: cone.leftTop.y + 20 },
      rightTop: { x: cone.rightTop.x - 22, y: cone.rightTop.y + 20 },
      tip: { x: cone.tip.x, y: cone.tip.y - 12 },
    };
  }

  private getBounds() {
    const size = Math.min(this.width * 0.78, this.height * 0.82);
    const centerX = this.width * 0.52;
    const topY = this.height * 0.16;
    const topWidth = size * 0.88;
    const coneHeight = size * 0.58;

    return {
      centerX,
      topY,
      topWidth,
      coneHeight,
      tipY: topY + coneHeight + size * 0.18,
    };
  }

  private getConePoints(bounds: ReturnType<PouroverScene["getBounds"]>) {
    return {
      leftTop: { x: bounds.centerX - bounds.topWidth / 2, y: bounds.topY },
      rightTop: { x: bounds.centerX + bounds.topWidth / 2, y: bounds.topY },
      tip: { x: bounds.centerX, y: bounds.tipY },
    };
  }

  private getWaterPoints(
    bounds: ReturnType<PouroverScene["getBounds"]>,
    waterLevel: number,
  ) {
    const fill = clamp01(waterLevel);
    const bottom = bounds.tipY - 16;
    const topRange = bounds.coneHeight * 0.62;
    const top = Math.max(bounds.topY + 30, bottom - Math.max(4, fill * topRange));
    const topHalfWidth = this.getConeHalfWidthAtY(bounds, top) * 0.9;
    const bottomHalfWidth = this.getConeHalfWidthAtY(bounds, bottom) * 0.82;

    return {
      leftTop: { x: bounds.centerX - topHalfWidth, y: top },
      rightTop: { x: bounds.centerX + topHalfWidth, y: top },
      rightBottom: { x: bounds.centerX + bottomHalfWidth, y: bottom },
      leftBottom: { x: bounds.centerX - bottomHalfWidth, y: bottom },
    };
  }

  private getConeHalfWidthAtY(
    bounds: ReturnType<PouroverScene["getBounds"]>,
    y: number,
  ): number {
    const t = clamp01((y - bounds.topY) / (bounds.tipY - bounds.topY));
    const topHalfWidth = bounds.topWidth * 0.5;
    return Math.max(4, topHalfWidth * (1 - t));
  }

  private getMugRect(bounds: ReturnType<PouroverScene["getBounds"]>) {
    const width = bounds.topWidth * 0.34;
    const height = bounds.coneHeight * 0.32;
    return {
      x: bounds.centerX - width / 2,
      y: bounds.tipY + 58,
      width,
      height,
    };
  }

  private drawInputStream(
    kettleTip: Point,
    water: ReturnType<PouroverScene["getWaterPoints"]>,
    state: PouroverSimulationState,
    streams: StreamVisualState,
  ): void {
    if (streams.inDisplayedRateGPerSec <= 0) {
      return;
    }
    const startY = kettleTip.y;
    const endY = this.getWaterSurfaceCenterY(water);
    const intensity = clamp01(streams.inNormRaw);
    this.drawVerticalStream(
      kettleTip.x,
      startY,
      endY,
      streams.inWidthPx,
      intensity,
      "78, 149, 178",
    );
    this.drawStreamDroplets(
      kettleTip.x,
      startY,
      endY,
      streams.inWidthPx,
      intensity,
      state.timeSec,
      "78, 149, 178",
    );
  }

  private getWaterSurfaceCenterY(water: ReturnType<PouroverScene["getWaterPoints"]>): number {
    return water.leftTop.y + 4;
  }

  private clampKettleTip(tip: Point): Point {
    return {
      x: Math.max(26, Math.min(this.width - 26, tip.x)),
      y: Math.max(24, Math.min(this.height * 0.62, tip.y)),
    };
  }

  private drawKettle(tip: Point): void {
    const ctx = this.ctx;
    const bodyCenter = { x: tip.x - 72, y: tip.y - 42 };
    const bodyWidth = 124;
    const bodyHeight = 86;
    const handleCenter = { x: bodyCenter.x - bodyWidth * 0.44, y: bodyCenter.y - 2 };

    ctx.save();
    ctx.strokeStyle = "rgba(41, 51, 60, 0.9)";
    ctx.lineWidth = 4;
    ctx.fillStyle = "rgba(170, 178, 186, 0.9)";
    ctx.beginPath();
    ctx.ellipse(bodyCenter.x, bodyCenter.y, bodyWidth * 0.5, bodyHeight * 0.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bodyCenter.x + 28, bodyCenter.y - 18);
    ctx.quadraticCurveTo(tip.x - 20, tip.y - 8, tip.x, tip.y);
    ctx.strokeStyle = "rgba(46, 56, 65, 0.95)";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(handleCenter.x, handleCenter.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(48, 58, 66, 0.9)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(32, 40, 48, 0.95)";
    ctx.fill();
    ctx.restore();
  }

  private renderFromCachedState(): void {
    if (!this.lastState || !this.lastParams) {
      return;
    }
    this.clear();
    this.drawScene(this.lastState, this.lastParams);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.lastState) {
      return;
    }
    const pointer = this.getPointer(event);
    this.pointerPositions.set(event.pointerId, pointer);
    if (event.pointerType === "touch") {
      this.touchPointerIds.add(event.pointerId);
    }

    if (this.isDraggingKettle && event.pointerType === "touch" && this.dragPointerId !== event.pointerId) {
      this.touchAdjustMode = true;
      this.cancelLongPress();
      this.touchAdjustAccumulator = 0;
      this.canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }

    if (this.isDraggingKettle) {
      return;
    }
    const kettleTip = this.kettleTipToPoint(this.lastState.kettleTip);
    const dx = pointer.x - kettleTip.x;
    const dy = pointer.y - kettleTip.y;
    if (Math.hypot(dx, dy) > 84) {
      return;
    }
    this.isDraggingKettle = true;
    this.dragPointerId = event.pointerId;
    this.dragOffset = { x: dx, y: dy };
    this.wheelDeltaAccumulator = 0;
    this.touchAdjustMode = false;
    this.touchAdjustAccumulator = 0;
    this.canvas.setPointerCapture(event.pointerId);

    if (event.pointerType === "touch") {
      this.longPressPointerId = event.pointerId;
      this.longPressStartPoint = pointer;
      this.longPressTimerId = window.setTimeout(() => {
        if (
          this.isDraggingKettle &&
          this.dragPointerId === event.pointerId &&
          this.touchPointerIds.size === 1
        ) {
          this.touchAdjustMode = true;
          this.touchAdjustAccumulator = 0;
        }
        this.cancelLongPress();
      }, 350);
      event.preventDefault();
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.isDraggingKettle || !this.lastState) {
      return;
    }
    const pointer = this.getPointer(event);
    const previous = this.pointerPositions.get(event.pointerId);
    this.pointerPositions.set(event.pointerId, pointer);

    if (event.pointerType === "touch" && this.longPressPointerId === event.pointerId && !this.touchAdjustMode) {
      const start = this.longPressStartPoint;
      if (start && Math.hypot(pointer.x - start.x, pointer.y - start.y) > 8) {
        this.cancelLongPress();
      }
    }

    if (event.pointerType === "touch" && this.touchAdjustMode) {
      if (previous) {
        this.applyVerticalPourRateDelta(pointer.y - previous.y);
      }
      event.preventDefault();
      return;
    }

    if (this.dragPointerId !== event.pointerId) {
      return;
    }

    const nextTip = {
      x: pointer.x - this.dragOffset.x,
      y: pointer.y - this.dragOffset.y,
    };
    const clampedTip = this.clampKettleTip(nextTip);
    const nextKettleTip = this.pointToKettleTip(clampedTip);
    this.lastState = {
      ...this.lastState,
      kettleTip: nextKettleTip,
    };
    this.options.onKettleTipChange?.(nextKettleTip);
    this.renderFromCachedState();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.pointerPositions.delete(event.pointerId);
    this.touchPointerIds.delete(event.pointerId);
    this.cancelLongPressIfMatching(event.pointerId);

    if (!this.isDraggingKettle) {
      return;
    }
    if (event.pointerType === "touch") {
      if (this.touchPointerIds.size <= 1) {
        this.touchAdjustMode = false;
        this.touchAdjustAccumulator = 0;
      }
    }

    if (this.dragPointerId !== event.pointerId) {
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
      return;
    }

    this.isDraggingKettle = false;
    this.dragPointerId = null;
    this.wheelDeltaAccumulator = 0;
    this.touchAdjustMode = false;
    this.touchAdjustAccumulator = 0;
    this.cancelLongPress();
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.isDraggingKettle) {
      return;
    }
    event.preventDefault();
    const normalizedDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    this.wheelDeltaAccumulator += normalizedDelta;
    const stepThresholdPx = 40;
    const stepCount = Math.trunc(this.wheelDeltaAccumulator / stepThresholdPx);
    if (stepCount === 0) {
      return;
    }
    this.wheelDeltaAccumulator -= stepCount * stepThresholdPx;
    this.options.onPourRateNudge?.(-stepCount);
  };

  private applyVerticalPourRateDelta(deltaY: number): void {
    this.touchAdjustAccumulator += deltaY;
    const stepThresholdPx = 28;
    const stepCount = Math.trunc(this.touchAdjustAccumulator / stepThresholdPx);
    if (stepCount === 0) {
      return;
    }
    this.touchAdjustAccumulator -= stepCount * stepThresholdPx;
    this.options.onPourRateNudge?.(-stepCount);
  }

  private cancelLongPress(): void {
    if (this.longPressTimerId !== null) {
      window.clearTimeout(this.longPressTimerId);
      this.longPressTimerId = null;
    }
    this.longPressPointerId = null;
    this.longPressStartPoint = null;
  }

  private cancelLongPressIfMatching(pointerId: number): void {
    if (this.longPressPointerId === pointerId) {
      this.cancelLongPress();
    }
  }

  private getPointer(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private kettleTipToPoint(kettleTip: KettleTipState): Point {
    return this.clampKettleTip({
      x: clamp01(kettleTip.xNorm) * this.width,
      y: clamp01(kettleTip.yNorm) * this.height,
    });
  }

  private pointToKettleTip(point: Point): KettleTipState {
    return {
      xNorm: clamp01(point.x / Math.max(1, this.width)),
      yNorm: clamp01(point.y / Math.max(1, this.height)),
    };
  }

  private drawCutawayCone(cone: ReturnType<PouroverScene["getConePoints"]>): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "rgba(64, 87, 92, 0.28)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(cone.leftTop.x, cone.leftTop.y);
    ctx.lineTo(cone.tip.x, cone.tip.y);
    ctx.lineTo(cone.rightTop.x, cone.rightTop.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(234, 249, 250, 0.92)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cone.leftTop.x, cone.leftTop.y);
    ctx.lineTo(cone.tip.x, cone.tip.y);
    ctx.lineTo(cone.rightTop.x, cone.rightTop.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(234, 249, 250, 0.78)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cone.leftTop.x, cone.leftTop.y);
    ctx.bezierCurveTo(
      cone.leftTop.x + (cone.rightTop.x - cone.leftTop.x) * 0.24,
      cone.leftTop.y - 20,
      cone.rightTop.x - (cone.rightTop.x - cone.leftTop.x) * 0.24,
      cone.rightTop.y - 20,
      cone.rightTop.x,
      cone.rightTop.y,
    );
    ctx.stroke();
    ctx.restore();
  }

  private drawPaperFilter(cone: ReturnType<PouroverScene["getConePoints"]>): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(242, 235, 219, 0.68)";
    ctx.strokeStyle = "rgba(128, 104, 79, 0.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cone.leftTop.x + 22, cone.leftTop.y + 20);
    ctx.lineTo(cone.tip.x, cone.tip.y - 12);
    ctx.lineTo(cone.rightTop.x - 22, cone.rightTop.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawCoffeeGrounds(
    bounds: ReturnType<PouroverScene["getBounds"]>,
    cone: ReturnType<PouroverScene["getConePoints"]>,
    state: PouroverSimulationState,
    params: PouroverParams,
  ): void {
    const ctx = this.ctx;
    const topY = cone.leftTop.y + 34;
    const bottomY = cone.tip.y - 15;
    const saturation = clamp01(state.bedSaturation);
    const shadeLift = saturation * 24;

    ctx.save();
    this.pathPolygon([
      { x: cone.leftTop.x + 22, y: cone.leftTop.y + 20 },
      { x: cone.tip.x, y: cone.tip.y - 12 },
      { x: cone.rightTop.x - 22, y: cone.rightTop.y + 20 },
    ]);
    ctx.clip();

    const bedGradient = ctx.createLinearGradient(0, topY, 0, bottomY);
    bedGradient.addColorStop(0, `rgba(${92 + shadeLift}, ${60 + shadeLift * 0.3}, ${37 + shadeLift * 0.12}, 0.36)`);
    bedGradient.addColorStop(1, `rgba(${72 + shadeLift * 0.55}, ${45 + shadeLift * 0.2}, ${26 + shadeLift * 0.08}, 0.66)`);
    ctx.fillStyle = bedGradient;
    ctx.fillRect(cone.leftTop.x + 18, topY, bounds.topWidth - 36, bottomY - topY + 16);

    this.groundParticles.forEach((particle, index) => {
      const tone = Math.max(36, Math.min(118, 104 - particle.size * 28 + saturation * 18 + (index % 3) * 4));
      const highlightFine = params.highlightFines && particle.particleClass === "fine";

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = highlightFine
        ? "rgba(174, 98, 38, 0.95)"
        : `rgba(${tone}, ${Math.max(28, tone - 31)}, ${Math.max(18, tone - 56)}, 0.9)`;
      ctx.fill();

      if (highlightFine) {
        ctx.strokeStyle = "rgba(235, 174, 91, 0.78)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  private drawWater(water: ReturnType<PouroverScene["getWaterPoints"]>): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, water.leftTop.y, 0, water.leftBottom.y);
    gradient.addColorStop(0, "rgba(111, 198, 223, 0.8)");
    gradient.addColorStop(1, "rgba(67, 143, 176, 0.54)");

    ctx.save();
    ctx.fillStyle = gradient;
    this.pathPolygon([water.leftTop, water.rightTop, water.rightBottom, water.leftBottom]);
    ctx.fill();

    ctx.strokeStyle = "rgba(228, 252, 255, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(water.leftTop.x, water.leftTop.y);
    ctx.bezierCurveTo(
      water.leftTop.x + (water.rightTop.x - water.leftTop.x) * 0.25,
      water.leftTop.y - 7,
      water.rightTop.x - (water.rightTop.x - water.leftTop.x) * 0.25,
      water.rightTop.y - 7,
      water.rightTop.x,
      water.rightTop.y,
    );
    ctx.stroke();
    ctx.restore();
  }

  private drawOutputStream(
    bounds: ReturnType<PouroverScene["getBounds"]>,
    mug: ReturnType<PouroverScene["getMugRect"]>,
    state: PouroverSimulationState,
    streams: StreamVisualState,
  ): void {
    if (streams.outDisplayedRateGPerSec <= 0) {
      return;
    }

    const intensity = clamp01(streams.outNormSmooth);
    const targetY = mug.y + 8;
    this.drawVerticalStream(
      bounds.centerX,
      bounds.tipY + 1,
      targetY,
      streams.outWidthPx,
      intensity,
      "78, 149, 178",
    );

    this.drawStreamDroplets(
      bounds.centerX,
      bounds.tipY + 8,
      targetY,
      streams.outWidthPx,
      intensity,
      state.timeSec,
      "78, 149, 178",
    );
  }

  private drawVerticalStream(
    x: number,
    startY: number,
    endY: number,
    widthPx: number,
    intensity: number,
    rgb: string,
  ): void {
    const safeIntensity = clamp01(Number.isFinite(intensity) ? intensity : 0);
    const safeWidthPx = Math.max(0, Number.isFinite(widthPx) ? widthPx : 0);
    if (safeWidthPx <= 0) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.1 + safeIntensity * 0.8;
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.lineWidth = safeWidthPx;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    ctx.restore();
  }

  private drawStreamDroplets(
    x: number,
    startY: number,
    endY: number,
    widthPx: number,
    intensity: number,
    timeSec: number,
    rgb: string,
  ): void {
    const safeIntensity = clamp01(Number.isFinite(intensity) ? intensity : 0);
    const safeWidthPx = Math.max(0, Number.isFinite(widthPx) ? widthPx : 0);
    if (safeIntensity <= 0 || safeWidthPx <= 0) {
      return;
    }

    const ctx = this.ctx;
    const dropletCount = 3;
    ctx.save();
    ctx.fillStyle = `rgba(${rgb}, ${0.1 + safeIntensity * 0.8})`;
    for (let index = 0; index < dropletCount; index += 1) {
      const progress = (timeSec * (0.13 + safeIntensity * 0.195) + index / dropletCount) % 1;
      const y = startY + progress * (endY - startY);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.8, safeWidthPx * 0.44), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMug(mug: ReturnType<PouroverScene["getMugRect"]>, state: PouroverSimulationState): void {
    const ctx = this.ctx;
    const fill = clamp01(state.brewedCoffeeG / 280);

    ctx.save();
    ctx.fillStyle = "rgba(255, 250, 240, 0.9)";
    ctx.strokeStyle = "rgba(88, 65, 49, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(mug.x, mug.y, mug.width, mug.height, 14);
    ctx.fill();
    ctx.stroke();

    const liquidTop = mug.y + mug.height - fill * (mug.height - 14);
    const liquidGradient = ctx.createLinearGradient(0, liquidTop, 0, mug.y + mug.height);
    liquidGradient.addColorStop(0, "rgba(145, 92, 49, 0.85)");
    liquidGradient.addColorStop(1, "rgba(94, 55, 25, 0.88)");
    ctx.fillStyle = liquidGradient;
    ctx.beginPath();
    ctx.roundRect(mug.x + 5, liquidTop, mug.width - 10, mug.y + mug.height - liquidTop - 5, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mug.x + mug.width + 8, mug.y + mug.height * 0.52, 10, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = "rgba(88, 65, 49, 0.44)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  private drawLabels(state: PouroverSimulationState): void {
    const ctx = this.ctx;
    const padX = 16;
    const lineGap = 20;
    const x = this.width - padX;
    const midY = this.height * 0.5;

    ctx.save();
    ctx.textAlign = "right";
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(40, 104, 129, 0.88)";
    ctx.fillText(`flow-in ${state.inflowRateGPerSec.toFixed(1)} g/s`, x, midY - lineGap * 0.5);

    ctx.fillStyle = "rgba(49, 90, 112, 0.88)";
    ctx.fillText(`flow-out ${state.outflowRateGPerSec.toFixed(1)} g/s`, x, midY + lineGap * 0.5);
    ctx.restore();
  }

  private pathPolygon(points: Point[]): void {
    const [first, ...rest] = points;
    this.ctx.beginPath();
    this.ctx.moveTo(first.x, first.y);
    rest.forEach((point) => this.ctx.lineTo(point.x, point.y));
    this.ctx.closePath();
  }
}
