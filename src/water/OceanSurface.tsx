import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore, ZONE_PRESETS } from '../state/useOceanStore';

const tempShallowColor = new THREE.Color();
const tempDeepColor = new THREE.Color();

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float wave1 = sin(pos.x * 0.4 + uTime * 0.8) * 0.4;
    float wave2 = sin(pos.z * 0.3 + uTime * 0.6) * 0.3;
    float wave3 = sin((pos.x + pos.z) * 0.2 + uTime * 0.4) * 0.5;
    pos.y += wave1 + wave2 + wave3;
    
    float dx = cos(pos.x * 0.4 + uTime * 0.8) * 0.4 * 0.4 + cos((pos.x + pos.z) * 0.2 + uTime * 0.4) * 0.5 * 0.2;
    float dz = cos(pos.z * 0.3 + uTime * 0.6) * 0.3 * 0.3 + cos((pos.x + pos.z) * 0.2 + uTime * 0.4) * 0.5 * 0.2;
    vec3 n = normalize(vec3(-dx, 1.0, -dz));
    
    vNormal = normalize(normalMatrix * n);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uCameraPosition;
  uniform vec3 uShallowColor;
  uniform vec3 uDeepColor;
  uniform float uBaseOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 4.0);
    
    vec3 shallow = uShallowColor;
    vec3 deep = uDeepColor;
    vec3 color = mix(deep, shallow, fresnel);
    
    vec3 sunDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 halfVec = normalize(sunDir + viewDir);
    float spec = pow(max(dot(vNormal, halfVec), 0.0), 128.0);
    color += vec3(1.0, 0.95, 0.85) * spec * 0.8;
    
    color += shallow * fresnel * 0.3;
    float alpha = mix(uBaseOpacity * 0.5, uBaseOpacity, fresnel);
    
    // Desvanecimiento suave en la distancia para eliminar 100% la línea horizontal de borde
    float dist = length(vWorldPosition.xz);
    float edgeFade = 1.0 - smoothstep(40.0, 180.0, dist);
    alpha *= edgeFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function OceanSurface() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const activeZoneId = useOceanStore((s) => s.activeZoneId);

  const initialPreset = ZONE_PRESETS[activeZoneId];

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uShallowColor: { value: new THREE.Color(initialPreset.waterShallowColor) },
      uDeepColor: { value: new THREE.Color(initialPreset.waterDeepColor) },
      uBaseOpacity: { value: initialPreset.waterOpacity },
    }),
    []
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      const preset = ZONE_PRESETS[activeZoneId];
      const lerpSpeed = Math.min(1.0, delta * 2.5);

      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uCameraPosition.value.copy(state.camera.position);

      tempShallowColor.set(preset.waterShallowColor);
      tempDeepColor.set(preset.waterDeepColor);

      materialRef.current.uniforms.uShallowColor.value.lerp(tempShallowColor, lerpSpeed);
      materialRef.current.uniforms.uDeepColor.value.lerp(tempDeepColor, lerpSpeed);
      materialRef.current.uniforms.uBaseOpacity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uBaseOpacity.value,
        preset.waterOpacity,
        lerpSpeed
      );
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
      <planeGeometry args={[600, 600, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

