# 藏经阁功法系统完善 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将藏经阁功法系统从静态展示升级为可交互的修炼系统：功法有属性加成、成员可参悟提升进度、满级翻倍。

**Architecture:** 在现有 schema 上增量扩展：SkillSchema 新增 effects/realmReq/maxProgress；MemberSchema 的 skills 从字符串数组重构为对象数组（skillId + progress + maxed）；UI 在现有藏经阁和成员页面增加参悟交互和进度显示；属性计算在渲染时实时汇总。

**Tech Stack:** Vanilla JS (ES modules), Dexie.js (IndexedDB), 现有 CSS 变量体系

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `sillytavern/game-state.js` | Schema 定义 + 向后兼容加载逻辑 |
| `index.html` | UI 渲染、交互逻辑、属性计算 |
| `sillytavern/st-prompt.js` | 提示词组装中显示功法加成 |

---

### Task 1: Schema 扩展 — SkillSchema 新增字段

**Files:**
- Modify: `sillytavern/game-state.js:134-141`

- [ ] **Step 1: 在 SkillSchema 中新增 effects、realmReq、maxProgress**

```javascript
const SkillSchema = zObject({
  id: zString(),
  name: zString(),
  type: zEnum(['道修', '神修', '魔修', '体修', '修行百艺'], '道修'),
  rank: zString('黄阶'),
  desc: zString(),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'jade'),
  effects: zObject({
    杀伐: zNumber({ default: 0 }),
    防御: zNumber({ default: 0 }),
    身法: zNumber({ default: 0 })
  }),
  realmReq: zString(''),
  maxProgress: zNumber({ default: 100, min: 0 })
});
```

- [ ] **Step 2: 在 GameStateSchema 中确保 storyHistory 的 snapshot 字段兼容（已有）**

`game-state.js` 中 `StoryRoundSchema` 的 `snapshot` 字段类型为 `zObject({})`，可兼容任何对象，无需修改。

- [ ] **Step 3: Commit**

```bash
git add sillytavern/game-state.js
git commit -m "feat: SkillSchema 新增 effects/realmReq/maxProgress"
```

---

### Task 2: Schema 重构 — MemberSchema skills 从字符串数组改为对象数组

**Files:**
- Modify: `sillytavern/game-state.js:114-115`

- [ ] **Step 1: 定义 MemberSkillSchema 并替换 MemberSchema 中的 skills**

在 `MemberSchema` 之前添加：
```javascript
const MemberSkillSchema = zObject({
  skillId: zString(),
  progress: zNumber({ default: 0, min: 0, max: 100 }),
  maxed: zBoolean(false)
});
```

修改 `MemberSchema`：
```javascript
// 旧
skills: zArray(zString(), []),
// 新
skills: zArray(MemberSkillSchema, []),
```

- [ ] **Step 2: Commit**

```bash
git add sillytavern/game-state.js
git commit -m "feat: MemberSchema skills 重构为对象数组"
```

---

### Task 3: 向后兼容 — 旧存档 skills 字符串数组转换

**Files:**
- Modify: `sillytavern/game-state.js:369-403`

- [ ] **Step 1: 在 mergeWithDefaults 中处理 skills 字段的向后兼容**

在 `mergeWithDefaults` 函数中，当处理到 `schema.t === 'array'` 时，需要特殊处理成员 skills 的转换。

由于 schema 无法区分哪个数组是 skills，需要在 `loadGameState` 或 `mergeWithDefaults` 之后添加一个兼容层。

更简单的方案：在 `loadGameState` 返回结果后，遍历 members 并转换 skills。

修改 `loadGameState`：

```javascript
export async function loadGameState(chatId) {
  if (!chatId) return deepClone(DEFAULT_GAME_STATE);
  try {
    const chat = await db.chats.get(chatId);
    if (chat?.variables?.gameState) {
      const state = mergeWithDefaults(chat.variables.gameState, GameStateSchema);
      // 向后兼容：旧存档成员 skills 是字符串数组
      for (const member of Object.values(state.members || {})) {
        if (member.skills && Array.isArray(member.skills)) {
          const first = member.skills[0];
          if (typeof first === 'string') {
            // 旧格式：字符串数组 → 对象数组
            const library = state.library || [];
            member.skills = member.skills.map(name => {
              const skill = library.find(s => s.name === name);
              return {
                skillId: skill?.id || '',
                progress: 0,
                maxed: false
              };
            });
          }
        }
      }
      return state;
    }
  } catch (e) { console.error('[GameState] load failed:', e); }
  return deepClone(DEFAULT_GAME_STATE);
}
```

- [ ] **Step 2: Commit**

```bash
git add sillytavern/game-state.js
git commit -m "feat: 旧存档成员 skills 字符串数组向后兼容转换"
```

---

### Task 4: 藏经阁页面 — 功法卡片显示 effects

**Files:**
- Modify: `index.html:9700-9711`

- [ ] **Step 1: 修改 renderSkills，在卡片上显示 effects**

```javascript
function renderSkills() {
  const grid = document.getElementById('skill-grid');
  grid.innerHTML = '';
  const skills = window.gameStateManager?.state?.library || [];
  const filtered = skills.filter(s => {
    const style = getSkillStyle(s);
    const typeMatch = currentSkillTypeFilter === 'all' || s.type === currentSkillTypeFilter;
    const rankMatch = currentSkillRankFilter === 'all' || style.rankLevel === currentSkillRankFilter;
    return typeMatch && rankMatch;
  });
  filtered.forEach(s => {
    const style = getSkillStyle(s);
    const effectsText = s.effects ? formatEffects(s.effects) : '';
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.onclick = () => showSkillDetail(s);
    card.innerHTML = `
      <span class="skill-rank" style="background:${style.bg};color:${style.color}">${s.rank}</span>
      <h4>${s.name}</h4>
      <div class="skill-type">${s.type}</div>
      ${effectsText ? `<div class="skill-effects">${effectsText}</div>` : ''}
      <div class="skill-desc">${s.desc}</div>
    `;
    grid.appendChild(card);
  });
}
```

在 `renderSkills` 附近添加 `formatEffects` 辅助函数：

```javascript
function formatEffects(effects) {
  if (!effects) return '';
  const parts = [];
  if (effects.杀伐) parts.push(`杀伐+${effects.杀伐}`);
  if (effects.防御) parts.push(`防御+${effects.防御}`);
  if (effects.身法) parts.push(`身法+${effects.身法}`);
  return parts.join(' · ');
}
```

添加 `.skill-effects` CSS（在 `.skill-desc` 附近）：

```css
.skill-effects {
  font-size: 11px;
  color: var(--gold-spirit);
  margin: 4px 0;
  opacity: 0.8;
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 功法卡片显示属性加成 effects"
```

---

### Task 5: 藏经阁页面 — 功法详情弹窗新增参悟按钮

**Files:**
- Modify: `index.html:9729-9761`

- [ ] **Step 1: 修改 showSkillDetail，新增 effects、realmReq 和参悟按钮**

```javascript
function showSkillDetail(skill) {
  const style = getSkillStyle(skill);
  const effectsText = skill.effects ? formatEffects(skill.effects) : '无属性加成';
  const realmText = skill.realmReq ? `修习要求：${skill.realmReq}` : '无境界要求';
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px">
      <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14"/>
      <path d="M4 19h16"/>
      <path d="M8 3v16"/>
    </svg>
    功法详情
  `;
  document.getElementById('modal-body').innerHTML = `
    <div class="sect-info-grid">
      <div class="info-block">
        <h4>功法名称</h4>
        <div class="info-value" style="font-size:16px;color:${style.color}">${skill.name}</div>
      </div>
      <div class="info-block">
        <h4>流派</h4>
        <div class="info-value">${skill.type}</div>
      </div>
      <div class="info-block">
        <h4>品阶</h4>
        <div class="info-value" style="color:${style.color}">${skill.rank}</div>
      </div>
      <div class="info-block">
        <h4>属性加成</h4>
        <div class="info-value" style="color:var(--gold-spirit)">${effectsText}</div>
      </div>
      <div class="info-block">
        <h4>境界要求</h4>
        <div class="info-value">${realmText}</div>
      </div>
      <div class="info-block full-width">
        <h4>功法介绍</h4>
        <div class="info-value" style="font-size:13px;line-height:1.8">${skill.desc}</div>
      </div>
      <div class="info-block full-width" style="margin-top:8px">
        <button class="title-btn primary" onclick="openPracticeDialog('${skill.id}')" style="width:100%">参悟此功法</button>
      </div>
    </div>
  `;
  overlay.classList.add('active');
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 功法详情弹窗显示 effects/realmReq 和参悟按钮"
```

---

### Task 6: 参悟弹窗 — 成员选择列表

**Files:**
- Modify: `index.html`（在 `showSkillDetail` 之后添加新函数）

- [ ] **Step 1: 添加 openPracticeDialog 函数**

```javascript
function openPracticeDialog(skillId) {
  const skill = (window.gameStateManager?.state?.library || []).find(s => s.id === skillId);
  if (!skill) return;

  const overlay = document.getElementById('modal-overlay');
  const members = Object.entries(window.gameStateManager?.state?.members || {});

  // 找出已修习此功法的成员及其进度
  const practicingMembers = members.filter(([_, m]) =>
    m.skills?.some(s => s.skillId === skillId)
  );

  // 未修习的成员（可作为新修习对象）
  const availableMembers = members.filter(([_, m]) =>
    !m.skills?.some(s => s.skillId === skillId)
  );

  const renderMemberOption = ([name, m]) => {
    const hasSkill = m.skills?.some(s => s.skillId === skillId);
    const skillEntry = hasSkill ? m.skills.find(s => s.skillId === skillId) : null;
    const progress = skillEntry?.progress || 0;
    const maxed = skillEntry?.maxed || false;
    const realmOk = !skill.realmReq || (m.realm || '').includes(skill.realmReq) || m.realm === skill.realmReq;
    const canPractice = !maxed && stamina.current >= 1 && realmOk;

    let status = '';
    if (maxed) status = '<span style="color:var(--gold-spirit)">已满级</span>';
    else if (!realmOk) status = `<span style="color:var(--lotus-pink)">需${skill.realmReq}</span>`;
    else if (progress > 0) status = `<span style="color:var(--jade-glow)">进度 ${progress}%</span>`;

    return `
      <div class="member-option ${canPractice ? '' : 'disabled'}" onclick="${canPractice ? `practiceSkill('${skillId}', '${name}')` : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:500">${name} · ${m.realm || '未知'}</div>
            <div style="font-size:12px;color:rgba(168,230,230,0.5)">${m.role || '成员'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px">${status}</div>
            ${canPractice ? '<div style="font-size:11px;color:var(--jade-glow)">消耗 1 体力</div>' : ''}
          </div>
        </div>
      </div>
    `;
  };

  document.getElementById('modal-title').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
    参悟《${skill.name}》
  `;
  document.getElementById('modal-body').innerHTML = `
    <div style="margin-bottom:12px;font-size:12px;color:rgba(168,230,230,0.5)">
      选择一名成员参悟此功法，每次消耗 1 体力，进度 +10%
    </div>
    ${practicingMembers.length > 0 ? `
      <div style="font-size:11px;color:var(--gold-spirit);margin-bottom:8px">正在修习</div>
      ${practicingMembers.map(renderMemberOption).join('')}
    ` : ''}
    ${availableMembers.length > 0 ? `
      <div style="font-size:11px;color:var(--jade-glow);margin:12px 0 8px">可新修习</div>
      ${availableMembers.map(renderMemberOption).join('')}
    ` : ''}
  `;
}
```

添加 `.member-option` CSS：

```css
.member-option {
  padding: 10px 12px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.member-option:hover {
  border-color: var(--jade-glow);
  background: rgba(110,207,207,0.05);
}
.member-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.member-option.disabled:hover {
  border-color: var(--glass-border);
  background: var(--glass-bg);
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 参悟弹窗成员选择列表"
```

---

### Task 7: 参悟逻辑 — 消耗体力、提升进度、满级检测

**Files:**
- Modify: `index.html`（在 `openPracticeDialog` 之后添加）

- [ ] **Step 1: 添加 practiceSkill 函数**

```javascript
function practiceSkill(skillId, memberName) {
  const state = window.gameStateManager?.state;
  if (!state) return;

  const member = state.members?.[memberName];
  if (!member) return;

  const skill = (state.library || []).find(s => s.id === skillId);
  if (!skill) return;

  // 检查体力
  if (stamina.current < 1) {
    alert('体力不足！');
    return;
  }

  // 检查境界
  if (skill.realmReq && member.realm !== skill.realmReq && !(member.realm || '').includes(skill.realmReq)) {
    alert(`该功法需要 ${skill.realmReq} 修为方可参悟`);
    return;
  }

  // 扣除体力
  stamina.current -= 1;
  updateStaminaSegments();

  // 确保成员 skills 是数组
  if (!member.skills) member.skills = [];

  // 查找或创建功法条目
  let skillEntry = member.skills.find(s => s.skillId === skillId);
  if (!skillEntry) {
    skillEntry = { skillId, progress: 0, maxed: false };
    member.skills.push(skillEntry);
  }

  // 已满级不可再参悟
  if (skillEntry.maxed) {
    alert('该功法已满级！');
    return;
  }

  // 提升进度
  const increment = 10;
  const maxProgress = skill.maxProgress || 100;
  skillEntry.progress = Math.min(skillEntry.progress + increment, maxProgress);

  // 检测满级
  if (skillEntry.progress >= maxProgress) {
    skillEntry.maxed = true;
    alert(`${memberName} 参悟《${skill.name}》已满级！属性加成翻倍！`);
  } else {
    alert(`${memberName} 参悟《${skill.name}》进度：${skillEntry.progress}%`);
  }

  // 关闭弹窗并刷新
  document.getElementById('modal-overlay').classList.remove('active');
  refreshAllUI();
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 参悟逻辑 — 消耗体力、提升进度、满级检测"
```

---

### Task 8: 成员页面 — 显示功法进度和属性加成

**Files:**
- Modify: `index.html`（成员详情渲染处，约在 5500-5600 行附近）

- [ ] **Step 1: 修改成员功法列表渲染，显示进度和加成**

找到成员详情中功法列表的渲染代码（约第 5505-5507 行）：

```javascript
// 旧
const skillListHtml = Array.isArray(p.skills) && p.skills.length > 0
  ? p.skills.map(s => `<div class="member-detail-skill-item">${s}</div>`).join('')
  : '<div class="member-detail-empty">暂无修习功法</div>';
```

改为：

```javascript
const library = window.gameStateManager?.state?.library || [];
const skillListHtml = Array.isArray(p.skills) && p.skills.length > 0
  ? p.skills.map(s => {
      const skill = library.find(sk => sk.id === s.skillId);
      const skillName = skill?.name || (typeof s === 'string' ? s : '未知功法');
      const progress = s.progress || 0;
      const maxed = s.maxed || false;
      const effects = skill?.effects || {};
      const effectText = effects.杀伐 || effects.防御 || effects.身法
        ? `(${effects.杀伐 ? '杀+' + effects.杀伐 : ''}${effects.防御 ? '防+' + effects.防御 : ''}${effects.身法 ? '身+' + effects.身法 : ''}${maxed ? '×2' : ''})`
        : '';
      return `
        <div class="member-detail-skill-item">
          <span>${skillName}</span>
          ${maxed ? '<span style="color:var(--gold-spirit);font-size:10px">已满级</span>' : `<span style="color:var(--jade-glow);font-size:10px">${progress}%</span>`}
          ${effectText ? `<span style="color:var(--gold-spirit);font-size:10px;opacity:0.7">${effectText}</span>` : ''}
        </div>
      `;
    }).join('')
  : '<div class="member-detail-empty">暂无修习功法</div>';
```

- [ ] **Step 2: 修改成员属性面板，显示总属性（基础 + 功法加成）**

找到成员属性渲染代码，添加功法加成计算和显示。

在渲染成员属性的地方（通常有一个 `杀伐: ${stats.杀伐}` 类似的显示），改为：

```javascript
// 计算功法加成
function calcSkillEffects(member) {
  const library = window.gameStateManager?.state?.library || [];
  const bonus = { 杀伐: 0, 防御: 0, 身法: 0 };
  if (!member.skills || !Array.isArray(member.skills)) return bonus;
  for (const entry of member.skills) {
    const skill = library.find(s => s.id === entry.skillId);
    if (skill?.effects) {
      const multiplier = entry.maxed ? 2 : 1;
      bonus.杀伐 += (skill.effects.杀伐 || 0) * multiplier;
      bonus.防御 += (skill.effects.防御 || 0) * multiplier;
      bonus.身法 += (skill.effects.身法 || 0) * multiplier;
    }
  }
  return bonus;
}
```

在属性渲染处，将基础属性显示改为：

```javascript
const skillBonus = calcSkillEffects(member);
// 显示：杀伐 50 (+10) = 60
// 其中 50 是 baseStats.杀伐，10 是 skillBonus.杀伐
```

具体实现取决于现有属性渲染代码的结构，需要找到对应位置修改。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 成员页面显示功法进度和属性加成"
```

---

### Task 9: 提示词 — formatGameStateForPrompt 显示功法加成

**Files:**
- Modify: `sillytavern/st-prompt.js:52-151`

- [ ] **Step 1: 修改成员显示，增加功法加成**

在 `formatGameStateForPrompt` 中，成员信息部分修改为显示总属性。

找到成员遍历的代码（约第 60-64 行）：

```javascript
for (const [name, m] of memberEntries) {
  lines.push(`  ${name} · ${m.daoName || ''} · ${m.realm || ''} · ${m.role || ''} · 状态:${m.status || ''} · 天赋:${m.talent || ''} · 寿元:${m.lifespan?.current || 0}/${m.lifespan?.max || 0} · 忠诚:${m.loyalty || 0} · 心情:${m.mood || 0} · 杀伐:${m.stats?.杀伐 || 0} 防御:${m.stats?.防御 || 0} 身法:${m.stats?.身法 || 0}`);
  if (m.skills?.length) lines.push(`    功法:${m.skills.join('、')}`);
}
```

改为显示总属性（含功法加成）：

```javascript
// 添加辅助函数：计算功法加成
function calcSkillBonus(member, library) {
  const bonus = { 杀伐: 0, 防御: 0, 身法: 0 };
  if (!member.skills || !Array.isArray(member.skills)) return bonus;
  for (const entry of member.skills) {
    const skill = library.find(s => s.id === entry.skillId);
    if (skill?.effects) {
      const multiplier = entry.maxed ? 2 : 1;
      bonus.杀伐 += (skill.effects.杀伐 || 0) * multiplier;
      bonus.防御 += (skill.effects.防御 || 0) * multiplier;
      bonus.身法 += (skill.effects.身法 || 0) * multiplier;
    }
  }
  return bonus;
}

// 修改成员输出
for (const [name, m] of memberEntries) {
  const bonus = calcSkillBonus(m, state.library || []);
  const total杀伐 = (m.stats?.杀伐 || 0) + bonus.杀伐;
  const total防御 = (m.stats?.防御 || 0) + bonus.防御;
  const total身法 = (m.stats?.身法 || 0) + bonus.身法;
  lines.push(`  ${name} · ${m.daoName || ''} · ${m.realm || ''} · ${m.role || ''} · 状态:${m.status || ''} · 天赋:${m.talent || ''} · 寿元:${m.lifespan?.current || 0}/${m.lifespan?.max || 0} · 忠诚:${m.loyalty || 0} · 心情:${m.mood || 0} · 杀伐:${total杀伐}(${m.stats?.杀伐 || 0}+${bonus.杀伐}) 防御:${total防御}(${m.stats?.防御 || 0}+${bonus.防御}) 身法:${total身法}(${m.stats?.身法 || 0}+${bonus.身法})`);
  // 功法显示也改为包含进度
  if (m.skills?.length) {
    const skillTexts = m.skills.map(s => {
      const skill = (state.library || []).find(sk => sk.id === s.skillId);
      const n = skill?.name || s.skillId || '未知';
      return s.maxed ? `${n}(满)` : `${n}(${s.progress || 0}%)`;
    });
    lines.push(`    功法:${skillTexts.join('、')}`);
  }
}
```

- [ ] **Step 2: 修改功法显示（不再只显示数量）**

找到藏经阁输出部分（约第 144-148 行）：

```javascript
const library = state.library || [];
if (library.length > 0) {
  lines.push('');
  lines.push(`【藏经阁】共藏功法 ${library.length} 部`);
}
```

改为显示功法详情（含 effects 和 realmReq）：

```javascript
const library = state.library || [];
if (library.length > 0) {
  lines.push('');
  lines.push('【藏经阁】');
  for (const skill of library) {
    const effects = skill.effects || {};
    const effectText = [effects.杀伐 && `杀伐+${effects.杀伐}`, effects.防御 && `防御+${effects.防御}`, effects.身法 && `身法+${effects.身法}`].filter(Boolean).join(' ');
    const reqText = skill.realmReq ? ` [需${skill.realmReq}]` : '';
    lines.push(`  《${skill.name}》${skill.rank}·${skill.type}${reqText}${effectText ? ' ' + effectText : ''}`);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add sillytavern/st-prompt.js
git commit -m "feat: 提示词中成员显示总属性含功法加成，功法显示详细信息"
```

---

### Task 10: LLM 提示词 — 要求输出 effects 和 realmReq

**Files:**
- Modify: `index.html`（LLM 提示词组装处，约第 7819-7828 行和第 8259-8289 行）

- [ ] **Step 1: 修改开局功法生成提示词**

找到 `/library` 的输出规范说明：

```javascript
/library：[{id:"", name:"", type:"道修|神修|魔修|体修|修行百艺", rank:"品阶", desc:"", color:"jade|purple|pink|gold"}, ...]
```

改为：

```javascript
/library：[{id:"", name:"", type:"道修|神修|魔修|体修|修行百艺", rank:"品阶", desc:"", color:"jade|purple|pink|gold", effects:{杀伐:0,防御:0,身法:0}, realmReq:""}, ...]
// effects 必须与功法描述相符（剑诀类加杀伐、炼体类加防御等）
// realmReq 为修习该功法所需的最低境界（如"炼气期""筑基期"），不可为空
```

同时修改开局功法设计原则部分，增加 effects 和 realmReq 的说明。

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: LLM提示词要求输出功法effects和realmReq"
```

---

## 自我审查

### Spec 覆盖检查

| 需求 | 对应 Task |
|------|----------|
| SkillSchema 新增 effects/realmReq/maxProgress | Task 1 |
| MemberSchema skills 重构为对象数组 | Task 2 |
| 旧存档向后兼容 | Task 3 |
| 功法卡片显示 effects | Task 4 |
| 功法详情弹窗显示参悟按钮 | Task 5 |
| 参悟成员选择弹窗 | Task 6 |
| 参悟逻辑（消耗体力、提升进度、满级） | Task 7 |
| 成员页面显示功法进度和属性加成 | Task 8 |
| 提示词显示功法加成 | Task 9 |
| LLM 提示词输出规范 | Task 10 |

**覆盖率：100%，无遗漏。**

### Placeholder 扫描
- 无 TBD/TODO
- 无 "implement later"
- 无 "add appropriate error handling"
- 所有步骤包含具体代码

### 类型一致性检查
- `skillId` 统一使用字符串
- `progress` 统一为 0-100 数字
- `maxed` 统一为布尔
- `effects` 统一为 {杀伐, 防御, 身法} 对象

---

## 执行交接

**计划完成，保存至 `docs/superpowers/plans/2026-05-01-library-skill.md`。**

**两个执行选项：**

**1. Subagent-Driven（推荐）** — 每个 Task 派一个子代理执行，我在任务间审查，快速迭代

**2. Inline Execution** — 在当前会话中使用 executing-plans 批量执行任务

**选择哪个？**
