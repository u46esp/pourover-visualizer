import type { PlayheadState } from "../simulation/playhead"

/** Unicode: U+23F8 pause, U+25B6 play (media control symbols). */
const GLYPH_PAUSE = "\u23F8"
const GLYPH_PLAY = "\u25B6"

export type TimeBarLimits = {
  tMin: number
  tMax: number
}

/**
 * DOM time controls: Play/Pause and scrub slider bound to `playhead.simTime`.
 */
export function mountTimeBar(
  container: HTMLElement,
  playhead: PlayheadState,
  limits: TimeBarLimits,
): { syncFromPlayhead: () => void } {
  const row = document.createElement("div")
  row.className = "time-bar-inner"

  const playBtn = document.createElement("button")
  playBtn.type = "button"
  playBtn.className = "time-bar-play"

  const range = document.createElement("input")
  range.type = "range"
  range.className = "time-bar-slider"
  range.min = String(limits.tMin)
  range.max = String(limits.tMax)
  range.step = "any"

  const readout = document.createElement("span")
  readout.className = "time-bar-readout"

  row.append(playBtn, range, readout)
  container.appendChild(row)

  let sliderDragging = false

  function clampT(value: number) {
    return Math.min(Math.max(value, limits.tMin), limits.tMax)
  }

  function applyScrub(value: number) {
    playhead.simTime = clampT(value)
    playhead.accumulator = 0
  }

  function refreshPlayButton() {
    if (playhead.playing) {
      playBtn.textContent = GLYPH_PAUSE
      playBtn.setAttribute("aria-label", "Pause")
      playBtn.title = "Pause"
    } else {
      playBtn.textContent = GLYPH_PLAY
      playBtn.setAttribute("aria-label", "Play")
      playBtn.title = "Play"
    }
    playBtn.setAttribute("aria-pressed", playhead.playing ? "true" : "false")
  }

  function refreshReadout() {
    readout.textContent = `${playhead.simTime.toFixed(2)} / ${limits.tMax.toFixed(0)} s`
  }

  function syncFromPlayhead() {
    if (!sliderDragging) {
      range.valueAsNumber = playhead.simTime
    }
    refreshReadout()
    refreshPlayButton()
  }

  playBtn.addEventListener("click", () => {
    const next = !playhead.playing
    if (next && playhead.simTime >= limits.tMax) {
      playhead.simTime = limits.tMin
      playhead.accumulator = 0
    }
    playhead.playing = next
    refreshPlayButton()
  })

  range.addEventListener("pointerdown", () => {
    sliderDragging = true
    playhead.playing = false
    refreshPlayButton()
  })

  range.addEventListener("input", () => {
    applyScrub(range.valueAsNumber)
    refreshReadout()
  })

  const endDrag = () => {
    sliderDragging = false
  }
  range.addEventListener("pointerup", endDrag)
  range.addEventListener("pointercancel", endDrag)
  window.addEventListener("pointerup", endDrag)

  range.valueAsNumber = playhead.simTime
  refreshReadout()
  refreshPlayButton()

  return { syncFromPlayhead }
}
