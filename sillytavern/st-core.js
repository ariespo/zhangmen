/**
 * SillyTavern Web v2.0 - Core Module
 * Database, state management, chat sessions, import/export
 */

import Dexie from 'https://unpkg.com/dexie@4.0.1/dist/dexie.mjs';

// ===== Database =====
const DB_NAME = 'SillyTavernWebDB_Zhangmen';

class AppDatabase extends Dexie {
  constructor() {
    super(DB_NAME);
    this.version(2).stores({
      lorebooks: '++id, name, updatedAt',
      presets: '++id, name, updatedAt',
      settings: 'key',
      chats: '++id, name, updatedAt'
    });
  }
}

export const db = new AppDatabase();

// ===== Default Data =====
export const DEFAULT_SETTINGS = {
  key: 'settings',
  api: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    timeout: 60000
  },
  activePresetId: null,
  activeLorebookIds: [],
  activeChatId: null,
  userName: '清虚子',
  characterName: '云璃仙子',
  theme: 'jade',
  language: 'zh',
  autoSave: true,
  autoSaveInterval: 30
};

export const DEFAULT_PRESET = {
  id: 'default',
  name: '修仙对话',
  description: '适合修仙世界的对话风格',
  promptOrder: [
    {
      id: 'system',
      name: '系统提示',
      content: '你是一位修仙世界的资深修士，正在与掌门对话。请用古风修仙的语气回答，适当使用"道友"、"贫道"、"修为"等词汇。保持角色扮演的一致性。',
      enabled: true,
      position: 0,
      insertionType: 'system',
      role: 'system'
    },
    {
      id: 'world_info',
      name: '世界书',
      content: '',
      enabled: true,
      position: 100,
      insertionType: 'system',
      role: 'system',
      description: '动态插入的世界书条目'
    },
    {
      id: 'character',
      name: '角色定义',
      content: '你是{{char}}，{{user}}的宗门顾问。',
      enabled: true,
      position: 200,
      insertionType: 'system',
      role: 'system'
    },
    {
      id: 'scenario',
      name: '场景设定',
      content: '当前场景：云璃仙宗，太素历9877年。',
      enabled: false,
      position: 250,
      insertionType: 'system',
      role: 'system'
    },
    {
      id: 'example_messages',
      name: '示例对话',
      content: '',
      enabled: false,
      position: 280,
      insertionType: 'system',
      role: 'system'
    },
    {
      id: 'history',
      name: '聊天记录',
      content: '',
      enabled: true,
      position: 300,
      insertionType: 'system',
      role: 'system'
    },
    {
      id: 'user_input',
      name: '用户输入',
      content: '',
      enabled: true,
      position: 400,
      insertionType: 'user',
      role: 'user'
    }
  ],
  parameters: {
    temperature: 0.85,
    maxTokens: 2048,
    topP: 0.9,
    frequencyPenalty: 0.2,
    presencePenalty: 0.3
  },
  contextLength: 4096,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// ===== Position Maps =====
export const POSITION_MAP = {
  0: 'before_char',
  1: 'after_char',
  2: 'before_example',
  3: 'after_example',
  4: 'at_depth'
};

export const REVERSE_POSITION_MAP = {
  before_char: 0,
  after_char: 1,
  before_example: 2,
  after_example: 3,
  at_depth: 4
};

export const LOGIC_MAP = { 0: 'and', 1: 'or' };

// ===== Initialization =====
export async function initDatabase() {
  const presetCount = await db.presets.count();
  if (presetCount === 0) {
    await db.presets.add(DEFAULT_PRESET);
  }

  const settingsData = await db.settings.get('settings');
  if (!settingsData) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}

// ===== Import / Export =====
function normalizeLorebookEntries(rawEntries) {
  // SillyTavern exports entries as an object keyed by uid, not an array
  if (!rawEntries) return [];
  const entriesArray = Array.isArray(rawEntries)
    ? rawEntries
    : Object.values(rawEntries);
  return entriesArray.filter(e => e && !e.disable && !e.excluded);
}

export function importLorebook(data) {
  return {
    id: crypto.randomUUID(),
    name: data.name || '导入的世界书',
    description: data.description || '',
    entries: normalizeLorebookEntries(data.entries)
      .map(e => ({
        id: crypto.randomUUID(),
        keys: e.key || [],
        secondaryKeys: e.keysecondary || [],
        content: e.content || '',
        order: e.order ?? 100,
        position: POSITION_MAP[e.position ?? 1],
        depth: e.depth,
        selective: e.selective ?? false,
        selectiveLogic: LOGIC_MAP[e.selectiveLogic ?? 1],
        constant: e.constant ?? false,
        probability: e.useProbability ? (e.probability ?? 100) : 100,
        addMemo: e.addMemo ?? false,
        comment: e.comment || ''
      })),
    recursiveScanning: data.settings?.recursive_scanning ?? data.recursive_scanning ?? false,
    caseSensitive: data.settings?.case_sensitive ?? data.case_sensitive ?? false,
    matchWholeWords: data.settings?.match_whole_words ?? data.match_whole_words ?? false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function exportLorebook(book) {
  return {
    name: book.name,
    description: book.description,
    entries: book.entries.map((e, idx) => ({
      uid: idx,
      key: e.keys,
      keysecondary: e.secondaryKeys || [],
      comment: e.comment || e.content.slice(0, 50),
      content: e.content,
      constant: e.constant,
      selective: e.selective,
      selectiveLogic: (e.selectiveLogic === 'and' ? 0 : 1),
      addMemo: e.addMemo,
      order: e.order,
      position: REVERSE_POSITION_MAP[e.position],
      disable: false,
      probability: e.probability,
      depth: e.depth ?? 4,
      group: '',
      useProbability: e.probability < 100,
      excluded: false
    })),
    settings: {
      recursive_scanning: book.recursiveScanning,
      case_sensitive: book.caseSensitive,
      match_whole_words: book.matchWholeWords
    }
  };
}

export function exportPreset(preset) {
  return {
    name: preset.name,
    description: preset.description,
    prompt_order: preset.promptOrder.map(b => ({
      identifier: b.id,
      name: b.name,
      system_prompt: b.content,
      enabled: b.enabled,
      role: b.role === 'user' ? 1 : b.role === 'assistant' ? 2 : 0,
      position: b.position
    })),
    gen_params: {
      temperature: preset.parameters.temperature,
      max_tokens: preset.parameters.maxTokens,
      top_p: preset.parameters.topP,
      frequency_penalty: preset.parameters.frequencyPenalty,
      presence_penalty: preset.parameters.presencePenalty
    }
  };
}

function resolveRole(b) {
  if (typeof b.role === 'string' && b.role) return b.role.toLowerCase();
  if (b.role === 1) return 'user';
  if (b.role === 2) return 'assistant';
  if (b.system_prompt === true) return 'system';
  return 'system';
}

// Map SillyTavern prompt identifiers to our internal block IDs
const SILLYTAVERN_ID_MAP = {
  main: 'system',
  nsfw: 'system',
  jailbreak: 'system',
  dialogueExamples: 'example_messages',
  chatHistory: 'history',
  worldInfoBefore: 'world_info',
  worldInfoAfter: 'world_info',
  charDescription: 'character',
  enhanceDefinitions: 'character',
  charPersonality: 'character',
  scenario: 'scenario',
  personaDescription: 'system',
  userInfo: 'system',
  authorsNote: 'system',
  // Fallbacks for common variants
  world_info_before: 'world_info',
  world_info_after: 'world_info',
  char_description: 'character',
  char_personality: 'character',
  persona_description: 'system',
  user_info: 'system',
  authors_note: 'system',
  enhance_definitions: 'character',
  dialogue_examples: 'example_messages',
  chat_history: 'history'
};

function mapSillyTavernId(identifier) {
  return SILLYTAVERN_ID_MAP[identifier] || identifier;
}

function buildPromptOrder(promptsRepo, orderIndex) {
  // promptsRepo: array of prompt definitions (content repo)
  // orderIndex: ordering entries in various SillyTavern formats
  if (!Array.isArray(promptsRepo)) promptsRepo = [];

  const promptMap = new Map();
  for (const p of promptsRepo) {
    const id = p.identifier || p.id;
    if (id) promptMap.set(id, p);
  }

  // Normalize orderIndex into a flat array of {identifier, enabled}
  let flatOrder = [];

  if (Array.isArray(orderIndex)) {
    if (orderIndex.length > 0) {
      const first = orderIndex[0];
      // Wrapped character format: [{character_id, order: [{identifier, enabled}]}]
      if (first && typeof first === 'object' && Array.isArray(first.order)) {
        flatOrder = first.order;
      }
      // Flat format: [{identifier, enabled}]
      else if (first && (first.identifier !== undefined || first.id !== undefined)) {
        flatOrder = orderIndex;
      }
    }
  } else if (orderIndex && typeof orderIndex === 'object') {
    // Object keyed by API type: {openai: [{identifier, enabled}], claude: [...]}
    for (const key of Object.keys(orderIndex)) {
      const arr = orderIndex[key];
      if (Array.isArray(arr) && arr.length > 0) {
        flatOrder = arr;
        break;
      }
    }
  }

  const result = [];
  if (flatOrder.length > 0) {
    for (const entry of flatOrder) {
      const identifier = entry.identifier || entry.id;
      if (!identifier) continue;
      const prompt = promptMap.get(identifier);
      if (!prompt) continue;
      const roleStr = resolveRole(prompt);
      result.push({
        id: mapSillyTavernId(identifier),
        name: prompt.name || identifier,
        content: prompt.content || '',
        enabled: entry.enabled ?? true,
        position: prompt.injection_order ?? prompt.position ?? prompt.injectionPosition ?? 0,
        insertionType: roleStr,
        role: roleStr,
        description: prompt.description || ''
      });
    }
  } else if (promptsRepo.length > 0) {
    // No valid order index: use all prompts in their natural order
    for (const prompt of promptsRepo) {
      const identifier = prompt.identifier || prompt.id;
      if (!identifier) continue;
      const roleStr = resolveRole(prompt);
      result.push({
        id: mapSillyTavernId(identifier),
        name: prompt.name || identifier,
        content: prompt.content || '',
        enabled: prompt.enabled ?? true,
        position: prompt.injection_order ?? prompt.position ?? prompt.injectionPosition ?? 0,
        insertionType: roleStr,
        role: roleStr,
        description: prompt.description || ''
      });
    }
  }

  return result;
}

export async function importPreset(data, fileName) {
  const id = crypto.randomUUID();

  // Derive preset name: explicit field > filename without extension > default
  const derivedName = data.name || (fileName ? fileName.replace(/\.json$/i, '') : null) || '导入的预设';

  // SillyTavern native format:
  // - data.prompts = content repository (array of prompt objects with identifier, name, content, role...)
  // - data.prompt_order = sorting/enabled index (array of {identifier, enabled})
  // Tavernlike format:
  // - data.prompt_order or data.promptOrder = combined array with content
  let promptOrder = [];
  if (Array.isArray(data.prompts) || Array.isArray(data.prompt_order) || Array.isArray(data.promptOrder)) {
    const promptsRepo = data.prompts || data.prompt_order || data.promptOrder || [];
    const orderIndex = data.prompt_order || data.promptOrder || undefined;
    promptOrder = buildPromptOrder(promptsRepo, orderIndex);
  }

  // Fallback to default prompt blocks if nothing was resolved
  if (promptOrder.length === 0) {
    DEFAULT_PRESET.promptOrder.forEach(b => {
      promptOrder.push({ ...b, id: crypto.randomUUID() });
    });
  }

  // Parameters may be nested or flat
  const p = data.gen_params || data.parameters || data;
  const temperature = p.temperature ?? p.temp ?? 0.85;
  const maxTokens = p.openai_max_tokens ?? p.max_tokens ?? p.maxTokens ?? p.max_length ?? p.genamt ?? 2048;
  const topP = p.top_p ?? p.topP ?? 0.9;
  const frequencyPenalty = p.frequency_penalty ?? p.frequencyPenalty ?? p.rep_pen ?? 0.0;
  const presencePenalty = p.presence_penalty ?? p.presencePenalty ?? 0.0;

  // Context length: various common keys across formats
  const contextLength = data.openai_max_context ?? data.contextLength ?? data.context_length ?? data.truncation_length ?? 4096;

  return {
    id,
    name: derivedName,
    description: data.description || '',
    promptOrder,
    parameters: {
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty
    },
    contextLength,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// ===== JSON Helpers =====
export async function importJsonFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) { resolve(null); return; }
      try {
        const text = await file.text();
        resolve({ data: JSON.parse(text), fileName: file.name });
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export function exportToJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== Full Data Export/Import =====
export async function exportAllData() {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    data: {
      lorebooks: await db.lorebooks.toArray(),
      presets: await db.presets.toArray(),
      settings: await db.settings.get('settings'),
      chats: await db.chats.toArray()
    }
  };
  exportToJson(data, `sillytavern_backup_${new Date().toISOString().slice(0, 10)}.json`);
}

export async function importAllData(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  if (data.data) {
    if (data.data.lorebooks) {
      for (const book of data.data.lorebooks) {
        await db.lorebooks.put({ ...book, id: book.id || crypto.randomUUID() });
      }
    }
    if (data.data.presets) {
      for (const preset of data.data.presets) {
        await db.presets.put({ ...preset, id: preset.id || crypto.randomUUID() });
      }
    }
    if (data.data.settings) {
      await db.settings.put({ ...data.data.settings, key: 'settings' });
    }
    if (data.data.chats) {
      for (const chat of data.data.chats) {
        await db.chats.put({ ...chat, id: chat.id || crypto.randomUUID() });
      }
    }
  }
  return true;
}

export async function clearAllData() {
  await db.delete();
}

// ===== State Store =====
export function createStore() {
  const state = {
    lorebooks: [],
    presets: [],
    settings: { ...DEFAULT_SETTINGS },
    chats: [],
    activeModal: null,
    activeTab: 'api',
    selectedBookId: null,
    selectedPresetId: null,
    selectedChatId: null,
    isCreatingBook: false,
    editingEntryId: null,
    editingMessageId: null,
    promptPreview: null,
    toast: null
  };

  const listeners = new Set();

  const notify = () => listeners.forEach(fn => fn(state));

  const setState = (updater) => {
    if (typeof updater === 'function') {
      Object.assign(state, updater(state));
    } else {
      Object.assign(state, updater);
    }
    notify();
  };

  const showToast = (message, type = 'info') => {
    setState({ toast: { message, type, id: Date.now() } });
    setTimeout(() => setState({ toast: null }), 2500);
  };

  return {
    getState: () => state,
    setState,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async loadData() {
      await initDatabase();
      state.lorebooks = await db.lorebooks.toArray();
      state.presets = await db.presets.toArray();
      state.chats = await db.chats.toArray();
      const settingsData = await db.settings.get('settings');
      if (settingsData) {
        state.settings = { ...DEFAULT_SETTINGS, ...settingsData };
      }
      notify();
    },

    // ---- Lorebooks ----
    async saveLorebook(book) {
      book.updatedAt = Date.now();
      await db.lorebooks.put(book);
      state.lorebooks = await db.lorebooks.toArray();
      notify();
    },

    async deleteLorebook(id) {
      await db.lorebooks.delete(id);
      state.lorebooks = await db.lorebooks.toArray();
      if (state.selectedBookId === id) state.selectedBookId = null;
      const activeIds = state.settings.activeLorebookIds.filter(x => x !== id);
      state.settings.activeLorebookIds = activeIds;
      await db.settings.put(state.settings);
      notify();
    },

    // ---- Presets ----
    async savePreset(preset) {
      preset.updatedAt = Date.now();
      await db.presets.put(preset);
      state.presets = await db.presets.toArray();
      notify();
    },

    async deletePreset(id) {
      await db.presets.delete(id);
      state.presets = await db.presets.toArray();
      if (state.selectedPresetId === id) state.selectedPresetId = null;
      if (state.settings.activePresetId === id) {
        state.settings.activePresetId = null;
        await db.settings.put(state.settings);
      }
      notify();
    },

    // ---- Settings ----
    async saveSettings(settings) {
      Object.assign(state.settings, settings);
      await db.settings.put(state.settings);
      notify();
    },

    // ---- Chats ----
    async createChat(name = '新对话') {
      const chat = {
        id: crypto.randomUUID(),
        name,
        messages: [],
        variables: {},
        presetId: state.settings.activePresetId,
        lorebookIds: [...state.settings.activeLorebookIds],
        userName: state.settings.userName,
        characterName: state.settings.characterName,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await db.chats.put(chat);
      state.chats = await db.chats.toArray();
      state.settings.activeChatId = chat.id;
      await db.settings.put(state.settings);
      notify();
      return chat;
    },

    async loadChat(id) {
      state.settings.activeChatId = id;
      await db.settings.put(state.settings);
      notify();
    },

    async deleteChat(id) {
      await db.chats.delete(id);
      state.chats = await db.chats.toArray();
      if (state.settings.activeChatId === id) {
        state.settings.activeChatId = null;
        await db.settings.put(state.settings);
      }
      notify();
    },

    async renameChat(id, name) {
      const chat = await db.chats.get(id);
      if (chat) {
        chat.name = name;
        chat.updatedAt = Date.now();
        await db.chats.put(chat);
        state.chats = await db.chats.toArray();
        notify();
      }
    },

    async addMessage(chatId, message) {
      const chat = await db.chats.get(chatId);
      if (!chat) return;
      chat.messages.push({
        id: crypto.randomUUID(),
        role: message.role,
        content: message.content,
        variables: message.variables || {},
        timestamp: Date.now()
      });
      chat.updatedAt = Date.now();
      await db.chats.put(chat);
      state.chats = await db.chats.toArray();
      notify();
    },

    async editMessage(chatId, messageId, newContent) {
      const chat = await db.chats.get(chatId);
      if (!chat) return;
      const msg = chat.messages.find(m => m.id === messageId);
      if (msg) {
        msg.content = newContent;
        chat.updatedAt = Date.now();
        await db.chats.put(chat);
        state.chats = await db.chats.toArray();
        notify();
      }
    },

    async deleteMessagesAfter(chatId, messageId) {
      const chat = await db.chats.get(chatId);
      if (!chat) return;
      const idx = chat.messages.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        chat.messages = chat.messages.slice(0, idx + 1);
        chat.updatedAt = Date.now();
        await db.chats.put(chat);
        state.chats = await db.chats.toArray();
        notify();
      }
    },

    async branchChat(sourceChatId, messageId, newName) {
      const source = await db.chats.get(sourceChatId);
      if (!source) return null;
      const idx = source.messages.findIndex(m => m.id === messageId);
      const chat = {
        id: crypto.randomUUID(),
        name: newName || `${source.name} 分支`,
        messages: source.messages.slice(0, idx + 1).map(m => ({ ...m, id: crypto.randomUUID() })),
        variables: source.messages[idx]?.variables || { ...source.variables },
        presetId: source.presetId,
        lorebookIds: [...source.lorebookIds],
        userName: source.userName,
        characterName: source.characterName,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await db.chats.put(chat);
      state.chats = await db.chats.toArray();
      state.settings.activeChatId = chat.id;
      await db.settings.put(state.settings);
      notify();
      return chat;
    },

    async setChatVariables(chatId, variables) {
      const chat = await db.chats.get(chatId);
      if (chat) {
        chat.variables = { ...chat.variables, ...variables };
        chat.updatedAt = Date.now();
        await db.chats.put(chat);
        state.chats = await db.chats.toArray();
        notify();
      }
    },

    async updateMessageVariables(chatId, messageId, variables) {
      const chat = await db.chats.get(chatId);
      if (!chat) return;
      const msg = chat.messages.find(m => m.id === messageId);
      if (msg) {
        msg.variables = { ...msg.variables, ...variables };
        chat.updatedAt = Date.now();
        await db.chats.put(chat);
        state.chats = await db.chats.toArray();
        notify();
      }
    },

    // ---- Helpers ----
    getActivePreset() {
      return state.presets.find(p => p.id === state.settings.activePresetId) || null;
    },

    getActiveLorebooks() {
      return state.lorebooks.filter(b => state.settings.activeLorebookIds.includes(b.id));
    },

    getActiveChat() {
      return state.chats.find(c => c.id === state.settings.activeChatId) || null;
    },

    showToast
  };
}
