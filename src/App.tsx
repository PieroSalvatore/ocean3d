import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import OceanScene from './scene/OceanScene';

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 4, 22], fov: 50, near: 0.1, far: 300 }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1.15,
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#001822']} />
      <fog attach="fog" args={['#001822', 40, 160]} />
      
      <OceanScene />
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={70}
        maxPolarAngle={Math.PI / 2.01}
        target={[0, 0, 0]}
      />
      <Stats />
    </Canvas>
  );
}
