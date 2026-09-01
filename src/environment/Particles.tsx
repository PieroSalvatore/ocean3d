import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 3200

export function Particles() {
  const pointsRef = useRef<THREE.Points>(null!)

  // Static positions (initial values in the Float32Array that we mutate every frame)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos   = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 60  // X spread
      pos[i * 3 + 1] = -28 + Math.random() * 30    // Y spread (floor to near surface)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50  // Z spread
      sizes[i]        = 0.02 + Math.random() * 0.08
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('size',     new THREE.BufferAttribute(sizes, 1))
    return g
  }, [])

  // Speed table — constant per particle, built once
  const speeds = useMemo(() => {
    const s = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) s[i] = 0.25 + Math.random() * 0.75
    return s
  }, [])

  useFrame((_, delta) => {
    const pos = geo.attributes.position.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      // Gentle upward drift
      pos[iy] += speeds[i] * delta

      // Lazy horizontal sway (deterministic, based on Y position)
      pos[ix] += Math.sin(pos[iy] * 0.4 + i * 0.01) * 0.008

      // Wrap around: reset below floor when particle reaches surface
      if (pos[iy] > 2) {
        pos[iy]  = -28
        pos[ix] = (Math.random() - 0.5) * 60
        pos[iz] = (Math.random() - 0.5) * 50
      }
    }

    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.07}
        color="#88ccee"
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
