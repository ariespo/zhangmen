// Tests for skill deduplication logic used in the 藏经 (library) page.
const deduplicateSkills = require('../sillytavern/skill-utils.js');

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error('FAIL:', message);
    console.error('  expected:', JSON.stringify(expected));
    console.error('  actual:  ', JSON.stringify(actual));
    process.exitCode = 1;
  } else {
    console.log('PASS:', message);
  }
}

function skill(name, rank, effects, desc) {
  return { id: Math.random().toString(36).slice(2), name, type: '道修', rank, desc, color: 'jade', effects, realmReq: '', maxProgress: 100 };
}

// 1. Empty input returns empty array
assertEqual(deduplicateSkills([]), [], 'empty array stays empty');

// 2. Single skill is returned unchanged
const single = [skill('太虚剑诀', '黄阶下品', { 杀伐: 10, 防御: 0, 身法: 0 }, '剑道入门')];
assertEqual(deduplicateSkills(single).length, 1, 'single skill kept');
assertEqual(deduplicateSkills(single)[0].name, '太虚剑诀', 'single skill name unchanged');

// 3. Two identical same-name skills are merged into one
const identical = [
  skill('青莲剑典', '玄阶上品', { 杀伐: 20, 防御: 10, 身法: 5 }, '青莲剑意'),
  skill('青莲剑典', '玄阶上品', { 杀伐: 20, 防御: 10, 身法: 5 }, '青莲剑意')
];
assertEqual(deduplicateSkills(identical).length, 1, 'identical duplicates merged');
assertEqual(deduplicateSkills(identical)[0].name, '青莲剑典', 'merged skill keeps base name');

// 4. Different same-name skills: higher rank/effects gets 高阶 suffix
const different = [
  skill('青莲剑典', '玄阶上品', { 杀伐: 20, 防御: 10, 身法: 5 }, '青莲剑意'),
  skill('青莲剑典', '地阶下品', { 杀伐: 40, 防御: 20, 身法: 10 }, '青莲剑意·进阶')
];
const diffResult = deduplicateSkills(different);
assertEqual(diffResult.length, 2, 'different duplicates both kept');
const advanced = diffResult.find(s => s.rank === '地阶下品');
const basic = diffResult.find(s => s.rank === '玄阶上品');
assertEqual(advanced.name, '青莲剑典高阶', 'higher skill gets 高阶 suffix');
assertEqual(basic.name, '青莲剑典', 'lower skill keeps base name');

// 5. Three same-name skills: two identical merged, one higher gets suffix
const triple = [
  skill('金刚诀', '黄阶下品', { 杀伐: 0, 防御: 10, 身法: 0 }, '炼体功法'),
  skill('金刚诀', '黄阶下品', { 杀伐: 0, 防御: 10, 身法: 0 }, '炼体功法'),
  skill('金刚诀', '玄阶下品', { 杀伐: 0, 防御: 25, 身法: 0 }, '炼体功法·强化')
];
const tripleResult = deduplicateSkills(triple);
assertEqual(tripleResult.length, 2, 'two identical merged, one higher kept');
assertEqual(tripleResult.some(s => s.name === '金刚诀'), true, 'base skill present');
assertEqual(tripleResult.some(s => s.name === '金刚诀高阶'), true, 'advanced skill present');

// 6. Different names are not affected
const mixed = [
  skill('太虚剑诀', '黄阶下品', { 杀伐: 10, 防御: 0, 身法: 0 }, '剑道入门'),
  skill('金刚诀', '黄阶下品', { 杀伐: 0, 防御: 10, 身法: 0 }, '炼体功法')
];
const mixedResult = deduplicateSkills(mixed);
assertEqual(mixedResult.length, 2, 'different names kept separate');
assertEqual(mixedResult.map(s => s.name).sort(), ['太虚剑诀', '金刚诀'], 'names unchanged');

if (!process.exitCode) {
  console.log('\nAll tests passed.');
}
