import * as THREE from "three"

export type DemoCircleView = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  /** Filled circle mesh; position.x will follow simulation time in later wiring. */
  circle: THREE.Mesh
  render: () => void
  dispose: () => void
}

/**
 * Three.js scene with a single circle mesh, per Architecture.md (WebGL via Three.js).
 */
export function createDemoCircleView(container: HTMLElement): DemoCircleView {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xfafafa)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 4)
  camera.lookAt(0, 0, 0)

  const geometry = new THREE.CircleGeometry(0.35, 48)
  const material = new THREE.MeshBasicMaterial({ color: 0x2563eb })
  const circle = new THREE.Mesh(geometry, material)
  scene.add(circle)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  function setSize() {
    const w = container.clientWidth
    const h = Math.max(container.clientHeight, 1)
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
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
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return { scene, camera, renderer, circle, render, dispose }
}
