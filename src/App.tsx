import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import OceanScene from './scene/OceanScene';
import AtmosphericFog from './scene/AtmosphericFog';
import { HUD } from './ui/HUD';
import './ui/HUD.css';

import { useOceanStore } from './state/useOceanStore';

export default function App() {
  const activeZoneId = useOceanStore((s) => s.activeZoneId);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Capa de Interfaz de Usuario (HTML Overlay) */}
      <HUD />

      {/* Capa de Gráficos 3D (R3F Canvas) */}
      <Canvas
        camera={{ position: [0, 4, 22], fov: 50, near: 0.1, far: 300 }}
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
      >
        <AtmosphericFog key={`fog-${activeZoneId}`} />
        <OceanScene key={`scene-${activeZoneId}`} />
        
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
    </div>
  );
}

