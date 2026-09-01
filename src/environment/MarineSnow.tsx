import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 2800;

export default function MarineSnow() {
  const pointsRef = useRef<THREE.Points>(null!);

  const { geo, speeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const sp  = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = -6 + Math.random() * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      sp[i]          = 0.3 + Math.random() * 0.7;
    }

    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, speeds: sp };
  }, []);

  useFrame((_, delta) => {
    const pos = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const iy = i * 3 + 1;
      const ix = i * 3;

      pos[iy] += speeds[i] * delta * 0.8;
      pos[ix] += Math.sin(pos[iy] * 0.3 + i) * 0.006;

      if (pos[iy] > 18) {
        pos[iy] = -6;
      }
    }

    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.12}
        color="#aaddff"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
