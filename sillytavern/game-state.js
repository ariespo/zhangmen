/**
 * 云璃仙宗 - Game State Variable System
 * Schema-first, reactive, per-chat persistence
 */

import { db } from './st-core.js';

// ===== Schema DSL =====
function zString(defaultValue = '') { return { t: 'string', d: defaultValue }; }
function zNumber(opts = {}) { return { t: 'number', d: opts.default ?? 0, min: opts.min, max: opts.max }; }
function zEnum(values, defaultValue) { return { t: 'enum', values, d: defaultValue ?? values[0] }; }
function zBoolean(defaultValue = false) { return { t: 'boolean', d: defaultValue }; }
function zArray(itemSchema, defaultValue = []) { return { t: 'array', item: itemSchema, d: JSON.parse(JSON.stringify(defaultValue)) }; }
function zObject(shape) { return { t: 'object', shape, d: {} }; }
function zRecord(itemSchema, defaultValue = {}) { return { t: 'record', item: itemSchema, d: JSON.parse(JSON.stringify(defaultValue)) }; }

function deepClone(v) {
  if (v == null) return v;
  if (typeof v !== 'object') return v;
  if (v.__isProxy) return toRaw(v);
  return JSON.parse(JSON.stringify(v));
}

function mergeDefaultWithSchema(existing, schema) {
  if (schema.t === 'object') {
    const o = buildDefault(schema);
    return Object.assign(o, deepClone(existing));
  }
  if (schema.t === 'record') {
    const r = {};
    for (const [k, v] of Object.entries(existing)) {
      r[k] = typeof v === 'object' && schema.item ? mergeDefaultWithSchema(v, schema.item) : deepClone(v);
    }
    return r;
  }
  if (schema.t === 'array') {
    if (!Array.isArray(existing)) return deepClone(schema.d);
    return existing.map(item => typeof item === 'object' ? mergeDefaultWithSchema(item, schema.item) : deepClone(item));
  }
  return deepClone(existing);
}

function buildDefault(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  switch (schema.t) {
    case 'string': return schema.d;
    case 'number': return schema.d;
    case 'boolean': return schema.d;
    case 'enum': return schema.d;
    case 'array': return schema.d.map(v => typeof v === 'object' ? mergeDefaultWithSchema(v, schema.item) : v);
    case 'object': {
      const o = {};
      for (const [k, s] of Object.entries(schema.shape)) o[k] = buildDefault(s);
      return o;
    }
    case 'record': {
      const r = {};
      for (const [k, v] of Object.entries(schema.d)) {
        r[k] = typeof v === 'object' ? mergeDefaultWithSchema(v, schema.item) : buildDefault(schema.item);
      }
      return r;
    }
    default: return undefined;
  }
}

function toRaw(v) {
  if (v == null) return v;
  if (typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(toRaw);
  const o = {};
  for (const key of Object.keys(v)) {
    if (key === '__isProxy') continue;
    o[key] = toRaw(v[key]);
  }
  return o;
}

// ===== Schemas =====
const EquipmentSchema = zObject({
  name: zString(),
  rank: zString('黄阶下品'),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'jade'),
  type: zEnum(['武器', '防具', '饰品', '法宝'], '武器')
});

const MemberSchema = zObject({
  id: zString(),
  name: zString(),
  daoName: zString(),
  realm: zString('炼气期'),
  role: zEnum(['掌门', '大长老', '执法首座', '丹峰长老', '藏经长老', '守山长老', '成员'], '成员'),
  status: zEnum(['坐镇', '巡查', '炼丹', '研习', '闭关', '外出', '受伤'], '坐镇'),
  talent: zString('中'),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'jade'),
  stats: zObject({
    杀伐: zNumber({ default: 50, min: 0, max: 100 }),
    防御: zNumber({ default: 50, min: 0, max: 100 }),
    身法: zNumber({ default: 50, min: 0, max: 100 })
  }),
  baseStats: zObject({
    杀伐: zNumber({ default: 50, min: 0, max: 100 }),
    防御: zNumber({ default: 50, min: 0, max: 100 }),
    身法: zNumber({ default: 50, min: 0, max: 100 })
  }),
  lifespan: zObject({
    current: zNumber({ default: 100, min: 0 }),
    max: zNumber({ default: 200, min: 1 })
  }),
  loyalty: zNumber({ default: 60, min: 0, max: 100 }),
  mood: zNumber({ default: 70, min: 0, max: 100 }),
  skills: zArray(zString(), []),
  equipment: zArray(EquipmentSchema, [])
});

const TreasuryItemSchema = zObject({
  id: zString(),
  name: zString(),
  type: zEnum(['武器', '防具', '遁具', '饰品', '丹药', '材料', '功法', '法宝', '杂物'], '杂物'),
  rank: zString('黄阶下品'),
  quantity: zNumber({ default: 1, min: 0 }),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'jade'),
  description: zString(),
  owner: zString(),
  effects: zObject({
    杀伐: zNumber({ default: 0 }),
    防御: zNumber({ default: 0 }),
    身法: zNumber({ default: 0 })
  })
});

const SkillSchema = zObject({
  id: zString(),
  name: zString(),
  type: zEnum(['道修', '神修', '魔修', '体修', '修行百艺'], '道修'),
  rank: zString('黄阶'),
  desc: zString(),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'jade')
});

const OpportunitySchema = zObject({
  id: zString(),
  title: zString(),
  desc: zString(),
  category: zEnum(['tianshi', 'dili', 'renhe'], 'tianshi'),
  cost: zNumber({ default: 1, min: 0 }),
  completed: zBoolean(false)
});

const FactionSchema = zObject({
  name: zString(),
  relation: zEnum(['盟友', '友好', '中立', '警惕', '敌对'], '中立'),
  value: zNumber({ default: 50, min: 0, max: 100 }),
  desc: zString(),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'gold'),
  leader: zString()
});

const QuestSideSchema = zObject({
  id: zString(),
  name: zString(),
  status: zEnum(['未触发', '进行中', '已完成', '已失败'], '未触发'),
  progress: zNumber({ default: 0, min: 0, max: 100 })
});

const BuildingSchema = zObject({
  name: zString(),
  level: zNumber({ default: 1, min: 0, max: 10 }),
  unlocked: zBoolean(true),
  description: zString()
});

const RegionSchema = zObject({
  name: zString(),
  unlocked: zBoolean(false),
  controlledBy: zString('未知')
});

export const GameStateSchema = zObject({
  members: zRecord(MemberSchema, {
    '沈万钧': { id: 'm1', name: '沈万钧', daoName: '万钧真人', realm: '元婴后期', role: '大长老', status: '坐镇', talent: '上上', color: 'jade', stats: { 杀伐: 88, 防御: 72, 身法: 45 }, baseStats: { 杀伐: 88, 防御: 72, 身法: 45 }, lifespan: { current: 892, max: 1500 }, loyalty: 85, mood: 75, skills: ['太虚真解（第三层）'], equipment: [] },
    '周明远': { id: 'm2', name: '周明远', daoName: '明远子', realm: '元婴初期', role: '执法首座', status: '巡查', talent: '上', color: 'purple', stats: { 杀伐: 82, 防御: 58, 身法: 62 }, baseStats: { 杀伐: 82, 防御: 58, 身法: 62 }, lifespan: { current: 710, max: 1200 }, loyalty: 78, mood: 80, skills: [], equipment: [] },
    '苏瑶': { id: 'm3', name: '苏瑶', daoName: '瑶光', realm: '金丹后期', role: '丹峰长老', status: '炼丹', talent: '上上', color: 'pink', stats: { 杀伐: 55, 防御: 48, 身法: 52 }, baseStats: { 杀伐: 55, 防御: 48, 身法: 52 }, lifespan: { current: 412, max: 800 }, loyalty: 82, mood: 72, skills: [], equipment: [] },
    '林淮安': { id: 'm4', name: '林淮安', daoName: '静虚子', realm: '金丹中期', role: '藏经长老', status: '研习', talent: '上', color: 'gold', stats: { 杀伐: 42, 防御: 50, 身法: 38 }, baseStats: { 杀伐: 42, 防御: 50, 身法: 38 }, lifespan: { current: 356, max: 700 }, loyalty: 70, mood: 68, skills: [], equipment: [] }
  }),
  finance: zObject({
    gold: zNumber({ default: 12580, min: 0 }),
    income: zNumber({ default: 8420 }),
    expense: zNumber({ default: 5680 }),
    prestige: zNumber({ default: 1800, min: 0 }),
    realmTitle: zString('一洲正道魁首')
  }),
  treasury: zObject({
    items: zArray(TreasuryItemSchema, [
      { id: 'w1', name: '霜华剑', type: '武器', rank: '上品灵器', quantity: 1, color: 'jade', description: '剑身如霜，挥剑时可凝冰气伤人', owner: '清虚子', effects: { 杀伐: 45, 防御: 5, 身法: 8 } },
      { id: 'w2', name: '碧落剑', type: '武器', rank: '上品灵器', quantity: 1, color: 'jade', description: '通体碧绿，传闻可引动天地灵气', owner: '', effects: { 杀伐: 42, 防御: 8, 身法: 10 } },
      { id: 'w3', name: '紫电鞭', type: '武器', rank: '中品灵器', quantity: 1, color: 'purple', description: '鞭身缠绕紫电，中者麻痹难动', owner: '苏瑶', effects: { 杀伐: 35, 防御: 0, 身法: 15 } },
      { id: 'w4', name: '玄铁枪', type: '武器', rank: '中品灵器', quantity: 1, color: 'gold', description: '玄铁铸成，势大力沉，一往无前', owner: '', effects: { 杀伐: 38, 防御: 12, 身法: -5 } },
      { id: 'w5', name: '青锋剑', type: '武器', rank: '下品灵器', quantity: 1, color: 'jade', description: '入门成员常用的制式飞剑', owner: '', effects: { 杀伐: 22, 防御: 2, 身法: 5 } },
      { id: 'w6', name: '噬魂刃', type: '武器', rank: '上品灵器', quantity: 1, color: 'pink', description: '魔道凶器，可伤敌神魂', owner: '周明远', effects: { 杀伐: 50, 防御: 0, 身法: 12 } },
      { id: 'a1', name: '玄龟甲', type: '防具', rank: '中品灵器', quantity: 1, color: 'jade', description: '仿上古玄龟背甲所铸，坚不可摧', owner: '清虚子', effects: { 杀伐: 0, 防御: 40, 身法: -8 } },
      { id: 'a2', name: '冰蚕衣', type: '防具', rank: '上品灵器', quantity: 1, color: 'purple', description: '万年冰蚕丝织成，水火不侵', owner: '', effects: { 杀伐: 5, 防御: 35, 身法: 10 } },
      { id: 'a3', name: '金丝软甲', type: '防具', rank: '中品灵器', quantity: 1, color: 'gold', description: '金丝编织，轻便柔韧，贴身无形', owner: '沈万钧', effects: { 杀伐: 0, 防御: 28, 身法: 5 } },
      { id: 'a4', name: '护体符', type: '防具', rank: '法器', quantity: 1, color: 'pink', description: '可激发护体灵光的防御符箓', owner: '', effects: { 杀伐: 0, 防御: 15, 身法: 0 } },
      { id: 'e1', name: '遁空梭', type: '遁具', rank: '上品灵器', quantity: 1, color: 'purple', description: '可撕裂虚空，瞬息千里', owner: '', effects: { 杀伐: 0, 防御: 5, 身法: 50 } },
      { id: 'e2', name: '踏云靴', type: '遁具', rank: '中品灵器', quantity: 1, color: 'gold', description: '穿上可踏云而行，速度大增', owner: '', effects: { 杀伐: 0, 防御: 0, 身法: 30 } },
      { id: 'e3', name: '缩地符', type: '遁具', rank: '法器', quantity: 1, color: 'jade', description: '一步可达十里之外', owner: '', effects: { 杀伐: 0, 防御: 0, 身法: 18 } },
      { id: 'ac1', name: '凝神玉佩', type: '饰品', rank: '上品灵器', quantity: 1, color: 'jade', description: '可凝神静气，抵御心魔', owner: '', effects: { 杀伐: 8, 防御: 15, 身法: 5 } },
      { id: 'ac2', name: '储物戒指', type: '饰品', rank: '中品灵器', quantity: 1, color: 'gold', description: '内含独立空间，可储万物', owner: '清虚子', effects: { 杀伐: 0, 防御: 5, 身法: 5 } },
      { id: 'ac3', name: '锁灵镯', type: '饰品', rank: '下品灵器', quantity: 1, color: 'purple', description: '可锁住周身灵气，隐匿身形', owner: '', effects: { 杀伐: 0, 防御: 10, 身法: 12 } }
    ]),
    arrayName: zString('九曜星辰阵'),
    arrayRank: zString('地阶上品'),
    arrayDesc: zString('聚灵护山，攻防一体')
  }),
  library: zArray(SkillSchema, [
    { id: 's1', name: '太虚真解', type: '道修', rank: '天阶上品', desc: '宗门根本功法，可贯通天地灵气，攻守兼备，修炼至大成可触摸天道门槛', color: 'jade' },
    { id: 's2', name: '紫霄神雷诀', type: '道修', rank: '地阶上品', desc: '雷法秘术，引天雷入体，威力惊人，修炼者需承受雷霆淬体之痛', color: 'purple' },
    { id: 's3', name: '天罡剑诀', type: '道修', rank: '地阶中品', desc: '上古剑法，凝聚天罡之力，一剑可破万法，剑修必修之术', color: 'gold' },
    { id: 's4', name: '碧波心经', type: '道修', rank: '玄阶上品', desc: '水属性功法，可凝神静气，疗伤恢复，适合水木灵根修炼', color: 'jade' },
    { id: 's5', name: '基础剑术', type: '道修', rank: '黄阶', desc: '入门剑法，简单实用，外门成员必修的基础剑道之术', color: 'jade' },
    { id: 's6', name: '神念九转', type: '神修', rank: '天阶下品', desc: '以神识为根基，九转之后神念可覆盖千里，一念杀敌于无形', color: 'purple' },
    { id: 's7', name: '炼神诀', type: '神修', rank: '地阶上品', desc: '锤炼神魂之法，可抵御心魔入侵，提升悟性', color: 'purple' },
    { id: 's8', name: '噬魂魔典', type: '魔修', rank: '天阶中品', desc: '魔道至高功法，可吞噬他人魂魄提升修为，为正道所不容', color: 'pink' },
    { id: 's9', name: '血煞大法', type: '魔修', rank: '地阶下品', desc: '以血为引，激发潜能，短时间内战力倍增，但会损伤根基', color: 'pink' },
    { id: 's10', name: '金刚不坏体', type: '体修', rank: '玄阶上品', desc: '体修功法，可大幅提升肉身防御力，刀枪不入，水火不侵', color: 'gold' },
    { id: 's11', name: '龙象般若功', type: '体修', rank: '地阶中品', desc: '搬运气血，淬炼肉身，修炼至大成可拥有龙象之力', color: 'gold' },
    { id: 's12', name: '九转还丹术', type: '修行百艺', rank: '地阶上品', desc: '高阶丹方集录，含筑基丹、金丹丹方等，丹道宗师必修', color: 'pink' },
    { id: 's13', name: '玄天阵录', type: '修行百艺', rank: '地阶', desc: '阵法宝典，囊括数十种攻防大阵的布置之法', color: 'purple' },
    { id: 's14', name: '灵药辨识经', type: '修行百艺', rank: '黄阶', desc: '记载千余种灵药特性，炼丹入门必读', color: 'pink' },
    { id: 's15', name: '基础炼器诀', type: '修行百艺', rank: '凡阶', desc: '炼器入门之法，教授如何辨识材料、掌控火候', color: 'jade' }
  ]),
  opportunities: zArray(OpportunitySchema, [
    { id: 'o1', title: '九星连珠', desc: '天地剧变，星辰移位，未来三百年内气运之子出现概率大幅度增加，正是广收门徒的最佳时机', category: 'tianshi', cost: 1, completed: false },
    { id: 'o2', title: '灵气复苏', desc: '沉寂万年的上古灵脉开始苏醒，各大宗门都在寻找新出现的灵地，机不可失', category: 'tianshi', cost: 1, completed: false },
    { id: 'o3', title: '太古遗迹现世', desc: '据探子回报，东荒深处的「葬仙谷」有上古遗迹出世，传说其中有仙人遗留的传承', category: 'dili', cost: 2, completed: false },
    { id: 'o4', title: '论剑大会', desc: '天剑宗将于三个月后召开「万剑朝宗」论剑大会，邀请天下剑修共襄盛举', category: 'dili', cost: 1, completed: false },
    { id: 'o5', title: '青阳道人讲法', desc: '太玄学府的青阳居士将于下月在云梦泽开设法会，讲授「道法自然」之理', category: 'dili', cost: 1, completed: false },
    { id: 'o6', title: '长老请愿', desc: '大长老沈万钧请求上调执法堂成员俸禄，称近年宗门收入增加，理应惠及门人', category: 'renhe', cost: 1, completed: false },
    { id: 'o7', title: '成员纷争', desc: '成员林淮安与苏瑶因一处洞府归属产生激烈矛盾，请求掌门主持公道', category: 'renhe', cost: 1, completed: false },
    { id: 'o8', title: '万象门求见', desc: '万象门特使携带厚礼求见，希望能够与我宗建立更深层次的战略合作关系', category: 'renhe', cost: 1, completed: false }
  ]),
  diplomacy: zRecord(FactionSchema, {
    '天剑宗': { name: '天剑宗', relation: '盟友', value: 82, desc: '百年盟约，互为犄角之势', color: 'jade', leader: '剑尊·凌霄子' },
    '万象门': { name: '万象门', relation: '友好', value: 65, desc: '近年来往密切，有意深化合作', color: 'purple', leader: '门主·玄机老人' },
    '血影谷': { name: '血影谷', relation: '敌对', value: 15, desc: '魔修势力，多次侵犯边境', color: 'pink', leader: '谷主·血罗' },
    '碧落宫': { name: '碧落宫', relation: '中立', value: 50, desc: '女修门派，鲜少涉及外界纷争', color: 'gold', leader: '宫主·明月仙子' },
    '太玄学府': { name: '太玄学府', relation: '友好', value: 70, desc: '学术交流频繁，成员互有往来', color: 'jade', leader: '府主·青阳居士' },
    '九幽教': { name: '九幽教', relation: '警惕', value: 30, desc: '行事诡秘，近来动向不明', color: 'pink', leader: '教主·幽冥真人' }
  }),
  quests: zObject({
    main: zObject({
      currentStage: zString('玄云密信'),
      completedStages: zArray(zString(), [])
    }),
    side: zArray(QuestSideSchema, [])
  }),
  world: zObject({
    buildings: zArray(BuildingSchema, [
      { name: '悟道殿', level: 5, unlocked: true, description: '掌门修行之所' },
      { name: '藏经阁', level: 3, unlocked: true, description: '收藏功法典籍' },
      { name: '炼丹房', level: 2, unlocked: true, description: '炼制丹药' },
      { name: '炼器峰', level: 2, unlocked: true, description: '锻造法器' }
    ]),
    regions: zArray(RegionSchema, [
      { name: '云璃峰', unlocked: true, controlledBy: '云璃仙宗' },
      { name: '苍梧山', unlocked: false, controlledBy: '苍梧山散修' },
      { name: '万剑峡', unlocked: false, controlledBy: '天剑宗' }
    ])
  })
});

export const DEFAULT_GAME_STATE = buildDefault(GameStateSchema);

// ===== Patch Application =====
export function applyPatches(root, patchArray) {
  if (!Array.isArray(patchArray)) return;
  for (const op of patchArray) {
    try { applySingleOp(root, op); } catch (e) { console.warn('[GameState] Patch op failed:', op, e); }
  }
}

function applySingleOp(root, op) {
  const segs = (op.path || '').split('/').filter(Boolean);
  if (segs.length === 0) return;
  const key = segs.pop();
  let target = root;
  for (const seg of segs) {
    if (target == null || !(seg in target)) { console.warn('[GameState] Path not found:', op.path); return; }
    target = target[seg];
  }
  if (op.op === 'replace') {
    if (Array.isArray(target)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && idx >= 0 && idx < target.length) target[idx] = op.value;
      else console.warn('[GameState] replace index out of bounds:', op.path);
    } else if (typeof target === 'object') target[key] = op.value;
  } else if (op.op === 'delta') {
    let delta = op.value;
    if (typeof delta === 'string') delta = parseFloat(delta);
    if (typeof delta !== 'number') { console.warn('[GameState] delta requires number:', op); return; }
    if (Array.isArray(target)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && idx >= 0 && idx < target.length && typeof target[idx] === 'number') target[idx] += delta;
    } else if (typeof target === 'object' && typeof target[key] === 'number') {
      target[key] += delta;
    } else { console.warn('[GameState] delta target not numeric:', op.path); }
  } else if (op.op === 'insert') {
    if (Array.isArray(target)) {
      if (key === '-') target.push(op.value);
      else {
        const idx = parseInt(key, 10);
        if (!isNaN(idx)) { idx >= 0 && idx <= target.length ? target.splice(idx, 0, op.value) : target.push(op.value); }
        else target[key] = op.value;
      }
    } else if (typeof target === 'object') target[key] = op.value;
  } else if (op.op === 'remove') {
    if (Array.isArray(target)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && idx >= 0 && idx < target.length) target.splice(idx, 1);
      else console.warn('[GameState] remove index out of bounds:', op.path);
    } else if (typeof target === 'object') delete target[key];
  }
}

// ===== Persistence =====
function mergeWithDefaults(data, schema) {
  if (schema.t === 'object') {
    const out = buildDefault(schema);
    for (const k of Object.keys(data)) {
      if (k in schema.shape) out[k] = mergeWithDefaults(data[k], schema.shape[k]);
      else out[k] = deepClone(data[k]);
    }
    return out;
  }
  if (schema.t === 'record') {
    const out = {};
    for (const k of Object.keys(data)) out[k] = typeof data[k] === 'object' ? mergeWithDefaults(data[k], schema.item) : deepClone(data[k]);
    return out;
  }
  if (schema.t === 'array') {
    if (!Array.isArray(data)) return deepClone(schema.d);
    return data.map(item => typeof item === 'object' ? mergeWithDefaults(item, schema.item) : deepClone(item));
  }
  return deepClone(data);
}

export async function loadGameState(chatId) {
  if (!chatId) return deepClone(DEFAULT_GAME_STATE);
  try {
    const chat = await db.chats.get(chatId);
    if (chat?.variables?.gameState) return mergeWithDefaults(chat.variables.gameState, GameStateSchema);
  } catch (e) { console.error('[GameState] load failed:', e); }
  return deepClone(DEFAULT_GAME_STATE);
}

export async function saveGameState(chatId, state) {
  if (!chatId) return;
  try {
    const chat = await db.chats.get(chatId);
    if (!chat) return;
    chat.variables = { ...(chat.variables || {}), gameState: toRaw(state) };
    chat.updatedAt = Date.now();
    await db.chats.put(chat);
  } catch (e) { console.error('[GameState] save failed:', e); }
}

// ===== Deep Proxy =====
function createDeepProxy(target, notify, path = '') {
  if (target == null || typeof target !== 'object') return target;
  if (target.__isProxy) return target;
  for (const key of Object.keys(target)) {
    const child = target[key];
    if (child && typeof child === 'object' && !child.__isProxy) {
      target[key] = createDeepProxy(child, notify, path ? `${path}/${key}` : key);
    }
  }
  return new Proxy(target, {
    get(t, key) {
      if (key === '__isProxy') return true;
      const val = t[key];
      if (typeof val === 'function' && Array.isArray(t)) {
        const mutators = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
        if (mutators.includes(key)) {
          return (...args) => { const res = val.apply(t, args); notify(path); return res; };
        }
      }
      if (val && typeof val === 'object' && !val.__isProxy) {
        const cp = path ? `${path}/${String(key)}` : String(key);
        t[key] = createDeepProxy(val, notify, cp);
      }
      return t[key];
    },
    set(t, key, value) {
      const old = t[key];
      if (value && typeof value === 'object' && !value.__isProxy) {
        const cp = path ? `${path}/${String(key)}` : String(key);
        value = createDeepProxy(value, notify, cp);
      }
      t[key] = value;
      if (old !== value) { notify(path ? `${path}/${String(key)}` : String(key)); }
      return true;
    },
    deleteProperty(t, key) {
      const had = key in t;
      delete t[key];
      if (had) notify(path ? `${path}/${String(key)}` : String(key));
      return true;
    }
  });
}

// ===== Manager =====
export class GameStateManager {
  constructor() {
    this._chatId = null;
    this._state = null;
    this._subs = new Map();
    this._saveTimer = null;
    this._loaded = false;
  }
  get state() {
    if (!this._state) this._state = createDeepProxy(deepClone(DEFAULT_GAME_STATE), p => this._onChange(p));
    return this._state;
  }
  _onChange(changedPath) {
    const cp = '/' + changedPath;
    for (const [subPath, cbs] of this._subs) {
      if (cp === subPath || cp.startsWith(subPath + '/') || subPath.startsWith(cp + '/')) {
        for (const cb of cbs) { try { cb(this.getByPath(subPath)); } catch (e) { console.error(e); } }
      }
    }
    if (this._chatId) {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => saveGameState(this._chatId, this._state), 300);
    }
  }
  getByPath(path) {
    const segs = path.split('/').filter(Boolean);
    let val = this._state;
    for (const seg of segs) { if (val == null) return undefined; val = val[seg]; }
    return val;
  }
  subscribe(path, callback) {
    if (!this._subs.has(path)) this._subs.set(path, new Set());
    this._subs.get(path).add(callback);
    callback(this.getByPath(path));
    return () => this._subs.get(path)?.delete(callback);
  }
  async load(chatId) {
    this._chatId = chatId;
    const data = await loadGameState(chatId);
    this._state = createDeepProxy(data, p => this._onChange(p));
    this._loaded = true;
    for (const [subPath, cbs] of this._subs) {
      const val = this.getByPath(subPath);
      for (const cb of cbs) { try { cb(val); } catch (e) { console.error(e); } }
    }
    return this._state;
  }
  applyPatch(patchArray) { applyPatches(this._state, patchArray); }
  toRaw() { return toRaw(this._state); }
}

export function createGameStateManager() { return new GameStateManager(); }
