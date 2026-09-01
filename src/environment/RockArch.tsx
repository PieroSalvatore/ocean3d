import { useMemo } from 'react';
import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════
// ROCK ARCH & KELP CAVE (BIOMA VERDE ESMERALDA - IZQUIERDA)
// Crea la estructura del arco de roca orgánico cubierto de musgo y algas
// que enmarca el lado izquierdo exactamente como en el concept art.
// ═══════════════════════════════════════════════════════════════════

function createRockMesh(scale: [number, number, number], noiseOffset: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 32, 24);
  const noise3D = createNoise3D();
  const pos = geo.attributes.position.array as Float32Array;

  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    const y = pos[i + 1];
    const z = pos[i + 2];

    // Deformación de roca escarpada orgánica
    const n1 = noise3D(x * 1.2 + noiseOffset, y * 1.2, z * 1.2) * 0.45;
    const n2 = noise3D(x * 3.5, y * 3.5 + noiseOffset, z * 3.5) * 0.15;
    const factor = 1.0 + n1 + n2;

    pos[i]     = x * scale[0] * factor;
    pos[i + 1] = y * scale[1] * factor;
    pos[i + 2] = z * scale[2] * factor;
  }

  geo.computeVertexNormals();
  return geo;
}

export default function RockArch() {
  const rockGeos = useMemo(() => [
    createRockMesh([8, 22, 10], 0.0),  // Pilar principal izquierdo
    createRockMesh([12, 9, 8], 10.0),  // Techo del arco superior
    createRockMesh([7, 15, 7], 20.0),  // Fondo de la cueva
    createRockMesh([5, 8, 5], 30.0),   // Rocas de primer plano
  ], []);

  // Material de roca submarina oscura con tono verde-esmeralda y rugosidad musgosa
  const rockMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0d2216'),
    roughness: 0.92,
    metalness: 0.05,
    flatShading: false,
  }), []);

  const mossMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1b4528'),
    roughness: 0.98,
    metalness: 0.0,
  }), []);

  return (
    <group position={[-16, -2, -6]}>
      {/* Pilar principal de la cueva (borde izquierdo) */}
      <mesh geometry={rockGeos[0]} material={rockMaterial} position={[0, 4, 0]} rotation={[0.1, 0.3, -0.15]} />
      <mesh geometry={rockGeos[0]} material={mossMaterial} position={[-0.5, 4.2, 0.2]} scale={1.03} rotation={[0.1, 0.3, -0.15]} />

      {/* Arco superior conectando hacia el centro del techo */}
      <mesh geometry={rockGeos[1]} material={rockMaterial} position={[8, 14, -2]} rotation={[-0.2, 0.5, -0.4]} />

      {/* Formaciones rocosas de cueva en el fondo distante */}
      <mesh geometry={rockGeos[2]} material={rockMaterial} position={[-6, 0, -12]} rotation={[0, -0.4, 0]} />

      {/* Rocas de primer plano cerca del suelo */}
      <mesh geometry={rockGeos[3]} material={rockMaterial} position={[5, -3, 6]} rotation={[0.3, 0.8, -0.2]} />
      <mesh geometry={rockGeos[3]} material={mossMaterial} position={[2, -3.5, 9]} scale={0.7} rotation={[-0.2, 0.2, 0]} />

      {/* Silueta misteriosa en la niebla profunda de la cueva */}
      <mesh position={[-8, 6, -30]} rotation={[0, 0.4, 0]}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial color="#02140c" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}
