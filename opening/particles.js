// opening/particles.js — 花瓣/竹叶粒子

import * as THREE from 'three';

export function createParticles(scene, count = 60) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 10 + 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = -(Math.random() * 0.03 + 0.01);
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

    sizes[i] = Math.random() * 0.08 + 0.03;
    opacities[i] = Math.random() * 0.6 + 0.2;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

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
        pos[idx + 1] += velocities[idx + 1];
        pos[idx] += velocities[idx] + Math.sin(time * 0.5 + phases[i]) * 0.002;
        pos[idx + 2] += velocities[idx + 2];

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
