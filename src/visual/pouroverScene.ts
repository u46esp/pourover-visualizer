import type { PouroverSimulationState } from "../model/simulationState";

interface Point {
  x: number;
  y: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export class PouroverScene {
  private readonly canvas = document.createElement("canvas");
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;

  constructor(private readonly host: HTMLElement) {
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

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  update(state: PouroverSimulationState): void {
    this.clear();
    this.drawScene(state);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.host.replaceChildren();
  }

  private resize(): void {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, this.host.clientWidth);
    this.height = Math.max(1, this.host.clientHeight);
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  private clear(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, "#f8efe4");
    gradient.addColorStop(1, "#dcc2a2");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawScene(state: PouroverSimulationState): void {
    const bounds = this.getBounds();
    const cone = this.getConePoints(bounds);
    const water = this.getWaterPoints(bounds, state.waterLevel);
    const mug = this.getMugRect(bounds);
    this.drawInputStream(bounds, state);
    this.drawCutawayCone(cone);
    this.drawPaperFilter(cone);
    this.drawWater(water);
    this.drawOutputStream(bounds, mug, state);
    this.drawMug(mug, state);
    this.drawLabels(bounds, state);
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
    bounds: ReturnType<PouroverScene["getBounds"]>,
    state: PouroverSimulationState,
  ): void {
    const ctx = this.ctx;
    const intensity = Math.max(0.16, state.flowIntensity);

    ctx.save();
    ctx.strokeStyle = `rgba(89, 183, 214, ${0.35 + intensity * 0.5})`;
    ctx.lineWidth = 4 + intensity * 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bounds.centerX - bounds.topWidth * 0.08, bounds.topY - 92);
    ctx.bezierCurveTo(
      bounds.centerX - bounds.topWidth * 0.09,
      bounds.topY - 38,
      bounds.centerX - bounds.topWidth * 0.06,
      bounds.topY + 12,
      bounds.centerX - bounds.topWidth * 0.04,
      bounds.topY + 52,
    );
    ctx.stroke();
    ctx.restore();
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
  ): void {
    const ctx = this.ctx;
    const intensity = Math.max(0.08, state.dripIntensity);
    const targetY = mug.y + 8;

    ctx.save();
    ctx.strokeStyle = `rgba(78, 149, 178, ${0.22 + intensity * 0.68})`;
    ctx.lineWidth = 3 + intensity * 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bounds.centerX, bounds.tipY + 1);
    ctx.lineTo(bounds.centerX, targetY);
    ctx.stroke();

    const dropletCount = 3;
    for (let index = 0; index < dropletCount; index += 1) {
      const progress = (state.timeSec * (0.55 + intensity) + index / dropletCount) % 1;
      const y = bounds.tipY + 8 + progress * (targetY - bounds.tipY - 16);
      ctx.beginPath();
      ctx.arc(bounds.centerX, y, 1.8 + intensity * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(78, 149, 178, ${0.22 + intensity * 0.68})`;
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

  private drawLabels(
    bounds: ReturnType<PouroverScene["getBounds"]>,
    state: PouroverSimulationState,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(55, 36, 24, 0.78)";
    ctx.fillText("cutaway dripper", bounds.centerX - bounds.topWidth * 0.45, bounds.topY - 20);
    ctx.fillText("coffee mug", bounds.centerX - bounds.topWidth * 0.15, bounds.tipY + 132);

    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(40, 104, 129, 0.88)";
    ctx.fillText(
      `flow-in ${state.inflowRateGPerSec.toFixed(1)} g/s`,
      bounds.centerX - bounds.topWidth * 0.27,
      bounds.topY - 64,
    );

    ctx.fillStyle = "rgba(49, 90, 112, 0.88)";
    ctx.fillText(
      `flow-out ${state.outflowRateGPerSec.toFixed(1)} g/s`,
      bounds.centerX + bounds.topWidth * 0.05,
      bounds.tipY + 36,
    );
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
