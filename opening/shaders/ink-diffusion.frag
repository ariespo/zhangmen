// ink-diffusion.frag — 墨点晕染效果

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_dropPos;
uniform float u_dropRadius;
uniform float u_diffusionProgress;

// Simplex noise helpers
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM noise for organic edges
float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 5; i++) {
    sum += amp * snoise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 center = u_dropPos;
  float dist = length(uv - center);

  // Base ink circle with noise distortion
  float noise1 = fbm(uv * 3.0 + u_time * 0.1);
  float noise2 = fbm(uv * 6.0 - u_time * 0.05);
  float distortedDist = dist + noise1 * 0.08 + noise2 * 0.04;

  // Ink density: 1.0 at center, 0.0 at edge
  float maxRadius = u_dropRadius * u_diffusionProgress;
  float inkDensity = 1.0 - smoothstep(0.0, maxRadius, distortedDist);

  // Dry brush edge effect (fei bai)
  float edgeNoise = snoise(uv * 15.0 + u_time * 0.2);
  float edgeMask = smoothstep(0.3, 0.7, inkDensity);
  float dryBrush = edgeNoise * edgeMask * (1.0 - edgeMask) * 2.0;

  // Final ink with paper texture
  float paperTex = snoise(uv * 50.0) * 0.03;
  float finalInk = inkDensity + dryBrush * 0.15 + paperTex;
  finalInk = clamp(finalInk, 0.0, 1.0);

  // Output: ink intensity (0 = paper, 1 = ink)
  gl_FragColor = vec4(vec3(finalInk), 1.0);
}
