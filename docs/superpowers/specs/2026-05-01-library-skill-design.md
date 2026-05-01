# 藏经阁功法系统完善设计

## 背景

当前藏经阁（功法）系统仅为静态展示：功法只有 `id/name/type/rank/desc/color` 6个字段，UI 只有列表筛选 + 详情弹窗，没有任何操作交互。成员修习的功法只是纯文本列表，与藏经阁完全割裂，没有任何可玩性。

## 目标

1. 功法不再只是文本，而是对成员有实际属性加成
2. 成员功法与藏经阁建立直接关联（通过 skillId）
3. 玩家可通过"参悟"操作提升功法进度
4. 进度满后属性加成翻倍，形成成长感

## 数据结构变更

### SkillSchema（功法）

```javascript
const SkillSchema = zObject({
  id: zString(),
  name: zString(),
  type: zEnum(['道修', '神修', '魔修', '体修', '修行百艺'], '道修'),
  rank: zString('黄阶'),
  desc: zString(),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'jade'),
  // 新增字段
  effects: zObject({
    杀伐: zNumber({ default: 0 }),
    防御: zNumber({ default: 0 }),
    身法: zNumber({ default: 0 })
  }),
  realmReq: zString(''),              // 修习所需最低境界
  maxProgress: zNumber({ default: 100, min: 0 })
});
```

### MemberSchema（成员功法关联重构）

```javascript
const MemberSkillSchema = zObject({
  skillId: zString(),
  progress: zNumber({ default: 0, min: 0, max: 100 }),
  maxed: zBoolean(false)
});

// MemberSchema 中 skills 字段从 zArray(zString(), []) 改为：
skills: zArray(MemberSkillSchema, [])
```

### 向后兼容

旧存档加载时，将成员 `skills: string[]` 转换为 `MemberSkillSchema[]`：
- 通过功法名称匹配藏经阁中的 `skillId`
- 匹配不上的保留 `skillId: ''`，作为"未知功法"显示
- `progress` 默认为 0，`maxed` 默认为 false

## UI 交互设计

### 藏经阁页面

1. **功法卡片** — 在原有信息基础上新增 effects 显示（小图标+数值）
2. **功法详情弹窗** — 新增内容：
   - 境界要求（`realmReq`）
   - 属性加成详情（effects 具体数值）
   - "参悟"按钮
3. **参悟流程**：
   - 点击"参悟" → 弹出成员选择列表（显示成员名称、境界、体力）
   - 选择成员 → 检查境界限制 → 扣除1体力 → 进度+10 → 提示成功
   - 若成员未修习该功法 → 先添加到其修习列表
   - 若进度满100 → 显示"已满级"标记，effects 翻倍生效

### 成员页面

1. **功法列表** — 显示内容：
   - 功法名称
   - 进度条（0-100%）
   - 当前加成数值（基础/满级）
2. **属性面板** — 显示内容：
   - 基础属性（来自 `baseStats`）
   - 功法加成（来自 skills 的 effects 总和）
   - 总属性（基础 + 加成）

## 游戏机制

| 机制 | 规则 |
|------|------|
| 参悟消耗 | 1体力/次 |
| 进度增长 | +10/次 |
| 满级效果 | effects 全部 ×2 |
| 境界限制 | 成员境界 < 功法 `realmReq` → 不可参悟 |
| 属性计算 | 总属性 = `baseStats` + Σ(功法 effects × (`maxed` ? 2 : 1)) |

## 提示词变更

1. **开局生成** — LLM 生成功法时同时生成 `effects`（与功法描述相符）
2. **formatGameStateForPrompt** — 成员显示总属性（含功法加成）
3. **LLM 新增/更新功法** — 需包含 `effects` 和 `realmReq`

## 影响范围

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `sillytavern/game-state.js` | SkillSchema 新增 effects/realmReq/maxProgress；MemberSchema skills 重构；向后兼容处理 |
| `index.html` | renderSkills 显示 effects；showSkillDetail 新增参悟按钮；新增参悟弹窗/成员选择；renderMembers 显示功法进度和属性加成；属性计算逻辑 |
| `sillytavern/st-prompt.js` | formatGameStateForPrompt 显示功法加成；成员属性显示总属性 |
| LLM 提示词 | 开局/新增功法时要求输出 effects 和 realmReq |
