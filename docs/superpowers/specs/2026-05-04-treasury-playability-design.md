# 万宝阁可玩性增强 — 设计方案

## 概述

补齐万宝阁页面缺失的物品类型，新增预设库+自定义表单的新增能力，以及按类型区分的消耗/销毁交互。核心目标：**让玩家能主动管理宗门宝库，不再只是被动查看**。

---

## 一、标签页分组

### 主分组（3 个）

| 主标签 | 英文 key | 包含子类型 | 次级 pill 筛选 |
|--------|----------|-----------|---------------|
| **装备** | equipment | 武器、护具、遁具、饰品、法宝 | 全部 / 武器 / 护具 / 遁具 / 饰品 / 法宝 |
| **消耗品** | consumable | 丹药、材料 | 全部 / 丹药 / 材料 |
| **其他** | misc | 杂物 | （无需次级筛选） |

> 注：功法类型已在藏经阁独立管理，不在万宝阁展示；法宝作为可装备类型归入装备组。

### 顶部操作栏

- 左侧：搜索框（按名称筛选当前类型）
- 右侧：「新增物品」按钮

---

## 二、预设库与新增表单

### 预设库数据结构

硬编码在 JS 中，按类型分组，约 30-40 个预设：

```js
const TREASURY_PRESETS = {
  weapon: [
    { name: '青冥剑', type: '武器', rank: '黄阶上品', color: 'jade',
      effects: { 杀伐: 15, 防御: 0, 身法: 5 },
      description: '剑身泛着淡淡青光，锋利异常' },
    { name: '玄铁重剑', type: '武器', rank: '玄阶下品', color: 'purple',
      effects: { 杀伐: 25, 防御: 5, 身法: -5 },
      description: '以千年玄铁锻造，沉重无比，威力惊人' },
    // ... 每种类型 4-6 个
  ],
  armor: [...], escape: [...], accessory: [...], magic: [...],
  pill: [...], material: [...], misc: [...]
};
```

### 新增表单交互

点击「新增物品」弹出模态框，左右分栏（移动端上下堆叠）：

**左栏：预设库**
- 顶部 pill 切换类型（与当前主标签联动，默认选中）
- 网格展示该类型的预设卡片（名称 + 品阶 + 简效）
- 点击预设 → 右栏自动填充，可修改

**右栏：自定义表单**
- 名称（输入框，必填）
- 类型（下拉，9 个选项，必填）
- 品阶（输入框，默认「黄阶下品」）
- 配色（4 色单选：jade/purple/pink/gold）
- 效果（3 个数字输入：杀伐 / 防御 / 身法，默认 0）
- 介绍（多行文本）
- 数量（数字，默认 1，≥1）

**确认后**：直接 `insert` 到 `/treasury/items/-`，即时落库，页面刷新。

---

## 三、消耗交互

### 装备类（武器/护具/遁具/饰品/法宝）

详情弹窗操作：
- **分配/收回**（已有）
- **销毁**：红色按钮，二次确认后 `remove` 该条目。若该装备已分配给某成员，同步从成员 `equipment` 中移除对应项。

### 丹药类

详情弹窗操作：
- **服用**：点击后弹出成员选择对话框，选择目标成员后确认

**丹药效果分类**：

| 效果类型 | 目标字段 | 上限/规则 |
|---------|---------|---------|
| 心情 | `mood` | clamp 0-100 |
| 忠诚 | `loyalty` | clamp 0-100 |
| 寿元 | `lifespan.current` | min(lifespan.max, current + value)；**同种寿元丹每个角色只能服用一次** |
| 三维 | `baseStats.杀伐/防御/身法` | 直接叠加，永久加成 |

**丹药效果映射表**：

```js
const PILL_EFFECTS = {
  '疗伤丹':   { mood: 15, desc: '心情恢复' },
  '回灵丹':   { loyalty: 10, desc: '忠诚度提升' },
  '延寿丹':   { lifespan: 20, desc: '寿元增加', oncePerMember: true },
  '聚灵丹':   { mood: 10, loyalty: 5, desc: '身心俱泰' },
  '锻体丹':   { stats: { 杀伐: 5, 防御: 3 }, desc: '体魄增强' },
  '轻灵丹':   { stats: { 身法: 8 }, desc: '身法精进' },
  // 未匹配：仅数量-1，效果由 LLM 剧情驱动
};
```

**服用执行流程**（`consumePill`）：
1. 检查丹药数量 ≥ 1
2. 若效果含 `oncePerMember`：检查 `member.consumedPills` 是否包含丹药名称，已包含则拒绝
3. 应用效果 patch（mood/loyalty/lifespan/baseStats）
4. 有 `oncePerMember` 则将该丹药名称 insert 到 `member.consumedPills`
5. 丹药数量 -1，归零则 `remove` 条目
6. `addActionLog('服用丹药', '${memberName} 服用 ${pill.name}', effect.desc, 0)` — 不消耗体力
7. 弹出 Toast 提示结果

### 材料/杂物

详情弹窗操作：
- **消耗**：弹出数量输入框（max=当前库存），确认后扣减数量，归零则删除
- `addActionLog('消耗物品', '消耗 ${item.name} ×${qty}', '', 0)` — 不消耗体力

---

## 四、数据流与 Schema 变更

### 新增成员字段

```js
// MemberSchema 扩展
consumedPills: zArray(zString(), [])
// 用途：记录该成员已服用过的寿元丹药名称，用于 oncePerMember 限制
```

### 新增函数

| 函数 | 职责 |
|------|------|
| `addTreasuryItem(values)` | 校验表单，构造 item，insert 到 treasury/items |
| `consumePill(itemId, memberName)` | 执行丹药服用，应用效果，更新数量/删除 |
| `destroyItem(itemId)` | 销毁装备，二次确认，remove 条目 |
| `consumeMaterial(itemId, qty)` | 消耗材料/杂物，扣减数量，归零删除 |
| `openAddItemDialog()` | 打开新增物品模态框，渲染预设库+表单 |

### 状态变量扩展

```js
// 替换原来的 currentTreasuryType = 'weapon'
const treasuryState = {
  group: 'equipment',      // equipment | consumable | misc
  filter: 'all',           // all | weapon | armor | escape | accessory | magic | pill | material
  search: ''
};
```

---

## 五、边界情况

| 场景 | 行为 |
|------|------|
| 服用丹药时目标成员已离队 | 提示「该成员已不在宗门」，禁用选择 |
| 寿元丹重复服用 | 提示「此丹药对该角色已无效」，拒绝执行 |
| 消耗数量 > 库存 | 输入框限制 max=当前数量 |
| 销毁已分配装备 | 允许销毁，同步从成员 equipment 中移除 |
| 新增表单品阶/名称为空 | 确认按钮 disabled，提示必填 |
| 搜索无结果 | 显示空状态「暂无此类物品」 |
| LLM 处理中 | 所有操作按钮禁用（复用现有 `body.llm-processing`） |

---

## 六、移动端适配

- 主标签 3 个等分，次级 pill 横向滚动（`overflow-x: auto`）
- 新增表单：桌面左右分栏 → 移动端上下堆叠
- 成员选择对话框：列表项最小 48px 高度
- 搜索框：移动端全宽显示在标签下方

---

## 七、与现有系统的衔接

- 新增物品即时落库，无需 LLM 参与，与 `submitAddBuilding` 模式一致
- 丹药服用即时落库，与 `practiceSkill` 即时更新进度模式一致
- 操作日志通过 `addActionLog` 进入提示词，LLM 自动读取「近日操作」
- 成员三维计算已有 `calcMemberStats`，`baseStats` 修改后自动反映在总属性中
- 订阅机制复用现有的 `/treasury/items` subscribe，`renderTreasury` 自动刷新
