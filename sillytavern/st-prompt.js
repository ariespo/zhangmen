/**
 * SillyTavern Web v2.0 - Prompt Assembler
 * Prompt assembly with full block support, macro replacement, context truncation
 */

import { createLorebookEngine } from './st-engine.js';
import { formatVariablesForPrompt } from './st-variables.js';

export const DEFAULT_PROMPT_BLOCKS = {
  SYSTEM_PROMPT: 'system',
  WORLD_INFO: 'world_info',
  CHARACTER_DESCRIPTION: 'character_description',
  SCENARIO: 'scenario',
  EXAMPLE_MESSAGES: 'example_messages',
  CHAT_HISTORY: 'chat_history',
  USER_INPUT: 'user_input'
};

// SillyTavern aliases that our assembler should recognize
const SILLYTAVERN_ALIASES = {
  chatHistory: 'history',
  dialogueExamples: 'example_messages',
  worldInfoBefore: 'world_info',
  worldInfoAfter: 'world_info',
  main: 'system',
  nsfw: 'system',
  jailbreak: 'system',
  charDescription: 'character',
  charPersonality: 'character',
  enhanceDefinitions: 'character',
  personaDescription: 'system',
  userInfo: 'system',
  authorsNote: 'system'
};

function getBlockType(block) {
  if (!block || !block.id) return null;
  // Direct match with internal IDs or DEFAULT_PROMPT_BLOCKS values
  if (Object.values(DEFAULT_PROMPT_BLOCKS).includes(block.id)) return block.id;
  // Check aliases
  return SILLYTAVERN_ALIASES[block.id] || block.id;
}

function estimateTokens(text) {
  if (!text) return 0;
  // Better approximation: 1 token ~= 0.6 Chinese chars or ~= 0.25 English words
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars * 0.6 + otherChars * 0.25);
}

function formatGameStateForPrompt(state) {
  if (!state) return '';
  const lines = [];
  const MAX_MEMBERS = 8;
  const MAX_ITEMS = 10;
  const MAX_BUILDINGS = 8;
  const MAX_REGIONS = 6;
  const MAX_FACTIONS = 6;
  const MAX_OPPS = 6;

  // Members
  const members = state.members || {};
  const memberEntries = Object.entries(members);
  if (memberEntries.length > 0) {
    lines.push('【成员】');
    for (const [name, m] of memberEntries.slice(0, MAX_MEMBERS)) {
      lines.push(`  ${name} · ${m.daoName || ''} · ${m.realm || ''} · ${m.role || ''} · 天赋:${m.talent || ''} · 忠诚:${m.loyalty || 0}`);
    }
    if (memberEntries.length > MAX_MEMBERS) {
      lines.push(`  ...等共 ${memberEntries.length} 人`);
    }
  }

  // Finance
  const fin = state.finance || {};
  lines.push(`【财务】灵石:${fin.gold || 0} 月收入:${fin.income || 0} 月支出:${fin.expense || 0} 威望:${fin.prestige || 0} 位阶:${fin.realmTitle || ''}`);

  // Treasury
  const treasury = state.treasury || {};
  const items = treasury.items || [];
  if (items.length > 0) {
    lines.push('【宝库】');
    for (const item of items.slice(0, MAX_ITEMS)) {
      lines.push(`  ${item.name} · ${item.type} · ${item.rank}`);
    }
    if (items.length > MAX_ITEMS) lines.push(`  ...等共 ${items.length} 件`);
    if (treasury.arrayName) lines.push(`  护山大阵:${treasury.arrayName} · ${treasury.arrayRank || ''}`);
  }

  // Diplomacy
  const diplo = state.diplomacy || {};
  const factionEntries = Object.entries(diplo);
  if (factionEntries.length > 0) {
    lines.push('【外交】');
    for (const [name, f] of factionEntries.slice(0, MAX_FACTIONS)) {
      lines.push(`  ${name} · ${f.relation || ''} · 关系值:${f.value || 0}`);
    }
    if (factionEntries.length > MAX_FACTIONS) lines.push(`  ...等共 ${factionEntries.length} 个势力`);
  }

  // Quests
  const quests = state.quests || {};
  if (quests.main?.currentStage) {
    lines.push(`【主线】${quests.main.currentStage}`);
  }
  const sideQuests = (quests.side || []).filter(q => q.status !== '已完成').slice(0, 3);
  if (sideQuests.length > 0) {
    for (const q of sideQuests) {
      lines.push(`  支线:${q.name} · ${q.status} · 进度:${q.progress || 0}%`);
    }
  }

  // World
  const world = state.world || {};
  const buildings = world.buildings || [];
  if (buildings.length > 0) {
    lines.push('【建筑】');
    for (const b of buildings.slice(0, MAX_BUILDINGS)) {
      lines.push(`  ${b.name} Lv.${b.level || 0}${b.unlocked ? '' : '[未解锁]'}`);
    }
    if (buildings.length > MAX_BUILDINGS) lines.push(`  ...等共 ${buildings.length} 座`);
  }
  const regions = world.regions || [];
  if (regions.length > 0) {
    lines.push('【疆域】');
    for (const r of regions.slice(0, MAX_REGIONS)) {
      lines.push(`  ${r.name} · ${r.unlocked ? '已探索' : '未探索'}`);
    }
    if (regions.length > MAX_REGIONS) lines.push(`  ...等共 ${regions.length} 处`);
  }

  // Opportunities
  const opps = state.opportunities || [];
  const pendingOpps = opps.filter(o => !o.completed).slice(0, MAX_OPPS);
  if (pendingOpps.length > 0) {
    lines.push('【机遇】');
    for (const o of pendingOpps) {
      const catMap = { tianshi: '天时', dili: '地利', renhe: '人和' };
      lines.push(`  [${catMap[o.category] || o.category}] ${o.title}`);
    }
  }

  // Library
  const library = state.library || [];
  if (library.length > 0) {
    lines.push(`【藏经阁】${library.length} 部功法`);
  }

  return lines.join('\n');
}

export function assemblePrompt(options) {
  const { userInput, history, preset, lorebooks, userName, characterName, variables, scenario, exampleMessages, gameState } = options;

  const effectivePreset = preset || DEFAULT_PRESET;
  const maxContextTokens = effectivePreset.contextLength || 4096;
  const maxResponseTokens = effectivePreset.parameters?.maxTokens || 2048;
  const availableContextTokens = Math.floor(maxContextTokens - maxResponseTokens);

  // === Lorebook matching ===
  const allMatchedEntries = [];
  const scanText = userInput + ' ' + history.slice(-3).map(m => m.content).join(' ');

  for (const book of (lorebooks || [])) {
    const engine = createLorebookEngine(book);
    const matches = engine.recursiveScan(scanText, 3);
    allMatchedEntries.push(...matches);
  }

  const uniqueEntries = Array.from(
    new Map(allMatchedEntries.map(e => [e.entry.id, e])).values()
  ).sort((a, b) => a.score - b.score);

  // === History truncation ===
  let currentTokens = 0;
  const recentHistory = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'system') continue;
    const msgTokens = estimateTokens(msg.content);
    if (currentTokens + msgTokens > availableContextTokens * 0.85) break;
    recentHistory.unshift({ role: msg.role, content: msg.content });
    currentTokens += msgTokens;
  }

  // === Prompt blocks sorting ===
  const sortedBlocks = (effectivePreset.promptOrder || [])
    .filter(b => b.enabled)
    .sort((a, b) => a.position - b.position);

  const assembledMessages = [];
  let systemAccumulator = '';
  let systemTokenCount = 0;
  let worldInfoInserted = false;
  let charDescInserted = false;
  let scenarioInserted = false;
  let exampleInserted = false;

  const addToSystem = (content) => {
    systemAccumulator += (systemAccumulator ? '\n\n' : '') + content;
    systemTokenCount = estimateTokens(systemAccumulator);
  };

  const flushSystem = () => {
    if (systemAccumulator.trim()) {
      assembledMessages.push({ role: 'system', content: systemAccumulator.trim() });
      systemAccumulator = '';
      systemTokenCount = 0;
    }
  };

  for (const block of sortedBlocks) {
    const blockType = getBlockType(block);

    // Handle special blocks
    if (blockType === 'history' || blockType === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY) {
      flushSystem();
      assembledMessages.push(...recentHistory);
      continue;
    }

    if (blockType === 'user_input' || blockType === DEFAULT_PROMPT_BLOCKS.USER_INPUT) {
      flushSystem();
      assembledMessages.push({ role: 'user', content: userInput });
      continue;
    }

    let content = block.content || '';
    content = replaceMacros(content, { userName, characterName, userInput, variables });

    // World info injection
    if (blockType === 'world_info' || blockType === DEFAULT_PROMPT_BLOCKS.WORLD_INFO) {
      worldInfoInserted = true;
      const worldInfoContent = uniqueEntries.map(e => e.entry.content).join('\n\n');
      if (worldInfoContent) {
        content = worldInfoContent;
      } else {
        continue;
      }
    }

    // Character description
    if (blockType === 'character' || blockType === DEFAULT_PROMPT_BLOCKS.CHARACTER_DESCRIPTION) {
      charDescInserted = true;
    }

    // Scenario
    if (blockType === 'scenario' || blockType === DEFAULT_PROMPT_BLOCKS.SCENARIO) {
      scenarioInserted = true;
      if (scenario) {
        content = scenario;
      } else if (!content.trim()) {
        continue;
      }
    }

    // Example messages
    if (blockType === 'example_messages' || blockType === DEFAULT_PROMPT_BLOCKS.EXAMPLE_MESSAGES) {
      exampleInserted = true;
      if (exampleMessages && exampleMessages.length > 0) {
        flushSystem();
        for (const ex of exampleMessages) {
          assembledMessages.push({
            role: ex.role || 'system',
            content: replaceMacros(ex.content, { userName, characterName, userInput, variables })
          });
        }
        continue;
      } else if (!content.trim()) {
        continue;
      }
    }

    if (!content.trim()) continue;

    const role = block.role || block.insertionType || 'system';
    if (role === 'system') {
      addToSystem(content);
    } else {
      flushSystem();
      assembledMessages.push({ role, content });
    }
  }

  // Add variables to system context
  const variablesBlock = formatVariablesForPrompt(variables || {});
  if (variablesBlock) {
    addToSystem(variablesBlock);
  }

  // Add game state to system context
  const gameStateBlock = formatGameStateForPrompt(gameState);
  if (gameStateBlock) {
    addToSystem('[当前宗门状态]\n' + gameStateBlock);
  }

  flushSystem();

  // Safety: ensure history exists if not explicitly placed
  const hasHistoryBlock = sortedBlocks.some(b => {
    const type = getBlockType(b);
    return type === 'history' || type === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY;
  });
  if (!hasHistoryBlock && recentHistory.length > 0) {
    const userIdx = assembledMessages.findIndex(m => m.role === 'user');
    if (userIdx === -1) {
      assembledMessages.push(...recentHistory);
    } else {
      assembledMessages.splice(userIdx, 0, ...recentHistory);
    }
  }

  // Safety: ensure user input exists if not explicitly placed
  const hasUserInputBlock = sortedBlocks.some(b => {
    const type = getBlockType(b);
    return type === 'user_input' || type === DEFAULT_PROMPT_BLOCKS.USER_INPUT;
  });
  if (!hasUserInputBlock) {
    const lastAssistant = assembledMessages.length - 1 - assembledMessages.slice().reverse().findIndex(m => m.role === 'assistant');
    if (lastAssistant >= 0 && lastAssistant < assembledMessages.length) {
      assembledMessages.splice(lastAssistant + 1, 0, { role: 'user', content: userInput });
    } else {
      assembledMessages.push({ role: 'user', content: userInput });
    }
  }

  const systemPrompt = assembledMessages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n');

  const totalTokens = assembledMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  return {
    messages: assembledMessages,
    matchedEntries: uniqueEntries,
    systemPrompt,
    tokenEstimate: {
      total: totalTokens,
      maxContext: maxContextTokens,
      available: availableContextTokens,
      history: recentHistory.length,
      lorebookEntries: uniqueEntries.length
    }
  };
}

export function previewPrompt(options) {
  const result = assemblePrompt(options);
  const lines = [];
  lines.push(`=== 系统提示 (${result.messages.filter(m => m.role === 'system').length} 条) ===`);
  result.messages.filter(m => m.role === 'system').forEach((m, i) => {
    lines.push(`[${i + 1}] ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`);
  });
  lines.push('');
  lines.push(`=== 对话历史 (${result.messages.filter(m => m.role !== 'system').length} 条) ===`);
  result.messages.filter(m => m.role !== 'system').forEach((m, i) => {
    lines.push(`[${m.role}] ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`);
  });
  lines.push('');
  lines.push(`=== 匹配世界书条目 (${result.matchedEntries.length}) ===`);
  result.matchedEntries.forEach((e, i) => {
    lines.push(`#${i + 1} [${e.entry.order}] 关键词: ${e.matchedKeywords.join(', ')}`);
  });
  lines.push('');
  lines.push(`=== Token 估算 ===`);
  lines.push(`总计: ~${result.tokenEstimate.total} / ${result.tokenEstimate.maxContext} (可用: ${result.tokenEstimate.available})`);
  lines.push(`历史: ${result.tokenEstimate.history} 条 | 世界书: ${result.tokenEstimate.lorebookEntries} 条`);

  return {
    text: lines.join('\n'),
    ...result
  };
}

export function replaceMacros(template, context) {
  if (!template) return '';
  let result = template
    .replace(/\{\{user\}\}/g, context.userName || '用户')
    .replace(/\{\{char\}\}/g, context.characterName || 'AI')
    .replace(/\{\{original\}\}/g, context.userInput || '');

  if (context.variables) {
    result = result.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      const value = context.variables?.[key.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  return result;
}

export const SUPPORTED_MACROS = [
  { name: '{{user}}', description: '用户名' },
  { name: '{{char}}', description: 'AI角色名' },
  { name: '{{original}}', description: '用户原始输入' },
  { name: '{{变量名}}', description: '自定义变量（例如 {{hp}}）' }
];

const DEFAULT_PRESET = {
  promptOrder: [
    { id: 'system', name: '系统提示', content: '', enabled: true, position: 0, insertionType: 'system', role: 'system' },
    { id: 'world_info', name: '世界书', content: '', enabled: true, position: 100, insertionType: 'system', role: 'system' },
    { id: 'character', name: '角色定义', content: '', enabled: true, position: 200, insertionType: 'system', role: 'system' },
    { id: 'history', name: '聊天记录', content: '', enabled: true, position: 300, insertionType: 'system', role: 'system' },
    { id: 'user_input', name: '用户输入', content: '', enabled: true, position: 400, insertionType: 'user', role: 'user' }
  ],
  parameters: { temperature: 0.85, maxTokens: 2048 },
  contextLength: 4096
};
