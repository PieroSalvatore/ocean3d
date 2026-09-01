import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const particleVertex = `
  uniform float uTime;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aOffset;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.y += mod(uTime * aSpeed * 0.2 + aOffset, 16.0) - 8.0;
    pos.x += sin(uTime * 0.15 + aOffset) * 0.3;
    pos.z += cos(uTime * 0.12 + aOffset) * 0.2;
    pos.x += sin(pos.y * 0.5 + uTime * 0.5) * 0.15;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    vAlpha = smoothstep(0.0, 30.0, -mvPosition.z) * 0.4;
  }
`;

const particleFragment = `
  varying float vAlpha;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    vec3 color = vec3(0.85, 0.95, 1.0);
    gl_FragColor = vec4(color, glow * vAlpha * 0.5);
  }
`;

const PARTICLE_COUNT = 1500;

export default function MarineSnow() {
  const pointsRef = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const sz  = new Float32Array(PARTICLE_COUNT);
    const sp  = new Float32Array(PARTICLE_COUNT);
    const off = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      sz[i]          = 1.0 + Math.random() * 2.0;
      sp[i]          = 0.3 + Math.random() * 1.0;
      off[i]         = Math.random() * 100;
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize',     new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aSpeed',    new THREE.BufferAttribute(sp, 1));
    g.setAttribute('aOffset',   new THREE.BufferAttribute(off, 1));
    return g;
  }, []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <shaderMaterial
        ref={matRef}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={{ uTime: { value: 0 } }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
