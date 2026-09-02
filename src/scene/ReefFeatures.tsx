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
  const shelfGeo = useMemo(() => new THREE.CylinderGeometry(5.5, 8.5, 2.8, 24), []);
  const terraceMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#3a4540'),
        roughness: 0.88,
        metalness: 0.05,
      }),
    []
  );

  return (
    <group>
      {/* Platform Shelf Flanco Izquierdo */}
      <mesh geometry={shelfGeo} material={terraceMat} position={[-16, -3.4, -6]} scale={[2.0, 1.0, 1.6]} rotation={[0.05, 0.3, -0.05]} />
      <mesh geometry={shelfGeo} material={terraceMat} position={[-14, -2.0, -14]} scale={[1.5, 1.1, 1.4]} rotation={[-0.05, -0.2, 0.05]} />

      {/* Platform Shelf Flanco Derecho */}
      <mesh geometry={shelfGeo} material={terraceMat} position={[17, -3.6, -8]} scale={[1.8, 1.0, 1.8]} rotation={[-0.05, -0.4, 0.05]} />
      <mesh geometry={shelfGeo} material={terraceMat} position={[15, -2.2, -16]} scale={[1.4, 1.1, 1.5]} rotation={[0.05, 0.2, -0.05]} />

      {/* Pared de Fondo Escalonada */}
      <mesh geometry={shelfGeo} material={terraceMat} position={[0, -2.2, -26]} scale={[3.4, 1.5, 2.2]} rotation={[0.1, 0, 0]} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. ROCAS Y CLÚSTERES DE CORAL (Fucsia #f472b6 y Amarillo #fbbf24)
// ═══════════════════════════════════════════════════════════════════
function ReefRocksAndCorals() {
  const rockMeshRef = useRef<THREE.InstancedMesh>(null!);
  const pinkCoralMeshRef = useRef<THREE.InstancedMesh>(null!);
  const yellowCoralMeshRef = useRef<THREE.InstancedMesh>(null!);

  const rockCount = 36;

  const [rockTransforms, coralPinkTransforms, coralYellowTransforms] = useMemo(() => {
    const rocks: { pos: [number, number, number]; rot: number; scale: [number, number, number] }[] = [];
    const pinkCorals: { pos: [number, number, number]; scale: number }[] = [];
    const yellowCorals: { pos: [number, number, number]; scale: number }[] = [];

    let count = 0;
    while (count < rockCount) {
      const side = count % 3;
      let x = 0;
      let z = 0;
      let y = -4.5;

      if (side === 0) {
        // Flanco izquierdo
        x = -8 - Math.random() * 18;
        z = 5 - Math.random() * 30;
      } else if (side === 1) {
        // Flanco derecho
        x = 8 + Math.random() * 18;
        z = 5 - Math.random() * 30;
      } else {
        // Fondo
        x = (Math.random() - 0.5) * 38;
        z = -18 - Math.random() * 16;
      }

      // Zona de Exclusión del Corredor Central (X: [-7.5, 7.5], Z: [-16, 12])
      if (Math.abs(x) < 7.5 && z > -16 && z < 12) continue;

      const scaleY = 0.8 + Math.random() * 1.4;
      const scaleXZ = 0.8 + Math.random() * 1.5;
      const rotY = Math.random() * Math.PI * 2;

      rocks.push({ pos: [x, y, z], rot: rotY, scale: [scaleXZ, scaleY, scaleXZ] });

      // 20-30% de las rocas llevan acentos de coral en cara superior
      if (Math.random() < 0.35) {
        const coralY = y + scaleY * 0.75;
        if (count % 2 === 0) {
          pinkCorals.push({ pos: [x + (Math.random() - 0.5) * 0.8, coralY, z + (Math.random() - 0.5) * 0.8], scale: 0.45 + Math.random() * 0.55 });
        } else {
          yellowCorals.push({ pos: [x + (Math.random() - 0.5) * 0.8, coralY, z + (Math.random() - 0.5) * 0.8], scale: 0.45 + Math.random() * 0.55 });
        }
      }

      count++;
    }

    return [rocks, pinkCorals, yellowCorals];
  }, []);

  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(1.2, 1), []);
  const rockMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38433e'),
        roughness: 0.88,
      }),
    []
  );

  const coralPinkGeo = useMemo(() => new THREE.SphereGeometry(0.75, 12, 12), []);
  const coralPinkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f472b6'), // Fucsia Target Render
        emissive: new THREE.Color('#f472b6'),
        emissiveIntensity: 0.18,
        roughness: 0.55,
      }),
    []
  );

  const coralYellowGeo = useMemo(() => new THREE.IcosahedronGeometry(0.7, 1), []);
  const coralYellowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#fbbf24'), // Amarillo Neón Target Render
        emissive: new THREE.Color('#fbbf24'),
        emissiveIntensity: 0.18,
        roughness: 0.55,
      }),
    []
  );

  useEffect(() => {
    if (rockMeshRef.current) {
      rockTransforms.forEach((r, i) => {
        dummy.position.set(r.pos[0], r.pos[1], r.pos[2]);
        dummy.rotation.set(0, r.rot, 0);
        dummy.scale.set(r.scale[0], r.scale[1], r.scale[2]);
        dummy.updateMatrix();
        rockMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      rockMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (pinkCoralMeshRef.current) {
      coralPinkTransforms.forEach((c, i) => {
        dummy.position.set(c.pos[0], c.pos[1], c.pos[2]);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(c.scale, c.scale * 1.3, c.scale);
        dummy.updateMatrix();
        pinkCoralMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      pinkCoralMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (yellowCoralMeshRef.current) {
      coralYellowTransforms.forEach((c, i) => {
        dummy.position.set(c.pos[0], c.pos[1], c.pos[2]);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(c.scale, c.scale, c.scale);
        dummy.updateMatrix();
        yellowCoralMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      yellowCoralMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [rockTransforms, coralPinkTransforms, coralYellowTransforms]);

  return (
    <group>
      <instancedMesh ref={rockMeshRef} args={[rockGeo, rockMat, rockTransforms.length]} receiveShadow castShadow />
      <instancedMesh ref={pinkCoralMeshRef} args={[coralPinkGeo, coralPinkMat, coralPinkTransforms.length]} receiveShadow />
      <instancedMesh ref={yellowCoralMeshRef} args={[coralYellowGeo, coralYellowMat, coralYellowTransforms.length]} receiveShadow />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. ABANICOS DE MAR (Sea Fans oscilando con corriente marina)
// ═══════════════════════════════════════════════════════════════════
function SeaFans() {
  const fansMeshRef = useRef<THREE.InstancedMesh>(null!);

  const fanCount = 32;

  const [fanBaseTransforms, phases] = useMemo(() => {
    const transforms: { pos: [number, number, number]; rotY: number; scale: number }[] = [];
    const ph = new Float32Array(fanCount);

    let count = 0;
    while (count < fanCount) {
      const side = count % 2;
      const x = side === 0 ? -9.5 - Math.random() * 16 : 9.5 + Math.random() * 16;
      const z = 4 - Math.random() * 28;

      if (Math.abs(x) < 7.5 && z > -16 && z < 12) continue;

      transforms.push({
        pos: [x, -4.5, z],
        rotY: Math.random() * Math.PI * 2,
        scale: 0.9 + Math.random() * 0.8,
      });

      ph[count] = Math.random() * Math.PI * 2;
      count++;
    }

    return [transforms, ph];
  }, []);

  const fanGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1.2, 1.8, 4, 6);
    geo.translate(0, 0.9, 0); // Anclar base al origen
    return geo;
  }, []);

  const fanMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#a78bfa'), // Púrpura suave
        roughness: 0.7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  useFrame((state) => {
    if (fansMeshRef.current) {
      const time = state.clock.elapsedTime;

      fanBaseTransforms.forEach((f, i) => {
        const phase = phases[i];
        // Oscilación de corriente marina en tiempo real (Zero-GC, usando pre-instanciados)
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
      <ReefRocksAndCorals />
      <SeaFans />
    </group>
  );
}
