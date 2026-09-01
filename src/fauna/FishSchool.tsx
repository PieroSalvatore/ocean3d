import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FISH_COUNT = 65

// School swarms near the coral area (right side, mid depth)
const CENTER = new THREE.Vector3(6, -14, -8)

// Per-fish constants (vary individual speed/radius/height offset)
function buildFishData() {
  const speeds   = new Float32Array(FISH_COUNT)
  const radii    = new Float32Array(FISH_COUNT)
  const yOffset  = new Float32Array(FISH_COUNT)
  const phases   = new Float32Array(FISH_COUNT)

  for (let i = 0; i < FISH_COUNT; i++) {
    speeds[i]  = 0.18 + (i % 9) * 0.022
    radii[i]   = 2.5 + Math.random() * 5.5
    yOffset[i] = CENTER.y + (Math.random() - 0.5) * 5
    phases[i]  = (i / FISH_COUNT) * Math.PI * 2
  }
  return { speeds, radii, yOffset, phases }
}

export function FishSchool() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy   = useMemo(() => new THREE.Object3D(), [])

  const { speeds, radii, yOffset, phases } = useMemo(buildFishData, [])

  // Cone pointing in +Z so "lookAt(direction)" naturally faces the fish forward
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.14, 0.45, 5)
    g.rotateX(Math.PI / 2)   // tip points in +Z → forward direction
    return g
  }, [])

  // Mix of orange, yellow, and white fish
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ff8c33'),
    roughness: 0.6,
    metalness: 0.15,
    vertexColors: false,
  }), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const m = meshRef.current

    for (let i = 0; i < FISH_COUNT; i++) {
      const angle = phases[i] + t * speeds[i]
      const r = radii[i]
      const wobble = Math.sin(t * 0.3 + i) * 0.5

      const px = CENTER.x + Math.cos(angle) * r
      const py = yOffset[i] + Math.sin(t * 0.25 + i * 0.8) * 1.2 + wobble * 0.2
      const pz = CENTER.z + Math.sin(angle) * r

      // Velocity direction = tangent to the circle
      const vx = -Math.sin(angle) * speeds[i] * r
      const vz =  Math.cos(angle) * speeds[i] * r

      dummy.position.set(px, py, pz)
      dummy.lookAt(px + vx, py, pz + vz)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }

    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[geo, mat, FISH_COUNT]} />
  )
}
