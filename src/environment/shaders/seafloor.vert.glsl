// ═══════════════════════════════════════════════════════════════════
// SEA FLOOR VERTEX SHADER
// Simple pass-through: just computes world position for the fragment.
// (Terrain displacement will be added in Phase 2.)
// ═══════════════════════════════════════════════════════════════════

precision highp float;

varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos     = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
