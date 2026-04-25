import * as THREE from "three"

/** Unscaled Y extent of the cone: topY 0.5 → tip -0.05. */
const CONE_LOCAL_HEIGHT = 0.55
/** AABB center Y in local space (so we can place origin at the visual center). */
const CONE_BBOX_CENTER_Y = (0.5 + -0.05) / 2

/** Fraction of the canvas (visualizer) height the cone should span vertically. */
const V60_VIEW_HEIGHT_FRACTION = 0.7

export type V60SwitchView = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  /** 2D clear-glass V60 cone; switch base / toggle can be re-added later. */
  v60: THREE.Group
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

function buildV60SwitchGroup(): {
  group: THREE.Group
  disposables: Array<THREE.BufferGeometry | THREE.Material>
} {
  const disposables: Array<THREE.BufferGeometry | THREE.Material> = []
  const group = new THREE.Group()

  const lineColor = 0x0f0f0f
  const coneFill = 0xffffff
  const zCone = 0

  const coneShape = makeTriangleShape(-0.3, 0.3, 0.5, 0, -0.05)
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

  return { group, disposables }
}

export function createV60SwitchView(container: HTMLElement): V60SwitchView {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xfafafa)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 5.5)
  camera.lookAt(0, 0, 0)

  const { group: v60, disposables } = buildV60SwitchGroup()
  scene.add(v60)

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

  function render() {
    renderer.render(scene, camera)
  }

  function dispose() {
    resizeObserver.disconnect()
    for (const d of disposables) {
      d.dispose()
    }
    renderer.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return { scene, camera, renderer, v60, render, dispose }
}
