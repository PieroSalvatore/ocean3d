import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const floorVertex = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vDepth;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vDepth = -worldPos.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const floorFragment = `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDepth;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec3 green = vec3(0.02, 0.18, 0.12);
    vec3 turquoise = vec3(0.08, 0.35, 0.40);
    float zoneMix = smoothstep(-25.0, 25.0, vWorldPosition.x);
    vec3 baseColor = mix(green, turquoise, zoneMix);
    
    float sand = noise(vWorldPosition.xz * 8.0) * 0.15;
    baseColor += vec3(sand);
    
    vec2 causticUv = vWorldPosition.xz * 0.6;
    float c1 = noise(causticUv + uTime * 0.15);
    float c2 = noise(causticUv * 1.3 - uTime * 0.12);
    float caustic = pow(c1 * c2, 3.0) * 1.2;
    baseColor += vec3(0.5, 0.85, 1.0) * caustic * 0.4;
    
    float depthFade = exp(-vDepth * 0.03);
    baseColor *= depthFade;
    
    float fogFactor = smoothstep(20.0, 80.0, length(vWorldPosition.xz));
    vec3 fogColor = mix(vec3(0.0, 0.12, 0.15), vec3(0.0, 0.08, 0.10), zoneMix);
    baseColor = mix(baseColor, fogColor, fogFactor * 0.6);
    
    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

export default function SeaFloor() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[120, 120, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={floorVertex}
        fragmentShader={floorFragment}
        uniforms={{
          uTime: { value: 0 },
        }}
      />
    </mesh>
  );
}
