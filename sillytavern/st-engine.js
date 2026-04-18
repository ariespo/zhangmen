/**
 * SillyTavern Web Enhancer - Lorebook Engine
 * 关键词匹配引擎（从 tavernlike 适配）
 */

export class LorebookEngine {
  constructor(lorebook) {
    this.lorebook = lorebook;
  }

  scan(text, additionalContext) {
    const normalizedText = this.lorebook.caseSensitive ? text : text.toLowerCase();
    const normalizedContext = additionalContext
      ? this.lorebook.caseSensitive ? additionalContext : additionalContext.toLowerCase()
      : normalizedText;

    const matched = [];

    for (const entry of this.lorebook.entries) {
      if (entry.enabled === false) continue;

      if (entry.constant) {
        matched.push({ entry, score: -9999, matchedKeywords: ['constant'] });
        continue;
      }

      if (Math.random() * 100 >= entry.probability) {
        continue;
      }

      const isMatch = this.checkEntryMatch(entry, normalizedText, normalizedContext);

      if (isMatch) {
        matched.push({
          entry,
          score: entry.order,
          matchedKeywords: entry.keys.filter(k =>
            this.containsKeyword(normalizedText, this.normalizeKeyword(k))
          ),
        });
      }
    }

    return matched.sort((a, b) => a.score - b.score);
  }

  recursiveScan(initialText, maxDepth = 3, additionalContext) {
    if (!this.lorebook.recursiveScanning || maxDepth <= 0) {
      return this.scan(initialText, additionalContext);
    }

    const allMatched = new Map();
    let currentText = initialText;
    let depth = 0;

    while (depth < maxDepth) {
      const newMatches = this.scan(currentText, additionalContext);
      let hasNewMatches = false;

      for (const match of newMatches) {
        if (!allMatched.has(match.entry.id)) {
          allMatched.set(match.entry.id, match);
          currentText += ' ' + match.entry.content;
          hasNewMatches = true;
        }
      }

      if (!hasNewMatches) break;
      depth++;
    }

    return Array.from(allMatched.values()).sort((a, b) => a.score - b.score);
  }

  groupByPosition(matched) {
    const grouped = {
      before_char: [], after_char: [], before_example: [], after_example: [],
      at_depth: [], example_msg_top: [], example_msg_bottom: [], outlet: []
    };

    for (const m of matched) {
      const pos = m.entry.position;
      if (grouped[pos]) grouped[pos].push(m);
      else grouped.after_char.push(m); // fallback
    }

    return grouped;
  }

  formatEntriesContent(entries) {
    if (entries.length === 0) return '';
    return entries.map(e => e.entry.content).join('\n\n');
  }

  checkEntryMatch(entry, text, context) {
    const { keys, secondaryKeys, selective, selectiveLogic } = entry;

    if (keys.length === 0) return false;

    const primaryMatches = keys.map(k => this.containsKeyword(text, this.normalizeKeyword(k)));
    const hasPrimaryMatch = (selectiveLogic === 'and' || selectiveLogic === 'and_any' || selectiveLogic === 'and_all')
      ? primaryMatches.every(m => m)
      : primaryMatches.some(m => m);

    if (!hasPrimaryMatch) return false;

    if (!selective || !secondaryKeys || secondaryKeys.length === 0) {
      return hasPrimaryMatch;
    }

    const secondaryMatches = secondaryKeys.map(k =>
      this.containsKeyword(context, this.normalizeKeyword(k))
    );

    return secondaryMatches.some(m => m);
  }

  normalizeKeyword(keyword) {
    return this.lorebook.caseSensitive ? keyword : keyword.toLowerCase();
  }

  containsKeyword(text, keyword) {
    if (this.lorebook.matchWholeWords) {
      const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
      return regex.test(text);
    }
    return text.includes(keyword);
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export function createLorebookEngine(lorebook) {
  return new LorebookEngine(lorebook);
}
