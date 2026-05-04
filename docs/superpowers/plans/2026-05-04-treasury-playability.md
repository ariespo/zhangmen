# 万宝阁可玩性增强 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐万宝阁页面缺失的物品类型，新增预设库+自定义表单的新增能力，以及按类型区分的消耗/销毁交互，让法宝系统从"纯展示"变为"可管理"。

**Architecture:** 保持单文件 HTML 架构，所有改动集中在 `index.html`（UI/CSS/JS）和 `sillytavern/game-state.js`（Schema 扩展）。复用现有模态框系统、变量订阅机制和操作日志系统。新增物品和消耗操作均即时落库，不等待 LLM。

**Tech Stack:** 纯前端 HTML/CSS/JS，自定义 GameStateManager（Proxy + JSON Patch），IndexedDB 持久化。

---

## 文件变更清单

| 文件 | 变更类型 | 职责 |
|------|---------|------|
| `sillytavern/game-state.js` | 修改 | Schema 扩展：`MemberSchema` 增加 `consumedPills` |
| `index.html` | 大量修改 | UI 结构（标签分组、搜索框、新增按钮）、CSS 样式、JS 逻辑（渲染/新增/消耗/销毁） |

---

## Task 1: Schema 扩展 — 添加 `consumedPills`

**Files:**
- Modify: `sillytavern/game-state.js:121`

- [ ] **Step 1: 在 MemberSchema 中增加 `consumedPills` 字段**

在 `equipment: zArray(EquipmentSchema, [])` 之后添加：

```js
  equipment: zArray(EquipmentSchema, []),
  consumedPills: zArray(zString(), [])
```

- [ ] **Step 2: Commit**

```bash
git add sillytavern/game-state.js
git commit -m "feat: MemberSchema 增加 consumedPills 字段，用于记录已服用寿元丹"
```

---

## Task 2: 标签页分组重构 + 搜索框

**Files:**
- Modify: `index.html:5214-5226`（万宝阁 HTML 结构）
- Modify: `index.html:2918-2941`（CSS，在 `.treasury-tab` 后添加新样式）

- [ ] **Step 1: 重写万宝阁页面 HTML**

替换 `index.html:5214-5226` 的 `#treasury-page` 内容：

```html
        <!-- TREASURY PAGE -->
        <div id="treasury-page" class="page-content">
          <div class="page-header">
            <h2>万宝阁</h2>
            <div style="font-size:12px;color:rgba(168,230,230,0.5)">宗门法宝，任尔调配</div>
          </div>
          <div class="treasury-group-tabs">
            <button class="treasury-group-tab active" data-group="equipment" onclick="switchTreasuryGroup('equipment', this)">装备</button>
            <button class="treasury-group-tab" data-group="consumable" onclick="switchTreasuryGroup('consumable', this)">消耗品</button>
            <button class="treasury-group-tab" data-group="misc" onclick="switchTreasuryGroup('misc', this)">其他</button>
          </div>
          <div class="treasury-sub-filters" id="treasury-sub-filters"></div>
          <div class="treasury-toolbar">
            <input type="text" class="treasury-search" id="treasury-search" placeholder="搜索物品..." oninput="onTreasurySearch(this.value)">
            <button class="action-btn-sm" onclick="openAddItemDialog()">+ 新增物品</button>
          </div>
          <div class="item-grid" id="item-grid"></div>
          <div class="empty-state" id="treasury-empty" style="display:none;text-align:center;padding:40px 20px;color:rgba(168,230,230,0.4)">
            <div style="font-size:48px;margin-bottom:12px">📦</div>
            <div>暂无此类物品</div>
          </div>
        </div>
```

- [ ] **Step 2: 添加 CSS 样式**

在 `index.html` 的 `.treasury-tab` CSS 之后（约 line 2941）添加：

```css
    .treasury-group-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .treasury-group-tab {
      flex: 1;
      padding: 10px 16px;
      background: transparent;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: rgba(168, 230, 230, 0.7);
      font-family: inherit;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .treasury-group-tab:hover, .treasury-group-tab.active {
      background: rgba(110, 207, 207, 0.15);
      border-color: rgba(110, 207, 207, 0.4);
      color: var(--jade-glow);
    }
    .treasury-sub-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .treasury-sub-filter {
      padding: 4px 12px;
      background: transparent;
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      color: rgba(168, 230, 230, 0.6);
      font-family: inherit;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;
    }
    .treasury-sub-filter:hover, .treasury-sub-filter.active {
      background: rgba(110, 207, 207, 0.12);
      border-color: rgba(110, 207, 207, 0.35);
      color: var(--jade-glow);
    }
    .treasury-toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      align-items: center;
    }
    .treasury-search {
      flex: 1;
      padding: 8px 14px;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 13px;
    }
    .treasury-search::placeholder {
      color: rgba(168, 230, 230, 0.35);
    }
    @media (max-width: 768px) {
      .treasury-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .treasury-search {
        width: 100%;
      }
    }
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 万宝阁标签页分组重构（装备/消耗品/其他）+ 搜索框 + 新增按钮"
```

---

## Task 3: 预设库数据结构 + 状态变量

**Files:**
- Modify: `index.html:10429-10435`（替换 `itemSvgs`，扩展为完整映射）

- [ ] **Step 1: 替换 `itemSvgs` 为完整类型映射常量**

替换 `index.html:10429-10435`：

```js
    // ====== TREASURY ======
    const TREASURY_TYPE_MAP = {
      weapon: { label: '武器', group: 'equipment', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M14.5 3.5l6 6-11 11-6-6z"/><path d="M9.5 14.5l-5 5"/><path d="M18 2l4 4"/></svg>' },
      armor: { label: '护具', group: 'equipment', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 3L4 7v5c0 5 3.5 9.5 8 10.5 4.5-1 8-5.5 8-10.5V7l-8-4z"/></svg>' },
      escape: { label: '遁具', group: 'equipment', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
      accessory: { label: '饰品', group: 'equipment', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>' },
      magic: { label: '法宝', group: 'equipment', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
      pill: { label: '丹药', group: 'consumable', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10 2v7.31"/><path d="M14 2v7.31"/><path d="M8.5 9.3a7 7 0 1 0 7 0"/><path d="M12 16v5"/></svg>' },
      material: { label: '材料', group: 'consumable', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 2l-8 8 8 8 8-8-8-8z"/></svg>' },
      misc: { label: '杂物', group: 'misc', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>' }
    };

    const TREASURY_GROUP_CONFIG = {
      equipment: { label: '装备', filters: ['all', 'weapon', 'armor', 'escape', 'accessory', 'magic'] },
      consumable: { label: '消耗品', filters: ['all', 'pill', 'material'] },
      misc: { label: '其他', filters: ['all', 'misc'] }
    };

    const TREASURY_PRESETS = {
      weapon: [
        { name: '青冥剑', type: '武器', rank: '黄阶上品', color: 'jade', effects: { 杀伐: 15, 防御: 0, 身法: 5 }, description: '剑身泛着淡淡青光，锋利异常' },
        { name: '玄铁重剑', type: '武器', rank: '玄阶下品', color: 'purple', effects: { 杀伐: 25, 防御: 5, 身法: -5 }, description: '以千年玄铁锻造，沉重无比，威力惊人' },
        { name: '血纹刀', type: '武器', rank: '黄阶中品', color: 'pink', effects: { 杀伐: 12, 防御: 0, 身法: 2 }, description: '刀刃有血丝纹路，饮血后更加锋利' },
        { name: '竹杖', type: '武器', rank: '凡阶', color: 'jade', effects: { 杀伐: 3, 防御: 0, 身法: 0 }, description: '普通青竹削制而成，聊胜于无' }
      ],
      armor: [
        { name: '玄铁护甲', type: '防具', rank: '黄阶上品', color: 'purple', effects: { 杀伐: 0, 防御: 15, 身法: -3 }, description: '玄铁锻造，沉重但防御力极佳' },
        { name: '轻云袍', type: '防具', rank: '黄阶中品', color: 'jade', effects: { 杀伐: 0, 防御: 8, 身法: 5 }, description: '以灵蚕吐丝织就，轻盈飘逸' },
        { name: '皮甲', type: '防具', rank: '凡阶', color: 'jade', effects: { 杀伐: 0, 防御: 4, 身法: 0 }, description: '普通兽皮缝制，基础防护' }
      ],
      escape: [
        { name: '遁地符', type: '遁具', rank: '黄阶中品', color: 'gold', effects: { 杀伐: 0, 防御: 0, 身法: 10 }, description: '贴于足底，可借地脉之力遁走' },
        { name: '风行靴', type: '遁具', rank: '黄阶上品', color: 'jade', effects: { 杀伐: 0, 防御: 2, 身法: 12 }, description: '刻有风行法阵，踏之如御风' }
      ],
      accessory: [
        { name: '聚灵玉佩', type: '饰品', rank: '黄阶上品', color: 'jade', effects: { 杀伐: 5, 防御: 5, 身法: 5 }, description: '内含微型聚灵阵，可缓慢汇聚灵气' },
        { name: '护心镜', type: '饰品', rank: '玄阶下品', color: 'gold', effects: { 杀伐: 0, 防御: 10, 身法: 0 }, description: '悬于胸前，可挡致命一击' }
      ],
      magic: [
        { name: '乾坤袋', type: '法宝', rank: '玄阶中品', color: 'gold', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '内有乾坤，可容纳海量物品' },
        { name: '照妖镜', type: '法宝', rank: '黄阶上品', color: 'purple', effects: { 杀伐: 8, 防御: 0, 身法: 0 }, description: '可照出妖物本体，亦有伤敌之能' }
      ],
      pill: [
        { name: '疗伤丹', type: '丹药', rank: '黄阶下品', color: 'jade', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '疗伤圣药，可恢复伤势与心情' },
        { name: '回灵丹', type: '丹药', rank: '黄阶下品', color: 'jade', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '恢复灵识清明，提升忠诚度' },
        { name: '延寿丹', type: '丹药', rank: '玄阶下品', color: 'gold', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '可增加寿元，每名角色只能服用一次' },
        { name: '聚灵丹', type: '丹药', rank: '黄阶中品', color: 'purple', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '灵气充盈，身心俱泰' },
        { name: '锻体丹', type: '丹药', rank: '黄阶中品', color: 'pink', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '锤炼体魄，永久性增强三维属性' },
        { name: '轻灵丹', type: '丹药', rank: '黄阶中品', color: 'jade', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '身法精进，灵动如风' }
      ],
      material: [
        { name: '玄铁矿石', type: '材料', rank: '黄阶上品', color: 'purple', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '炼制玄阶法器的基础材料' },
        { name: '灵草', type: '材料', rank: '黄阶下品', color: 'jade', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '炼制丹药的常见材料' },
        { name: '妖丹', type: '材料', rank: '黄阶中品', color: 'pink', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '妖兽内丹，蕴含精纯灵力' }
      ],
      misc: [
        { name: '宗门令牌', type: '杂物', rank: '凡阶', color: 'gold', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '宗门身份象征，无实际效用' },
        { name: '古旧地图', type: '杂物', rank: '凡阶', color: 'jade', effects: { 杀伐: 0, 防御: 0, 身法: 0 }, description: '残缺的地图，似乎指向某处遗迹' }
      ]
    };

    const PILL_EFFECTS = {
      '疗伤丹': { mood: 15, desc: '伤势好转，心情恢复' },
      '回灵丹': { loyalty: 10, desc: '灵识清明，忠心渐增' },
      '延寿丹': { lifespan: 20, desc: '寿元增加', oncePerMember: true },
      '聚灵丹': { mood: 10, loyalty: 5, desc: '灵气充盈，身心俱泰' },
      '锻体丹': { stats: { 杀伐: 5, 防御: 3 }, desc: '体魄增强' },
      '轻灵丹': { stats: { 身法: 8 }, desc: '身法精进' }
    };

    let treasuryState = { group: 'equipment', filter: 'all', search: '' };
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 万宝阁预设库数据结构 + 类型映射 + 丹药效果表"
```

---

## Task 4: renderTreasury 重写 + 分组切换

**Files:**
- Modify: `index.html:10578-10613`（替换 renderTreasury + switchTreasury）

- [ ] **Step 1: 重写渲染和切换函数**

替换 `index.html:10578-10613` 的全部内容：

```js
    function renderTreasuryItems(items) {
      const grid = document.getElementById('item-grid');
      const emptyState = document.getElementById('treasury-empty');
      grid.innerHTML = '';
      if (items.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      items.forEach(item => {
        const colorVar = item.color === 'jade' ? 'var(--jade-glow)' : item.color === 'purple' ? 'var(--mist-purple)' : item.color === 'pink' ? 'var(--lotus-pink)' : 'var(--gold-spirit)';
        const bgVar = item.color === 'jade' ? 'rgba(110,207,207,0.12)' : item.color === 'purple' ? 'rgba(139,126,200,0.12)' : item.color === 'pink' ? 'rgba(212,114,140,0.12)' : 'rgba(200,168,110,0.12)';
        const typeKey = Object.keys(TREASURY_TYPE_MAP).find(k => TREASURY_TYPE_MAP[k].label === item.type) || 'misc';
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
          <div class="item-icon-lg" style="background:${bgVar};color:${colorVar}">
            ${TREASURY_TYPE_MAP[typeKey]?.svg || TREASURY_TYPE_MAP.misc.svg}
          </div>
          <h5>${item.name}</h5>
          <div class="item-rarity" style="background:${bgVar};color:${colorVar}">${item.rank}</div>
          <div class="item-owner">${item.owner || '库房'}${item.quantity > 1 ? ' · ×' + item.quantity : ''}</div>
          <div style="margin-top:10px;display:flex;gap:6px;justify-content:center">
            <button class="action-btn-sm" onclick="event.stopPropagation();openItemDetail('${item.id}')">详情</button>
            ${item.type === '丹药' || item.type === '材料' || item.type === '杂物' ? '' : `<button class="action-btn-sm" onclick="event.stopPropagation();openAssignDialog('${item.id}')">分配</button>`}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function renderSubFilters() {
      const container = document.getElementById('treasury-sub-filters');
      const config = TREASURY_GROUP_CONFIG[treasuryState.group];
      if (!config || config.filters.length <= 1) {
        container.innerHTML = '';
        return;
      }
      container.innerHTML = config.filters.map(f => {
        const label = f === 'all' ? '全部' : TREASURY_TYPE_MAP[f]?.label || f;
        const isActive = treasuryState.filter === f;
        return `<button class="treasury-sub-filter ${isActive ? 'active' : ''}" onclick="switchTreasuryFilter('${f}', this)">${label}</button>`;
      }).join('');
    }

    function switchTreasuryFilter(filter, btn) {
      treasuryState.filter = filter;
      if (btn) {
        document.querySelectorAll('.treasury-sub-filter').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
      }
      refreshTreasuryDisplay();
    }

    function switchTreasuryGroup(group, btn) {
      treasuryState.group = group;
      treasuryState.filter = 'all';
      treasuryState.search = '';
      document.getElementById('treasury-search').value = '';
      document.querySelectorAll('.treasury-group-tab').forEach(t => t.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderSubFilters();
      refreshTreasuryDisplay();
    }

    function onTreasurySearch(value) {
      treasuryState.search = value.trim().toLowerCase();
      refreshTreasuryDisplay();
    }

    function refreshTreasuryDisplay() {
      const allItems = window.gameStateManager?.state?.treasury?.items || [];
      const groupTypes = TREASURY_GROUP_CONFIG[treasuryState.group].filters
        .filter(f => f !== 'all')
        .map(f => TREASURY_TYPE_MAP[f]?.label);
      let items = allItems.filter(i => groupTypes.includes(i.type));
      if (treasuryState.filter !== 'all') {
        const targetLabel = TREASURY_TYPE_MAP[treasuryState.filter]?.label;
        items = items.filter(i => i.type === targetLabel);
      }
      if (treasuryState.search) {
        items = items.filter(i => i.name.toLowerCase().includes(treasuryState.search));
      }
      renderTreasuryItems(items);
    }
```

- [ ] **Step 2: 更新读档刷新和订阅中的 renderTreasury 调用**

在 `index.html` 中找到两处旧的 `renderTreasury` 调用并替换：

1. 读档后刷新处（约 line 10683）：
```js
      if (typeof renderTreasuryItems === 'function') refreshTreasuryDisplay();
```

2. `/treasury/items` subscribe 处（约 line 10759）：
```js
    gameStateManager.subscribe('/treasury/items', () => {
      if (typeof refreshTreasuryDisplay === 'function') refreshTreasuryDisplay();
    });
```

- [ ] **Step 3: 初始化调用**

将原来的 `renderTreasury('weapon');` 替换为：
```js
    renderSubFilters();
    refreshTreasuryDisplay();
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 万宝阁渲染逻辑重写 — 分组切换 + 次级筛选 + 搜索"
```

---

## Task 5: 新增物品模态框

**Files:**
- Modify: `index.html`（在现有 JS 函数之后添加新函数）

- [ ] **Step 1: 添加新增物品模态框函数**

在 `refreshTreasuryDisplay` 函数之后添加：

```js
    function openAddItemDialog() {
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path d="M12 5v14M5 12h14"/></svg>
        新增物品
      `;

      const currentFilter = treasuryState.filter !== 'all' ? treasuryState.filter : 'weapon';
      const presetOptions = Object.keys(TREASURY_PRESETS).map(k => {
        const presets = TREASURY_PRESETS[k];
        return `<optgroup label="${TREASURY_TYPE_MAP[k]?.label || k}">
          ${presets.map((p, i) => `<option value="${k}:${i}">${p.name} · ${p.rank}</option>`).join('')}
        </optgroup>`;
      }).join('');

      document.getElementById('modal-body').innerHTML = `
        <div style="display:flex;gap:16px;max-height:70vh;overflow-y:auto">
          <div style="flex:1;min-width:200px">
            <div style="font-size:13px;color:rgba(168,230,230,0.6);margin-bottom:10px">预设库（点击自动填充）</div>
            <select id="add-item-preset" style="width:100%;padding:8px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit;margin-bottom:10px" onchange="onPresetSelect(this.value)">
              <option value="">-- 选择预设 --</option>
              ${presetOptions}
            </select>
            <div id="preset-preview" style="font-size:12px;color:rgba(168,230,230,0.5);line-height:1.6"></div>
          </div>
          <div style="flex:2;min-width:250px">
            <div class="form-group">
              <label>名称 *</label>
              <input type="text" id="add-item-name" style="width:100%;padding:8px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit" placeholder="物品名称">
            </div>
            <div class="form-group">
              <label>类型</label>
              <select id="add-item-type" style="width:100%;padding:8px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit">
                ${Object.keys(TREASURY_TYPE_MAP).map(k => `<option value="${TREASURY_TYPE_MAP[k].label}">${TREASURY_TYPE_MAP[k].label}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>品阶</label>
              <input type="text" id="add-item-rank" style="width:100%;padding:8px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit" placeholder="黄阶下品" value="黄阶下品">
            </div>
            <div class="form-group">
              <label>配色</label>
              <div style="display:flex;gap:10px">
                ${['jade','purple','pink','gold'].map(c => `
                  <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
                    <input type="radio" name="add-item-color" value="${c}" ${c === 'jade' ? 'checked' : ''}>
                    <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${c === 'jade' ? '#6ecfcf' : c === 'purple' ? '#8b7ec8' : c === 'pink' ? '#d4728c' : '#c8a86e'}"></span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label>效果</label>
              <div style="display:flex;gap:8px">
                <div style="flex:1">杀伐 <input type="number" id="add-item-effect-sha" style="width:100%;padding:6px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit" value="0"></div>
                <div style="flex:1">防御 <input type="number" id="add-item-effect-def" style="width:100%;padding:6px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit" value="0"></div>
                <div style="flex:1">身法 <input type="number" id="add-item-effect-spd" style="width:100%;padding:6px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit" value="0"></div>
              </div>
            </div>
            <div class="form-group">
              <label>介绍</label>
              <textarea id="add-item-desc" style="width:100%;padding:8px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit;min-height:60px;resize:vertical" placeholder="物品描述..."></textarea>
            </div>
            <div class="form-group">
              <label>数量</label>
              <input type="number" id="add-item-qty" style="width:100%;padding:8px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit" value="1" min="1">
            </div>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
          <button class="opportunity-btn secondary" onclick="closeModal()">取消</button>
          <button class="opportunity-btn primary" id="add-item-submit" onclick="submitAddItem()">确认新增</button>
        </div>
      `;
      overlay.classList.add('active');
    }

    function onPresetSelect(value) {
      if (!value) {
        document.getElementById('preset-preview').innerHTML = '';
        return;
      }
      const [typeKey, idx] = value.split(':');
      const preset = TREASURY_PRESETS[typeKey]?.[parseInt(idx)];
      if (!preset) return;
      document.getElementById('add-item-name').value = preset.name;
      document.getElementById('add-item-type').value = preset.type;
      document.getElementById('add-item-rank').value = preset.rank;
      document.querySelector(`input[name="add-item-color"][value="${preset.color}"]`).checked = true;
      document.getElementById('add-item-effect-sha').value = preset.effects?.杀伐 || 0;
      document.getElementById('add-item-effect-def').value = preset.effects?.防御 || 0;
      document.getElementById('add-item-effect-spd').value = preset.effects?.身法 || 0;
      document.getElementById('add-item-desc').value = preset.description || '';
      document.getElementById('preset-preview').innerHTML = `
        <div style="padding:10px;background:rgba(110,207,207,0.08);border-radius:8px;border:1px solid rgba(110,207,207,0.2)">
          <div style="color:var(--jade-glow);margin-bottom:4px">${preset.name} · ${preset.rank}</div>
          <div>${preset.description}</div>
        </div>
      `;
    }

    function submitAddItem() {
      const name = document.getElementById('add-item-name').value.trim();
      if (!name) {
        alert('请输入物品名称');
        return;
      }
      const type = document.getElementById('add-item-type').value;
      const rank = document.getElementById('add-item-rank').value.trim() || '黄阶下品';
      const color = document.querySelector('input[name="add-item-color"]:checked')?.value || 'jade';
      const effects = {
        杀伐: parseInt(document.getElementById('add-item-effect-sha').value) || 0,
        防御: parseInt(document.getElementById('add-item-effect-def').value) || 0,
        身法: parseInt(document.getElementById('add-item-effect-spd').value) || 0
      };
      const description = document.getElementById('add-item-desc').value.trim();
      const quantity = Math.max(1, parseInt(document.getElementById('add-item-qty').value) || 1);

      const item = {
        id: 'treasury_' + Date.now(),
        name,
        type,
        rank,
        color,
        quantity,
        description,
        owner: '',
        effects
      };

      window.gameStateManager.applyPatch([{
        op: 'insert',
        path: '/treasury/items/-',
        value: item
      }]);

      closeModal();
      refreshTreasuryDisplay();
    }
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 万宝阁新增物品模态框 — 预设库选择 + 自定义表单"
```

---

## Task 6: 装备销毁 + 材料消耗

**Files:**
- Modify: `index.html:10521-10576`（重写 openItemDetail）

- [ ] **Step 1: 重写 openItemDetail，增加操作按钮**

替换 `index.html:10521-10576`：

```js
    function openItemDetail(itemId) {
      const items = window.gameStateManager?.state?.treasury?.items || [];
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        ${item.name}
      `;
      const colorVar = item.color === 'jade' ? 'var(--jade-glow)' : item.color === 'purple' ? 'var(--mist-purple)' : item.color === 'pink' ? 'var(--lotus-pink)' : 'var(--gold-spirit)';
      const bgVar = item.color === 'jade' ? 'rgba(110,207,207,0.12)' : item.color === 'purple' ? 'rgba(139,126,200,0.12)' : item.color === 'pink' ? 'rgba(212,114,140,0.12)' : 'rgba(200,168,110,0.12)';
      const effects = item.effects || { 杀伐: 0, 防御: 0, 身法: 0 };

      let actionButtons = `<button class="opportunity-btn secondary" onclick="closeModal()">关闭</button>`;
      if (item.type === '武器' || item.type === '防具' || item.type === '遁具' || item.type === '饰品' || item.type === '法宝') {
        actionButtons += `<button class="opportunity-btn primary" onclick="closeModal();openAssignDialog('${item.id}')">分配/收回</button>`;
        actionButtons += `<button class="opportunity-btn" style="background:rgba(255,100,100,0.15);border-color:rgba(255,100,100,0.4);color:#ff6464" onclick="destroyItem('${item.id}')">销毁</button>`;
      } else if (item.type === '丹药') {
        actionButtons += `<button class="opportunity-btn primary" onclick="closeModal();openConsumePillDialog('${item.id}')">服用</button>`;
      } else if (item.type === '材料' || item.type === '杂物') {
        actionButtons += `<button class="opportunity-btn primary" onclick="closeModal();openConsumeMaterialDialog('${item.id}')">消耗</button>`;
      }

      document.getElementById('modal-body').innerHTML = `
        <div class="sect-info-grid">
          <div class="info-block">
            <h4>装备名称</h4>
            <div class="info-value" style="color:${colorVar};font-size:16px">${item.name}</div>
          </div>
          <div class="info-block">
            <h4>类型</h4>
            <div class="info-value">${item.type}</div>
          </div>
          <div class="info-block">
            <h4>品阶</h4>
            <div class="info-value" style="color:${colorVar}">${item.rank}</div>
          </div>
          <div class="info-block">
            <h4>当前持有者</h4>
            <div class="info-value">${item.owner || '宗门库房'}${item.quantity > 1 ? ' · 库存 ×' + item.quantity : ''}</div>
          </div>
          <div class="info-block full-width">
            <h4>介绍</h4>
            <div class="info-value" style="font-size:13px;line-height:1.8">${item.description || '暂无介绍'}</div>
          </div>
          <div class="info-block full-width">
            <h4>效果</h4>
            <div class="info-value" style="font-size:13px;line-height:2">
              <div style="display:flex;gap:16px;flex-wrap:wrap">
                <span style="padding:4px 12px;background:${bgVar};border-radius:6px;color:${colorVar}">杀伐 ${effects.杀伐 >= 0 ? '+' : ''}${effects.杀伐}</span>
                <span style="padding:4px 12px;background:${bgVar};border-radius:6px;color:${colorVar}">防御 ${effects.防御 >= 0 ? '+' : ''}${effects.防御}</span>
                <span style="padding:4px 12px;background:${bgVar};border-radius:6px;color:${colorVar}">身法 ${effects.身法 >= 0 ? '+' : ''}${effects.身法}</span>
              </div>
            </div>
          </div>
          <div class="info-block full-width" style="display:flex;gap:10px;justify-content:flex-end;background:transparent;border:none;padding:8px 0 0 0">
            ${actionButtons}
          </div>
        </div>
      `;
      overlay.classList.add('active');
    }
```

- [ ] **Step 2: 添加销毁和材料消耗函数**

在 `openItemDetail` 之后添加：

```js
    function destroyItem(itemId) {
      const items = window.gameStateManager?.state?.treasury?.items || [];
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      if (!confirm(`确定销毁 ${item.name}？此操作不可撤销。`)) return;

      const idx = items.findIndex(i => i.id === itemId);
      if (idx === -1) return;

      // 如果已分配给成员，从成员 equipment 中移除
      if (item.owner) {
        const member = window.gameStateManager.state.members[item.owner];
        if (member && member.equipment) {
          const eqIdx = member.equipment.findIndex(e => e.name === item.name);
          if (eqIdx !== -1) {
            window.gameStateManager.applyPatch([{
              op: 'remove',
              path: `/members/${item.owner}/equipment/${eqIdx}`
            }]);
          }
        }
      }

      window.gameStateManager.applyPatch([{
        op: 'remove',
        path: '/treasury/items/' + idx
      }]);

      closeModal();
      refreshTreasuryDisplay();
    }

    function openConsumeMaterialDialog(itemId) {
      const items = window.gameStateManager?.state?.treasury?.items || [];
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').innerHTML = '消耗物品';
      document.getElementById('modal-body').innerHTML = `
        <div style="font-size:14px;margin-bottom:16px">
          消耗 <span style="color:var(--jade-glow)">${item.name}</span>（库存：${item.quantity}）
        </div>
        <div class="form-group">
          <label>数量</label>
          <input type="number" id="consume-qty" style="width:100%;padding:8px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-family:inherit" value="1" min="1" max="${item.quantity}">
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
          <button class="opportunity-btn secondary" onclick="closeModal()">取消</button>
          <button class="opportunity-btn primary" onclick="consumeMaterial('${itemId}')">确认消耗</button>
        </div>
      `;
      overlay.classList.add('active');
    }

    function consumeMaterial(itemId) {
      const items = window.gameStateManager?.state?.treasury?.items || [];
      const idx = items.findIndex(i => i.id === itemId);
      if (idx === -1) return;
      const qty = parseInt(document.getElementById('consume-qty').value) || 1;
      const item = items[idx];
      if (qty > item.quantity) {
        alert('消耗数量超过库存');
        return;
      }
      if (qty <= 0) {
        closeModal();
        return;
      }

      if (qty >= item.quantity) {
        window.gameStateManager.applyPatch([{
          op: 'remove',
          path: '/treasury/items/' + idx
        }]);
      } else {
        window.gameStateManager.applyPatch([{
          op: 'replace',
          path: '/treasury/items/' + idx + '/quantity',
          value: item.quantity - qty
        }]);
      }

      addActionLog('消耗物品', `消耗 ${item.name} ×${qty}`, '', 0);
      closeModal();
      refreshTreasuryDisplay();
    }
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 装备销毁 + 材料/杂物消耗功能"
```

---

## Task 7: 丹药服用（核心功能）

**Files:**
- Modify: `index.html`（在现有函数之后添加）

- [ ] **Step 1: 添加丹药服用相关函数**

在 `consumeMaterial` 之后添加：

```js
    function openConsumePillDialog(itemId) {
      const items = window.gameStateManager?.state?.treasury?.items || [];
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        服用丹药
      `;

      const members = Object.values(window.gameStateManager.state.members || {});
      const player = window.gameStateManager.state.player;
      const allTargets = [
        ...(player ? [{ name: player.name, label: `${player.name} · ${player.realm} · 掌门`, isPlayer: true }] : []),
        ...members.map(m => ({ name: m.name, label: `${m.name} · ${m.realm} · ${m.role}`, isPlayer: false }))
      ];

      const effectInfo = PILL_EFFECTS[item.name];
      let effectText = '效果由剧情驱动';
      if (effectInfo) {
        const parts = [];
        if (effectInfo.mood) parts.push(`心情 +${effectInfo.mood}`);
        if (effectInfo.loyalty) parts.push(`忠诚 +${effectInfo.loyalty}`);
        if (effectInfo.lifespan) parts.push(`寿元 +${effectInfo.lifespan}`);
        if (effectInfo.stats) {
          if (effectInfo.stats.杀伐) parts.push(`杀伐 +${effectInfo.stats.杀伐}`);
          if (effectInfo.stats.防御) parts.push(`防御 +${effectInfo.stats.防御}`);
          if (effectInfo.stats.身法) parts.push(`身法 +${effectInfo.stats.身法}`);
        }
        effectText = parts.join('，') + ' · ' + effectInfo.desc;
        if (effectInfo.oncePerMember) effectText += '（每名角色仅限一次）';
      }

      document.getElementById('modal-body').innerHTML = `
        <div style="font-size:14px;margin-bottom:12px">
          将 <span style="color:var(--jade-glow)">${item.name}</span> 给：
        </div>
        <div style="font-size:12px;color:rgba(168,230,230,0.5);margin-bottom:12px">${effectText}</div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto">
          ${allTargets.map(t => `
            <button class="story-choice-btn" onclick="consumePill('${itemId}', '${t.name}', ${t.isPlayer})" style="text-align:left">
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>
      `;
      overlay.classList.add('active');
    }

    function consumePill(itemId, memberName, isPlayer) {
      const items = window.gameStateManager?.state?.treasury?.items || [];
      const idx = items.findIndex(i => i.id === itemId);
      if (idx === -1) return;
      const item = items[idx];

      const memberPath = isPlayer ? '/player' : '/members/' + memberName;
      const member = isPlayer ? window.gameStateManager.state.player : window.gameStateManager.state.members[memberName];
      if (!member) {
        alert('该成员已不在宗门');
        return;
      }

      const effect = PILL_EFFECTS[item.name];
      const patches = [];
      let effectDesc = '';

      if (effect) {
        // 检查 oncePerMember
        if (effect.oncePerMember) {
          const consumed = member.consumedPills || [];
          if (consumed.includes(item.name)) {
            alert('此丹药对该角色已无效');
            return;
          }
          patches.push({
            op: 'insert',
            path: memberPath + '/consumedPills/-',
            value: item.name
          });
        }

        if (effect.mood !== undefined) {
          const newMood = Math.min(100, Math.max(0, (member.mood || 70) + effect.mood));
          patches.push({ op: 'replace', path: memberPath + '/mood', value: newMood });
        }
        if (effect.loyalty !== undefined) {
          const newLoyalty = Math.min(100, Math.max(0, (member.loyalty || 60) + effect.loyalty));
          patches.push({ op: 'replace', path: memberPath + '/loyalty', value: newLoyalty });
        }
        if (effect.lifespan !== undefined) {
          const newLifespan = Math.min(member.lifespan?.max || 200, (member.lifespan?.current || 100) + effect.lifespan);
          patches.push({ op: 'replace', path: memberPath + '/lifespan/current', value: newLifespan });
        }
        if (effect.stats) {
          const newBaseStats = { ...member.baseStats };
          if (effect.stats.杀伐) newBaseStats.杀伐 = (newBaseStats.杀伐 || 50) + effect.stats.杀伐;
          if (effect.stats.防御) newBaseStats.防御 = (newBaseStats.防御 || 50) + effect.stats.防御;
          if (effect.stats.身法) newBaseStats.身法 = (newBaseStats.身法 || 50) + effect.stats.身法;
          patches.push({ op: 'replace', path: memberPath + '/baseStats', value: newBaseStats });
        }
        effectDesc = effect.desc;
      }

      // 丹药数量 -1
      if (item.quantity <= 1) {
        patches.unshift({ op: 'remove', path: '/treasury/items/' + idx });
      } else {
        patches.unshift({ op: 'replace', path: '/treasury/items/' + idx + '/quantity', value: item.quantity - 1 });
      }

      window.gameStateManager.applyPatch(patches);

      addActionLog('服用丹药', `${memberName} 服用 ${item.name}`, effectDesc || '效果由剧情驱动', 0);

      closeModal();
      refreshTreasuryDisplay();

      // Toast 提示
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(20,40,40,0.95);border:1px solid rgba(110,207,207,0.3);color:var(--jade-glow);padding:10px 20px;border-radius:8px;font-size:13px;z-index:9999;animation:fadeInUp 0.3s';
      toast.textContent = `${memberName} 服用 ${item.name} · ${effectDesc || '效果待定'}`;
      document.body.appendChild(toast);
      setTimeout(() => { toast.remove(); }, 2500);
    }
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 丹药服用功能 — 成员选择 + 即时效果落库 + 寿元丹去重"
```

---

## Task 8: LLM 处理中禁用 + 空状态完善

**Files:**
- Modify: `index.html`（在 CSS 中添加禁用样式）

- [ ] **Step 1: 添加 LLM 处理中禁用样式**

在 `index.html` 的 CSS 区域（约 line 3974 附近，`body.llm-processing` 规则区域）添加：

```css
    body.llm-processing .treasury-group-tab,
    body.llm-processing .treasury-sub-filter,
    body.llm-processing .treasury-search,
    body.llm-processing #treasury-page .action-btn-sm,
    body.llm-processing #treasury-page .opportunity-btn {
      opacity: 0.5;
      pointer-events: none;
    }
```

- [ ] **Step 2: 添加 fadeInUp 动画（用于 Toast）**

在 CSS 区域添加：

```css
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: LLM 处理中禁用万宝阁操作 + Toast 动画"
```

---

## Task 9: 端到端验证

**Files:** 无新增文件，浏览器验证。

- [ ] **Step 1: 启动本地服务器**

```bash
npx serve . -l 3000
```

- [ ] **Step 2: 浏览器验证清单**

打开 `http://localhost:3000`，按以下顺序验证：

| # | 验证项 | 预期结果 |
|---|--------|---------|
| 1 | 点击侧边栏「万宝阁」 | 显示装备/消耗品/其他三个主标签，默认选中装备 |
| 2 | 装备标签下的次级筛选 | 显示「全部/武器/护具/遁具/饰品/法宝」pill |
| 3 | 点击「消耗品」主标签 | 显示「全部/丹药/材料」pill，丹药卡片出现（如果有） |
| 4 | 搜索框输入文字 | 实时过滤当前类型下的物品 |
| 5 | 点击「新增物品」 | 弹出模态框，左侧预设库下拉，右侧表单 |
| 6 | 选择预设「青冥剑」 | 右侧表单自动填充名称/类型/品阶/效果/介绍 |
| 7 | 修改名称后点击确认 | 新物品立即出现在对应类型网格中 |
| 8 | 点击装备详情 | 显示分配/收回/销毁三个按钮 |
| 9 | 点击销毁并确认 | 物品从列表消失，刷新后不存在 |
| 10 | 点击丹药详情 | 显示服用按钮 |
| 11 | 点击服用，选择成员 | 弹出成员列表，选择后服用 |
| 12 | 服用后检查 | 丹药数量-1（归零删除），成员属性变化（如 mood+15），Toast 弹出 |
| 13 | 再次给同一成员服用延寿丹 | 提示「此丹药对该角色已无效」 |
| 14 | 点击材料详情 → 消耗 | 弹出数量输入，确认后扣减数量 |
| 15 | DevTools 375px 模拟手机 | 主标签等分，搜索框全宽，表单上下堆叠 |

- [ ] **Step 3: Push 到 GitHub**

```bash
git push origin main
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 标签页分组（装备/消耗品/其他）→ Task 2 + Task 4
- [x] 预设库数据结构 → Task 3
- [x] 新增物品模态框（预设+自定义）→ Task 5
- [x] 装备销毁 → Task 6
- [x] 丹药服用即时效果（mood/loyalty/lifespan/stats）→ Task 7
- [x] 寿元丹 oncePerMember 限制 → Task 7
- [x] 材料消耗 → Task 6
- [x] 搜索框 → Task 2 + Task 4
- [x] 空状态 → Task 2 + Task 4
- [x] LLM 处理中禁用 → Task 8
- [x] 移动端适配 → CSS 中已有 media query，Task 2 中新增样式已覆盖
- [x] Schema 扩展 consumedPills → Task 1

**Placeholder scan:**
- [x] 无 TBD/TODO/待确定
- [x] 所有函数包含完整实现
- [x] 验证步骤包含具体操作

**Type consistency:**
- [x] `TREASURY_TYPE_MAP` 键名与 `itemSvgs` 旧键名一致（weapon/armor/escape/accessory）
- [x] `TREASURY_GROUP_CONFIG.filters` 使用 type map 键名
- [x] `switchTreasuryFilter` 参数与 `TREASURY_TYPE_MAP` 键名一致
- [x] `PILL_EFFECTS` 键名与预设库 `name` 字段匹配
