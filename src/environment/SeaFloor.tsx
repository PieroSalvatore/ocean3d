import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import seafloorVert from './shaders/seafloor.vert.glsl'
import seafloorFrag from './shaders/seafloor.frag.glsl'

// ─── SeaFloor ─────────────────────────────────────────────────────
// Flat plane at Y = -28 with procedural caustics and depth tinting.
// Phase 2 will add simplex-noise terrain displacement on top of this.
export function SeaFloor() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo<Record<string, THREE.IUniform>>(() => ({
    uTime: { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -25, 0]}>
      {/* 4×4 segments — enough for smooth caustic sampling */}
      <planeGeometry args={[600, 600, 4, 4]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={seafloorVert}
        fragmentShader={seafloorFrag}
        uniforms={uniforms}
      />
    </mesh>
  )
}
