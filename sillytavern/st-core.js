/**
 * SillyTavern Web Enhancer - 核心模块
 * 数据库、导入导出、状态管理
 */

import Dexie from 'https://unpkg.com/dexie@4.0.1/dist/dexie.mjs';

// ===== 数据库 =====
const DB_NAME = 'SillyTavernWebDB_Zhangmen';

class AppDatabase extends Dexie {
  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      lorebooks: '++id, name, updatedAt',
      presets: '++id, name, updatedAt',
      settings: 'key',
      chats: '++id, name, updatedAt'
    });
  }
}

export const db = new AppDatabase();

// ===== 默认数据 =====
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
      id: 'history',
      name: '聊天记录',
      content: '',
      enabled: true,
      position: 300,
      insertionType: 'system',
      role: 'system'
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

// ===== 初始化 =====
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

// ===== 世界书导入 =====
export function importLorebook(data) {
  const positionMap = {
    0: 'before_char',
    1: 'after_char',
    2: 'before_example',
    3: 'after_example',
    4: 'at_depth'
  };
  const logicMap = { 0: 'and', 1: 'or' };

  return {
    id: crypto.randomUUID(),
    name: data.name || '导入的世界书',
    description: data.description || '',
    entries: (data.entries || [])
      .filter(e => !e.disable && !e.excluded)
      .map(e => ({
        id: crypto.randomUUID(),
        keys: e.key || [],
        content: e.content || '',
        order: e.order ?? 100,
        position: positionMap[e.position ?? 1],
        depth: e.depth,
        selective: e.selective ?? false,
        selectiveLogic: logicMap[e.selectiveLogic ?? 1],
        constant: e.constant ?? false,
        probability: e.useProbability ? (e.probability ?? 100) : 100,
        addMemo: e.addMemo ?? false,
        comment: e.comment || ''
      })),
    recursiveScanning: data.settings?.recursive_scanning ?? false,
    caseSensitive: data.settings?.case_sensitive ?? false,
    matchWholeWords: data.settings?.match_whole_words ?? false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// ===== 世界书导出 =====
export function exportLorebook(book) {
  const reversePositionMap = {
    before_char: 0,
    after_char: 1,
    before_example: 2,
    after_example: 3,
    at_depth: 4
  };
  const reverseLogicMap = { and: 0, or: 1 };

  return {
    name: book.name,
    description: book.description,
    entries: book.entries.map((e, idx) => ({
      uid: idx,
      key: e.keys,
      keysecondary: [],
      comment: e.comment || e.content.slice(0, 50),
      content: e.content,
      constant: e.constant,
      selective: e.selective,
      selectiveLogic: reverseLogicMap[e.selectiveLogic],
      addMemo: e.addMemo,
      order: e.order,
      position: reversePositionMap[e.position],
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

// ===== 预设导出 =====
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

// ===== 全数据导出 =====
export async function exportAllData() {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      lorebooks: await db.lorebooks.toArray(),
      presets: await db.presets.toArray(),
      settings: await db.settings.get('settings')
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sillytavern_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== 全数据导入 =====
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
  }

  return true;
}

// ===== 清理数据 =====
export async function clearAllData() {
  await db.delete();
}

// ===== 状态管理（简单版）=====
export function createStore() {
  const state = {
    lorebooks: [],
    presets: [],
    settings: DEFAULT_SETTINGS,
    activeModal: null,
    selectedBookId: null,
    selectedPresetId: null,
    activeTab: 'api',
    isCreatingBook: false
  };

  const listeners = new Set();

  return {
    getState: () => state,

    setState: (updater) => {
      if (typeof updater === 'function') {
        Object.assign(state, updater(state));
      } else {
        Object.assign(state, updater);
      }
      listeners.forEach(fn => fn(state));
    },

    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async loadData() {
      state.lorebooks = await db.lorebooks.toArray();
      state.presets = await db.presets.toArray();
      const settingsData = await db.settings.get('settings');
      if (settingsData) {
        state.settings = { ...DEFAULT_SETTINGS, ...settingsData };
      }
      listeners.forEach(fn => fn(state));
    }
  };
}
