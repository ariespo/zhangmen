/**
 * SillyTavern Web v2.0 - Integration Entry
 * 解耦设计：此文件是唯一与宿主项目交互的入口点
 */

import { createStore, db } from './st-core.js';
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

  // Expose API mode lorebook switcher globally
  window.switchApiLorebookMode = switchApiLorebookMode;

  await store.loadData();
  await ensureDefaultLorebook(store);

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

/**
 * Ensure default lorebook '宗门志' exists with format and variable specs.
 * Creates entries from LLM_FORMAT_SPEC.md and LLM_REFERENCE.md on first load.
 */
async function ensureDefaultLorebook(store) {
  const books = store.getState().lorebooks;
  let book = books.find(b => b.name === '宗门志');
  let created = false;

  if (!book) {
    book = {
      id: crypto.randomUUID(),
      name: '宗门志',
      description: '宗门志游戏默认世界书，包含LLM输出格式规范和变量参考',
      entries: [],
      recursiveScanning: false,
      caseSensitive: false,
      matchWholeWords: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    created = true;
  }

  const hasFormatEntry = book.entries.some(e => e.comment === '格式规范');
  const hasVarEntry = book.entries.some(e => e.comment === '变量规范');
  const hasMainFormatEntry = book.entries.some(e => e.comment === '多API主格式');
  const hasSecondFormatEntry = book.entries.some(e => e.comment === '多API第二格式');

  const needsEntries = !hasFormatEntry || !hasVarEntry || !hasMainFormatEntry || !hasSecondFormatEntry;

  if (needsEntries) {
    try {
      const [formatRes, varRes, mainRes, secondRes] = await Promise.all([
        fetch('./LLM_FORMAT_SPEC.md'),
        fetch('./LLM_REFERENCE.md'),
        fetch('./docs/LLM_FORMAT_SPEC_MAIN.md'),
        fetch('./docs/LLM_FORMAT_SPEC_SECOND.md')
      ]);

      const formatContent = formatRes.ok ? await formatRes.text() : '';
      const varContent = varRes.ok ? await varRes.text() : '';
      const mainContent = mainRes.ok ? await mainRes.text() : '';
      const secondContent = secondRes.ok ? await secondRes.text() : '';

      // 单 API 模式条目
      if (!hasFormatEntry && formatContent) {
        book.entries.push({
          id: crypto.randomUUID(),
          keys: [],
          secondaryKeys: [],
          content: formatContent,
          order: 100,
          position: 'at_depth',
          depth: 0,
          selective: false,
          selectiveLogic: 'not_all',
          constant: true,
          probability: 100,
          enabled: true,
          role: 'system',
          addMemo: false,
          comment: '格式规范'
        });
      }

      if (!hasVarEntry && varContent) {
        book.entries.push({
          id: crypto.randomUUID(),
          keys: [],
          secondaryKeys: [],
          content: varContent,
          order: 101,
          position: 'at_depth',
          depth: 0,
          selective: false,
          selectiveLogic: 'not_all',
          constant: true,
          probability: 100,
          enabled: true,
          role: 'system',
          addMemo: false,
          comment: '变量规范'
        });
      }

      // 多 API 模式条目
      if (!hasMainFormatEntry && mainContent) {
        book.entries.push({
          id: crypto.randomUUID(),
          keys: [],
          secondaryKeys: [],
          content: mainContent,
          order: 200,
          position: 'at_depth',
          depth: 0,
          selective: false,
          selectiveLogic: 'not_all',
          constant: true,
          probability: 100,
          enabled: false,
          role: 'system',
          addMemo: false,
          comment: '多API主格式'
        });
      }

      if (!hasSecondFormatEntry && secondContent) {
        book.entries.push({
          id: crypto.randomUUID(),
          keys: [],
          secondaryKeys: [],
          content: secondContent,
          order: 201,
          position: 'at_depth',
          depth: 0,
          selective: false,
          selectiveLogic: 'not_all',
          constant: true,
          probability: 100,
          enabled: false,
          role: 'system',
          addMemo: false,
          comment: '多API第二格式'
        });
      }

      await store.saveLorebook(book);
    } catch (e) {
      console.warn('[DefaultLorebook] 创建默认世界书条目失败:', e);
      return;
    }
  }

  // 根据 apiMode 设置条目启用状态
  const apiMode = store.getState().settings?.apiMode || 'single';
  let needsUpdate = false;
  for (const entry of book.entries) {
    if (entry.comment === '格式规范' || entry.comment === '变量规范') {
      const shouldEnable = apiMode === 'single';
      if (entry.enabled !== shouldEnable) { entry.enabled = shouldEnable; needsUpdate = true; }
    }
    if (entry.comment === '多API主格式') {
      const shouldEnable = apiMode === 'dual';
      if (entry.enabled !== shouldEnable) { entry.enabled = shouldEnable; needsUpdate = true; }
    }
    if (entry.comment === '多API第二格式') {
      const shouldEnable = apiMode === 'dual';
      if (entry.enabled !== shouldEnable) { entry.enabled = shouldEnable; needsUpdate = true; }
    }
  }
  if (needsUpdate) {
    await store.saveLorebook(book);
  }

  // Activate the book if it isn't already
  const settings = store.getState().settings;
  if (!settings.activeLorebookIds.includes(book.id)) {
    settings.activeLorebookIds.push(book.id);
    try {
      await db.settings.put(settings);
      store.setState({ settings: { ...settings } });
    } catch (e) {
      console.warn('[DefaultLorebook] 激活默认世界书失败:', e);
    }
  }

  if (created) {
    console.log('[DefaultLorebook] 已创建默认世界书《宗门志》并激活');
  }
}

// Auto-initialize
/**
 * 切换 API 模式时更新世界书条目启用状态
 * @param {string} mode - 'single' 或 'dual'
 * @param {object} store - SillyTavern store
 */
export async function switchApiLorebookMode(mode, store) {
  const books = store.getState().lorebooks;
  const book = books.find(b => b.name === '宗门志');
  if (!book) return;

  let needsUpdate = false;
  for (const entry of book.entries) {
    if (entry.comment === '格式规范' || entry.comment === '变量规范') {
      const shouldEnable = mode === 'single';
      if (entry.enabled !== shouldEnable) { entry.enabled = shouldEnable; needsUpdate = true; }
    }
    if (entry.comment === '多API主格式' || entry.comment === '多API第二格式') {
      const shouldEnable = mode === 'dual';
      if (entry.enabled !== shouldEnable) { entry.enabled = shouldEnable; needsUpdate = true; }
    }
  }

  if (needsUpdate) {
    await store.saveLorebook(book);
    console.log('[Lorebook] 已切换至', mode === 'dual' ? '多API' : '单API', '模式');
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => initSillyTavernEnhancer(), 100);
} else {
  document.addEventListener('DOMContentLoaded', () => initSillyTavernEnhancer());
}
