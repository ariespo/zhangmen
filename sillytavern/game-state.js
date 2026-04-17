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
  type: zEnum(['武器', '防具', '丹药', '材料', '功法', '法宝', '杂物'], '杂物'),
  rank: zString('黄阶下品'),
  quantity: zNumber({ default: 1, min: 0 }),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'jade'),
  description: zString()
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
    items: zArray(TreasuryItemSchema, []),
    arrayName: zString('九曜星辰阵'),
    arrayRank: zString('地阶上品'),
    arrayDesc: zString('聚灵护山，攻防一体')
  }),
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
