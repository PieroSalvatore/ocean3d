import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore, ZONE_PRESETS } from '../state/useOceanStore';

// ═══════════════════════════════════════════════════════════════════
// EXACT REPLICA OF THE TARGET IMAGE:
// Sand ripples dunes, crisp white caustic ribbons, natural golden sand,
// and 5 scattered round stones on the sea floor.
// ═══════════════════════════════════════════════════════════════════

const floorVertex = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vDuneHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Crestas de dunas de arena paralelas
    float dunePattern1 = sin(pos.x * 0.28 + pos.y * 0.12) * 0.55;
    float dunePattern2 = sin(pos.x * 0.55 - pos.y * 0.22) * 0.22;
    float totalDune = dunePattern1 + dunePattern2;

    pos.z += totalDune;
    vDuneHeight = totalDune;

    float dx = cos(pos.x * 0.28 + pos.y * 0.12) * 0.28 * 0.55 + cos(pos.x * 0.55 - pos.y * 0.22) * 0.55 * 0.22;
    float dy = cos(pos.x * 0.28 + pos.y * 0.12) * 0.12 * 0.55 - cos(pos.x * 0.55 - pos.y * 0.22) * 0.22 * 0.22;
    vec3 n = normalize(vec3(-dx, -dy, 1.0));

    vNormal = normalize(normalMatrix * n);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const tempScatterColor = new THREE.Color();

const floorFragment = `
  uniform float uTime;
  uniform vec3 uWaterScatter;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vDuneHeight;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float causticRibbon(vec2 p, float time) {
    vec2 p1 = p * 0.25 + vec2(time * 0.08, time * 0.05);
    vec2 p2 = p * 0.42 - vec2(time * 0.06, -time * 0.09);

    float wave1 = sin(p1.x * 3.0 + sin(p1.y * 2.5 + time * 0.8));
    float wave2 = cos(p2.y * 3.5 + cos(p2.x * 2.8 - time * 0.9));

    float ribbon = abs(wave1 + wave2);
    return pow(1.0 - smoothstep(0.0, 0.45, ribbon), 3.0);
  }

  void main() {
    vec3 sandCrest  = vec3(0.78, 0.72, 0.55);
    vec3 sandTrough = vec3(0.52, 0.46, 0.34);
    vec3 waterScatter = uWaterScatter;

    float duneFactor = smoothstep(-0.6, 0.6, vDuneHeight);
    vec3 sandColor = mix(sandTrough, sandCrest, duneFactor);

    float grain = hash(vWorldPosition.xz * 15.0) * 0.04;
    sandColor += vec3(grain);

    float c1 = causticRibbon(vWorldPosition.xz, uTime);
    float c2 = causticRibbon(vWorldPosition.xz * 1.5 + vec2(1.2), uTime * 1.2);
    float causticsNet = max(c1, c2 * 0.75);

    vec3 causticColor = vec3(0.92, 0.98, 1.0) * causticsNet * 0.85;
    sandColor += causticColor;

    float dist = length(vWorldPosition.xz);
    float fogFactor = smoothstep(30.0, 160.0, dist);
    sandColor = mix(sandColor, sandColor * vec3(0.6, 0.9, 1.0), 0.35);

    vec3 finalColor = mix(sandColor, waterScatter * 0.3, fogFactor * 0.75);

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`;

function ScatteredRocks() {
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

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const preset = ZONE_PRESETS[activeZoneId];
      tempScatterColor.set(preset.fogColor);
      matRef.current.uniforms.uWaterScatter.value.lerp(tempScatterColor, Math.min(1.0, delta * 2.5));
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
          uniforms={{
            uTime: { value: 0 },
            uWaterScatter: { value: new THREE.Color(ZONE_PRESETS.reef.fogColor) },
          }}
        />
      </mesh>
      <ScatteredRocks />
    </group>
  );
}
