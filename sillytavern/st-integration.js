/**
 * SillyTavern Web Enhancer - 集成入口
 * 解耦设计：此文件是唯一与宿主项目交互的入口点
 */

import { createStore } from './st-core.js';
import { renderModal, bindEvents, updateLorebookBadge } from './st-ui.js';

/**
 * 初始化 SillyTavern 增强功能
 * @param {Object} options - 配置选项
 * @param {string} options.container - 宿主页面按钮容器的 CSS 选择器
 * @param {string} options.theme - 主题名称 (jade, gothic, etc.)
 */
export async function initSillyTavernEnhancer(options = {}) {
  if (window.__sillyTavernInitialized) {
    return window.sillyTavernStore;
  }
  window.__sillyTavernInitialized = true;

  const { container = '.st-button-container', theme = 'jade' } = options;

  // 创建状态管理器
  const store = createStore();
  window.sillyTavernStore = store; // 全局访问，便于调试

  // 加载数据
  await store.loadData();

  // 渲染控制按钮到宿主页面
  renderControlButtons(container);

  // 绑定事件
  bindEvents(store);

  // 订阅状态变化，更新UI
  store.subscribe((state) => {
    renderModal(state, store);
    updateLorebookBadge(state);
  });

  // 初始化徽章
  updateLorebookBadge(store.getState());

  console.log('[SillyTavern] 增强功能已初始化');
  return store;
}

/**
 * 渲染控制按钮到宿主页面
 */
function renderControlButtons(containerSelector) {
  // 查找宿主容器
  let container = document.querySelector(containerSelector);

  // 如果宿主没有提供容器，创建一个浮动容器
  if (!container) {
    container = document.createElement('div');
    container.className = 'st-floating-container';
    document.body.appendChild(container);
  }

  // 注入控制按钮
  const controls = document.createElement('div');
  controls.className = 'st-controls';
  controls.innerHTML = `
    <button class="st-btn" id="st-btn-lorebook" title="世界书管理">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <span>创意工坊</span>
      <span class="st-badge" id="st-lorebook-count" style="display:none">0</span>
    </button>
    <button class="st-btn" id="st-btn-preset" title="预设管理">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6"/>
      </svg>
      <span>预设</span>
    </button>
    <button class="st-btn" id="st-btn-settings" title="系统设置">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  `;

  container.appendChild(controls);
}

/**
 * 获取当前激活的世界书内容（供宿主项目调用）
 * @param {string} text - 要扫描的文本
 * @returns {Object} 匹配结果
 */
export function getActiveLorebookEntries(text) {
  const store = window.sillyTavernStore;
  if (!store) return [];

  const state = store.getState();
  // 这里可以集成 LorebookEngine 进行关键词匹配
  // 返回匹配的条目内容
  return {
    activeBookIds: state.settings.activeLorebookIds,
    // TODO: 实现具体的匹配逻辑
  };
}

/**
 * 获取当前预设的生成参数（供宿主项目调用）
 * @returns {Object|null} 生成参数
 */
export function getActivePresetParams() {
  const store = window.sillyTavernStore;
  if (!store) return null;

  const state = store.getState();
  const preset = state.presets.find(p => p.id === state.settings.activePresetId);
  return preset?.parameters || null;
}

// 自动初始化（如果页面已加载）
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // 延迟一点确保 DOM 完全就绪
  setTimeout(() => initSillyTavernEnhancer(), 100);
} else {
  document.addEventListener('DOMContentLoaded', () => initSillyTavernEnhancer());
}
