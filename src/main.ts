import { DEFAULT_POUROVER_PARAMS, SIMULATION_DT_SEC, SIMULATION_DURATION_SEC } from "./constants/simulation";
import type { PouroverSimulationState } from "./model/simulationState";
import { createPouroverSimulator } from "./simulation/pouroverHeuristic";
import { Controls, type ControlState } from "./ui/controls";
import { PouroverScene } from "./visual/pouroverScene";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = `
  <main class="app-shell">
    <aside class="panel">
      <section class="hero">
        <h1>Coffee Brewing Visualizer</h1>
        <p>
          Bare-bones pourover frame view.
        </p>
      </section>
      <div id="controls"></div>
      <section class="control-group">
        <h2>Flow rates</h2>
        <div class="field">
          <label><span>Flow-in rate</span><output id="flow-in-rate">0.0 g/s</output></label>
        </div>
        <div class="field">
          <label><span>Flow-out rate</span><output id="flow-out-rate">0.0 g/s</output></label>
        </div>
      </section>
    </aside>
    <section class="stage" aria-label="Interactive Pourover visualization">
      <div id="canvas-host"></div>
    </section>
  </main>
`;

const controlsHost = getElement("#controls");
const canvasHost = getElement("#canvas-host");
const flowInRateOutput = getElement<HTMLOutputElement>("#flow-in-rate");
const flowOutRateOutput = getElement<HTMLOutputElement>("#flow-out-rate");

const scene = new PouroverScene(canvasHost);
const simulator = createPouroverSimulator();

const initialState: ControlState = {
  method: "pourover",
  params: { ...DEFAULT_POUROVER_PARAMS },
  timeSec: 0,
  playing: true,
  playbackRate: 1,
};

let controlState = initialState;
let lastFrameMs = performance.now();

const controls = new Controls(controlsHost, initialState, {
  onChange(nextState) {
    const previousTimeSec = controlState.timeSec;
    controlState = nextState;

    if (controlState.timeSec !== previousTimeSec) {
      catchUpSimulator();
    }

    renderState();
  },
  onReset() {
    simulator.reset();
    controls.setState({
      ...controlState,
      params: { ...DEFAULT_POUROVER_PARAMS },
      timeSec: 0,
      playing: false,
      playbackRate: 1,
    });
  },
});

requestAnimationFrame(tick);

function tick(nowMs: number): void {
  const deltaSec = Math.min(0.08, (nowMs - lastFrameMs) / 1000);
  lastFrameMs = nowMs;

  if (controlState.playing) {
    const nextTime = controlState.timeSec + deltaSec * controlState.playbackRate;
    if (nextTime >= SIMULATION_DURATION_SEC) {
      controlState.timeSec = SIMULATION_DURATION_SEC;
      controlState.playing = false;
      controls.setPlaying(false);
    } else {
      controlState.timeSec = nextTime;
      controls.setPlaying(true);
    }
    controls.setTime(controlState.timeSec);
    catchUpSimulator();
  }

  renderState();
  requestAnimationFrame(tick);
}

function catchUpSimulator(): void {
  if (controlState.timeSec < simulator.timeSec) {
    simulator.reset();
  }

  let remaining = controlState.timeSec - simulator.timeSec;
  while (remaining > 1e-6) {
    const dt = Math.min(SIMULATION_DT_SEC, remaining);
    simulator.step(controlState.params, dt);
    remaining -= dt;
  }
}

function renderState(): void {
  const simulationState = simulator.getState(controlState.params);
  scene.update(simulationState, controlState.params);
  updateFlowRateReadout(simulationState);
}

function updateFlowRateReadout(state: PouroverSimulationState): void {
  flowInRateOutput.value = `${state.inflowRateGPerSec.toFixed(1)} g/s`;
  flowInRateOutput.textContent = flowInRateOutput.value;
  flowOutRateOutput.value = `${state.outflowRateGPerSec.toFixed(1)} g/s`;
  flowOutRateOutput.textContent = flowOutRateOutput.value;
}

function getElement<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}
