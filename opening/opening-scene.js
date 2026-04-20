// opening/opening-scene.js — Three.js 场景 + 动画时序

import * as THREE from 'three';
import { createParticles } from './particles.js';

const VERTEX_SHADER = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

async function loadShader(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load shader: ${url}`);
  return res.text();
}

export class OpeningScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;
    this.startTime = performance.now();
    this.isComplete = false;
    this.titleRevealed = false;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.autoClear = true;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Independent scenes for each pass (prevents cross-contamination)
    this.inkScene = new THREE.Scene();
    this.mountainScene = new THREE.Scene();
    this.composeScene = new THREE.Scene();

    // Offscreen render targets
    this.inkTarget = new THREE.WebGLRenderTarget(this.width, this.height);
    this.mountainTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    this.onResize = () => {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || window.innerHeight;
      this.renderer.setSize(this.width, this.height);
      this.inkTarget.setSize(this.width, this.height);
      this.mountainTarget.setSize(this.width, this.height);
      if (this.materials) {
        this.materials.ink.uniforms.u_resolution.value.set(this.width, this.height);
        this.materials.mountain.uniforms.u_resolution.value.set(this.width, this.height);
        this.materials.compose.uniforms.u_resolution.value.set(this.width, this.height);
      }
    };
    window.addEventListener('resize', this.onResize);
  }

  async init() {
    const [inkFrag, mtnFrag, compFrag] = await Promise.all([
      loadShader('./opening/shaders/ink-diffusion.frag'),
      loadShader('./opening/shaders/mountain-form.frag'),
      loadShader('./opening/shaders/compose.frag')
    ]);

    const quadGeo = new THREE.PlaneGeometry(2, 2);

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

    const inkQuad = new THREE.Mesh(quadGeo, this.materials.ink);
    const mtnQuad = new THREE.Mesh(quadGeo, this.materials.mountain);
    const compQuad = new THREE.Mesh(quadGeo, this.materials.compose);

    this.inkScene.add(inkQuad);
    this.mountainScene.add(mtnQuad);
    this.composeScene.add(compQuad);

    // Particles are rendered on top of compose in a separate pass
    this.particleScene = new THREE.Scene();
    this.particles = createParticles(this.particleScene, 60);
  }

  update(elapsed) {
    if (!this.materials) return true;

    const t = elapsed;

    // --- Phase 1: Ink diffusion (0-3s) ---
    const inkProgress = Math.min(t / 3.0, 1.0);
    this.materials.ink.uniforms.u_time.value = t;
    this.materials.ink.uniforms.u_diffusionProgress.value = inkProgress;

    // --- Phase 2: Mountain reveal (1.5-5s, faster) ---
    const mtnProgress = t > 1.5 ? Math.min((t - 1.5) / 3.5, 1.0) : 0;
    this.materials.mountain.uniforms.u_time.value = t;
    this.materials.mountain.uniforms.u_revealProgress.value = mtnProgress;

    // --- Compose uniforms ---
    this.materials.compose.uniforms.u_time.value = t;

    // Render ink pass → inkTarget
    this.renderer.setRenderTarget(this.inkTarget);
    this.renderer.render(this.inkScene, this.camera);

    // Render mountain pass → mountainTarget
    this.renderer.setRenderTarget(this.mountainTarget);
    this.renderer.render(this.mountainScene, this.camera);

    // Render compose pass → screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.composeScene, this.camera);

    // Render particles on top (after 5s)
    if (this.particles && t > 5) {
      this.particles.update(t);
      this.renderer.render(this.particleScene, this.camera);
    }

    // --- Phase 4: Title reveal trigger (11s) ---
    if (t > 11 && !this.titleRevealed) {
      this.titleRevealed = true;
      if (this.onTitleReveal) this.onTitleReveal();
    }

    // Completion (16s)
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
    if (this.materials) {
      Object.values(this.materials).forEach(m => m.dispose());
    }
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export function initOpeningScene(container, onTitleReveal, onComplete) {
  const scene = new OpeningScene(container);
  scene.onTitleReveal = onTitleReveal;
  scene.onComplete = onComplete;
  scene.init().then(() => scene.animate());
  return scene;
}
