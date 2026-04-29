import { V60_SWITCH_DRAIN_TOGGLED_ON } from "./constants/appEvents"
import { V60_SWITCH_MAX_FLOW_G_PER_S } from "./constants/switchFlow"
import { SIM_TIME_MAX, SIM_TIME_MIN } from "./constants/simulation"
import { createV60SwitchReservoir, stepV60SwitchDrain } from "./physics/v60SwitchReservoir"
import { createPlayheadState, stepPlayhead } from "./simulation/playhead"
import { mountTimeBar } from "./ui/timeBar"
import { createV60SwitchView } from "./visual/v60SwitchScene"

const shell = document.createElement("div")
shell.id = "app-shell"

const controls = document.createElement("aside")
controls.id = "controls-panel"
controls.setAttribute("aria-label", "Simulation controls")

const observations = document.createElement("aside")
observations.id = "observations-panel"
observations.setAttribute("aria-label", "Observations")

const visualizer = document.createElement("div")
visualizer.id = "visualizer"

const canvasHost = document.createElement("div")
canvasHost.id = "canvas-host"

const timeBar = document.createElement("footer")
timeBar.id = "time-bar"
timeBar.setAttribute("aria-label", "Time control")

visualizer.appendChild(canvasHost)
visualizer.appendChild(timeBar)
shell.append(controls, visualizer, observations)
document.body.appendChild(shell)

const obsTitle = document.createElement("h2")
obsTitle.className = "observations-title"
obsTitle.textContent = "Observations"
const outflowRow = document.createElement("div")
outflowRow.className = "observation-row"
const outflowLabel = document.createElement("span")
outflowLabel.className = "observation-label"
outflowLabel.textContent = "Outflow"
const outflowValue = document.createElement("span")
outflowValue.className = "observation-value"
outflowValue.textContent = "0.00 g/s"
outflowRow.append(outflowLabel, outflowValue)
observations.append(obsTitle, outflowRow)

const view = createV60SwitchView(canvasHost)

const drainField = document.createElement("fieldset")
drainField.className = "controls-drain"
const drainLegend = document.createElement("legend")
drainLegend.textContent = "Drain"
const row = document.createElement("div")
row.className = "controls-drain-toggle-row"
const rightHint = document.createElement("button")
rightHint.type = "button"
rightHint.className = "controls-drain-hint"
rightHint.textContent = "Open"
const toggle = document.createElement("label")
toggle.className = "ios-toggle"
const drainSwitch = document.createElement("input")
drainSwitch.type = "checkbox"
drainSwitch.className = "ios-toggle-input"
drainSwitch.id = "drain-open-toggle"
drainSwitch.setAttribute("aria-label", "Drain: closed or open")
const track = document.createElement("span")
track.className = "ios-toggle-ui"
rightHint.addEventListener("click", () => {
  drainSwitch.checked = !drainSwitch.checked
  drainSwitch.dispatchEvent(new Event("change", { bubbles: true }))
})
drainSwitch.addEventListener("change", () => {
  if (drainSwitch.checked) {
    window.dispatchEvent(new CustomEvent(V60_SWITCH_DRAIN_TOGGLED_ON, { bubbles: true }))
  }
})
toggle.append(drainSwitch, track)
row.append(toggle, rightHint)
drainField.append(drainLegend, row)
controls.appendChild(drainField)

const reservoir = createV60SwitchReservoir()

const playhead = createPlayheadState(true)
const timeBarApi = mountTimeBar(timeBar, playhead, {
  tMin: SIM_TIME_MIN,
  tMax: SIM_TIME_MAX,
})

let lastSec = performance.now() / 1000

function frame() {
  const nowSec = performance.now() / 1000
  const deltaTime = Math.min(nowSec - lastSec, 0.25)
  lastSec = nowSec

  const simT0 = playhead.simTime
  stepPlayhead(playhead, deltaTime)
  const dtSim = playhead.simTime - simT0
  const { emittedG } = stepV60SwitchDrain(reservoir, {
    switchOpen: drainSwitch.checked,
    flowRateGPerSec: V60_SWITCH_MAX_FLOW_G_PER_S,
    dtSimSec: dtSim,
  })
  const outflowGps = dtSim > 0 ? emittedG / dtSim : 0
  outflowValue.textContent = `${outflowGps.toFixed(2)} g/s`
  view.setWaterInventoryG(reservoir.inventoryG)

  timeBarApi.syncFromPlayhead()
  // simTime and drain both use the same fixed-tick sim clock (PVIZ-002).

  view.render()
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
