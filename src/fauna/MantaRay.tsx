import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function createMantaGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array([
     0,    0.4,   3.5,   // 0 tip
     8.0, -0.3,   0.2,   // 1 right wing tip
     3.8, -0.2,  -1.8,   // 2 right rear
     0,   -0.2,  -2.5,   // 3 tail base
    -3.8, -0.2,  -1.8,   // 4 left rear
    -8.0, -0.3,   0.2,   // 5 left wing tip
     0,   -0.1,  -4.5,   // 6 tail tip
     0,    0.1,   0.5,   // 7 center hub
  ]);

  const idx = new Uint16Array([
    7, 0, 1,   7, 1, 2,   7, 2, 3,
    7, 3, 4,   7, 4, 5,   7, 5, 0,
    3, 6, 2,   4, 6, 3,
    1, 0, 7,   2, 1, 7,   3, 2, 7,
    4, 3, 7,   5, 4, 7,   0, 5, 7,
  ]);

  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

export default function MantaRay() {
  const groupRef = useRef<THREE.Group>(null!);
  const t = useRef(0);

  const geo = useMemo(createMantaGeometry, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#162942'),
    roughness: 0.75,
    metalness: 0.1,
    side: THREE.DoubleSide,
  }), []);

  useFrame((_, delta) => {
    t.current += delta;
    const s = t.current;
    const g = groupRef.current;
    if (!g) return;

    // Órbita elíptica suave alrededor del centro iluminado
    g.position.set(
      2 + Math.cos(s * 0.12) * 14,
      3 + Math.sin(s * 0.08) * 2.5,
      -4 + Math.sin(s * 0.10) * 10
    );

    const dx = -Math.sin(s * 0.12) * 14 * 0.12;
    const dz =  Math.cos(s * 0.10) * 10 * 0.10;

    g.rotation.y = Math.atan2(dx, dz);
    g.rotation.z = -dx * 0.75; // Inclinación natural en curvas (banking)
    g.rotation.x = Math.sin(s * 0.7) * 0.05; // Aleteo
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geo} material={mat} castShadow />
    </group>
  );
}
