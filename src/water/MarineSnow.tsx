import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore, ZONE_PRESETS } from '../state/useOceanStore';

const COUNT = 1200;
const tempColor = new THREE.Color();

const marineSnowVertex = `
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;

  attribute float aPhase;
  attribute float aSpeedMult;
  attribute float aType; // 0.0 = nieve marina, 1.0 = micro-burbuja, 2.0 = espora bioluminiscente

  varying float vType;
  varying vec3 vMvPosition;

  void main() {
    vType = aType;
    vec3 pos = position;

    if (aType > 0.5 && aType < 1.5) {
      // 🫧 Micro-Burbuja: Asciende hacia la superficie y oscila lateralmente
      pos.y = mod(pos.y + uTime * uSpeed * aSpeedMult * 2.0 + 10.0, 30.0) - 10.0;
      pos.x += sin(uTime * 1.8 + aPhase) * 0.35;
      pos.z += cos(uTime * 1.5 + aPhase) * 0.25;
    } else if (aType >= 1.5) {
      // ✨ Espora Bioluminiscente: Flota en patrón sinusoidal 3D mnemónico
      pos.y += sin(uTime * 0.8 + aPhase) * 0.8;
      pos.x += cos(uTime * 0.6 + aPhase * 2.0) * 0.6;
      pos.z += sin(uTime * 0.7 + aPhase * 1.5) * 0.6;
    } else {
      // ❄️ Nieve Marina: Cae/flota lentamente con derrape de corriente
      pos.y = mod(pos.y - uTime * uSpeed * aSpeedMult * 0.6 + 20.0, 30.0) - 10.0;
      pos.x += sin(uTime * 0.9 + aPhase) * 0.5;
      pos.z += cos(uTime * 0.7 + aPhase * 0.4);
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vMvPosition = mvPosition.xyz;

    // Atenuación de tamaño por perspectiva de cámara
    gl_PointSize = uSize * (35.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const marineSnowFragment = `
  uniform vec3 uColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uGlow;

  varying float vType;
  varying vec3 vMvPosition;

  void main() {
    // Forma circular suave
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.05, dist);

    // Anillo brillante para micro-burbujas
    if (vType > 0.5 && vType < 1.5) {
      float rim = smoothstep(0.2, 0.48, dist) * smoothstep(0.5, 0.4, dist);
      alpha = mix(alpha * 0.4, rim * 0.9, 0.6);
    }

    // Atenuación por niebla oceánica
    float viewDist = length(vMvPosition);
    float fogFactor = smoothstep(uFogNear, uFogFar, viewDist);

    vec3 finalColor = mix(uColor, uColor * (1.0 + uGlow * 1.5), uGlow * 0.5);

    gl_FragColor = vec4(finalColor, alpha * (1.0 - fogFactor * 0.85));
  }
`;

export default function MarineSnow() {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  
  const activeZoneId = useOceanStore((s) => s.activeZoneId);

  // Inicialización única de geometría y atributos GPU
  const [positions, phases, speedMults, types] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const ph = new Float32Array(COUNT);
    const sm = new Float32Array(COUNT);
    const tp = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 25 - 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;

      ph[i] = Math.random() * Math.PI * 2;
      sm[i] = 0.5 + Math.random() * 0.8;

      const rand = Math.random();
      if (rand < 0.25) {
        tp[i] = 1.0; // Burbuja
      } else if (rand > 0.75) {
        tp[i] = 2.0; // Espora
      } else {
        tp[i] = 0.0; // Nieve marina
      }
    }
    return [pos, ph, sm, tp];
  }, []);

  const initialPreset = ZONE_PRESETS[activeZoneId];

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: initialPreset.particleSize },
      uSpeed: { value: initialPreset.particleSpeed },
      uColor: { value: new THREE.Color(initialPreset.particleColor) },
      uFogNear: { value: initialPreset.fogNear },
      uFogFar: { value: initialPreset.fogFar },
      uGlow: { value: initialPreset.bioluminescenceGlow },
    }),
    []
  );

  useFrame((state, delta) => {
    if (matRef.current) {
      const preset = ZONE_PRESETS[activeZoneId];
      const lerpSpeed = Math.min(1.0, delta * 2.5);

      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      matRef.current.uniforms.uSize.value = THREE.MathUtils.lerp(matRef.current.uniforms.uSize.value, preset.particleSize, lerpSpeed);
      matRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(matRef.current.uniforms.uSpeed.value, preset.particleSpeed, lerpSpeed);
      matRef.current.uniforms.uFogNear.value = THREE.MathUtils.lerp(matRef.current.uniforms.uFogNear.value, preset.fogNear, lerpSpeed);
      matRef.current.uniforms.uFogFar.value = THREE.MathUtils.lerp(matRef.current.uniforms.uFogFar.value, preset.fogFar, lerpSpeed);
      matRef.current.uniforms.uGlow.value = THREE.MathUtils.lerp(matRef.current.uniforms.uGlow.value, preset.bioluminescenceGlow, lerpSpeed);

      tempColor.set(preset.particleColor);
      matRef.current.uniforms.uColor.value.lerp(tempColor, lerpSpeed);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSpeedMult" args={[speedMults, 1]} />
        <bufferAttribute attach="attributes-aType" args={[types, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={marineSnowVertex}
        fragmentShader={marineSnowFragment}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
