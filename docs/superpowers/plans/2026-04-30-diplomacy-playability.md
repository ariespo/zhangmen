# 合纵阁（外交页面）可玩性增强 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为外交页面（合纵阁）添加可交互操作（拜访/送礼/威逼/宣战），支持多选弟子派遣，每次消耗1体力，发送时构建外交提示词。

**Architecture:** 复刻山河页面疆域"采取行动"的交互模式。Schema 新增3个字段 → 卡片 UI 增强 → 新增4个交互函数 → 提示词构建集成 → 文档同步更新。

**Tech Stack:** Vanilla JS, 单文件 HTML (index.html), 自定义 Schema DSL (game-state.js)

---

## 文件变更总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `sillytavern/game-state.js` | 修改 | FactionSchema 新增 highestMember/discipleCount/controlledRegions |
| `index.html` | 修改（多处） | renderFactions 增强 + 4个新交互函数 + submitActions 提示词构建 |
| `VARIABLES.md` | 修改 | diplomacy 字段表补充3个新字段 |
| `LLM_FORMAT_SPEC.md` | 修改 | 外交势力示例和字段规范补充 |
| `LLM_REFERENCE.md` | 修改 | 外交对象 JSON 示例 + 路径列表补充 |

---

## Task 1: Schema 扩展

**Files:**
- Modify: `sillytavern/game-state.js:152-159`

- [ ] **Step 1: 修改 FactionSchema，新增3个字段**

将现有 `FactionSchema`：
```js
const FactionSchema = zObject({
  name: zString(),
  relation: zEnum(['盟友', '友好', '中立', '警惕', '敌对'], '中立'),
  value: zNumber({ default: 50, min: 0, max: 100 }),
  desc: zString(),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'gold'),
  leader: zString()
});
```

替换为：
```js
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
```

- [ ] **Step 2: Commit**

```bash
git add sillytavern/game-state.js
git commit -m "feat: FactionSchema 扩展 highestMember/discipleCount/controlledFields

为外交势力增加战略信息字段，支持合纵阁交互

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Task 2: 外交卡片 UI 增强

**Files:**
- Modify: `index.html:5891-5915` (renderFactions 函数)

- [ ] **Step 1: 重写 renderFactions 函数**

找到现有 `renderFactions` 函数（约 5891-5915 行），将其替换为增强版本：

```js
    function renderFactions() {
      const list = document.getElementById('faction-list');
      list.innerHTML = '';
      Object.values(window.gameStateManager.state.diplomacy).forEach(f => {
        const relColor = f.value >= 60 ? 'var(--jade-glow)' : f.value >= 40 ? 'var(--gold-spirit)' : 'var(--lotus-pink)';
        const relBg = f.value >= 60 ? 'rgba(110,207,207,0.12)' : f.value >= 40 ? 'rgba(200,168,110,0.12)' : 'rgba(212,114,140,0.12)';
        const hm = f.highestMember || {};
        const highestText = hm.name ? `${hm.name}|${hm.role || '—'}|${hm.realm || '—'}` : '—';
        const discipleText = f.discipleCount > 0 ? `${f.discipleCount}人` : '未知';
        const regionsText = (f.controlledRegions || []).length > 0 ? f.controlledRegions.join('、') : '暂无';
        const card = document.createElement('div');
        card.className = 'faction-card';
        card.innerHTML = `
          <div class="faction-header">
            <div class="faction-name">
              <svg viewBox="0 0 20 20" fill="none" stroke="${relColor}" stroke-width="1.2"><polygon points="10,2 17,7 14,16 6,16 3,7"/></svg>
              ${f.name}
            </div>
            <span class="relation-badge" style="background:${relBg};color:${relColor}">${f.relation}</span>
          </div>
          <div style="font-size:12px;color:rgba(168,230,230,0.5);margin-bottom:4px">掌权者：${f.leader}</div>
          <div style="font-size:12px;color:rgba(168,230,230,0.5);margin-bottom:4px">最高境界：${highestText} | 弟子数：${discipleText}</div>
          <div style="font-size:12px;color:rgba(168,230,230,0.5);margin-bottom:8px">疆域：${regionsText}</div>
          <div style="font-size:12px;color:rgba(168,230,230,0.6);margin-bottom:10px">${f.desc}</div>
          <div class="relation-bar">
            <div class="relation-fill" style="width:${f.value}%;background:${relColor}"></div>
          </div>
          <button class="region-explore-btn" style="margin-top:10px" onclick="event.stopPropagation();showFactionActions('${f.name}')">采取行动</button>
        `;
        list.appendChild(card);
      });
    }
```

注意：必须使用 `event.stopPropagation()` 阻止冒泡，避免与卡片上可能存在的其他点击事件冲突。

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 外交卡片 UI 增强 — 新增最高成员/弟子数/疆域信息 + 采取行动按钮

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Task 3: 外交交互函数

**Files:**
- Modify: `index.html`（在 `renderFactions` 函数之后插入新函数）

在 `renderFactions` 函数的闭合 `}`（约 5915 行）之后、`// ====== WORLD DATA ======` 注释之前插入以下4个新函数。

- [ ] **Step 1: 插入 showFactionActions**

```js
    function showFactionActions(factionName) {
      const state = window.gameStateManager?.state;
      if (!state) return;
      const f = state.diplomacy?.[factionName];
      if (!f) return;
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg> ${f.name} — 采取行动
      `;
      document.getElementById('modal-body').innerHTML = `
        <div style="font-size:13px;color:rgba(168,230,230,0.7);margin-bottom:16px">
          与 <span style="color:var(--gold-spirit);font-weight:600">${f.name}</span> 的关系为 <span style="color:var(--gold-spirit);font-weight:600">${f.relation}</span>（${f.value}/100）。
          <br>每次行动消耗 <span style="color:var(--jade-glow)">1 点体力</span>，需派遣弟子执行。
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="opportunity-btn primary" style="text-align:left;justify-content:flex-start"
            onclick="selectMembersForFactionAction('${factionName}', '拜访')">
            <span>拜访 — 派遣弟子前往建立友好联系，了解对方动态</span>
          </button>
          <button class="opportunity-btn primary" style="background:rgba(200,168,110,0.15);border-color:rgba(200,168,110,0.4);color:var(--gold-spirit);text-align:left;justify-content:flex-start"
            onclick="selectMembersForFactionAction('${factionName}', '送礼')">
            <span>送礼 — 携带宗门礼物，尝试提升外交关系</span>
          </button>
          <button class="opportunity-btn primary" style="background:rgba(212,114,140,0.15);border-color:rgba(212,114,140,0.4);color:var(--lotus-pink);text-align:left;justify-content:flex-start"
            onclick="selectMembersForFactionAction('${factionName}', '威逼')">
            <span>威逼 — 展示实力，向对方施压</span>
          </button>
          <button class="opportunity-btn primary" style="background:rgba(255,107,107,0.15);border-color:rgba(255,107,107,0.4);color:#ff6b6b;text-align:left;justify-content:flex-start"
            onclick="selectMembersForFactionAction('${factionName}', '宣战')">
            <span>宣战 — 正式宣战，大幅降低关系值</span>
          </button>
        </div>
        <div class="building-actions" style="margin-top:16px">
          <button class="opportunity-btn secondary" onclick="closeModal()">取消</button>
        </div>
      `;
      overlay.classList.add('active');
    }
```

- [ ] **Step 2: 插入 selectMembersForFactionAction**

```js
    function selectMembersForFactionAction(factionName, actionType) {
      const state = window.gameStateManager?.state;
      if (!state) return;
      const f = state.diplomacy?.[factionName];
      if (!f) return;
      const members = state.members || {};
      const assigned = getAssignedMembersThisRound();
      const available = Object.values(members).filter(m => {
        if (m.status === '外出' || m.status === '闭关' || m.status === '死亡') return false;
        if (assigned.has(m.name)) return false;
        return true;
      });
      const overlay = document.getElementById('modal-overlay');
      const actionLabels = { '拜访': '拜访', '送礼': '送礼', '威逼': '威逼', '宣战': '宣战' };
      const actionColors = { '拜访': 'var(--jade-glow)', '送礼': 'var(--gold-spirit)', '威逼': 'var(--lotus-pink)', '宣战': '#ff6b6b' };
      if (available.length === 0) {
        document.getElementById('modal-body').innerHTML = `
          <div style="font-size:13px;color:rgba(168,230,230,0.7);text-align:center;padding:20px 0">
            没有可用的弟子可派遣。
            <br><span style="font-size:12px;color:rgba(168,230,230,0.4)">（弟子可能已外出、闭关、死亡，或在本轮已被分配其他任务）</span>
          </div>
          <div class="building-actions">
            <button class="opportunity-btn secondary" onclick="closeModal()">关闭</button>
          </div>
        `;
        overlay.classList.add('active');
        return;
      }
      const containerId = 'faction-member-select-' + Date.now();
      document.getElementById('modal-title').innerHTML = `选择执行「${actionLabels[actionType]}」的弟子`;
      document.getElementById('modal-body').innerHTML = `
        <div style="font-size:13px;color:rgba(168,230,230,0.7);margin-bottom:12px">
          选择派遣至 <span style="color:${actionColors[actionType]}">${f.name}</span> 执行${actionLabels[actionType]}的弟子（可多选）：
        </div>
        <div id="${containerId}" style="display:flex;flex-direction:column;gap:8px">
          ${available.map((m) => `
            <div class="opportunity-btn secondary member-select-row" data-name="${m.name}"
              style="text-align:left;justify-content:flex-start;cursor:pointer;position:relative;padding-left:36px"
              onclick="toggleMemberSelect(this)"
            >
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;border:1.5px solid rgba(110,207,207,0.4);border-radius:3px;display:flex;align-items:center;justify-content:center"
                class="member-check-box"
              >&#x200b;</span>
              <span>${m.name}（${m.realm}）— 忠诚度${m.loyalty} | 杀伐${m.stats?.杀伐 || 0} | 身法${m.stats?.身法 || 0}</span>
            </div>
          `).join('')}
        </div>
        <div class="building-actions" style="margin-top:16px">
          <button class="opportunity-btn secondary" onclick="closeModal()">取消</button>
          <button class="opportunity-btn primary" onclick="confirmFactionMembers('${factionName}', '${actionType}', '${containerId}')">确认派遣</button>
        </div>
      `;
      overlay.classList.add('active');
    }
```

注意：`toggleMemberSelect` 函数已在山河页面中定义（约 6455-6471 行），直接复用，无需重新定义。

- [ ] **Step 3: 插入 confirmFactionMembers**

```js
    function confirmFactionMembers(factionName, actionType, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const selected = Array.from(container.querySelectorAll('.member-select-row.selected')).map(el => el.dataset.name);
      if (selected.length === 0) {
        alert('请至少选择一名弟子');
        return;
      }
      executeFactionAction(factionName, actionType, selected);
      closeModal();
    }
```

- [ ] **Step 4: 插入 executeFactionAction**

```js
    function executeFactionAction(factionName, actionType, memberNames) {
      const state = window.gameStateManager?.state;
      if (!state) return;
      const f = state.diplomacy?.[factionName];
      if (!f) return;
      const names = Array.isArray(memberNames) ? memberNames : [memberNames];
      const namesText = names.join('、');
      const content = `派遣 ${namesText} 前往 ${f.name}（掌权者：${f.leader || '未知'}）执行${actionType}`;
      const success = addActionLog(actionType, f.name, content, 1, { memberNames: names, factionName: factionName });
      if (!success) return;
      alert(`${namesText} 已受命前往 ${f.name} 执行${actionType}。提交操作后将由天道推演结果。`);
    }
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: 外交页面交互 — 拜访/送礼/威逼/宣战 + 多选弟子派遣

复刻山河页面疆域采取行动交互模式：
- showFactionActions: 操作选择弹窗
- selectMembersForFactionAction: 多选可用弟子
- confirmFactionMembers: 确认选择
- executeFactionAction: 消耗体力并写入 actionLog

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Task 4: 外交操作提示词构建

**Files:**
- Modify: `index.html:8117-8118`（在"非玩家疆域行动特殊提示词"块之后、"建筑操作特殊提示词"块之前插入）

- [ ] **Step 1: 插入外交操作提示词构建逻辑**

找到 `index.html` 中约 8117 行（非玩家疆域行动提示词块的闭合 `}` 之后），在 `// 建筑操作特殊提示词` 注释之前插入：

```js
      // 外交行动特殊提示词
      const factionActionLogs = actionLogs.filter(log => ['拜访', '送礼', '威逼', '宣战'].includes(log.type));
      if (factionActionLogs.length > 0) {
        for (const log of factionActionLogs) {
          const factionName = log.factionName;
          const f = window.gameStateManager?.state?.diplomacy?.[factionName];
          if (!f) continue;
          const names = log.memberNames || [];
          const allMembers = window.gameStateManager?.state?.members || {};
          const memberDetails = names.map(n => {
            const m = allMembers[n];
            if (!m) return `「${n}」（信息未知）`;
            const personality = (m.personality || []).join('、') || '未知';
            const appearance = (m.appearance || []).join('、') || '未知';
            return `「${n}」（${m.realm}，${m.gender || '未知'}）\n  性格：${personality}\n  外貌：${appearance}\n  忠诚度：${m.loyalty || '未知'} | 心情：${m.mood || '未知'}`;
          }).join('\n');
          const hm = f.highestMember || {};
          const highestText = hm.name ? `${hm.name}|${hm.role || '—'}|${hm.realm || '—'}` : '未知';
          const regionsText = (f.controlledRegions || []).length > 0 ? f.controlledRegions.join('、') : '暂无';
          userInput += `\n\n【外交行动】${playerName}决定派遣弟子前往「${f.name}」进行${log.type}。\n\n派遣弟子：\n${memberDetails}\n\n对方宗门信息：\n- 势力名称：${f.name}\n- 掌权者：${f.leader || '未知'}\n- 最高境界成员：${highestText}\n- 弟子数：${f.discipleCount > 0 ? f.discipleCount + '人' : '未知'}\n- 掌握疆域：${regionsText}\n- 与玩家关系：${f.relation}\n- 关系值：${f.value}/100\n\n请设计一段剧情来交代这个行动，需要交代：\n1. 行动本身的过程（弟子如何抵达、如何展开行动）\n2. 对方宗门的反应和表现\n3. 行动对双方关系的影响\n4. 弟子的表现和可能的成长`;
        }
      }
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 外交操作提示词构建 — 拜访/送礼/威逼/宣战

submitActions 中新增外交行动特殊提示词：
- 列出派遣弟子的完整信息（境界、性别、性格、外貌、忠诚度、心情）
- 列出对方宗门完整信息（掌权者、最高成员、弟子数、疆域、关系）
- 要求 LLM 设计剧情交代行动过程、对方反应、关系影响、弟子成长

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Task 5: VARIABLES.md 更新

**Files:**
- Modify: `VARIABLES.md:241-261`

- [ ] **Step 1: 扩展 diplomacy 字段表**

找到 VARIABLES.md 中 diplomacy 字段表（约 241-248 行），将：
```markdown
| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `name` | string | `""` | — | 势力名（与 Record key 相同） |
| `relation` | enum | `"中立"` | 盟友/友好/中立/警惕/敌对 | 关系等级 |
| `value` | number | `50` | 0–100 | 关系值 |
| `desc` | string | `""` | — | 关系描述 |
| `color` | enum | `"gold"` | jade/purple/pink/gold | UI 配色 |
| `leader` | string | `""` | — | 掌权者 |
```

替换为：
```markdown
| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `name` | string | `""` | — | 势力名（与 Record key 相同） |
| `relation` | enum | `"中立"` | 盟友/友好/中立/警惕/敌对 | 关系等级 |
| `value` | number | `50` | 0–100 | 关系值 |
| `desc` | string | `""` | — | 关系描述 |
| `color` | enum | `"gold"` | jade/purple/pink/gold | UI 配色 |
| `leader` | string | `""` | — | 掌权者 |
| `highestMember.name` | string | `""` | — | 最高境界成员姓名 |
| `highestMember.role` | string | `""` | — | 最高境界成员职位 |
| `highestMember.realm` | string | `""` | — | 最高境界成员境界 |
| `discipleCount` | number | `0` | ≥0 | 弟子总人数 |
| `controlledRegions` | string[] | `[]` | — | 掌控的疆域名称列表 |
```

同时，在新增势力示例（约 260 行）中更新示例值：

将：
```xml
<vars>[{"op":"insert","path":"/diplomacy/青云宗","value":{"name":"青云宗","relation":"中立","value":50,"desc":"新兴宗门，态度暧昧","color":"gold","leader":"宗主·青云子"}}]</vars>
```

替换为：
```xml
<vars>[{"op":"insert","path":"/diplomacy/青云宗","value":{"name":"青云宗","relation":"中立","value":50,"desc":"新兴宗门，态度暧昧","color":"gold","leader":"宗主·青云子","highestMember":{"name":"青云子","role":"宗主","realm":"元婴期圆满"},"discipleCount":128,"controlledRegions":["青云峰","翠竹林"]}}]</vars>
```

- [ ] **Step 2: Commit**

```bash
git add VARIABLES.md
git commit -m "docs: VARIABLES.md 外交势力字段补充 highestMember/discipleCount/controlledRegions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Task 6: LLM_REFERENCE.md 更新

**Files:**
- Modify: `LLM_REFERENCE.md:161-180`（外交对象 JSON 示例）
- Modify: `LLM_REFERENCE.md:391-400`（diplomacy 路径列表）

- [ ] **Step 1: 更新外交对象 JSON 示例**

找到 `LLM_REFERENCE.md` 约 161-177 行的外交对象示例，将：
```json
{
  "name": "",
  "relation": "中立",
  "value": 50,
  "desc": "",
  "color": "gold",
  "leader": ""
}
```

替换为：
```json
{
  "name": "",
  "relation": "中立",
  "value": 50,
  "desc": "",
  "color": "gold",
  "leader": "",
  "highestMember": {
    "name": "",
    "role": "",
    "realm": ""
  },
  "discipleCount": 0,
  "controlledRegions": []
}
```

- [ ] **Step 2: 更新 diplomacy 路径列表**

找到 `LLM_REFERENCE.md` 约 391-400 行的 diplomacy 路径列表，将：
```
/diplomacy/{势力名}
/diplomacy/{势力名}/name
/diplomacy/{势力名}/relation
/diplomacy/{势力名}/value
/diplomacy/{势力名}/desc
/diplomacy/{势力名}/leader
```

替换为：
```
/diplomacy/{势力名}
/diplomacy/{势力名}/name
/diplomacy/{势力名}/relation
/diplomacy/{势力名}/value
/diplomacy/{势力名}/desc
/diplomacy/{势力名}/leader
/diplomacy/{势力名}/highestMember/name
/diplomacy/{势力名}/highestMember/role
/diplomacy/{势力名}/highestMember/realm
/diplomacy/{势力名}/discipleCount
/diplomacy/{势力名}/controlledRegions
/diplomacy/{势力名}/controlledRegions/-   // 追加疆域
```

- [ ] **Step 3: Commit**

```bash
git add LLM_REFERENCE.md
git commit -m "docs: LLM_REFERENCE.md 外交对象扩展新字段与路径

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Task 7: LLM_FORMAT_SPEC.md 更新

**Files:**
- Modify: `LLM_FORMAT_SPEC.md`（找到外交影响分析示例和变量更新示例中的 diplomacy 部分）

- [ ] **Step 1: 在分析模块外交影响示例中补充新字段**

找到 `LLM_FORMAT_SPEC.md` 中 `<analysis>` 示例的外交影响部分（约第 402 行附近），将示例中：
```
3. 外交影响：与天剑宗关系恶化，关系值-5
```

保持原样（分析模块不要求字段级细节，保持简洁）。

在 `<vars>` 示例中（约第 413 行），将：
```json
  {"op":"delta","path":"/diplomacy/天剑宗/value","value":"-5"}
```

保持原样。

新增一段外交势力字段规范说明（在文件合适位置，例如"疆域字段规范"之后）：

在 `LLM_FORMAT_SPEC.md` 中找到 `### 5.6 疆域字段规范` 部分，在其后插入：

```markdown
### 5.7 外交势力字段规范

新增或更新外交势力 `/diplomacy/{势力名}` 时，除原有字段外，还应尽量填充以下字段以增强沉浸感：

```json
{
  "highestMember": {
    "name": "最高境界成员姓名",
    "role": "职位，如掌门/长老/宗主",
    "realm": "境界，如金丹期后期"
  },
  "discipleCount": 128,
  "controlledRegions": ["疆域名1", "疆域名2"]
}
```

- `highestMember`：该势力最高境界的1名代表人物，用于外交情报展示
- `discipleCount`：弟子总人数，反映势力规模
- `controlledRegions`：掌控的疆域名称列表，应与 `world.regions` 中的 `controlledBy` 保持一致
```

- [ ] **Step 2: Commit**

```bash
git add LLM_FORMAT_SPEC.md
git commit -m "docs: LLM_FORMAT_SPEC.md 新增外交势力字段规范

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## 实施自检清单

实施完成后，手动验证以下场景：

1. **Schema 验证**：新游戏开局时， diplomacy 数据能正确通过 mergeWithDefaults 并包含新字段的默认值
2. **卡片展示**：外交页面显示势力卡片，包含"最高境界"、"弟子数"、"疆域"三行信息
3. **交互流程**：点击"采取行动" → 选择"拜访" → 多选弟子 → 确认 → 体力-1 → actionLog 中出现记录
4. **撤回功能**：在操作记录面板中点击"撤回"，体力恢复，actionLog 移除该记录
5. **提示词构建**：提交操作时，Network 面板中 userInput 包含完整的外交行动提示词段落
6. **移动端适配**：≤768px 下卡片信息不换行溢出，按钮可正常点击

---

## Spec 覆盖检查

| Spec 要求 | 对应任务 |
|-----------|---------|
| FactionSchema 新增 highestMember | Task 1 |
| FactionSchema 新增 discipleCount | Task 1 |
| FactionSchema 新增 controlledRegions | Task 1 |
| 卡片展示最高境界成员 | Task 2 |
| 卡片展示弟子数 | Task 2 |
| 卡片展示掌握疆域 | Task 2 |
| 卡片"采取行动"按钮 | Task 2 |
| 操作选择弹窗（拜访/送礼/威逼/宣战） | Task 3 Step 1 |
| 多选弟子派遣 | Task 3 Step 2 |
| 消耗1体力 | Task 3 Step 4 |
| 写入 actionLog | Task 3 Step 4 |
| 可撤回 | 复用现有 undoActionLog 机制 |
| 外交提示词构建 | Task 4 |
| VARIABLES.md 更新 | Task 5 |
| LLM_REFERENCE.md 更新 | Task 6 |
| LLM_FORMAT_SPEC.md 更新 | Task 7 |
| 世界书自动更新 | 复用 st-integration.js 自动读取 LLM_REFERENCE.md 机制 |

---

*Plan created: 2026-04-30*
