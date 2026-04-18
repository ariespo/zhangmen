/**
 * SillyTavern Web v2.0 - Integration Entry
 * 解耦设计：此文件是唯一与宿主项目交互的入口点
 */

import { createStore } from './st-core.js';
import { renderModal, bindEvents, updateLorebookBadge, updateChatBadge, renderToast } from './st-ui.js';
import { previewPrompt } from './st-prompt.js';
import { extractVariables } from './st-variables.js';
import { createLorebookEngine } from './st-engine.js';

/**
 * Initialize SillyTavern Enhancer
 * @param {Object} options
 * @param {string} options.container - Host button container selector
 * @param {string} options.theme - Theme name
 */
export async function initSillyTavernEnhancer(options = {}) {
  if (window.__sillyTavernInitialized) {
    return window.sillyTavernStore;
  }
  window.__sillyTavernInitialized = true;

  const { container = '.st-button-container', theme = 'jade' } = options;

  const store = createStore();
  window.sillyTavernStore = store;

  // Expose prompt preview globally
  window.__st_previewPrompt = (opts) => {
    const state = store.getState();
    const preset = store.getActivePreset();
    const activeBooks = store.getActiveLorebooks();
    const chat = store.getActiveChat();
    return previewPrompt({
      userInput: opts.userInput || '',
      history: opts.history || chat?.messages || [],
      preset: preset || opts.preset,
      lorebooks: activeBooks,
      userName: state.settings.userName || '用户',
      characterName: state.settings.characterName || 'AI',
      variables: chat?.variables || {}
    });
  };

  await store.loadData();

  renderControlButtons(container);
  bindEvents(store);

  store.subscribe((state) => {
    renderModal(state, store);
    updateLorebookBadge(state);
    updateChatBadge(state);
    renderToast(state);
  });

  updateLorebookBadge(store.getState());
  updateChatBadge(store.getState());

  // Ensure active chat exists
  if (!store.getActiveChat() && store.getState().chats.length === 0) {
    await store.createChat('默认对话');
  }

  console.log('[SillyTavern] v2.0 增强功能已初始化');
  return store;
}

/**
 * Render control buttons into host page
 */
function renderControlButtons(containerSelector) {
  let container = document.querySelector(containerSelector);

  if (!container) {
    container = document.createElement('div');
    container.className = 'st-floating-container';
    document.body.appendChild(container);
  }

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
    <button class="st-btn" id="st-btn-chat" title="对话管理">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span>对话</span>
      <span class="st-badge" id="st-chat-count" style="display:none">0</span>
    </button>
    <button class="st-btn" id="st-btn-variables" title="变量面板">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <span>变量</span>
    </button>
    <button class="st-btn" id="st-btn-prompt-preview" title="提示词预览">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
        <path d="M11 8v6"/>
        <path d="M8 11h6"/>
      </svg>
      <span>预览</span>
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
 * Get active lorebook entries for host scanning
 * @param {string} text - Text to scan
 */
export function getActiveLorebookEntries(text) {
  const store = window.sillyTavernStore;
  if (!store) return { activeBookIds: [], matchedEntries: [] };

  const activeBooks = store.getActiveLorebooks();
  const matched = [];
  for (const book of activeBooks) {
    const engine = createLorebookEngine(book);
    matched.push(...engine.scan(text));
  }
  return {
    activeBookIds: store.getState().settings.activeLorebookIds,
    matchedEntries: matched
  };
}

/**
 * Get active preset parameters for host
 */
export function getActivePresetParams() {
  const store = window.sillyTavernStore;
  if (!store) return null;
  const preset = store.getActivePreset();
  return preset?.parameters || null;
}

/**
 * Get active chat for host
 */
export function getActiveChat() {
  const store = window.sillyTavernStore;
  if (!store) return null;
  return store.getActiveChat();
}

/**
 * Add a message to the active chat and extract variables
 */
export async function addChatMessage(message) {
  const store = window.sillyTavernStore;
  if (!store) return;
  const chat = store.getActiveChat();
  if (!chat) {
    await store.createChat('新对话');
  }
  const activeChat = store.getActiveChat();
  if (!activeChat) return;

  const { cleanedText, updates } = extractVariables(message.content || '');
  const msg = { ...message, content: cleanedText || message.content };

  await store.addMessage(activeChat.id, msg);
  if (Object.keys(updates).length > 0) {
    await store.setChatVariables(activeChat.id, updates);
  }
}

// Auto-initialize
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => initSillyTavernEnhancer(), 100);
} else {
  document.addEventListener('DOMContentLoaded', () => initSillyTavernEnhancer());
}
