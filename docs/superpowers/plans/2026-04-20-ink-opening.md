# Three.js 水墨粒子山水开场动画实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** 用 Three.js shader 替换现有开场动画，实现四阶段水墨晕染效果。

**Architecture:** 单 fullscreen quad + 三层 fragment shader（ink diffusion → mountain form → compose）+ Points 粒子系统，由 opening-scene.js 统一时序控制。

**Tech Stack:** Three.js (CDN), GLSL shaders, ES modules

---

## 文件清单

| 文件 | 职责 |
|------|------|
| `opening/shaders/ink-diffusion.frag` | 墨点晕染 shader |
| `opening/shaders/mountain-form.frag` | 山脉轮廓生成 shader |
| `opening/shaders/compose.frag` | 最终合成 shader |
| `opening/particles.js` | 花瓣/竹叶粒子系统 |
| `opening/opening-scene.js` | Three.js 场景 + 动画时序 |
| `opening/index.js` | 入口，导出 `initOpeningAnimation` |
| `index.html` | 引入 Three.js CDN，替换现有开场 DOM |

---

### Task 1: 墨点晕染 Shader

**Files:**
- Create: `opening/shaders/ink-diffusion.frag`

- [ ] **Step 1: 创建 shader 文件**

```glsl
// ink-diffusion.frag — 墨点晕染效果

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_dropPos;
uniform float u_dropRadius;
uniform float u_diffusionProgress; // 0→1

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
```

- [ ] **Step 2: Commit**

```bash
git add opening/shaders/ink-diffusion.frag
git commit -m "feat: ink diffusion shader"
```

---

### Task 2: 山脉生成 Shader

**Files:**
- Create: `opening/shaders/mountain-form.frag`

- [ ] **Step 1: 创建 shader 文件**

```glsl
// mountain-form.frag — 程序化山脉生成

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_revealProgress; // 0→1

// Noise helpers (same as ink-diffusion)
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
```

- [ ] **Step 2: Commit**

```bash
git add opening/shaders/mountain-form.frag
git commit -m "feat: mountain generation shader"
```

---

### Task 3: 合成 Shader

**Files:**
- Create: `opening/shaders/compose.frag`

- [ ] **Step 1: 创建 shader 文件**

```glsl
// compose.frag — 最终合成：水墨山水 + 倒影 + 调色

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_inkTex;      // ink diffusion render target
uniform sampler2D u_mountainTex; // mountain render target
uniform float u_waterLevel;      // 0.0 - 1.0, y position of water line
uniform float u_reflectionStrength;

// Simple noise for water ripple
float snoise(vec2 v);

vec3 paperColor = vec3(0.96, 0.94, 0.91); // #f5f0e8 宣纸色
vec3 inkColor = vec3(0.06, 0.06, 0.07);   // 墨色

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uvAspect = vec2(uv.x * aspect, uv.y);

  // Sample layers
  float ink = texture2D(u_inkTex, uv).r;
  vec4 mountain = texture2D(u_mountainTex, uv);
  float mtn = mountain.r;

  // Combine ink background + mountains
  float combinedInk = max(ink * 0.3, mtn);

  // Water reflection
  float waterLine = u_waterLevel;
  vec3 finalColor = paperColor;

  if (uv.y > waterLine) {
    // Above water: show mountains
    finalColor = mix(paperColor, inkColor, combinedInk);
  } else {
    // Below water: reflection
    vec2 reflectUV = vec2(uv.x, waterLine + (waterLine - uv.y));
    float ripple = snoise(reflectUV * 8.0 + u_time * 0.5) * 0.01;
    reflectUV.x += ripple;

    float reflectMtn = texture2D(u_mountainTex, reflectUV).r;
    float reflectInk = texture2D(u_inkTex, reflectUV).r;
    float reflectCombined = max(reflectInk * 0.2, reflectMtn);

    // Fade reflection toward bottom
    float fade = 1.0 - smoothstep(0.0, waterLine, waterLine - uv.y);
    reflectCombined *= fade * u_reflectionStrength;

    finalColor = mix(paperColor, inkColor, reflectCombined);
  }

  // Vignette
  float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5) * 1.2);
  finalColor = mix(finalColor * 0.85, finalColor, vignette);

  // Subtle warm tint
  finalColor += vec3(0.02, 0.01, 0.0) * (1.0 - combinedInk);

  gl_FragColor = vec4(finalColor, 1.0);
}

// Inline noise for water ripple
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
```

- [ ] **Step 2: Commit**

```bash
git add opening/shaders/compose.frag
git commit -m "feat: compose shader with water reflection"
```

---

### Task 4: 粒子系统

**Files:**
- Create: `opening/particles.js`

- [ ] **Step 1: 创建粒子系统**

```js
// opening/particles.js — 花瓣/竹叶粒子

import * as THREE from 'three';

export function createParticles(scene, count = 80) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;     // x
    positions[i * 3 + 1] = Math.random() * 10 + 5;      // y (start above)
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;   // z

    velocities[i * 3] = (Math.random() - 0.5) * 0.02;   // drift x
    velocities[i * 3 + 1] = -(Math.random() * 0.03 + 0.01); // fall y
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

    sizes[i] = Math.random() * 0.08 + 0.03;
    opacities[i] = Math.random() * 0.6 + 0.2;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  // Create a soft circular texture for petals
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,220,220,1)');
  grad.addColorStop(0.5, 'rgba(255,200,200,0.5)');
  grad.addColorStop(1, 'rgba(255,200,200,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 0.1,
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
    color: new THREE.Color(0xffcccc),
    opacity: 0.6,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    mesh: points,
    update(time) {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        // Fall
        pos[idx + 1] += velocities[idx + 1];
        // Wind drift (sin wave)
        pos[idx] += velocities[idx] + Math.sin(time * 0.5 + phases[i]) * 0.002;
        pos[idx + 2] += velocities[idx + 2];

        // Reset if below screen
        if (pos[idx + 1] < -5) {
          pos[idx + 1] = 8;
          pos[idx] = (Math.random() - 0.5) * 20;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
      scene.remove(points);
    }
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add opening/particles.js
git commit -m "feat: petal particle system"
```

---

### Task 5: Three.js 场景 + 时序控制

**Files:**
- Create: `opening/opening-scene.js`

- [ ] **Step 1: 创建场景文件**

```js
// opening/opening-scene.js — Three.js 场景 + 动画时序

import * as THREE from 'three';
import { createParticles } from './particles.js';

// Shader sources (loaded as raw strings in real impl)
// For now, use inline shaders or fetch from .frag files

const VERTEX_SHADER = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

async function loadShader(url) {
  const res = await fetch(url);
  return res.text();
}

export class OpeningScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;
    this.startTime = performance.now();
    this.phase = 'ink-drop'; // ink-drop | mountains | ambient | title
    this.isComplete = false;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Render targets
    this.inkTarget = new THREE.WebGLRenderTarget(this.width, this.height);
    this.mountainTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    this.initShaders();
    this.particles = createParticles(this.scene, 60);

    // Resize handler
    this.onResize = () => {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || window.innerHeight;
      this.renderer.setSize(this.width, this.height);
      this.inkTarget.setSize(this.width, this.height);
      this.mountainTarget.setSize(this.width, this.height);
      this.materials.ink.uniforms.u_resolution.value.set(this.width, this.height);
      this.materials.mountain.uniforms.u_resolution.value.set(this.width, this.height);
      this.materials.compose.uniforms.u_resolution.value.set(this.width, this.height);
    };
    window.addEventListener('resize', this.onResize);
  }

  async initShaders() {
    const inkFrag = await loadShader('./opening/shaders/ink-diffusion.frag');
    const mtnFrag = await loadShader('./opening/shaders/mountain-form.frag');
    const compFrag = await loadShader('./opening/shaders/compose.frag');

    const quadGeo = new THREE.PlaneGeometry(2, 2);

    // Ink material
    this.materials = {
      ink: new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: inkFrag,
        uniforms: {
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(this.width, this.height) },
          u_dropPos: { value: new THREE.Vector2(0.5, 0.5) },
          u_dropRadius: { value: 0.8 },
          u_diffusionProgress: { value: 0 }
        }
      }),
      mountain: new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: mtnFrag,
        uniforms: {
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(this.width, this.height) },
          u_revealProgress: { value: 0 }
        }
      }),
      compose: new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: compFrag,
        uniforms: {
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(this.width, this.height) },
          u_inkTex: { value: this.inkTarget.texture },
          u_mountainTex: { value: this.mountainTarget.texture },
          u_waterLevel: { value: 0.35 },
          u_reflectionStrength: { value: 0.6 }
        }
      })
    };

    this.quads = {
      ink: new THREE.Mesh(quadGeo, this.materials.ink),
      mountain: new THREE.Mesh(quadGeo, this.materials.mountain),
      compose: new THREE.Mesh(quadGeo, this.materials.compose)
    };
  }

  update(elapsed) {
    if (!this.materials) return;

    const t = elapsed;

    // Phase timing
    const PHASES = {
      'ink-drop':  { start: 0, end: 3.5 },
      'mountains': { start: 2.0, end: 8.0 },
      'ambient':   { start: 7.0, end: 13.0 },
      'title':     { start: 11.0, end: 16.0 }
    };

    // Ink diffusion progress
    const inkProgress = Math.min(t / 3.0, 1.0);
    this.materials.ink.uniforms.u_time.value = t;
    this.materials.ink.uniforms.u_diffusionProgress.value = inkProgress;

    // Mountain reveal
    const mtnProgress = t > 2.0 ? Math.min((t - 2.0) / 5.0, 1.0) : 0;
    this.materials.mountain.uniforms.u_time.value = t;
    this.materials.mountain.uniforms.u_revealProgress.value = mtnProgress;

    // Compose
    this.materials.compose.uniforms.u_time.value = t;

    // Render passes
    this.scene.add(this.quads.ink);
    this.renderer.setRenderTarget(this.inkTarget);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.quads.ink);
    this.scene.add(this.quads.mountain);
    this.renderer.setRenderTarget(this.mountainTarget);
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.quads.mountain);
    this.scene.add(this.quads.compose);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    // Particles (on top)
    if (this.particles && t > 5) {
      this.particles.update(t);
    }

    // Check completion
    if (t > 16 && !this.isComplete) {
      this.isComplete = true;
      if (this.onComplete) this.onComplete();
    }

    return !this.isComplete;
  }

  animate() {
    const loop = () => {
      const elapsed = (performance.now() - this.startTime) / 1000;
      const continueAnim = this.update(elapsed);
      if (continueAnim) {
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.inkTarget.dispose();
    this.mountainTarget.dispose();
    if (this.particles) this.particles.dispose();
    Object.values(this.materials || {}).forEach(m => m.dispose());
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export function initOpeningScene(container, onComplete) {
  const scene = new OpeningScene(container);
  scene.onComplete = onComplete;
  scene.animate();
  return scene;
}
```

- [ ] **Step 2: Commit**

```bash
git add opening/opening-scene.js
git commit -m "feat: Three.js opening scene with shader pipeline"
```

---

### Task 6: 入口文件

**Files:**
- Create: `opening/index.js`

- [ ] **Step 1: 创建入口**

```js
// opening/index.js — 水墨开场动画入口

import { initOpeningScene } from './opening-scene.js';

/**
 * 初始化水墨开场动画
 * @param {HTMLElement} container - 容器元素
 * @param {Function} onComplete - 动画完成回调
 * @returns {Object} { dispose }
 */
export function initOpeningAnimation(container, onComplete) {
  // WebGL 检测
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn('WebGL not supported, falling back to CSS');
    fallbackOpening(container, onComplete);
    return { dispose() {} };
  }

  const scene = initOpeningScene(container, onComplete);

  return {
    dispose() {
      scene.dispose();
    }
  };
}

// CSS 降级方案
function fallbackOpening(container, onComplete) {
  container.innerHTML = `
    <div style="width:100%;height:100%;background:linear-gradient(180deg,#f5f0e8 0%,#e8e0d0 100%);
                display:flex;align-items:center;justify-content:center;flex-direction:column;">
      <h1 style="font-family:'ZCOOL XiaoWei',serif;font-size:64px;color:#1a1a1a;letter-spacing:12px;
                 opacity:0;animation:fadeIn 2s ease forwards;">宗门志</h1>
      <p style="font-family:'Noto Serif SC',serif;font-size:16px;color:#666;letter-spacing:4px;
                margin-top:16px;opacity:0;animation:fadeIn 2s ease 0.8s forwards;">
        问道长生 · 经营宗门 · 你的仙道由你书写
      </p>
    </div>
    <style>
      @keyframes fadeIn { to { opacity:1; } }
    </style>
  `;
  setTimeout(() => onComplete && onComplete(), 3000);
}
```

- [ ] **Step 2: Commit**

```bash
git add opening/index.js
git commit -m "feat: opening animation entry with WebGL fallback"
```

---

### Task 7: 修改 index.html 引入 Three.js

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 在 head 中添加 Three.js CDN**

在现有 script 标签附近添加：

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
    }
  }
</script>
```

- [ ] **Step 2: 替换标题页内容**

将现有 SVG 山水卷轴内容替换为 canvas 容器：

```html
<!-- TITLE SCREEN -->
<div id="title-screen">
  <div id="opening-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;"></div>
  <div class="opening-title" id="opening-title">宗门志</div>
  <div class="opening-subtitle" id="opening-subtitle">问道长生 · 经营宗门 · 你的仙道由你书写</div>
  <div class="title-menu" id="title-menu">
    <button class="title-btn primary" onclick="startNewGame()">开始新游戏</button>
    <button class="title-btn" onclick="loadGame()">读取游戏</button>
    <button class="title-btn" onclick="openTitleSettings()">设置</button>
  </div>
</div>
```

- [ ] **Step 3: 移除旧动画代码，添加新动画初始化**

删除现有的 Motion One 开场动画代码块（initOpening 函数），在 script 末尾添加：

```js
    // ====== THREE.JS OPENING ANIMATION ======
    (async function initInkOpening() {
      try {
        const { initOpeningAnimation } = await import('./opening/index.js');
        const container = document.getElementById('opening-canvas');
        if (!container) return;

        const opening = initOpeningAnimation(container, () => {
          // Animation complete - title/menu are already visible via CSS
        });

        // Store for cleanup
        window._openingAnimation = opening;
      } catch (e) {
        console.error('Failed to load opening animation:', e);
      }
    })();
```

- [ ] **Step 4: 更新 CSS 让标题/菜单配合新动画时序**

确保 `.opening-title`, `.opening-subtitle`, `.title-menu` 默认 opacity: 0，并在适当时间淡入。

现有 CSS 已有 `opacity: 0` 初始状态和 `.show` 类动画，保持即可。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: integrate Three.js ink opening into title screen"
```

---

### Task 8: 测试与验证

**Files:**
- None (manual browser testing)

- [ ] **Step 1: 启动本地服务器**

```bash
npx serve . -p 3000
```

- [ ] **Step 2: 验证各阶段**

1. 打开 `http://localhost:3000`
2. 确认第 1 秒：墨点开始晕染（宣纸色 → 黑色墨迹扩散）
3. 确认第 3-5 秒：山脉轮廓从底部浮现
4. 确认第 8-10 秒：云雾/粒子效果
5. 确认第 12 秒后：标题和菜单正常显示
6. 检查控制台无 shader 编译错误

- [ ] **Step 3: 测试降级**

在 Chrome DevTools → Rendering → 禁用 WebGL，刷新确认 CSS 降级方案生效。

- [ ] **Step 4: 性能检查**

打开 Performance 面板，录制 5 秒，确认 60fps 稳定。

- [ ] **Step 5: 推送**

```bash
git push origin main
```

---

## Self-Review

### Spec Coverage

| Spec 章节 | 对应 Task |
|-----------|-----------|
| 墨点晕染 shader | Task 1 |
| 山脉生成 shader | Task 2 |
| 合成 shader | Task 3 |
| 粒子系统 | Task 4 |
| Three.js 场景 + 时序 | Task 5 |
| 入口 + 降级 | Task 6 |
| index.html 集成 | Task 7 |
| 测试 | Task 8 |

### Placeholder Scan

- [x] 无 "TBD" / "TODO"
- [x] 所有步骤包含完整代码
- [x] 无模糊描述
- [x] 函数名一致（`initOpeningAnimation`, `initOpeningScene`）

### Type Consistency

- `loadShader` 返回 `Promise<string>`
- `initOpeningAnimation` 接收 `(container, onComplete)`
- `OpeningScene.update(elapsed)` 返回 `boolean` (continue?)
- Uniform 命名跨文件一致 (`u_time`, `u_resolution`)
