# 云璃仙宗 — LLM Prompt 工程指南

> 本文档面向接入本游戏的 LLM（大语言模型），说明如何通过输出结构化标签来驱动游戏状态与 UI。

---

## 一、输出标签总览

LLM 回复中可嵌入以下 XML 风格标签。游戏前端会流式捕获并处理。

| 标签 | 用途 | 示例 |
|------|------|------|
| `<thinking>` | 内部推演/思路（不显示给玩家，仅用于调试） | `<thinking>我需要决定宗门下一步行动...</thinking>` |
| `<maintext>` | 剧情正文（天机正文），会实时渲染到故事区域 | `<maintext>晨曦初露，云璃峰上雾气氤氲...</maintext>` |
| `<option>` | 给玩家的选项列表，每行一个选项 | `<option>A. 直接开战\nB. 暂且隐忍</option>` |
| `<sum>` | 事件摘要，用于生成「近日要事」卡片 | `<sum>时间：XX | 地点：XX | 人物：XX | 事件：XX</sum>` |
| `<vars>` | **核心：修改变量系统**，JSON 数组格式 | `<vars>[{"op":"delta","path":"/finance/gold","value":"-500"}]</vars>` |

**标签使用规则：**
- 所有标签可选，按需输出。
- `<maintext>` 和 `<option>` 会实时流式渲染到玩家界面。
- `<sum>` 触发「近日要事」卡片生成。
- `<vars>` 触发游戏状态变更和 UI 自动刷新。
- `<thinking>` 内容不展示给玩家，仅记录于调试面板。

---

## 二、`<vars>` 标签详解

### 2.1 基本格式

```xml
<vars>[{"op": "操作类型", "path": "/路径", "value": "值"}]</vars>
```

- 外层必须是合法 JSON 数组。
- 支持同时执行多条操作：

```xml
<vars>
[
  {"op":"delta","path":"/finance/gold","value":"-500"},
  {"op":"replace","path":"/members/沈万钧/status","value":"闭关"},
  {"op":"insert","path":"/treasury/items","value":{"name":"筑基丹","type":"丹药","quantity":3}}
]
</vars>
```

### 2.2 操作类型（op）

| op | 说明 | 适用场景 |
|----|------|----------|
| `replace` | 完全替换目标值 | 修改成员状态、势力关系、建筑等级等 |
| `delta` | 对数字做加减（`value` 可正可负） | 增减灵石、威望、属性值、忠诚度等 |
| `insert` | 向数组末尾插入元素，或向 Record 添加键值对 | 新增成员、新增宝库物品、新增支线任务 |
| `remove` | 从数组按索引删除，或从 Record 删除键 | 移除成员、删除物品、移除建筑 |

### 2.3 路径规则

路径以 `/` 分隔，从根开始：

- **对象字段**：`/finance/gold`
- **Record 键**：`/members/沈万钧`（成员名作为键）
- **数组索引**：`/world/buildings/0/level`（第 0 个建筑的 level 字段）
- **数组追加**：`/treasury/items/-`（`-` 表示数组末尾）

---

## 三、完整数据结构（Schema）

以下是游戏中所有可通过 `<vars>` 操作的数据字段及其初始值。

### 3.1 成员（members）

类型：Record，key 为成员姓名。

```json
{
  "沈万钧": {
    "id": "m1",
    "name": "沈万钧",
    "daoName": "万钧真人",
    "realm": "元婴后期",
    "role": "大长老",
    "status": "坐镇",
    "talent": "上上",
    "color": "jade",
    "stats": { "杀伐": 88, "防御": 72, "身法": 45 },
    "baseStats": { "杀伐": 88, "防御": 72, "身法": 45 },
    "lifespan": { "current": 892, "max": 1500 },
    "loyalty": 85,
    "mood": 75,
    "skills": ["太虚真解（第三层）"],
    "equipment": []
  }
}
```

**字段说明：**

| 字段 | 类型 | 可取值/范围 | 说明 |
|------|------|-------------|------|
| `name` | string | — | 姓名（同时是 Record 的 key） |
| `daoName` | string | — | 道号 |
| `realm` | string | 炼气期→金丹期→元婴期→化神期等 | 境界 |
| `role` | enum | 掌门/大长老/执法首座/丹峰长老/藏经长老/守山长老/成员 | 职务 |
| `status` | enum | 坐镇/巡查/炼丹/研习/闭关/外出/受伤 | 当前状态 |
| `talent` | string | 上上/上/中/下/下下 | 天赋资质 |
| `color` | enum | jade/purple/pink/gold | UI 配色标识 |
| `stats.杀伐` | number | 0–100 | 战斗属性（含装备加成） |
| `stats.防御` | number | 0–100 | 同上 |
| `stats.身法` | number | 0–100 | 同上 |
| `baseStats` | object | 同 stats | 基础属性（不含装备） |
| `lifespan.current` | number | 0–max | 当前寿元 |
| `lifespan.max` | number | ≥1 | 最大寿元 |
| `loyalty` | number | 0–100 | 忠诚度 |
| `mood` | number | 0–100 | 心情 |
| `skills` | string[] | — | 已修功法列表 |
| `equipment` | object[] | — | 装备列表 |

**常用操作示例：**

```xml
<!-- 成员闭关修炼，状态改变 -->
<vars>[{"op":"replace","path":"/members/沈万钧/status","value":"闭关"}]</vars>

<!-- 成员寿元减少 -->
<vars>[{"op":"delta","path":"/members/沈万钧/lifespan/current","value":"-10"}]</vars>

<!-- 新增一名成员 -->
<vars>[{"op":"insert","path":"/members/林青羽","value":{"id":"m5","name":"林青羽","daoName":"青羽子","realm":"筑基后期","role":"成员","status":"坐镇","talent":"上","color":"purple","stats":{"杀伐":45,"防御":38,"身法":52},"baseStats":{"杀伐":45,"防御":38,"身法":52},"lifespan":{"current":120,"max":300},"loyalty":60,"mood":80,"skills":[],"equipment":[]}}]</vars>

<!-- 移除成员 -->
<vars>[{"op":"remove","path":"/members/林青羽"}]</vars>

<!-- 提升忠诚度 -->
<vars>[{"op":"delta","path":"/members/沈万钧/loyalty","value":"5"}]</vars>
```

### 3.2 财务（finance）

```json
{
  "gold": 12580,
  "income": 8420,
  "expense": 5680,
  "prestige": 1800,
  "realmTitle": "一洲正道魁首"
}
```

**常用操作：**

```xml
<!-- 消耗灵石 -->
<vars>[{"op":"delta","path":"/finance/gold","value":"-1000"}]</vars>

<!-- 增加威望 -->
<vars>[{"op":"delta","path":"/finance/prestige","value":"200"}]</vars>

<!-- 修改位阶称号 -->
<vars>[{"op":"replace","path":"/finance/realmTitle","value":"东荒第一宗"}]</vars>
```

### 3.3 宝库（treasury）

```json
{
  "items": [],
  "arrayName": "九曜星辰阵",
  "arrayRank": "地阶上品",
  "arrayDesc": "聚灵护山，攻防一体"
}
```

**物品字段说明：**

| 字段 | 类型 | 可取值 | 说明 |
|------|------|--------|------|
| `name` | string | — | 物品名 |
| `type` | enum | 武器/防具/丹药/材料/功法/法宝/杂物 | 类型 |
| `rank` | string | 黄阶下品→天阶上品 | 品阶 |
| `quantity` | number | ≥0 | 数量 |
| `color` | enum | jade/purple/pink/gold | UI 配色 |
| `description` | string | — | 描述 |

**常用操作：**

```xml
<!-- 添加物品到宝库 -->
<vars>[{"op":"insert","path":"/treasury/items/-","value":{"id":"t1","name":"筑基丹","type":"丹药","rank":"黄阶上品","quantity":5,"color":"jade","description":"辅助筑基的灵丹"}}]</vars>

<!-- 移除宝库中第 0 个物品 -->
<vars>[{"op":"remove","path":"/treasury/items/0"}]</vars>

<!-- 修改护山大阵描述 -->
<vars>[{"op":"replace","path":"/treasury/arrayDesc","value":"以九星之力聚灵，攻防兼备"}]</vars>
```

### 3.4 外交（diplomacy）

类型：Record，key 为势力名。

```json
{
  "天剑宗": {
    "name": "天剑宗",
    "relation": "盟友",
    "value": 82,
    "desc": "百年盟约，互为犄角之势",
    "color": "jade",
    "leader": "剑尊·凌霄子"
  }
}
```

**relation 可取值：** 盟友 / 友好 / 中立 / 警惕 / 敌对

**常用操作：**

```xml
<!-- 降低与天剑宗的关系值 -->
<vars>[{"op":"delta","path":"/diplomacy/天剑宗/value","value":"-15"}]</vars>

<!-- 改变关系等级 -->
<vars>[{"op":"replace","path":"/diplomacy/天剑宗/relation","value":"警惕"}]</vars>

<!-- 新增势力 -->
<vars>[{"op":"insert","path":"/diplomacy/青云宗","value":{"name":"青云宗","relation":"中立","value":50,"desc":"新兴宗门，态度暧昧","color":"gold","leader":"宗主·青云子"}}]</vars>
```

### 3.5 任务（quests）

```json
{
  "main": {
    "currentStage": "玄云密信",
    "completedStages": []
  },
  "side": []
}
```

**支线任务字段：**

| 字段 | 类型 | 可取值 | 说明 |
|------|------|--------|------|
| `id` | string | — | 唯一标识 |
| `name` | string | — | 任务名 |
| `status` | enum | 未触发/进行中/已完成/已失败 | 状态 |
| `progress` | number | 0–100 | 进度百分比 |

**常用操作：**

```xml
<!-- 推进主线阶段 -->
<vars>[{"op":"replace","path":"/quests/main/currentStage","value":"九星连珠"}]</vars>

<!-- 记录已完成的主线阶段 -->
<vars>[{"op":"insert","path":"/quests/main/completedStages/-","value":"玄云密信"}]</vars>

<!-- 新增支线任务 -->
<vars>[{"op":"insert","path":"/quests/side/-","value":{"id":"q1","name":"寻找失踪弟子","status":"进行中","progress":0}}]</vars>

<!-- 更新支线进度 -->
<vars>[{"op":"replace","path":"/quests/side/0/progress","value":50}]</vars>

<!-- 完成支线 -->
<vars>[{"op":"replace","path":"/quests/side/0/status","value":"已完成"}]</vars>
```

### 3.6 世界（world）

#### 3.6.1 建筑（buildings）

数组结构，每个建筑：

```json
{
  "name": "悟道殿",
  "level": 5,
  "unlocked": true,
  "description": "掌门修行之所"
}
```

**常用操作：**

```xml
<!-- 升级建筑 -->
<vars>[{"op":"replace","path":"/world/buildings/0/level","value":6}]</vars>

<!-- 解锁新建筑 -->
<vars>[{"op":"insert","path":"/world/buildings/-","value":{"name":"聚灵阵","level":1,"unlocked":true,"description":"汇聚天地灵气，加速修炼"}}]</vars>

<!-- 拆卸建筑 -->
<vars>[{"op":"remove","path":"/world/buildings/2"}]</vars>
```

#### 3.6.2 疆域（regions）

数组结构，每个区域：

```json
{
  "name": "云璃峰",
  "unlocked": true,
  "controlledBy": "云璃仙宗"
}
```

**常用操作：**

```xml
<!-- 探索解锁区域 -->
<vars>[{"op":"replace","path":"/world/regions/1/unlocked","value":true}]</vars>

<!-- 区域控制权变更 -->
<vars>[{"op":"replace","path":"/world/regions/1/controlledBy","value":"云璃仙宗"}]</vars>

<!-- 新增区域 -->
<vars>[{"op":"insert","path":"/world/regions/-","value":{"name":"幽冥谷","unlocked":false,"controlledBy":"九幽教"}}]</vars>
```

---

## 四、富文本渲染规则

`<maintext>` 中的内容支持以下格式标记，前端会自动渲染：

| 标记 | 效果 | 示例 |
|------|------|------|
| `**文本**` | 心理活动，淡紫色 | `**这星象阁来者不善**` |
| `《文本》` | 功法/秘籍/典籍，金色 | `《太虚真解》` |
| `"文本"` 或 `"文本"` | 对话，翠绿色 | `"宗主，大事不好！"` |

**示例：**

```xml
<maintext>
你正在悟道殿中参悟《太虚真解》，**这功法玄奥异常，今日似乎有所触动**。
门外传来急促脚步声，周明远推门而入："宗主，天机台有异象！"
</maintext>
```

---

## 五、完整响应示例

以下是一个典型的 LLM 响应结构：

```xml
<thinking>
玩家选择了"深化与星象阁合作"。
需要：
1. 消耗 500 灵石作为探索经费
2. 派遣周明远外出
3. 推进主线到"秘境探索"
4. 新增一个支线任务"古战场侦察"
</thinking>

<maintext>
你沉吟片刻，最终拍案定策："传我令，即刻筹备探索事宜。周明远，你率精锐弟子先行侦察古战场遗址。"

周明远拱手领命："弟子遵命！"

**星象阁的情报若是属实，这或许是我云璃仙宗千载难逢的机缘。但九幽教那边，恐怕不会坐视不理。**

三日后，周明远传回第一份密报：古战场外围确有灵气异常，但禁制重重，需地阶以上阵法师方可破解。
</maintext>

<option>
A. 加派阵法师随队支援，不惜代价破禁
B. 先撤回弟子，与星象阁商议联合破阵
C. 暂时观望，搜集更多情报后再行动
D. 另寻他处，放弃古战场转向其他灵气异常点
</option>

<sum>
时间：三日后 | 地点：云璃仙宗议事厅、古战场遗址外围 | 人物：清虚子、周明远 | 事件：清虚子决定深化与星象阁合作，派遣周明远率弟子侦察古战场遗址，发现地阶禁制阻碍，需进一步决策
</sum>

<vars>
[
  {"op":"delta","path":"/finance/gold","value":"-500"},
  {"op":"replace","path":"/members/周明远/status","value":"外出"},
  {"op":"replace","path":"/quests/main/currentStage","value":"秘境探索"},
  {"op":"insert","path":"/quests/main/completedStages/-","value":"玄云密信"},
  {"op":"insert","path":"/quests/side/-","value":{"id":"q_ancient","name":"古战场侦察","status":"进行中","progress":20}}
]
</vars>
```

---

## 六、最佳实践

1. **先输出 `<thinking>`，再输出正文** —— 有助于保持叙事连贯性。
2. **`<sum>` 务必包含时间、地点、人物、事件四要素** —— 否则「近日要事」卡片显示不完整。
3. **`<vars>` 放在最后** —— 避免状态变更后正文引用旧值。
4. **数值变更用 `delta`，状态切换用 `replace`** —— 语义清晰，减少错误。
5. **新增 Record 条目时用 `insert`** —— 与 `replace` 区分，便于追踪变更来源。
6. **避免在 `<maintext>` 中输出未转义的 `<` 或 `>`** —— 可能干扰标签解析。
7. **删除操作慎用 `remove`** —— 数组索引删除后，后续元素索引会变化。

---

*文档版本：v1.0 | 适用游戏版本：2026-04-17*
