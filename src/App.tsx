import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import OceanScene from './scene/OceanScene';

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 8, 25], fov: 55, near: 0.1, far: 200 }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1.2,
      }}
      dpr={[1, 2]}
      shadows
    >
      <color attach="background" args={['#001e26']} />
      <fog attach="fog" args={['#001e26', 20, 90]} />
      <OceanScene />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 2, 0]}
      />
      <Stats />
    </Canvas>
  );
}
