import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore, ZONE_PRESETS, TIME_MODIFIERS } from '../state/useOceanStore';

const tempFogColor = new THREE.Color();
const tempBgColor = new THREE.Color();

export default function AtmosphericFog() {
  const { scene } = useThree();
  const fogRef = useRef<THREE.Fog>(null);
  
  const activeZoneId = useOceanStore((s) => s.activeZoneId);
  const timeOfDayId = useOceanStore((s) => s.timeOfDayId);

  useFrame((_, delta) => {
    const preset = ZONE_PRESETS[activeZoneId];
    const timeMod = TIME_MODIFIERS[timeOfDayId];
    const lerpSpeed = Math.min(1.0, delta * 2.5);

    // 1. Color de niebla modulado por la hora del día
    tempFogColor.set(preset.fogColor);
    if (timeOfDayId !== 'day') {
      tempFogColor.lerp(new THREE.Color(timeMod.fogColorTint), 0.3);
    }

    if (fogRef.current) {
      fogRef.current.color.lerp(tempFogColor, lerpSpeed);
      fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, preset.fogNear, lerpSpeed);
      fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, preset.fogFar, lerpSpeed);
    }

    // 2. Fondo del Canvas (Scene background color)
    tempBgColor.set(preset.bgColor);
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(tempBgColor, lerpSpeed);
    } else {
      scene.background = tempBgColor.clone();
    }
  });

  const initialPreset = ZONE_PRESETS[activeZoneId];

  return (
    <fog
      ref={fogRef}
      attach="fog"
      args={[initialPreset.fogColor, initialPreset.fogNear, initialPreset.fogFar]}
    />
  );
}
