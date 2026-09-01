import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 4.0);
    
    vec3 shallow = vec3(0.15, 0.75, 0.85);
    vec3 deep = vec3(0.02, 0.25, 0.45);
    vec3 color = mix(deep, shallow, fresnel);
    
    vec3 sunDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 halfVec = normalize(sunDir + viewDir);
    float spec = pow(max(dot(vNormal, halfVec), 0.0), 128.0);
    color += vec3(1.0, 0.95, 0.85) * spec * 0.8;
    
    color += vec3(0.1, 0.6, 0.7) * fresnel * 0.3;
    float alpha = mix(0.35, 0.85, fresnel);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function OceanSurface() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uCameraPosition.value.copy(state.camera.position);
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
      <planeGeometry args={[120, 120, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uCameraPosition: { value: new THREE.Vector3() },
        }}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
