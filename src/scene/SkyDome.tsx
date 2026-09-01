import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const skyVertex = `
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = `
  uniform float uTime;
  varying vec3 vWorldPos;

  void main() {
    vec3 dir = normalize(vWorldPos);

    // Gradiente vertical continuo: Abismo marino abajo (dir.y = -1.0) → Agua turquesa iluminada arriba (dir.y = 1.0)
    float height = clamp(smoothstep(-0.8, 0.8, dir.y), 0.0, 1.0);

    // Gradiente bi-color en X (Verde Cueva a la izq vs Turquesa Arrecife a la der)
    float zone = clamp(smoothstep(-0.5, 0.5, dir.x), 0.0, 1.0);

    vec3 greenDeep    = vec3(0.01, 0.12, 0.10);
    vec3 greenShallow = vec3(0.02, 0.32, 0.22);
    vec3 blueDeep     = vec3(0.01, 0.16, 0.28);
    vec3 blueShallow   = vec3(0.02, 0.48, 0.65);

    vec3 leftSide  = mix(greenDeep, greenShallow, height);
    vec3 rightSide = mix(blueDeep, blueShallow, height);

    vec3 color = mix(leftSide, rightSide, zone);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

export default function SkyDome() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh scale={[-150, 150, 150]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
