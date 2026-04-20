// opening/index.js — 水墨开场动画入口

import { initOpeningScene } from './opening-scene.js';

/**
 * 初始化水墨开场动画
 * @param {HTMLElement} container - 容器元素
 * @param {Function} onComplete - 动画完成回调
 * @returns {Object} { dispose }
 */
export function initOpeningAnimation(container, onTitleReveal, onComplete) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn('WebGL not supported, falling back to CSS');
    fallbackOpening(container, onComplete);
    return { dispose() {} };
  }

  const scene = initOpeningScene(container, onTitleReveal, onComplete);

  return {
    dispose() {
      scene.dispose();
    }
  };
}

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
