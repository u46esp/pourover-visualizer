import { createDemoCircleView } from "./visual/demoCircleScene"

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

const view = createDemoCircleView(canvasHost)

function frame() {
  view.render()
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
