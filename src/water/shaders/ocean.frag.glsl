// ═══════════════════════════════════════════════════════════════════
// OCEAN FRAGMENT SHADER
//
// Lighting model (all in world space):
//   • Fresnel (Schlick, n=1.33) — controls transparency vs. reflectivity
//   • Three-lobe specular (sun disc + wide glint + broad halo)
//   • Subsurface scattering approximation at wave crests
//   • Procedural micro-normal detail via value noise
//   • Foam mask at crests
//   • Underwater view mode (seen from below)
// ═══════════════════════════════════════════════════════════════════

precision highp float;

uniform vec3  uSunColor;        // warm white
uniform vec3  uSunDirection;    // normalised, world space
uniform vec3  uDeepColor;       // deep ocean hue
uniform vec3  uShallowColor;    // turquoise surface hue
uniform vec3  uCameraPos;       // world space camera position
uniform float uTime;
uniform float uUnderwater;      // 0.0 = above surface, 1.0 = below

varying vec2  vUv;
varying vec3  vWorldPos;
varying vec3  vNormal;
varying float vElevation;       // wave height (world Y, metres above rest)

// ─── Value noise (fast, smooth) ──────────────────────────────────
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);   // smoothstep
  return mix(
    mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  // ── Normal with micro-detail perturbation ────────────────────
  vec3 N = normalize(vNormal);
  // Two noise layers scrolling at different speeds / scales
  float n1 = vnoise(vWorldPos.xz * 0.80 + vec2( uTime * 0.055,  uTime * 0.032)) - 0.5;
  float n2 = vnoise(vWorldPos.xz * 1.30 - vec2( uTime * 0.038, -uTime * 0.058)) - 0.5;
  // Perturb in X and Z of world space (keep Y perturbation small)
  N = normalize(N + vec3((n1 + n2) * 0.08, 0.0, (n1 - n2) * 0.08));

  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 L = normalize(uSunDirection);
  vec3 H = normalize(L + V);

  // ── Fresnel (Schlick) — water at normal incidence R₀ ≈ 0.02 ──
  float NdotV  = max(dot(N, V), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);

  // ── Specular (three lobes for sun reflection on water) ────────
  float NdotH = max(dot(N, H), 0.0);
  float sp1   = pow(NdotH, 2048.0) * 12.0;   // sharp sun disc
  float sp2   = pow(NdotH, 256.0)  *  1.5;   // wide glint
  float sp3   = pow(NdotH, 64.0)   *  0.3;   // broad halo
  vec3  spec  = uSunColor * (sp1 + sp2 + sp3) * fresnel;

  // ── Water body colour (depth + fresnel blend) ─────────────────
  // High fresnel (grazing) → reflect sky → use shallowColor
  // Low fresnel (overhead) → see through → deep water colour
  float bodyBlend = NdotV * 0.45 + (1.0 - fresnel) * 0.55;
  bodyBlend = clamp(bodyBlend, 0.0, 1.0);
  vec3  waterBody = mix(uDeepColor, uShallowColor, bodyBlend);

  // ── Subsurface scattering at wave crests ──────────────────────
  // Sunlight scatters forward through the crest — cyan-green glow
  float cresting  = smoothstep(0.08, 0.55, vElevation);
  float sssBack   = max(dot(L, -N), 0.0) * 0.6 + max(dot(L, N), 0.0) * 0.2;
  vec3  sss       = vec3(0.02, 0.88, 0.82) * cresting * sssBack * 0.55;

  // ── Foam at crests ────────────────────────────────────────────
  float foam      = smoothstep(0.30, 0.52, vElevation);
  float foamNoise = vnoise(vWorldPos.xz * 2.5 + uTime * 0.07);
  foam *= 0.35 + foamNoise * 0.65;
  vec3  foamColor = vec3(0.96, 0.98, 1.00) * foam;

  // ── Combine — above-water view ───────────────────────────────
  vec3  color = waterBody + spec + sss + foamColor * 0.5;
  float alpha = mix(0.55, 0.95, fresnel);
  alpha = max(alpha, foam * 0.90);

  // ── Underwater view (from below the surface) ─────────────────
  // Softer, dimmer — sunlight scatters heavily through the water column.
  float uw    = clamp(uUnderwater, 0.0, 1.0);
  vec3  uwCol = waterBody * 0.55 + vec3(0.0, 0.12, 0.32) * 0.45;
  color = mix(color, uwCol, uw);
  alpha = mix(alpha, 0.78, uw);

  gl_FragColor = vec4(color, alpha);
}
