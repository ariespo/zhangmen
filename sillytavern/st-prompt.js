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

function estimateTokens(text) {
  if (!text) return 0;
  // Better approximation: 1 token ~= 0.6 Chinese chars or ~= 0.25 English words
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars * 0.6 + otherChars * 0.25);
}

export function assemblePrompt(options) {
  const { userInput, history, preset, lorebooks, userName, characterName, variables, scenario, exampleMessages } = options;

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
    // Handle special blocks
    if (block.id === 'history' || block.id === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY) {
      flushSystem();
      assembledMessages.push(...recentHistory);
      continue;
    }

    if (block.id === 'user_input' || block.id === DEFAULT_PROMPT_BLOCKS.USER_INPUT) {
      flushSystem();
      assembledMessages.push({ role: 'user', content: userInput });
      continue;
    }

    let content = block.content || '';
    content = replaceMacros(content, { userName, characterName, userInput, variables });

    // World info injection
    if (block.id === 'world_info' || block.id === DEFAULT_PROMPT_BLOCKS.WORLD_INFO) {
      worldInfoInserted = true;
      const worldInfoContent = uniqueEntries.map(e => e.entry.content).join('\n\n');
      if (worldInfoContent) {
        content = worldInfoContent;
      } else {
        continue;
      }
    }

    // Character description
    if (block.id === 'character' || block.id === DEFAULT_PROMPT_BLOCKS.CHARACTER_DESCRIPTION) {
      charDescInserted = true;
    }

    // Scenario
    if (block.id === 'scenario' || block.id === DEFAULT_PROMPT_BLOCKS.SCENARIO) {
      scenarioInserted = true;
      if (scenario) {
        content = scenario;
      } else if (!content.trim()) {
        continue;
      }
    }

    // Example messages
    if (block.id === 'example_messages' || block.id === DEFAULT_PROMPT_BLOCKS.EXAMPLE_MESSAGES) {
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

  flushSystem();

  // Safety: ensure history exists if not explicitly placed
  const hasHistoryBlock = sortedBlocks.some(b =>
    b.id === 'history' || b.id === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY
  );
  if (!hasHistoryBlock && recentHistory.length > 0) {
    const userIdx = assembledMessages.findIndex(m => m.role === 'user');
    if (userIdx === -1) {
      assembledMessages.push(...recentHistory);
    } else {
      assembledMessages.splice(userIdx, 0, ...recentHistory);
    }
  }

  // Safety: ensure user input exists if not explicitly placed
  const hasUserInputBlock = sortedBlocks.some(b =>
    b.id === 'user_input' || b.id === DEFAULT_PROMPT_BLOCKS.USER_INPUT
  );
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
