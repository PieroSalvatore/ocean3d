import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Inline shaders (no extra .glsl files needed) ────────────────
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float x = vUv.x;
  float y = vUv.y;  // 0 = deep end, 1 = surface source (bright)

  // Feather at left/right edges — creates beam width
  float edge = 1.0 - abs(x * 2.0 - 1.0);
  edge = pow(edge, 2.8);

  // Fade from bright source (y=1) toward deep (y=0)
  float depth = pow(y, 0.48) * (1.0 - y * y * 0.25);

  // Animated shimmer along the beam
  float shimmer = 0.82 + 0.18 * sin(y * 16.0 - uTime * 2.2 + x * 5.0);

  float alpha = edge * depth * shimmer * uOpacity;
  gl_FragColor = vec4(0.65, 0.88, 1.0, clamp(alpha, 0.0, 1.0));
}`

// Each beam: position of its CENTER, rotation (euler), width, height, opacity
const BEAMS = [
  { pos: [10,  -8, -6],  rot: [0.08, 0.0,  -0.24], w: 2.5,  h: 30, op: 0.16 },
  { pos: [13,  -6, -9],  rot: [0.04, 0.06, -0.20], w: 1.5,  h: 28, op: 0.13 },
  { pos: [7,  -11, -4],  rot: [0.14,-0.04, -0.28], w: 1.0,  h: 25, op: 0.10 },
  { pos: [16,  -5, -12], rot: [0.0,  0.10, -0.19], w: 3.5,  h: 33, op: 0.08 },
  { pos: [5,  -13, -3],  rot: [0.20,-0.08, -0.31], w: 0.7,  h: 22, op: 0.07 },
  { pos: [17,  -4, -13], rot: [-0.03,0.14, -0.17], w: 1.2,  h: 27, op: 0.09 },
  { pos: [9,  -10, -8],  rot: [0.07, 0.02, -0.26], w: 4.0,  h: 36, op: 0.06 },
] as const

export function GodRays() {
  const timeRef = useRef(0)

  const materials = useMemo(() =>
    BEAMS.map(b =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime:    { value: 0 },
          uOpacity: { value: b.op },
        },
        transparent:  true,
        depthWrite:   false,
        blending:     THREE.AdditiveBlending,
        side:         THREE.DoubleSide,
      })
    )
  , [])

  useFrame((_, delta) => {
    timeRef.current += delta
    materials.forEach(m => { m.uniforms.uTime.value = timeRef.current })
  })

  return (
    <group>
      {BEAMS.map((b, i) => (
        <mesh
          key={i}
          position={b.pos as [number, number, number]}
          rotation={b.rot as [number, number, number]}
          material={materials[i]}
          renderOrder={1}
        >
          {/* 8 vertical segments so the shimmer has smooth gradient */}
          <planeGeometry args={[b.w, b.h, 1, 8]} />
        </mesh>
      ))}

      {/* Bright ambient "glow" at the light source area */}
      <pointLight position={[14, 4, -5]} intensity={3} color="#aaddff" distance={30} decay={2} />
    </group>
  )
}
