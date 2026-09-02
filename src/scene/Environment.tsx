import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore, ZONE_PRESETS, TIME_MODIFIERS } from '../state/useOceanStore';

const tempColor = new THREE.Color();
const tempSunColor = new THREE.Color();

export default function Environment() {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const point1Ref = useRef<THREE.PointLight>(null);
  const point2Ref = useRef<THREE.PointLight>(null);

  const activeZoneId = useOceanStore((s) => s.activeZoneId);
  const timeOfDayId = useOceanStore((s) => s.timeOfDayId);

  useFrame((state, delta) => {
    const preset = ZONE_PRESETS[activeZoneId];
    const timeMod = TIME_MODIFIERS[timeOfDayId];
    const lerpFactor = Math.min(1.0, delta * 2.5);

    // Animación suave de balanceo solar
    const t = state.clock.elapsedTime * 0.05;
    const targetSunX = preset.sunPosition[0] + timeMod.sunPositionOffset[0] + Math.sin(t) * 2;
    const targetSunY = Math.max(2, preset.sunPosition[1] + timeMod.sunPositionOffset[1]);
    const targetSunZ = preset.sunPosition[2] + timeMod.sunPositionOffset[2] + Math.cos(t) * 2;

    if (sunRef.current) {
      sunRef.current.position.x = THREE.MathUtils.lerp(sunRef.current.position.x, targetSunX, lerpFactor);
      sunRef.current.position.y = THREE.MathUtils.lerp(sunRef.current.position.y, targetSunY, lerpFactor);
      sunRef.current.position.z = THREE.MathUtils.lerp(sunRef.current.position.z, targetSunZ, lerpFactor);

      const targetSunIntensity = preset.sunIntensity * timeMod.sunIntensityMultiplier;
      sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, targetSunIntensity, lerpFactor);

      tempSunColor.set(preset.sunColor).lerp(new THREE.Color(timeMod.sunColorTint), 0.4);
      sunRef.current.color.lerp(tempSunColor, lerpFactor);
    }

    if (ambientRef.current) {
      const targetAmbient = preset.ambientIntensity * timeMod.ambientIntensityMultiplier;
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetAmbient, lerpFactor);
      ambientRef.current.color.lerp(tempColor.set(preset.ambientColor), lerpFactor);
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(hemiRef.current.intensity, preset.hemisphereIntensity, lerpFactor);
      hemiRef.current.color.lerp(tempColor.set(preset.hemisphereTopColor), lerpFactor);
      hemiRef.current.groundColor.lerp(tempColor.set(preset.hemisphereBottomColor), lerpFactor);
    }

    if (point1Ref.current) {
      point1Ref.current.intensity = THREE.MathUtils.lerp(point1Ref.current.intensity, preset.pointLight1Intensity, lerpFactor);
      point1Ref.current.color.lerp(tempColor.set(preset.pointLight1Color), lerpFactor);
    }

    if (point2Ref.current) {
      point2Ref.current.intensity = THREE.MathUtils.lerp(point2Ref.current.intensity, preset.pointLight2Intensity, lerpFactor);
      point2Ref.current.color.lerp(tempColor.set(preset.pointLight2Color), lerpFactor);
    }
  });

  const initialPreset = ZONE_PRESETS[activeZoneId];

  return (
    <>
      <directionalLight
        ref={sunRef}
        position={initialPreset.sunPosition}
        intensity={initialPreset.sunIntensity}
        color={initialPreset.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      <ambientLight ref={ambientRef} intensity={initialPreset.ambientIntensity} color={initialPreset.ambientColor} />

      <hemisphereLight
        ref={hemiRef}
        color={initialPreset.hemisphereTopColor}
        groundColor={initialPreset.hemisphereBottomColor}
        intensity={initialPreset.hemisphereIntensity}
      />

      <pointLight ref={point1Ref} position={[-15, 5, -5]} intensity={initialPreset.pointLight1Intensity} color={initialPreset.pointLight1Color} distance={30} decay={2} />
      <pointLight ref={point2Ref} position={[15, 4, -5]} intensity={initialPreset.pointLight2Intensity} color={initialPreset.pointLight2Color} distance={30} decay={2} />
    </>
  );
}

