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
    float shape = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0);
    shape *= pow(vUv.y, 0.5);
    
    float dust = noise(vUv * 10.0 + uTime * 0.1) * noise(vUv * 20.0 - uTime * 0.15);
    dust = smoothstep(0.3, 0.7, dust) * 0.3;
    
    float pulse = sin(uTime * 0.5 + vUv.y * 3.0) * 0.1 + 0.9;
    
    float alpha = (shape * pulse * uOpacity + dust * shape) * uOpacity;
    vec3 color = uRayColor;
    
    gl_FragColor = vec4(color, alpha * 0.25);
  }
`;

function SingleRay({ position, rotation, scale, baseOpacityMultiplier }: { 
  position: [number, number, number], 
  rotation: [number, number, number], 
  scale: [number, number, number],
  baseOpacityMultiplier: number 
}) {
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
    if (matRef.current) {
      const preset = ZONE_PRESETS[activeZoneId];
      const timeMod = TIME_MODIFIERS[timeOfDayId];
      const lerpSpeed = Math.min(1.0, delta * 2.5);

      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
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
    <mesh position={position} rotation={rotation} scale={scale}>
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
      // Abanico volumétrico radiante desde la esquina superior derecha (Target Render)
      return [
        { pos: [12, 5, -8] as [number, number, number], rot: [0.35, -0.4, 0.25] as [number, number, number], scale: [8, 24, 1] as [number, number, number], mult: 1.2 },
        { pos: [18, 6, -12] as [number, number, number], rot: [0.3, -0.45, 0.2] as [number, number, number], scale: [10, 26, 1] as [number, number, number], mult: 1.3 },
        { pos: [6, 4, -4] as [number, number, number], rot: [0.4, -0.35, 0.3] as [number, number, number], scale: [7, 22, 1] as [number, number, number], mult: 1.0 },
        { pos: [24, 7, -16] as [number, number, number], rot: [0.25, -0.5, 0.15] as [number, number, number], scale: [12, 28, 1] as [number, number, number], mult: 1.1 },
      ];
    }
    // Disposición original para otras zonas
    return [
      { pos: [-8, 4, -5] as [number, number, number], rot: [0.3, 0.2, 0.1] as [number, number, number], scale: [4, 18, 1] as [number, number, number], mult: 0.9 },
      { pos: [0, 4, -2] as [number, number, number], rot: [0.2, -0.1, 0] as [number, number, number], scale: [5, 20, 1] as [number, number, number], mult: 1.0 },
      { pos: [8, 4, -6] as [number, number, number], rot: [0.25, 0.3, -0.1] as [number, number, number], scale: [3.5, 16, 1] as [number, number, number], mult: 0.8 },
      { pos: [-4, 3.5, 2] as [number, number, number], rot: [0.35, -0.2, 0.05] as [number, number, number], scale: [3, 14, 1] as [number, number, number], mult: 0.7 },
      { pos: [5, 3.8, 4] as [number, number, number], rot: [0.28, 0.15, 0] as [number, number, number], scale: [4.5, 19, 1] as [number, number, number], mult: 0.85 },
    ];
  }, [activeZoneId]);

  return (
    <group>
      {rays.map((r, i) => (
        <SingleRay key={i} position={r.pos} rotation={r.rot} scale={r.scale} baseOpacityMultiplier={r.mult} />
      ))}
    </group>
  );
}
