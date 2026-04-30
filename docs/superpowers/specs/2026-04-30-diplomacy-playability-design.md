# 合纵阁（外交页面）可玩性增强 — 设计文档

## 背景

当前外交页面（合纵阁）仅展示势力卡片（名称、关系值、掌权者、描述），无交互功能。
昨天山河殿已实现建筑升级/拆卸/新增、疆域探索/派遣坐镇/非玩家势力采取行动等完整交互。
本次将外交页面提升至同等可玩性水平。

## 设计目标

- 外交势力卡片具备可执行操作（拜访、送礼、威逼、宣战）
- 卡片信息更丰富，支持战略决策
- 操作流程与山河页面完全一致，降低学习成本

---

## 一、Schema 扩展

### 1.1 FactionSchema 变更

`sillytavern/game-state.js` 中 `FactionSchema` 新增字段：

```js
const FactionSchema = zObject({
  name: zString(),
  relation: zEnum(['盟友', '友好', '中立', '警惕', '敌对'], '中立'),
  value: zNumber({ default: 50, min: 0, max: 100 }),
  desc: zString(),
  color: zEnum(['jade', 'purple', 'pink', 'gold'], 'gold'),
  leader: zString(),
  // === 新增字段 ===
  highestMember: zObject({
    name: zString(''),
    role: zString(''),
    realm: zString('')
  }, { default: { name: '', role: '', realm: '' } }),
  discipleCount: zNumber({ default: 0, min: 0 }),
  controlledRegions: zArray(zString(), [])
});
```

### 1.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `highestMember` | object | 宗门最高境界成员：name（角色名）、role（职位）、realm（境界） |
| `discipleCount` | number | 该势力弟子总人数 |
| `controlledRegions` | string[] | 掌控的疆域名称列表，如 `["黄龙谷", "风之国"]` |

### 1.3 默认值处理

- `highestMember` 默认为 `{name:'',role:'',realm:''}`，空值时 UI 显示"—"
- `discipleCount` 默认 0，UI 显示"未知"
- `controlledRegions` 默认空数组，UI 显示"暂无"

---

## 二、变量表更新

### 2.1 VARIABLES.md

在 `/diplomacy` 条目下补充新增字段的说明。

### 2.2 LLM_FORMAT_SPEC.md / LLM_REFERENCE.md

在变量规范的外交势力部分，增加 `highestMember`、`discipleCount`、`controlledRegions` 的字段说明和示例。

---

## 三、世界书更新

### 3.1 默认世界书条目

`sillytavern/st-integration.js` 中《宗门志》世界书的"变量规范"条目需更新：

- 在外交势力 `/diplomacy` 的说明中，补充三个新字段的含义和示例值
- 提示 LLM 在创建/更新外交势力时，尽量填充这些字段以增强沉浸感

---

## 四、UI 设计

### 4.1 外交卡片增强

在现有 `faction-card` 基础上，在关系条上方插入信息行：

```
┌─────────────────────────────────┐
│ 势力名                    [关系标签]│
│ 掌权者：XXX                      │
│ 最高境界：张三|掌门|元婴期前期     │
│ 弟子数：24人 | 疆域：黄龙谷, 风之国│
│ 描述文字...                       │
│ [==========关系值进度条=========] │
│ [       采 取 行 动       ]      │
└─────────────────────────────────┘
```

### 4.2 新增字段展示规则

| 字段 | 空值显示 | 有值显示 |
|------|---------|---------|
| 最高境界 | `最高境界：—` | `最高境界：{name}\|{role}\|{realm}` |
| 弟子数 | `弟子数：未知` | `弟子数：{count}人` |
| 掌握疆域 | `疆域：暂无` | `疆域：{name1}, {name2}` |

三条信息放在同一行，用 `|` 分隔，字号 12px，颜色 `rgba(168,230,230,0.5)`。

### 4.3 "采取行动"按钮

- 位置：卡片底部，关系条下方
- 样式：与山河页面疆域卡片的操作按钮一致（`region-explore-btn` 样式变体）
- 文字：`采取行动`
- 颜色：使用 `--jade-glow` 边框

### 4.4 移动端适配

- ≤768px 时信息行自动换行
- 字体保持 12px 不缩小（保证可读性）
- "采取行动"按钮宽度 100%

---

## 五、交互流程

### 5.1 流程图

```
点击卡片"采取行动"按钮
  → showFactionActions(factionName)
    → 弹窗：选择外交操作
      → selectMembersForFactionAction(factionName, actionType)
        → 弹窗：多选可用弟子
          → confirmFactionMembers(factionName, actionType, containerId)
            → executeFactionAction(factionName, actionType, memberNames)
              → 消耗 1 体力
              → 写入 actionLog
              → alert("已受命，提交后由天道推演")
```

### 5.2 操作类型

| 操作 | 颜色 | 说明 |
|------|------|------|
| 拜访 | `--jade-glow` | 派遣弟子前往建立友好联系 |
| 送礼 | `--gold-spirit` | 携带宗门礼物，提升关系 |
| 威逼 | `--lotus-pink` | 展示实力，施压对方 |
| 宣战 | `#ff6b6b` | 正式宣战，降低关系 |

### 5.3 弟子多选逻辑

复刻山河页面 `selectMemberForRegionAction`：

1. 过滤掉状态为"外出"、"闭关"、"死亡"的弟子
2. 过滤掉 `getAssignedMembersThisRound()` 中已分配的弟子
3. 展示 checkbox 多选 UI（`toggleMemberSelect`）
4. 至少选择 1 人

### 5.4 体力消耗与 actionLog

- 每次操作消耗 1 体力（`addActionLog`）
- actionLog 条目：category = actionType, target = factionName
- 数据：memberNames（数组）、factionName、actionType
- 撤回：复用现有 `undoActionLog` 机制，恢复体力

---

## 六、提示词构建

### 6.1 触发时机

`submitActions()` 发送时，遍历 actionLogs 中 category 为外交操作（拜访/送礼/威逼/宣战）的条目，构建对应的提示词段落。

### 6.2 提示词模板

```
（玩家名称）决定派遣弟子（列出每个弟子的：名称、境界、性别、性格、外貌等信息），
前往（对方宗门势力名称）进行（行动名称：拜访/送礼/威逼/宣战）。

对方宗门信息：
- 势力名称：{faction.name}
- 掌权者：{faction.leader}
- 最高境界成员：{faction.highestMember.name}|{faction.highestMember.role}|{faction.highestMember.realm}
- 弟子数：{faction.discipleCount}人
- 掌握疆域：{faction.controlledRegions.join('、')}
- 与玩家关系：{faction.relation}
- 关系值：{faction.value}/100

请设计一段剧情来交代这个行动，需要交代：
1. 行动本身的过程（弟子如何抵达、如何展开行动）
2. 对方宗门的反应和表现
3. 行动对双方关系的影响
4. 弟子的表现和可能的成长
```

### 6.3 弟子信息模板

每个派遣弟子输出：
```
- {name}（{realm}，{gender}）
  性格：{personality.join('、')}
  外貌：{appearance.join('、')}
  忠诚度：{loyalty} | 心情：{mood}
```

---

## 七、代码变更清单

| 文件 | 变更 |
|------|------|
| `sillytavern/game-state.js` | FactionSchema 新增 3 字段 |
| `index.html` | renderFactions 增强卡片 UI + 新增交互函数（5个）+ 提示词构建逻辑 |
| `VARIABLES.md` | 补充 diplomacy 新字段说明 |
| `LLM_FORMAT_SPEC.md` / `LLM_REFERENCE.md` | 外交势力字段补充 |
| `sillytavern/st-integration.js` | 默认世界书"变量规范"条目更新 |

---

## 八、风险与注意事项

1. **LLM 填充新字段**：开局和后续剧情中，LLM 可能不会自动填充 `highestMember` 等字段。需要在提示词中明确要求。
2. **controlledRegions 与 world.regions 同步**：如果 LLM 修改了疆域掌控者，需确保外交势力的 `controlledRegions` 也同步更新。建议由 LLM 通过 `<vars>` 自行维护。
3. **空值处理**：UI 必须优雅处理字段缺失或空值的情况。
