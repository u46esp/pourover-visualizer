import { PARAM_LIMITS } from "../constants/simulation";
import { BREW_METHODS, type BrewMethodId } from "../model/brewMethod";
import { GRINDER_PROFILES } from "../model/grinderProfile";
import type { PouroverParams } from "../model/simulationState";

export interface ControlState {
  method: BrewMethodId;
  params: PouroverParams;
  timeSec: number;
  playing: boolean;
  playbackRate: 1 | 2 | 4;
}

interface ControlCallbacks {
  onChange: (state: ControlState) => void;
  onReset: () => void;
}

type ParamKey = Exclude<keyof PouroverParams, "grinderProfile" | "highlightFines">;

export class Controls {
  private state: ControlState;
  private readonly outputs = new Map<string, HTMLOutputElement>();
  private playButton!: HTMLButtonElement;
  private readonly speedButtons = new Map<1 | 2 | 4, HTMLButtonElement>();

  constructor(
    private readonly host: HTMLElement,
    initialState: ControlState,
    private readonly callbacks: ControlCallbacks,
  ) {
    this.state = structuredClone(initialState);
    this.render();
    this.emit();
  }

  setPlaying(playing: boolean): void {
    this.state.playing = playing;
    this.playButton.textContent = playing ? "Pause" : "Play";
  }

  setState(state: ControlState): void {
    this.state = structuredClone(state);
    this.render();
    this.emit();
  }

  setTime(timeSec: number): void {
    this.state.timeSec = timeSec;
    this.updateOutput("timeSec", `${timeSec.toFixed(1)} s`);
  }

  getState(): ControlState {
    return structuredClone(this.state);
  }

  private render(): void {
    this.host.replaceChildren();
    this.host.append(
      // this.createSelectors(),
      this.createFlowRateGroup(),
      this.createGroundsGroup(),
      this.createTimeGroup(),
    );
  }

  private createSelectors(): HTMLElement {
    const group = document.createElement("section");
    group.className = "control-group";
    group.innerHTML = "<h2>Brew view</h2>";

    const method = this.createSelectField("Method", BREW_METHODS, this.state.method);
    group.append(method);
    return group;
  }

  private createFlowRateGroup(): HTMLElement {
    const group = document.createElement("section");
    group.className = "control-group";
    group.innerHTML = "<h2>Pour</h2>";
    const flowLimits = PARAM_LIMITS.pourRateGPerSec;
    const kettleLimits = PARAM_LIMITS.kettleTempC;
    group.append(
      this.createRangeField(
        "Flow-in rate",
        "pourRateGPerSec",
        this.state.params.pourRateGPerSec,
        flowLimits.min,
        flowLimits.max,
        flowLimits.step,
        flowLimits.unit,
      ),
      this.createRangeField(
        "Kettle temperature",
        "kettleTempC",
        this.state.params.kettleTempC,
        kettleLimits.min,
        kettleLimits.max,
        kettleLimits.step,
        kettleLimits.unit,
      ),
    );

    return group;
  }

  private createGroundsGroup(): HTMLElement {
    const group = document.createElement("section");
    group.className = "control-group";
    group.innerHTML = "<h2>Grounds</h2>";
    group.append(this.createGrinderProfileField(), this.createHighlightFinesField());
    return group;
  }

  private createTimeGroup(): HTMLElement {
    const group = document.createElement("section");
    group.className = "control-group";
    group.innerHTML = "<h2>Time</h2>";

    const timeField = this.createReadOnlyField(
      "Brew time",
      "timeSec",
      this.state.timeSec,
      "s",
    );

    this.playButton = document.createElement("button");
    this.playButton.type = "button";
    this.playButton.textContent = this.state.playing ? "Pause" : "Play";
    this.playButton.addEventListener("click", () => {
      this.state.playing = !this.state.playing;
      this.playButton.textContent = this.state.playing ? "Pause" : "Play";
      this.emit();
    });

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "secondary";
    reset.textContent = "Reset";
    reset.addEventListener("click", () => this.callbacks.onReset());

    const row = document.createElement("div");
    row.className = "button-row";
    row.append(this.playButton, reset);
    group.append(timeField, row, this.createSpeedRow());
    return group;
  }

  private createSpeedRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "button-row";
    this.speedButtons.clear();

    ([1, 2, 4] as const).forEach((rate) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary";
      button.textContent = `${rate}x`;
      button.addEventListener("click", () => {
        this.state.playbackRate = rate;
        this.refreshSpeedButtons();
        this.emit();
      });
      this.speedButtons.set(rate, button);
      row.append(button);
    });

    this.refreshSpeedButtons();
    return row;
  }

  private createSelectField<T extends { id: string; label: string; enabled?: boolean }>(
    label: string,
    options: T[],
    selected: string,
  ): HTMLElement {
    const field = document.createElement("div");
    field.className = "field";

    const labelElement = document.createElement("label");
    labelElement.textContent = label;

    const select = document.createElement("select");
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.id;
      optionElement.textContent = option.enabled === false ? `${option.label} (coming later)` : option.label;
      optionElement.disabled = option.enabled === false;
      optionElement.selected = option.id === selected;
      select.append(optionElement);
    });

    select.addEventListener("change", () => {
      this.state.method = select.value as BrewMethodId;
      this.emit();
    });

    field.append(labelElement, select);
    return field;
  }

  private createGrinderProfileField(): HTMLElement {
    const field = document.createElement("div");
    field.className = "field";

    const labelElement = document.createElement("label");
    labelElement.textContent = "Grinder profile";

    const select = document.createElement("select");
    GRINDER_PROFILES.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.label;
      option.selected = profile.id === this.state.params.grinderProfile;
      select.append(option);
    });

    select.addEventListener("change", () => {
      this.state.params.grinderProfile = select.value as PouroverParams["grinderProfile"];
      this.emit();
    });

    field.append(labelElement, select);
    return field;
  }

  private createHighlightFinesField(): HTMLElement {
    const field = document.createElement("div");
    field.className = "field";

    const labelElement = document.createElement("label");
    const labelText = document.createElement("span");
    labelText.textContent = "Highlight fines";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.state.params.highlightFines;
    input.addEventListener("change", () => {
      this.state.params.highlightFines = input.checked;
      this.emit();
    });

    labelElement.append(labelText, input);
    field.append(labelElement);
    return field;
  }

  private createRangeField(
    label: string,
    key: ParamKey | "timeSec",
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
  ): HTMLElement {
    const field = document.createElement("div");
    field.className = "field";

    const labelElement = document.createElement("label");
    const labelText = document.createElement("span");
    labelText.textContent = label;
    const output = document.createElement("output");
    this.outputs.set(key, output);
    labelElement.append(labelText, output);

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener("input", () => {
      const nextValue = Number(input.value);
      if (key === "timeSec") {
        this.state.timeSec = nextValue;
        this.state.playing = false;
        this.playButton.textContent = "Play";
      } else {
        this.state.params[key] = nextValue;
      }
      this.updateOutput(key, this.formatValue(nextValue, unit));
      this.emit();
    });

    field.append(labelElement, input);
    this.updateOutput(key, this.formatValue(value, unit));
    return field;
  }

  private createReadOnlyField(
    label: string,
    key: "timeSec",
    value: number,
    unit: string,
  ): HTMLElement {
    const field = document.createElement("div");
    field.className = "field";

    const labelElement = document.createElement("label");
    const labelText = document.createElement("span");
    labelText.textContent = label;
    const output = document.createElement("output");
    this.outputs.set(key, output);
    labelElement.append(labelText, output);

    field.append(labelElement);
    this.updateOutput(key, this.formatValue(value, unit));
    return field;
  }

  private updateOutput(key: string, value: string): void {
    const output = this.outputs.get(key);
    if (output) {
      output.value = value;
      output.textContent = value;
    }
  }

  private formatValue(value: number, unit: string): string {
    const precision =
      unit === "g/s" || unit === "s"
        ? 1
        : unit === "g" || unit === "°C"
          ? 0
          : 2;
    return `${value.toFixed(precision)}${unit ? ` ${unit}` : ""}`;
  }

  private emit(): void {
    this.callbacks.onChange(this.getState());
  }

  private refreshSpeedButtons(): void {
    this.speedButtons.forEach((button, rate) => {
      button.classList.toggle("active-speed", rate === this.state.playbackRate);
    });
  }
}
