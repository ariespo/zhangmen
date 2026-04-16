/**
 * SillyTavern Web Enhancer - Prompt Assembler
 * 提示词组装器（从 tavernlike 适配）
 */

import { createLorebookEngine } from './st-engine.js';
import { formatVariablesForPrompt, USER_ROLE } from './st-variables.js';

export const DEFAULT_PROMPT_BLOCKS = {
  SYSTEM_PROMPT: 'system_prompt',
  WORLD_INFO: 'world_info',
  CHARACTER_DESCRIPTION: 'character_description',
  SCENARIO: 'scenario',
  EXAMPLE_MESSAGES: 'example_messages',
  CHAT_HISTORY: 'chat_history',
  USER_INPUT: 'user_input',
};

export function assemblePrompt(options) {
  const { userInput, history, preset, lorebooks, userName, characterName, variables } = options;

  const allMatchedEntries = [];
  const scanText = userInput + ' ' + history.slice(-3).map(m => m.content).join(' ');

  for (const book of lorebooks) {
    const engine = createLorebookEngine(book);
    const matches = engine.recursiveScan(scanText, 3);
    allMatchedEntries.push(...matches);
  }

  const uniqueEntries = Array.from(
    new Map(allMatchedEntries.map(e => [e.entry.id, e])).values()
  ).sort((a, b) => a.score - b.score);

  const maxContextTokens = preset.contextLength || 4096;
  let currentTokens = 0;

  const recentHistory = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'system') continue;
    const msgTokens = msg.content.length / 4;
    if (currentTokens + msgTokens > maxContextTokens * 0.8) break;
    recentHistory.unshift({ role: msg.role, content: msg.content });
    currentTokens += msgTokens;
  }

  const sortedBlocks = preset.promptOrder
    .filter(b => b.enabled)
    .sort((a, b) => a.position - b.position);

  const assembledMessages = [];
  let systemAccumulator = '';

  for (const block of sortedBlocks) {
    if (block.id === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY) {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push(...recentHistory);
      continue;
    }

    if (block.id === DEFAULT_PROMPT_BLOCKS.USER_INPUT) {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push({ role: 'user', content: userInput });
      continue;
    }

    let content = block.content;
    content = replaceMacros(content, { userName, characterName, userInput, variables });

    if (block.id === DEFAULT_PROMPT_BLOCKS.WORLD_INFO) {
      const worldInfoContent = uniqueEntries.map(e => e.entry.content).join('\n\n');
      if (worldInfoContent) {
        content = worldInfoContent;
      } else {
        continue;
      }
    }

    if (!content.trim()) continue;

    const role = block.role || block.insertionType || 'system';
    if (role === 'system') {
      systemAccumulator += (systemAccumulator ? '\n\n' : '') + content;
    } else {
      if (systemAccumulator) {
        assembledMessages.push({ role: 'system', content: systemAccumulator });
        systemAccumulator = '';
      }
      assembledMessages.push({ role, content });
    }
  }

  const variablesBlock = formatVariablesForPrompt(variables || {});
  if (variablesBlock) {
    systemAccumulator += (systemAccumulator ? '\n\n' : '') + variablesBlock;
  }

  if (systemAccumulator) {
    assembledMessages.unshift({ role: 'system', content: systemAccumulator });
  }

  if (!sortedBlocks.some(b => b.id === DEFAULT_PROMPT_BLOCKS.CHAT_HISTORY)) {
    const userIdx = assembledMessages.findIndex(m => m.role === USER_ROLE);
    if (userIdx === -1) {
      assembledMessages.push(...recentHistory);
    } else {
      assembledMessages.splice(userIdx, 0, ...recentHistory);
    }
  }

  if (!sortedBlocks.some(b => b.id === DEFAULT_PROMPT_BLOCKS.USER_INPUT)) {
    assembledMessages.push({ role: 'user', content: userInput });
  }

  const systemPrompt = assembledMessages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n');

  return {
    messages: assembledMessages,
    matchedEntries: uniqueEntries,
    systemPrompt,
  };
}

export function replaceMacros(template, context) {
  let result = template
    .replace(/\{\{user\}\}/g, context.userName)
    .replace(/\{\{char\}\}/g, context.characterName)
    .replace(/\{\{original\}\}/g, context.userInput);

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
  { name: '{{变量名}}', description: '自定义变量（例如 {{hp}}）' },
];
