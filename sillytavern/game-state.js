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
  role: zEnum(['掌门', '大长老', '执法首座', '丹峰长老', '藏经长老', '守山长老', '内门弟子', '外门弟子', '成员'], '成员'),
  status: zEnum(['坐镇', '巡查', '炼丹', '研习', '闭关', '外出', '受伤'], '坐镇'),
  talent: zString('乙中'),
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
  personality: zArray(zString(), []),
  appearance: zArray(zString(), []),
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
  leader: zString(),
  highestMember: zObject({
    name: zString(''),
    role: zString(''),
    realm: zString('')
  }, { default: { name: '', role: '', realm: '' } }),
  discipleCount: zNumber({ default: 0, min: 0 }),
  controlledRegions: zArray(zString(), [])
});

const PlayerSchema = zObject({
  name: zString(),
  daoName: zString(),
  realm: zString(),
  gender: zString(),
  age: zNumber({ default: 0, min: 0 }),
  lifespan: zObject({
    current: zNumber({ default: 100, min: 0 }),
    max: zNumber({ default: 200, min: 1 })
  }),
  talent: zString(),
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
  skills: zArray(zString(), []),
  personality: zArray(zString(), []),
  appearance: zArray(zString(), []),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'gold')
});

const SectSchema = zObject({
  name: zString(),
  foundedYear: zString(),
  location: zString(),
  founder: zString(),
  history: zString(),
  lineage: zArray(zString(), []),
  description: zString(),
  motto: zString(),
  arrayName: zString(),
  arrayRank: zString(),
  arrayDesc: zString(),
  organization: zArray(zObject({
    rank: zNumber({ default: 0, min: 0 }),
    name: zString(''),
    members: zArray(zString(), [])
  }), [
    { rank: 0, name: '掌门', members: [] },
    { rank: 1, name: '副掌门', members: [] },
    { rank: 2, name: '长老', members: [] },
    { rank: 3, name: '真传弟子', members: [] },
    { rank: 4, name: '内门弟子', members: [] },
    { rank: 5, name: '外门弟子', members: [] },
    { rank: 6, name: '杂役', members: [] }
  ])
});

const EventSchema = zObject({
  id: zString(),
  text: zString(),
  time: zString(),
  location: zString(),
  people: zString(),
  type: zEnum(['urgent', 'normal', 'info', 'success'], 'normal')
});

const StoryRoundSchema = zObject({
  round: zNumber({ default: 0 }),
  maintext: zString(),
  options: zArray(zString(), []),
  vars: zRecord(zString(), {}),
  timestamp: zNumber({ default: 0 }),
  snapshot: zObject({})
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
  controlledBy: zString('未知'),
  explorationStage: zNumber({ default: 0, min: 0, max: 3 }),
  monthlyResources: zObject({
    gold: zNumber({ default: 0 }),
    potentialDisciples: zNumber({ default: 0 })
  }),
  locations: zArray(zString(), []),
  spiritualDensity: zEnum(['稀薄', '普通', '丰沛', '浓郁', '洞天福地'], '普通'),
  guardian: zString('')
});

export const GameStateSchema = zObject({
  members: zRecord(MemberSchema, {}),
  finance: zObject({
    gold: zNumber({ default: 0, min: 0 }),
    income: zNumber({ default: 0 }),
    expense: zNumber({ default: 0 }),
    prestige: zNumber({ default: 0, min: 0 }),
    realmTitle: zString(''),
    potentialDisciples: zNumber({ default: 0, min: 0 })
  }),
  treasury: zObject({
    items: zArray(TreasuryItemSchema, []),
    arrayName: zString(''),
    arrayRank: zString(''),
    arrayDesc: zString('')
  }),
  library: zArray(SkillSchema, []),
  opportunities: zArray(OpportunitySchema, []),
  diplomacy: zRecord(FactionSchema, {}),
  quests: zObject({
    main: zObject({
      currentStage: zString(''),
      completedStages: zArray(zString(), [])
    }),
    side: zArray(QuestSideSchema, [])
  }),
  world: zObject({
    buildings: zArray(BuildingSchema, []),
    regions: zArray(RegionSchema, [])
  }),
  player: PlayerSchema,
  sect: SectSchema,
  events: zArray(EventSchema, []),
  storyHistory: zArray(StoryRoundSchema, [])
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
    if (typeof delta !== 'number' || isNaN(delta)) { console.warn('[GameState] delta requires number:', op); return; }
    if (Array.isArray(target)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && idx >= 0 && idx < target.length) {
        if (typeof target[idx] === 'number') target[idx] += delta;
        else if (typeof target[idx] === 'string') { const cur = parseFloat(target[idx]); if (!isNaN(cur)) target[idx] = cur + delta; }
      }
    } else if (typeof target === 'object') {
      if (typeof target[key] === 'number') {
        target[key] += delta;
      } else if (typeof target[key] === 'string') {
        const cur = parseFloat(target[key]);
        if (!isNaN(cur)) target[key] = cur + delta;
        else console.warn('[GameState] delta target not numeric:', op.path);
      } else {
        console.warn('[GameState] delta target not numeric:', op.path);
      }
    }
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
  } else if (op.op === 'add') {
    // JSON Patch "add" — treat as insert for arrays, replace for objects
    if (Array.isArray(target)) {
      if (key === '-') target.push(op.value);
      else {
        const idx = parseInt(key, 10);
        if (!isNaN(idx)) { idx >= 0 && idx <= target.length ? target.splice(idx, 0, op.value) : target.push(op.value); }
        else target[key] = op.value;
      }
    } else if (typeof target === 'object') {
      target[key] = op.value;
    }
  }
}

// ===== Persistence =====
function mergeWithDefaults(data, schema) {
  if (schema.t === 'number') {
    const n = typeof data === 'number' ? data : parseFloat(data);
    return isNaN(n) ? schema.d : n;
  }
  if (schema.t === 'string') {
    return typeof data === 'string' ? data : String(data);
  }
  if (schema.t === 'boolean') {
    return typeof data === 'boolean' ? data : Boolean(data);
  }
  if (schema.t === 'enum') {
    const v = String(data);
    return schema.values.includes(v) ? v : schema.d;
  }
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

export async function getAllSaves() {
  try {
    const chats = await db.chats.toArray();
    const saves = chats.filter(c => c.playerName);
    const grouped = {};
    for (const chat of saves) {
      if (!grouped[chat.playerName]) grouped[chat.playerName] = [];
      const gs = chat.variables?.gameState || {};
      grouped[chat.playerName].push({
        id: chat.id,
        name: chat.name,
        playerName: chat.playerName,
        updatedAt: chat.updatedAt,
        sectName: gs.sect?.name || '未知宗门',
        playerRealm: gs.player?.realm || '未知',
        memberCount: Object.keys(gs.members || {}).length,
        messageCount: chat.messages?.length || 0
      });
    }
    for (const name in grouped) {
      grouped[name].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return grouped;
  } catch (e) {
    console.error('[GameState] getAllSaves failed:', e);
    return {};
  }
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
  reset() {
    this._chatId = null;
    this._state = null;
    this._loaded = false;
    if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
    // 清除 activeChatId，防止刷新后加载旧存档
    db.settings.get('settings').then(s => {
      if (s) { s.activeChatId = null; db.settings.put(s); }
    });
    // 触发订阅者，让他们收到默认值
    const emptyState = createDeepProxy(deepClone(DEFAULT_GAME_STATE), p => this._onChange(p));
    this._state = emptyState;
    for (const [subPath, cbs] of this._subs) {
      const val = this.getByPath(subPath);
      for (const cb of cbs) { try { cb(val); } catch (e) { console.error(e); } }
    }
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
  replaceState(newState) {
    this._state = createDeepProxy(deepClone(newState), p => this._onChange(p));
    for (const [subPath, cbs] of this._subs) {
      const val = this.getByPath(subPath);
      for (const cb of cbs) { try { cb(val); } catch (e) { console.error(e); } }
    }
  }
}

export function createGameStateManager() { return new GameStateManager(); }
