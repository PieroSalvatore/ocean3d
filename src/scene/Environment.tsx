import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Environment() {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame((state) => {
    if (sunRef.current) {
      const t = state.clock.elapsedTime * 0.05;
      sunRef.current.position.x = Math.sin(t) * 2;
      sunRef.current.position.z = Math.cos(t) * 2 + 5;
    }
  });

  return (
    <>
      <directionalLight
        ref={sunRef}
        position={[5, 20, 5]}
        intensity={2.5}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      <ambientLight intensity={0.4} color="#004455" />

      <pointLight position={[-15, 5, -5]} intensity={3} color="#00ff88" distance={25} decay={2} />
      <pointLight position={[15, 4, -5]} intensity={3} color="#00e5ff" distance={25} decay={2} />

      <hemisphereLight
        color="#b4f1f8"
        groundColor="#0d3b2e"
        intensity={0.6}
      />
    </>
  );
}
