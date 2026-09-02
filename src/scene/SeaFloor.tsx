import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore, ZONE_PRESETS, TIME_MODIFIERS } from '../state/useOceanStore';

// ═══════════════════════════════════════════════════════════════════
// EXACT REPLICA OF THE TARGET IMAGE:
// Sand ripples dunes, crisp white caustic ribbons, natural golden sand,
// and 5 scattered round stones on the sea floor.
// ═══════════════════════════════════════════════════════════════════

const floorVertex = `
  uniform float uTime;
  uniform float uIsReef;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vDuneHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float dunePattern1 = 0.0;
    float dunePattern2 = 0.0;

    if (uIsReef > 0.5) {
      // Dunas suaves de baja frecuencia y baja amplitud para Arrecife
      dunePattern1 = sin(pos.x * 0.08 + pos.y * 0.04) * 0.45;
      dunePattern2 = sin(pos.x * 0.18 - pos.y * 0.09) * 0.18;
    } else {
      // Patrón de dunas original para otras zonas
      dunePattern1 = sin(pos.x * 0.28 + pos.y * 0.12) * 0.55;
      dunePattern2 = sin(pos.x * 0.55 - pos.y * 0.22) * 0.22;
    }

    float totalDune = dunePattern1 + dunePattern2;
    pos.z += totalDune;
    vDuneHeight = totalDune;

    float dx = cos(pos.x * 0.08 + pos.y * 0.04) * 0.08 * 0.45 + cos(pos.x * 0.18 - pos.y * 0.09) * 0.18 * 0.18;
    float dy = cos(pos.x * 0.08 + pos.y * 0.04) * 0.04 * 0.45 - cos(pos.x * 0.18 - pos.y * 0.09) * 0.09 * 0.18;
    vec3 n = normalize(vec3(-dx, -dy, 1.0));

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * n);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const tempScatterColor = new THREE.Color();
const tempCrestColor = new THREE.Color();
const tempTroughColor = new THREE.Color();
const tempCausticColor = new THREE.Color();

const floorFragment = `
  uniform float uTime;
  uniform float uIsReef;
  uniform vec3 uWaterScatter;
  uniform vec3 uSandCrest;
  uniform vec3 uSandTrough;
  uniform vec3 uCausticColor;
  uniform float uCausticIntensity;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uOceanSurfaceY;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vDuneHeight;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float voronoiEdge(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float d1 = 8.0;
    float d2 = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = vec2(hash(n + g), hash(n + g + 1.5));
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) {
          d2 = d;
        }
      }
    }
    return sqrt(d2) - sqrt(d1);
  }

  float causticRibbonDual(vec2 p, float time) {
    vec2 p1 = p * 0.12 + vec2(time * 0.08, time * 0.05);
    vec2 p2 = p * 0.18 - vec2(time * 0.06, -time * 0.07);

    float e1 = voronoiEdge(p1 * 2.5);
    float e2 = voronoiEdge(p2 * 2.8);

    float ribbon1 = 1.0 - smoothstep(0.0, 0.22, e1);
    float ribbon2 = 1.0 - smoothstep(0.0, 0.22, e2);

    float net = pow(max(ribbon1, ribbon2 * 0.8), 2.5);
    return net;
  }

  float causticRibbonLegacy(vec2 p, float time) {
    vec2 p1 = p * 0.25 + vec2(time * 0.08, time * 0.05);
    vec2 p2 = p * 0.42 - vec2(time * 0.06, -time * 0.09);
    float wave1 = sin(p1.x * 3.0 + sin(p1.y * 2.5 + time * 0.8));
    float wave2 = cos(p2.y * 3.5 + cos(p2.x * 2.8 - time * 0.9));
    float ribbon = abs(wave1 + wave2);
    return pow(1.0 - smoothstep(0.0, 0.45, ribbon), 3.0);
  }

  void main() {
    vec3 sandCrest  = uSandCrest;
    vec3 sandTrough = uSandTrough;
    vec3 waterScatter = uWaterScatter;

    float duneFactor = smoothstep(-0.5, 0.5, vDuneHeight);
    vec3 sandColor = mix(sandTrough, sandCrest, duneFactor);

    float grain = hash(vWorldPosition.xz * 15.0) * 0.02;
    sandColor += vec3(grain);

    if (uIsReef > 0.5) {
      // 🏝️ Rama Arrecife: Voronoi Dual F2-F1 Malla Dorada Reticulada
      float causticsNet = causticRibbonDual(vWorldPosition.xz, uTime);
      float surfaceExposure = max(dot(vNormal, normalize(vec3(0.4, 1.0, 0.3))), 0.0);
      float zDepth = max((uOceanSurfaceY - vWorldPosition.y), 0.0);
      float depthAttenuation = exp(-zDepth * 0.04);

      vec3 causticColor = vec3(1.0, 0.95, 0.78) * causticsNet * uCausticIntensity * (0.3 + 0.7 * surfaceExposure) * depthAttenuation;
      sandColor += causticColor;
    } else {
      // 🌊 Rama Zonas 2-5: Shader original exacto intacto
      float c1 = causticRibbonLegacy(vWorldPosition.xz, uTime);
      float c2 = causticRibbonLegacy(vWorldPosition.xz * 1.5 + vec2(1.2), uTime * 1.2);
      float causticsNet = max(c1, c2 * 0.75);

      vec3 causticColor = uCausticColor * causticsNet * uCausticIntensity;
      sandColor += causticColor;
    }

    float dist = length(vWorldPosition.xz);
    float fogFactor = smoothstep(uFogNear, uFogFar, dist);

    vec3 finalColor = mix(sandColor, waterScatter, fogFactor * 0.95);

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`;

function ScatteredRocks() {
  const activeZoneId = useOceanStore((s) => s.activeZoneId);
  if (activeZoneId === 'reef') return null; // Elimina los 5 domos oscuros del centro del Arrecife!
  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 1), []);
  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3a4440'),
    roughness: 0.88,
  }), []);

  const rockPositions: [number, number, number, number][] = [
    [0, -4.5, -8, 1.4],
    [-6, -4.6, -14, 2.1],
    [8, -4.4, -12, 1.8],
    [14, -4.5, -18, 2.6],
    [-12, -4.5, -20, 3.0],
  ];

  return (
    <group>
      {rockPositions.map((r, i) => (
        <mesh key={i} geometry={rockGeo} material={rockMat} position={[r[0], r[1], r[2]]} scale={[r[3], r[3] * 0.65, r[3]]} />
      ))}
    </group>
  );
}

export default function SeaFloor() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const activeZoneId = useOceanStore((s) => s.activeZoneId);
  const timeOfDayId = useOceanStore((s) => s.timeOfDayId);

  const initialPreset = ZONE_PRESETS[activeZoneId];
  const initialTimeMod = TIME_MODIFIERS[timeOfDayId];

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIsReef: { value: activeZoneId === 'reef' ? 1.0 : 0.0 },
      uWaterScatter: { value: new THREE.Color(initialPreset.fogColor) },
      uSandCrest: { value: new THREE.Color(initialPreset.sandCrestColor) },
      uSandTrough: { value: new THREE.Color(initialPreset.sandTroughColor) },
      uCausticColor: { value: new THREE.Color(initialPreset.causticColor) },
      uCausticIntensity: { value: initialPreset.causticIntensity * initialTimeMod.causticIntensityMultiplier },
      uFogNear: { value: initialPreset.fogNear },
      uFogFar: { value: initialPreset.fogFar },
      uOceanSurfaceY: { value: 6.0 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (matRef.current) {
      const preset = ZONE_PRESETS[activeZoneId];
      const timeMod = TIME_MODIFIERS[timeOfDayId];
      const lerpSpeed = Math.min(1.0, delta * 2.5);

      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uIsReef.value = activeZoneId === 'reef' ? 1.0 : 0.0;
      
      tempScatterColor.set(preset.fogColor);
      tempCrestColor.set(preset.sandCrestColor);
      tempTroughColor.set(preset.sandTroughColor);
      tempCausticColor.set(preset.causticColor);

      matRef.current.uniforms.uWaterScatter.value.lerp(tempScatterColor, lerpSpeed);
      matRef.current.uniforms.uSandCrest.value.lerp(tempCrestColor, lerpSpeed);
      matRef.current.uniforms.uSandTrough.value.lerp(tempTroughColor, lerpSpeed);
      matRef.current.uniforms.uCausticColor.value.lerp(tempCausticColor, lerpSpeed);
      
      const targetCausticIntensity = preset.causticIntensity * timeMod.causticIntensityMultiplier;
      matRef.current.uniforms.uCausticIntensity.value = THREE.MathUtils.lerp(
        matRef.current.uniforms.uCausticIntensity.value,
        targetCausticIntensity,
        lerpSpeed
      );

      matRef.current.uniforms.uFogNear.value = THREE.MathUtils.lerp(
        matRef.current.uniforms.uFogNear.value,
        preset.fogNear,
        lerpSpeed
      );
      matRef.current.uniforms.uFogFar.value = THREE.MathUtils.lerp(
        matRef.current.uniforms.uFogFar.value,
        preset.fogFar,
        lerpSpeed
      );
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[600, 600, 128, 128]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={floorVertex}
          fragmentShader={floorFragment}
          uniforms={uniforms}
        />
      </mesh>
      <ScatteredRocks />
    </group>
  );
}
