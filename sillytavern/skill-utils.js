(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.deduplicateSkills = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  const RANK_TIER_ORDER = { '天': 5, '地': 4, '玄': 3, '黄': 2, '凡': 1 };
  const RANK_GRADE_ORDER = { '上品': 3, '中品': 2, '下品': 1 };

  function rankScore(rank) {
    const tier = rank?.charAt(0) || '';
    const gradeMatch = typeof rank === 'string' ? rank.match(/(上品|中品|下品)$/) : null;
    const grade = gradeMatch ? gradeMatch[1] : '下品';
    return (RANK_TIER_ORDER[tier] || 0) * 10 + (RANK_GRADE_ORDER[grade] || 0);
  }

  function effectScore(effects) {
    if (!effects) return 0;
    return (effects.杀伐 || 0) + (effects.防御 || 0) + (effects.身法 || 0);
  }

  function effectsEqual(a, b) {
    if (!a || !b) return !a && !b;
    return (a.杀伐 || 0) === (b.杀伐 || 0) &&
           (a.防御 || 0) === (b.防御 || 0) &&
           (a.身法 || 0) === (b.身法 || 0);
  }

  function skillsEqual(a, b) {
    return a.rank === b.rank && effectsEqual(a.effects, b.effects) && a.desc === b.desc;
  }

  function compareSkills(a, b) {
    const rankDiff = rankScore(b.rank) - rankScore(a.rank);
    if (rankDiff !== 0) return rankDiff;
    return effectScore(b.effects) - effectScore(a.effects);
  }

  function deduplicateSkills(skills) {
    if (!Array.isArray(skills)) return [];

    const groups = new Map();
    for (const s of skills) {
      if (!s || !s.name) continue;
      if (!groups.has(s.name)) groups.set(s.name, []);
      groups.get(s.name).push(s);
    }

    const result = [];
    for (const group of groups.values()) {
      const unique = [];
      for (const s of group) {
        const exists = unique.some(u => skillsEqual(u, s));
        if (!exists) unique.push(s);
      }

      if (unique.length === 1) {
        result.push(unique[0]);
        continue;
      }

      unique.sort(compareSkills);
      const highest = unique[0];
      result.push({ ...highest, name: highest.name + '高阶' });
      for (let i = 1; i < unique.length; i++) {
        result.push(unique[i]);
      }
    }

    return result;
  }

  return deduplicateSkills;
}));
