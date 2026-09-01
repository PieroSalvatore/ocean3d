// ═══════════════════════════════════════════════════════════════════
// OCEAN VERTEX SHADER — Gerstner waves (physically-based trochoidal)
//
// Geometry: PlaneGeometry in XY-plane (Three.js default).
//   After mesh rotation=[-PI/2, 0, 0]:
//     Geometry X  →  World X   (horizontal)
//     Geometry Y  →  World -Z  (horizontal)
//     Geometry Z  →  World Y   (vertical ↑)
//
// The Gerstner functions therefore:
//   • Use pos.xy  as the horizontal coordinates for phase
//   • Write Δz    as the vertical (wave height) component
//   • Tangent starts as (1,0,0), binormal as (0,1,0)
//   • Normal = cross(tangent, binormal) → transformed by modelMatrix
// ═══════════════════════════════════════════════════════════════════

precision highp float;

uniform float uTime;

varying vec2  vUv;
varying vec3  vWorldPos;
varying vec3  vNormal;
varying float vElevation;   // wave height above rest (world Y), in geometry Z

#define PI  3.14159265358979323846

// ─── Single Gerstner wave ────────────────────────────────────────
// direction  : 2-D unit vector in geometry XY (= world XZ plane)
// amplitude  : A  — crest height (metres)
// steepness  : Q  — 0=sinusoidal, 1=sharp crest (keep Q*k*A < 1 per wave)
// wavelength : λ
// speed      : phase speed (metres / second)
//
// Writes increments into tangent & binormal for the analytical normal.
vec3 gerstnerWave(
  vec2  direction,
  float amplitude,
  float steepness,
  float wavelength,
  float speed,
  vec3  pos,
  float t,
  inout vec3 tangent,
  inout vec3 binormal
) {
  float k   = 2.0 * PI / wavelength;
  vec2  d   = normalize(direction);
  float phi = k * (dot(d, pos.xy) - speed * t);
  float c   = cos(phi);
  float s   = sin(phi);
  float Q   = steepness;
  float A   = amplitude;

  // Derivatives for tangent (∂/∂x) and binormal (∂/∂y)
  tangent  += vec3(
    -Q * d.x * d.x * k * A * s,   // ∂Δx/∂x
    -Q * d.x * d.y * k * A * s,   // ∂Δy/∂x
     d.x * k * A * c              // ∂Δz/∂x
  );
  binormal += vec3(
    -Q * d.y * d.x * k * A * s,   // ∂Δx/∂y
    -Q * d.y * d.y * k * A * s,   // ∂Δy/∂y
     d.y * k * A * c              // ∂Δz/∂y
  );

  return vec3(
    Q * A * d.x * c,  // Δx — horizontal surge
    Q * A * d.y * c,  // Δy — horizontal sway
    A * s             // Δz — vertical heave (= world Y height)
  );
}

void main() {
  vUv = uv;

  vec3 pos     = position;                 // starts in XY-plane, z = 0
  vec3 tangent  = vec3(1.0, 0.0, 0.0);    // ∂pos/∂x for flat plane
  vec3 binormal = vec3(0.0, 1.0, 0.0);    // ∂pos/∂y for flat plane

  // ── Six superimposed Gerstner waves ────────────────────────────
  // Larger, slower swells dominate; smaller chop adds texture.
  // Q values keep each wave below the looping threshold.
  //                dir             A      Q     λ    speed
  pos += gerstnerWave(vec2( 1.0,  0.70), 0.40, 0.50, 18.0, 2.6, pos, uTime, tangent, binormal);
  pos += gerstnerWave(vec2(-0.50,  0.90), 0.27, 0.42, 12.0, 2.1, pos, uTime, tangent, binormal);
  pos += gerstnerWave(vec2( 0.40, -0.60), 0.20, 0.38,  7.5, 1.7, pos, uTime, tangent, binormal);
  pos += gerstnerWave(vec2(-0.80,  0.40), 0.13, 0.28,  4.8, 1.3, pos, uTime, tangent, binormal);
  pos += gerstnerWave(vec2( 0.70,  0.30), 0.07, 0.22,  2.9, 1.0, pos, uTime, tangent, binormal);
  pos += gerstnerWave(vec2(-0.30, -0.80), 0.04, 0.16,  1.8, 0.8, pos, uTime, tangent, binormal);

  // ── Normal (geometry space → world space) ───────────────────────
  // cross(tangent, binormal) gives geometry-Z+ for a flat plane → world Y+
  vec3 geomNormal = normalize(cross(tangent, binormal));
  // modelMatrix (rotation-only) correctly transforms geometry normals to world
  vNormal    = normalize(mat3(modelMatrix) * geomNormal);

  // wave height above rest state (geometry Z, which maps to world Y)
  vElevation = pos.z;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos     = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
