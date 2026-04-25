import * as THREE from "three"
import { FULL_V60_INVENTORY_G } from "../constants/switchReservoir"
import { V60_CONE2D } from "../model/v60Cone2dProfile"
import { isWaterVisible, waterSurfaceYInCone2d } from "../physics/switchReservoirModel"

/** Unscaled Y extent of the cone: matches `V60_CONE2D` topY − tipY. */
const CONE_LOCAL_HEIGHT = V60_CONE2D.topY - V60_CONE2D.tipY
/** AABB center Y in local space (so we can place origin at the visual center). */
const CONE_BBOX_CENTER_Y = (V60_CONE2D.topY + V60_CONE2D.tipY) / 2

/** Fraction of the canvas (visualizer) height the cone should span vertically. */
const V60_VIEW_HEIGHT_FRACTION = 0.7

export type V60SwitchView = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  /** Root group (cone + water); `scale` holds view fit. */
  v60: THREE.Group
  /**
   * Sets **true** water inventory in **grams** (1 mL ≈ 1 g). **300 g** = visually full, matching
   * `FULL_V60_INVENTORY_G` and the cbrt height law in `switchReservoirModel.ts`.
   */
  setWaterInventoryG(grams: number): void
  render: () => void
  dispose: () => void
}

function makeTriangleShape(
  topLeftX: number,
  topRightX: number,
  topY: number,
  tipX: number,
  tipY: number,
): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(topLeftX, topY)
  s.lineTo(topRightX, topY)
  s.lineTo(tipX, tipY)
  s.closePath()
  return s
}

/** Filled isosceles “slice” of the cone: apex at tip, top edge at y = ySurface. */
function makeWaterShapeUpToY(ySurface: number): THREE.Shape {
  const { tipX, tipY, topY, topLeftX, topRightX } = V60_CONE2D
  const hTotal = topY - tipY
  const t = (ySurface - tipY) / hTotal
  const xL = tipX + t * (topLeftX - tipX)
  const xR = tipX + t * (topRightX - tipX)
  const s = new THREE.Shape()
  s.moveTo(tipX, tipY)
  s.lineTo(xL, ySurface)
  s.lineTo(xR, ySurface)
  s.closePath()
  return s
}

function buildV60SwitchGroup(): {
  group: THREE.Group
  body: THREE.Group
  disposables: Array<THREE.BufferGeometry | THREE.Material>
} {
  const disposables: Array<THREE.BufferGeometry | THREE.Material> = []
  const group = new THREE.Group()

  const lineColor = 0x0f0f0f
  const coneFill = 0xffffff
  const zCone = 0

  const c = V60_CONE2D
  const coneShape = makeTriangleShape(c.topLeftX, c.topRightX, c.topY, c.tipX, c.tipY)
  const coneGeo = new THREE.ShapeGeometry(coneShape)
  disposables.push(coneGeo)
  const coneMat = new THREE.MeshBasicMaterial({
    color: coneFill,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  disposables.push(coneMat)
  const cone = new THREE.Mesh(coneGeo, coneMat)
  cone.position.z = zCone

  const edgeGeo = new THREE.EdgesGeometry(coneGeo, 1)
  disposables.push(edgeGeo)
  const edgeMat = new THREE.LineBasicMaterial({ color: lineColor })
  disposables.push(edgeMat)
  const coneLines = new THREE.LineSegments(edgeGeo, edgeMat)
  coneLines.position.z = zCone + 0.0001

  const body = new THREE.Group()
  body.add(cone, coneLines)
  body.position.set(0, -CONE_BBOX_CENTER_Y, 0)
  group.add(body)

  return { group, body, disposables }
}

function replaceWaterMesh(
  body: THREE.Group,
  oldWater: THREE.Mesh | null,
  grams: number,
  waterMat: THREE.MeshBasicMaterial,
): THREE.Mesh | null {
  if (oldWater) {
    body.remove(oldWater)
    oldWater.geometry.dispose()
  }
  if (!isWaterVisible(grams)) {
    return null
  }
  const yS = waterSurfaceYInCone2d(grams)
  if (yS <= V60_CONE2D.tipY + 1e-6) {
    return null
  }
  const waterShape = makeWaterShapeUpToY(yS)
  const waterGeo = new THREE.ShapeGeometry(waterShape)
  const w = new THREE.Mesh(waterGeo, waterMat)
  w.position.z = -0.0012
  w.renderOrder = -1
  body.add(w)
  return w
}

export function createV60SwitchView(container: HTMLElement): V60SwitchView {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xfafafa)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 5.5)
  camera.lookAt(0, 0, 0)

  const { group: v60, body, disposables } = buildV60SwitchGroup()
  scene.add(v60)

  // Very pale default; TDS / extraction can lerp this toward brown later.
  const waterMat = new THREE.MeshBasicMaterial({
    color: 0xd6f4fa,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  disposables.push(waterMat)

  let waterMesh: THREE.Mesh | null = null

  function setWaterInventoryG(grams: number) {
    waterMesh = replaceWaterMesh(body, waterMesh, grams, waterMat)
  }

  function fitV60ScaleToView() {
    const dist = Math.abs(camera.position.z)
    const vFov = (camera.fov * Math.PI) / 180
    const frustumH = 2 * dist * Math.tan(vFov / 2)
    const s = (V60_VIEW_HEIGHT_FRACTION * frustumH) / CONE_LOCAL_HEIGHT
    v60.scale.setScalar(s)
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  function setSize() {
    const w = container.clientWidth
    const h = Math.max(container.clientHeight, 1)
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    fitV60ScaleToView()
  }

  container.appendChild(renderer.domElement)
  setSize()

  const resizeObserver = new ResizeObserver(setSize)
  resizeObserver.observe(container)

  // PVIZ-002: start with a full switch (300 g) — 1 mL per g, brim fill = 300 mL
  setWaterInventoryG(FULL_V60_INVENTORY_G)

  function render() {
    renderer.render(scene, camera)
  }

  function dispose() {
    resizeObserver.disconnect()
    if (waterMesh) {
      waterMesh.geometry.dispose()
      waterMesh = null
    }
    for (const d of disposables) {
      d.dispose()
    }
    renderer.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return { scene, camera, renderer, v60, setWaterInventoryG, render, dispose }
}
