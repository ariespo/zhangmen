// mountain-form.frag — 程序化山脉生成

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_revealProgress;

// Noise helpers
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
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

float fbm(vec2 p, int octaves) {
  float sum = 0.0, amp = 0.5, freq = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * snoise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

float ridgedNoise(vec2 p) {
  float n = snoise(p);
  return 1.0 - abs(n);
}

float ridgedFbm(vec2 p, int octaves) {
  float sum = 0.0, amp = 0.5, freq = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * ridgedNoise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

// Generate a mountain layer
float mountainLayer(vec2 uv, float yOffset, float heightScale,
                     float freq, int octaves, float blur) {
  vec2 p = uv * freq;
  float ridge = ridgedFbm(p, octaves);
  float mountainY = yOffset + ridge * heightScale;
  float edge = smoothstep(mountainY - blur, mountainY + blur, uv.y);
  return 1.0 - edge;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Reveal from bottom up
  float reveal = smoothstep(0.0, 1.0, u_revealProgress * 1.2 - uv.y * 0.2);

  // Far mountains (distant, faint, smooth)
  float farMtn = mountainLayer(uv, 0.55, 0.15, 2.0, 3, 0.08);
  float farInk = farMtn * 0.25 * reveal;

  // Mid mountains
  float midMtn = mountainLayer(uv, 0.45, 0.20, 3.5, 4, 0.05);
  float midInk = midMtn * 0.50 * reveal;

  // Near mountains (detailed, dark, with brush texture)
  float nearMtn = mountainLayer(uv, 0.35, 0.25, 5.0, 5, 0.03);
  // Add brush texture (cun fa simulation)
  float brushTex = fbm(uv * 20.0 + vec2(0.0, uv.y * 5.0), 3);
  nearMtn *= 0.85 + brushTex * 0.3;
  float nearInk = nearMtn * 0.85 * reveal;

  // Combine layers
  float totalInk = max(max(farInk, midInk), nearInk);

  // Layer-specific blur for depth
  float depthBlur = mix(0.02, 0.0, nearMtn);
  totalInk = smoothstep(0.0, 0.5 + depthBlur, totalInk);

  gl_FragColor = vec4(vec3(totalInk), totalInk > 0.01 ? 1.0 : 0.0);
}
