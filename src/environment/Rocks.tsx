import { useMemo } from 'react';
import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';

const ROCK_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#1c2a18'),
  roughness: 0.96,
  metalness: 0.0,
});
const MOSS_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#0f1d0c'),
  roughness: 0.98,
  metalness: 0.0,
});
const ALGAE_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#173512'),
  roughness: 0.95,
  transparent: true,
  opacity: 0.82,
  side: THREE.DoubleSide,
});

function makeRockGeo(noiseOffset: THREE.Vector3, segments = 14): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, segments, Math.floor(segments * 0.75));
  const noise3D = createNoise3D();
  const arr = geo.attributes.position.array as Float32Array;

  for (let i = 0; i < arr.length; i += 3) {
    const nx = arr[i] * 0.85 + noiseOffset.x;
    const ny = arr[i + 1] * 0.85 + noiseOffset.y;
    const nz = arr[i + 2] * 0.85 + noiseOffset.z;
    const disp = noise3D(nx, ny, nz) * 0.42;
    const bump = noise3D(nx * 3, ny * 3, nz * 3) * 0.12;
    const f = 1 + disp + bump;
    arr[i]     *= f;
    arr[i + 1] *= f;
    arr[i + 2] *= f;
  }

  geo.computeVertexNormals();
  return geo;
}

interface Formation {
  p: [number, number, number];
  s: [number, number, number];
  r: [number, number, number];
  g: number;
}

const FORMATIONS: Formation[] = [
  { p: [-8,  -19, -8],  s: [4.2, 13, 3.6],  r: [0.10,  0.30, -0.05], g: 0 },
  { p: [-13, -21, -12], s: [5.5, 11, 4.5],  r: [-0.05,-0.22,  0.08], g: 1 },
  { p: [-6,  -23, -5],  s: [3.2,  8, 2.8],  r: [0.05,  0.55,  0.00], g: 2 },
  { p: [-15, -24, -14], s: [6.0,  7, 5.0],  r: [0.00,  0.12, -0.04], g: 3 },
  { p: [-4,  -24, -10], s: [2.8,  5, 2.4],  r: [0.12, -0.28,  0.06], g: 0 },
  { p: [-10, -24, -18], s: [4.5,  9, 3.2],  r: [-0.08, 0.42,  0.00], g: 1 },
  { p: [-17, -24, -4],  s: [3.5,  8, 2.8],  r: [0.02, -0.18,  0.04], g: 2 },
  { p: [-7,  -24,  1],  s: [2.2,  6, 2.0],  r: [0.10,  0.60,  0.00], g: 3 },
  { p: [-3,  -24,  4],  s: [1.5,  3, 1.5],  r: [0.05,  0.10,  0.02], g: 0 },
  { p: [-5,  -24,  3],  s: [2.0,  4, 1.8],  r: [-0.04, 0.3,   0.00], g: 2 },
  { p: [-1,  -24, -6],  s: [1.8,  3, 1.6],  r: [0.0,   0.45,  0.0],  g: 1 },
];

const ALGAE_STRANDS = [
  { p: [-7,  -13, -6] as [number, number, number],  h: 3.5 },
  { p: [-9,  -14, -9] as [number, number, number],  h: 4.2 },
  { p: [-11, -13, -11] as [number, number, number], h: 5.0 },
  { p: [-14, -14, -13] as [number, number, number], h: 3.8 },
  { p: [-6,  -14, -8] as [number, number, number],  h: 2.8 },
  { p: [-12, -15, -4] as [number, number, number],  h: 4.5 },
  { p: [-8,  -12, -14] as [number, number, number], h: 3.2 },
];

export function Rocks() {
  const geos = useMemo(() => [
    makeRockGeo(new THREE.Vector3(0,   0,   0)),
    makeRockGeo(new THREE.Vector3(100, 0,   0)),
    makeRockGeo(new THREE.Vector3(0,   100, 0)),
    makeRockGeo(new THREE.Vector3(50,  50, 50)),
  ], []);

  return (
    <group>
      {FORMATIONS.map((f, i) => (
        <group key={i} position={f.p} rotation={f.r} scale={f.s}>
          <mesh geometry={geos[f.g]} material={ROCK_MAT} />
          <mesh geometry={geos[f.g]} material={MOSS_MAT} scale={[1.02, 1.02, 1.02]} />
        </group>
      ))}

      {ALGAE_STRANDS.map((a, i) => (
        <mesh
          key={i}
          position={[a.p[0], a.p[1] - a.h / 2, a.p[2]]}
          rotation={[(Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.12]}
          material={ALGAE_MAT}
        >
          <cylinderGeometry args={[0.04, 0.02, a.h, 4]} />
        </mesh>
      ))}
    </group>
  );
}
