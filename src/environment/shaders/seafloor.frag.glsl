// ═══════════════════════════════════════════════════════════════════
// SEA FLOOR FRAGMENT SHADER
//
// Effects:
//   • Sandy base with hash-based grain variation
//   • Animated Voronoi caustics (3 overlapping layers)
//   • Beer-Lambert light attenuation with depth
//   • Wavelength-dependent water column tinting
//     (red absorbed first → cyan/blue at depth)
// ═══════════════════════════════════════════════════════════════════

precision highp float;

uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPos;

#define PI 3.14159265358979323846

// ─── Pseudo-random hash ──────────────────────────────────────────
float hash1(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}

// ─── Animated Voronoi ────────────────────────────────────────────
// Each cell center oscillates with time — this creates the fluid
// caustic shimmer without requiring a texture.
float voronoi(vec2 p) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float d = 8.0;

  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 cell = vec2(float(x), float(y));
      // Animate the feature point inside its cell
      vec2 seed   = hash2(ip + cell);
      vec2 center = 0.5 + 0.5 * sin(uTime * 0.9 + PI * 2.0 * seed);
      vec2 r      = cell + center - fp;
      d = min(d, dot(r, r));
    }
  }
  return sqrt(d);
}

// ─── Caustics — three overlapping Voronoi layers ─────────────────
// Layers move in slightly different directions and speeds.
// Using min() of distances creates the sharp bright network
// characteristic of real water caustics.
float caustics(vec2 uv) {
  float v1 = voronoi(uv * 2.6 + vec2( uTime * 0.110,  uTime * 0.076));
  float v2 = voronoi(uv * 3.1 - vec2( uTime * 0.088,  uTime * 0.133));
  float v3 = voronoi(uv * 4.0 + vec2(-uTime * 0.065, -uTime * 0.097));

  float c = min(v1, min(v2, v3));
  // Tight threshold → bright sharp lines like real caustics
  return 1.0 - smoothstep(0.0, 0.27, c);
}

void main() {
  // ── Sand colour (grain variation via hash) ───────────────────
  vec3 sandLight = vec3(0.88, 0.79, 0.61);
  vec3 sandDark  = vec3(0.64, 0.56, 0.43);
  float grain    = hash1(floor(vWorldPos.xz * 0.7));
  vec3  sand     = mix(sandLight, sandDark, grain * 0.45);

  // ── Rock/dark patch variation ─────────────────────────────────
  float patch = hash1(floor(vWorldPos.xz * 0.15));
  vec3  rock  = vec3(0.38, 0.33, 0.28);
  sand = mix(sand, rock, smoothstep(0.78, 0.88, patch) * 0.55);

  // ── Caustics ──────────────────────────────────────────────────
  // Scale UV in world XZ so caustics appear ~1–3 m wide
  float c = caustics(vWorldPos.xz * 0.11);
  // Caustics are cyan-white light, slightly saturated
  vec3  causticsGlow = vec3(0.55, 1.0, 1.05) * c * 0.55;

  // ── Beer-Lambert light attenuation with depth ─────────────────
  // vWorldPos.y is negative (sea floor is below Y=0).
  // Each wavelength has a different absorption coefficient:
  //   red   absorbs in ~4–5 m → coefficient ~0.15
  //   green absorbs in ~20 m  → coefficient ~0.05
  //   blue  reaches 100+ m    → coefficient ~0.01
  float depth = abs(vWorldPos.y);
  float attenR = exp(-depth * 0.16);
  float attenG = exp(-depth * 0.050);
  float attenB = exp(-depth * 0.016);
  vec3  atten  = vec3(attenR, attenG, attenB);

  // ── Lit surface colour ────────────────────────────────────────
  vec3 lit = (sand + causticsGlow) * atten;

  // ── Deep water tint (fills shadows in the water column) ───────
  // The deeper you are the more the whole scene shifts to deep cyan/blue.
  float depthBlend = clamp(depth * 0.035, 0.0, 0.85);
  vec3  waterTint  = vec3(0.01, 0.07, 0.22);
  vec3  color      = mix(lit, waterTint, depthBlend);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
