import Environment from './Environment';
import SeaFloor from './SeaFloor';
import OceanSurface from '../water/OceanSurface';
import GodRays from '../water/GodRays';
import MarineSnow from '../water/MarineSnow';

export default function OceanScene() {
  return (
    <>
      <Environment />
      <SeaFloor />
      <OceanSurface />
      <GodRays />
      <MarineSnow />
    </>
  );
}
