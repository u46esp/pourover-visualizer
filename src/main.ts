import { SIM_TIME_MAX, SIM_TIME_MIN } from "./constants/simulation"
import { createPlayheadState, stepPlayhead } from "./simulation/playhead"
import { mountTimeBar } from "./ui/timeBar"
import { createV60SwitchView } from "./visual/v60SwitchScene"

const shell = document.createElement("div")
shell.id = "app-shell"

const controls = document.createElement("aside")
controls.id = "controls-panel"
controls.setAttribute("aria-label", "Simulation controls")

const visualizer = document.createElement("div")
visualizer.id = "visualizer"

const canvasHost = document.createElement("div")
canvasHost.id = "canvas-host"

const timeBar = document.createElement("footer")
timeBar.id = "time-bar"
timeBar.setAttribute("aria-label", "Time control")

visualizer.appendChild(canvasHost)
visualizer.appendChild(timeBar)
shell.appendChild(controls)
shell.appendChild(visualizer)
document.body.appendChild(shell)

const view = createV60SwitchView(canvasHost)
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

  stepPlayhead(playhead, deltaTime)
  timeBarApi.syncFromPlayhead()
  // simTime is for water flow (PVIZ-002), not V60 world position; brewer stays centered.

  view.render()
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
