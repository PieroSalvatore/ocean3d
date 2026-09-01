import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
    
    float alpha = shape * pulse * uOpacity + dust * shape;
    vec3 color = vec3(0.9, 0.95, 0.75);
    
    gl_FragColor = vec4(color, alpha * 0.25);
  }
`;

function SingleRay({ position, rotation, scale }: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={rayVertex}
        fragmentShader={rayFragment}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 0.6 + Math.random() * 0.4 },
        }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function GodRays() {
  const rays = [
    { pos: [-8, 4, -5] as [number, number, number], rot: [0.3, 0.2, 0.1] as [number, number, number], scale: [4, 18, 1] as [number, number, number] },
    { pos: [0, 4, -2] as [number, number, number], rot: [0.2, -0.1, 0] as [number, number, number], scale: [5, 20, 1] as [number, number, number] },
    { pos: [8, 4, -6] as [number, number, number], rot: [0.25, 0.3, -0.1] as [number, number, number], scale: [3.5, 16, 1] as [number, number, number] },
    { pos: [-4, 3.5, 2] as [number, number, number], rot: [0.35, -0.2, 0.05] as [number, number, number], scale: [3, 14, 1] as [number, number, number] },
    { pos: [5, 3.8, 4] as [number, number, number], rot: [0.28, 0.15, 0] as [number, number, number], scale: [4.5, 19, 1] as [number, number, number] },
  ];

  return (
    <group>
      {rays.map((r, i) => (
        <SingleRay key={i} position={r.pos} rotation={r.rot} scale={r.scale} />
      ))}
    </group>
  );
}
