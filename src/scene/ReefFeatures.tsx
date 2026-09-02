import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../state/useOceanStore';

// Pre-instanciados estáticos para evitar allocations en render / useFrame (Zero GC Rule)
const dummy = new THREE.Object3D();
const tempPosition = new THREE.Vector3();
const tempEuler = new THREE.Euler();
const tempQuaternion = new THREE.Quaternion();

// ═══════════════════════════════════════════════════════════════════
// 1. TERRAZAS Y PLATAFORMAS DE ROCA CORALINA (Flancos Izquierdo y Derecho)
// ═══════════════════════════════════════════════════════════════════
function CoralTerraces() {
  const shelfGeo = useMemo(() => new THREE.CylinderGeometry(6.5, 9.5, 3.5, 24), []);
  const terraceMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#323f38'),
        roughness: 0.85,
        metalness: 0.05,
      }),
    []
  );

  return (
    <group>
      {/* Platform Shelf Flanco Izquierdo (Elevadas sobre la arena) */}
      <mesh geometry={shelfGeo} material={terraceMat} position={[-16, -2.2, -4]} scale={[2.2, 1.2, 1.8]} rotation={[0.05, 0.3, -0.05]} />
      <mesh geometry={shelfGeo} material={terraceMat} position={[-14, -0.8, -14]} scale={[1.6, 1.3, 1.5]} rotation={[-0.05, -0.2, 0.05]} />

      {/* Platform Shelf Flanco Derecho (Elevadas sobre la arena) */}
      <mesh geometry={shelfGeo} material={terraceMat} position={[17, -2.4, -6]} scale={[2.0, 1.2, 1.9]} rotation={[-0.05, -0.4, 0.05]} />
      <mesh geometry={shelfGeo} material={terraceMat} position={[15, -1.0, -16]} scale={[1.5, 1.3, 1.6]} rotation={[0.05, 0.2, -0.05]} />

      {/* Pared de Fondo Escalonada */}
      <mesh geometry={shelfGeo} material={terraceMat} position={[0, -1.0, -26]} scale={[3.8, 1.8, 2.4]} rotation={[0.1, 0, 0]} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. CLÚSTERES Y MOUNDS DE CORAL (Fucsia #f472b6 y Amarillo #fbbf24)
// ═══════════════════════════════════════════════════════════════════
function ReefCoralsAndAccentMounds() {
  const pinkCoralMeshRef = useRef<THREE.InstancedMesh>(null!);
  const yellowCoralMeshRef = useRef<THREE.InstancedMesh>(null!);

  const coralCount = 28;

  const [pinkTransforms, yellowTransforms] = useMemo(() => {
    const pink: { pos: [number, number, number]; scale: number }[] = [];
    const yellow: { pos: [number, number, number]; scale: number }[] = [];

    // Colocar corales exclusivamente sobre la superficie superior de las terrazas laterales (Y > -1.5)
    for (let i = 0; i < coralCount; i++) {
      const side = i % 2;
      const x = side === 0 ? -11 - Math.random() * 12 : 11 + Math.random() * 12;
      const z = 2 - Math.random() * 22;
      const y = -1.2 + Math.random() * 1.8;

      const scale = 0.6 + Math.random() * 0.7;

      if (i % 2 === 0) {
        pink.push({ pos: [x, y, z], scale });
      } else {
        yellow.push({ pos: [x, y, z], scale });
      }
    }

    return [pink, yellow];
  }, []);

  const coralPinkGeo = useMemo(() => new THREE.SphereGeometry(0.85, 16, 16), []);
  const coralPinkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f472b6'), // Fucsia Target Render
        emissive: new THREE.Color('#f472b6'),
        emissiveIntensity: 0.25,
        roughness: 0.5,
      }),
    []
  );

  const coralYellowGeo = useMemo(() => new THREE.IcosahedronGeometry(0.8, 2), []);
  const coralYellowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#fbbf24'), // Amarillo Neón Target Render
        emissive: new THREE.Color('#fbbf24'),
        emissiveIntensity: 0.25,
        roughness: 0.5,
      }),
    []
  );

  useEffect(() => {
    if (pinkCoralMeshRef.current) {
      pinkTransforms.forEach((c, i) => {
        dummy.position.set(c.pos[0], c.pos[1], c.pos[2]);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(c.scale, c.scale * 1.2, c.scale);
        dummy.updateMatrix();
        pinkCoralMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      pinkCoralMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (yellowCoralMeshRef.current) {
      yellowTransforms.forEach((c, i) => {
        dummy.position.set(c.pos[0], c.pos[1], c.pos[2]);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(c.scale, c.scale, c.scale);
        dummy.updateMatrix();
        yellowCoralMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      yellowCoralMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [pinkTransforms, yellowTransforms]);

  return (
    <group>
      <instancedMesh ref={pinkCoralMeshRef} args={[coralPinkGeo, coralPinkMat, pinkTransforms.length]} receiveShadow />
      <instancedMesh ref={yellowCoralMeshRef} args={[coralYellowGeo, coralYellowMat, yellowTransforms.length]} receiveShadow />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. ABANICOS DE MAR (Sea Fans sobre repisas laterales)
// ═══════════════════════════════════════════════════════════════════
function SeaFans() {
  const fansMeshRef = useRef<THREE.InstancedMesh>(null!);

  const fanCount = 28;

  const [fanBaseTransforms, phases] = useMemo(() => {
    const transforms: { pos: [number, number, number]; rotY: number; scale: number }[] = [];
    const ph = new Float32Array(fanCount);

    let count = 0;
    while (count < fanCount) {
      const side = count % 2;
      const x = side === 0 ? -10 - Math.random() * 14 : 10 + Math.random() * 14;
      const z = 4 - Math.random() * 24;
      const y = -2.0 + Math.random() * 1.5;

      transforms.push({
        pos: [x, y, z],
        rotY: Math.random() * Math.PI * 2,
        scale: 1.0 + Math.random() * 0.9,
      });

      ph[count] = Math.random() * Math.PI * 2;
      count++;
    }

    return [transforms, ph];
  }, []);

  const fanGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1.4, 2.2, 4, 6);
    geo.translate(0, 1.1, 0); // Anclar base al origen
    return geo;
  }, []);

  const fanMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c084fc'), // Púrpura brillante
        roughness: 0.6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      }),
    []
  );

  useFrame((state) => {
    if (fansMeshRef.current) {
      const time = state.clock.elapsedTime;

      fanBaseTransforms.forEach((f, i) => {
        const phase = phases[i];
        const waveZ = Math.sin(time * 1.2 + phase) * 0.15 + Math.sin(time * 2.4 + phase * 1.5) * 0.05;
        const waveX = Math.cos(time * 0.9 + phase) * 0.08;

        tempPosition.set(f.pos[0], f.pos[1], f.pos[2]);
        tempEuler.set(waveZ, f.rotY + waveX, waveZ * 0.5);
        tempQuaternion.setFromEuler(tempEuler);

        dummy.position.copy(tempPosition);
        dummy.quaternion.copy(tempQuaternion);
        dummy.scale.set(f.scale, f.scale, f.scale);
        dummy.updateMatrix();

        fansMeshRef.current.setMatrixAt(i, dummy.matrix);
      });

      fansMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return <instancedMesh ref={fansMeshRef} args={[fanGeo, fanMat, fanCount]} receiveShadow />;
}

// ═══════════════════════════════════════════════════════════════════
// ORQUESTADOR REEF FEATURES (Montaje exclusivo para Zona 1)
// ═══════════════════════════════════════════════════════════════════
export default function ReefFeatures() {
  const activeZoneId = useOceanStore((s) => s.activeZoneId);

  // Garantía de Aislamiento Total: Si la zona activa no es 'reef', desmontar inmediatamente sin dejar residuos en zonas 2-5
  if (activeZoneId !== 'reef') return null;

  return (
    <group>
      <CoralTerraces />
      <ReefCoralsAndAccentMounds />
      <SeaFans />
    </group>
  );
}
