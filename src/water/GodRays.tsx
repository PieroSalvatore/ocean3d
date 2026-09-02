import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore, ZONE_PRESETS, TIME_MODIFIERS } from '../state/useOceanStore';

const tempRayColor = new THREE.Color();

const rayVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rayFragment = `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uRayColor;
  varying vec2 vUv;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Máscara bidimensional de desvanecimiento suave para eliminar 100% bordes de planos 3D
    float edgeMaskX = smoothstep(0.0, 0.25, vUv.x) * (1.0 - smoothstep(0.75, 1.0, vUv.x));
    float edgeMaskY = smoothstep(0.0, 0.20, vUv.y) * (1.0 - smoothstep(0.80, 1.0, vUv.y));
    float edgeMask = edgeMaskX * edgeMaskY;

    float shape = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 1.8);
    shape *= pow(vUv.y, 0.6);
    
    float dust = noise(vUv * 8.0 + uTime * 0.12) * noise(vUv * 16.0 - uTime * 0.18);
    dust = smoothstep(0.25, 0.75, dust) * 0.35;
    
    float pulse = sin(uTime * 0.6 + vUv.y * 3.5) * 0.12 + 0.88;
    
    float alpha = (shape * pulse * uOpacity + dust * shape) * uOpacity * edgeMask;
    vec3 color = uRayColor;
    
    gl_FragColor = vec4(color, alpha * 0.35);
  }
`;

function SingleRay({ basePos, baseRot, scale, baseOpacityMultiplier, phase }: { 
  basePos: [number, number, number], 
  baseRot: [number, number, number], 
  scale: [number, number, number],
  baseOpacityMultiplier: number,
  phase: number
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const activeZoneId = useOceanStore((s) => s.activeZoneId);
  const timeOfDayId = useOceanStore((s) => s.timeOfDayId);

  const initialPreset = ZONE_PRESETS[activeZoneId];
  const initialTimeMod = TIME_MODIFIERS[timeOfDayId];

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: initialPreset.godRaysOpacity * initialTimeMod.godRaysMultiplier * baseOpacityMultiplier },
      uRayColor: { value: new THREE.Color(initialPreset.godRaysColor) },
    }),
    []
  );

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Oscilación orgánica dinámica de posición y rotación por oleaje marino
    if (meshRef.current) {
      const swayX = Math.sin(time * 0.35 + phase) * 0.12;
      const swayZ = Math.cos(time * 0.28 + phase * 1.4) * 0.16;
      meshRef.current.rotation.set(
        baseRot[0] + swayX * 0.6,
        baseRot[1] + swayZ * 0.4,
        baseRot[2] + swayZ
      );
      meshRef.current.position.set(
        basePos[0] + Math.sin(time * 0.2 + phase) * 0.5,
        basePos[1] + Math.cos(time * 0.25 + phase) * 0.3,
        basePos[2]
      );
    }

    if (matRef.current) {
      const preset = ZONE_PRESETS[activeZoneId];
      const timeMod = TIME_MODIFIERS[timeOfDayId];
      const lerpSpeed = Math.min(1.0, delta * 2.5);

      matRef.current.uniforms.uTime.value = time;
      
      const targetOpacity = preset.godRaysOpacity * timeMod.godRaysMultiplier * baseOpacityMultiplier;
      matRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        matRef.current.uniforms.uOpacity.value,
        targetOpacity,
        lerpSpeed
      );

      tempRayColor.set(preset.godRaysColor);
      matRef.current.uniforms.uRayColor.value.lerp(tempRayColor, lerpSpeed);
    }
  });

  return (
    <mesh ref={meshRef} position={basePos} rotation={baseRot} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={rayVertex}
        fragmentShader={rayFragment}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function GodRays() {
  const activeZoneId = useOceanStore((s) => s.activeZoneId);

  const rays = useMemo(() => {
    if (activeZoneId === 'reef') {
      // Abanico etéreo difuso desde la fuente solar cenital central (Target Imagen 1)
      return [
        { basePos: [0, 10, -6] as [number, number, number], baseRot: [0.35, 0.0, 0.0] as [number, number, number], scale: [22, 45, 1] as [number, number, number], mult: 1.6, phase: 0.0 },
        { basePos: [-6, 9, -4] as [number, number, number], baseRot: [0.38, 0.25, -0.22] as [number, number, number], scale: [14, 38, 1] as [number, number, number], mult: 1.3, phase: 1.2 },
        { basePos: [6, 9, -4] as [number, number, number], baseRot: [0.38, -0.25, 0.22] as [number, number, number], scale: [14, 38, 1] as [number, number, number], mult: 1.3, phase: 2.4 },
        { basePos: [-12, 11, -8] as [number, number, number], baseRot: [0.30, 0.40, -0.35] as [number, number, number], scale: [18, 42, 1] as [number, number, number], mult: 1.1, phase: 3.6 },
        { basePos: [12, 11, -8] as [number, number, number], baseRot: [0.30, -0.40, 0.35] as [number, number, number], scale: [18, 42, 1] as [number, number, number], mult: 1.1, phase: 4.8 },
        { basePos: [-2, 8, -2] as [number, number, number], baseRot: [0.45, 0.10, -0.10] as [number, number, number], scale: [10, 30, 1] as [number, number, number], mult: 1.4, phase: 5.5 },
        { basePos: [2, 8, -2] as [number, number, number], baseRot: [0.45, -0.10, 0.10] as [number, number, number], scale: [10, 30, 1] as [number, number, number], mult: 1.4, phase: 0.8 },
      ];
    }
    // Disposición original para otras zonas
    return [
      { basePos: [-8, 4, -5] as [number, number, number], baseRot: [0.3, 0.2, 0.1] as [number, number, number], scale: [4, 18, 1] as [number, number, number], mult: 0.9, phase: 0 },
      { basePos: [0, 4, -2] as [number, number, number], baseRot: [0.2, -0.1, 0] as [number, number, number], scale: [5, 20, 1] as [number, number, number], mult: 1.0, phase: 1 },
      { basePos: [8, 4, -6] as [number, number, number], baseRot: [0.25, 0.3, -0.1] as [number, number, number], scale: [3.5, 16, 1] as [number, number, number], mult: 0.8, phase: 2 },
      { basePos: [-4, 3.5, 2] as [number, number, number], baseRot: [0.35, -0.2, 0.05] as [number, number, number], scale: [3, 14, 1] as [number, number, number], mult: 0.7, phase: 3 },
      { basePos: [5, 3.8, 4] as [number, number, number], baseRot: [0.28, 0.15, 0] as [number, number, number], scale: [4.5, 19, 1] as [number, number, number], mult: 0.85, phase: 4 },
    ];
  }, [activeZoneId]);

  return (
    <group>
      {rays.map((r, i) => (
        <SingleRay key={i} basePos={r.basePos} baseRot={r.baseRot} scale={r.scale} baseOpacityMultiplier={r.mult} phase={r.phase} />
      ))}
    </group>
  );
}
