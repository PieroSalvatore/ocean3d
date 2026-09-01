import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════
// TURQUOISE CORAL REEF (BIOMA ARRECIFE TURQUESA - DERECHA)
// Corales instanciados coloridos (naranja, magenta, violeta, cian)
// en el lado derecho de la pantalla cerca del suelo iluminado.
// ═══════════════════════════════════════════════════════════════════

const CORAL_COUNT = 120;
const PALETTE = ['#ff5522', '#ff2266', '#e033bb', '#ff8833', '#00ddbb', '#ffaa11', '#9922ee'];

export default function CoralReef() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const coralGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.6, 2.8, 6);
    geo.translate(0, 1.4, 0);
    return geo;
  }, []);

  const coralMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.75,
    metalness: 0.1,
    vertexColors: true,
  }), []);

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < CORAL_COUNT; i++) {
      // Posicionar en el lado derecho (X de 6 a 28, Z de -20 a 10)
      const x = 8 + Math.random() * 20;
      const z = -18 + Math.random() * 28;
      const h = 1.2 + Math.random() * 3.5;
      const r = 0.4 + Math.random() * 0.8;

      dummy.position.set(x, -5.2, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.3,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.3
      );
      dummy.scale.set(r, h, r);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      color.set(PALETTE[i % PALETTE.length]);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[coralGeo, coralMaterial, CORAL_COUNT]}
      castShadow
      receiveShadow
    />
  );
}
