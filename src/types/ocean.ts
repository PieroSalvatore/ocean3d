import * as THREE from 'three';

export type OceanZoneId = 'reef' | 'kelp' | 'depths' | 'cave' | 'abyss';
export type TimeOfDayId = 'morning' | 'day' | 'sunset' | 'night';

export interface ZonePreset {
  id: OceanZoneId;
  name: string;
  typeLabel: string;
  bgColor: string;          
  fogColor: string;         
  fogNear: number;          
  fogFar: number;           
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemisphereTopColor: string;
  hemisphereBottomColor: string;
  hemisphereIntensity: number;
  pointLight1Color: string;
  pointLight1Intensity: number;
  pointLight2Color: string;
  pointLight2Intensity: number;
  baseDepth: number;
  
  // Parámetros de Agua, Suelo, Cáusticas y Rayos Solares
  waterShallowColor: string;
  waterDeepColor: string;
  waterOpacity: number;
  sandCrestColor: string;
  sandTroughColor: string;
  causticColor: string;
  causticIntensity: number;
  godRaysOpacity: number;
  godRaysColor: string;
}

export interface TimeModifier {
  id: TimeOfDayId;
  sunColorTint: string;
  sunIntensityMultiplier: number;
  sunPositionOffset: [number, number, number];
  ambientIntensityMultiplier: number;
  fogColorTint: string;
  godRaysMultiplier: number;
  causticIntensityMultiplier: number;
}

export interface OceanState {
  activeZoneId: OceanZoneId;
  timeOfDayId: TimeOfDayId;
  soundEnabled: boolean;
  currentDepth: number;
  
  setZone: (zoneId: OceanZoneId) => void;
  setTimeOfDay: (timeId: TimeOfDayId) => void;
  toggleSound: () => void;
  setCurrentDepth: (depth: number) => void;
}
