# 宗门志 — 完整变量表

> 本文档列出游戏中所有可通过 `<vars>` 标签读写状态。路径以 `/` 开头，层级用 `/` 分隔。

---

## 一、顶层结构

```json
{
  "members":     {},      // Record<姓名, 成员对象>
  "finance":     {},      // 财务数据
  "treasury":    {},      // 宝库
  "library":     [],      // 功法数组
  "opportunities": [],    // 机遇数组
  "diplomacy":   {},      // Record<势力名, 外交对象>
  "quests":      {},      // 任务（主线+支线）
  "world":       {},      // 世界（建筑+疆域）
  "player":      {},      // 玩家（掌门）自身信息
  "sect":        {},      // 宗门信息
  "events":      []       // 近日要事列表
}
```

---

## 二、成员（members）

**类型**：Record，key 为成员姓名。  
**路径前缀**：`/members/{姓名}`

| 字段 | 类型 | 默认值 | 约束 | 说明 |
|------|------|--------|------|------|
| `id` | string | `""` | — | 唯一标识 |
| `name` | string | `""` | — | 姓名（与 Record key 相同） |
| `daoName` | string | `""` | — | 道号 |
| `realm` | string | `"炼气期"` | — | 境界，如 炼气期/金丹期/元婴期/化神期，含阶段则如 炼气期前期 |
| `role` | enum | `"成员"` | 掌门/大长老/执法首座/丹峰长老/藏经长老/守山长老/内门弟子/外门弟子/成员 | 职务 |
| `status` | enum | `"坐镇"` | 坐镇/巡查/炼丹/研习/闭关/外出/受伤 | 当前状态 |
| `talent` | string | `"乙中"` | 甲上/甲中/甲下/乙上/乙中/乙下/丙上/丙中/丙下/丁上/丁中/丁下 | 天赋资质 |
| `color` | enum | `"jade"` | jade/purple/pink/gold | UI 配色标识 |
| `stats.杀伐` | number | `50` | 0–100 | 当前杀伐（含装备加成） |
| `stats.防御` | number | `50` | 0–100 | 当前防御（含装备加成） |
| `stats.身法` | number | `50` | 0–100 | 当前身法（含装备加成） |
| `baseStats.杀伐` | number | `50` | 0–100 | 基础杀伐（不含装备） |
| `baseStats.防御` | number | `50` | 0–100 | 基础防御（不含装备） |
| `baseStats.身法` | number | `50` | 0–100 | 基础身法（不含装备） |
| `lifespan.current` | number | `100` | ≥0 | 当前寿元 |
| `lifespan.max` | number | `200` | ≥1 | 最大寿元 |
| `loyalty` | number | `60` | 0–100 | 忠诚度 |
| `mood` | number | `70` | 0–100 | 心情 |
| `skills` | string[] | `[]` | — | 已修功法列表，如 `["太虚真解（第三层）"]` |
| `equipment` | object[] | `[]` | — | 装备列表（见 EquipmentSchema） |

**EquipmentSchema（成员.equipment 中的对象）：**

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `name` | string | `""` | — | 装备名 |
| `rank` | string | `"黄阶下品"` | — | 品阶 |
| `color` | enum | `"jade"` | jade/purple/pink/gold | 配色 |
| `type` | enum | `"武器"` | 武器/防具/饰品/法宝 | 装备类型 |

**路径示例：**

```
/members/沈万钧/status
/members/沈万钧/stats/杀伐
/members/沈万钧/lifespan/current
/members/沈万钧/skills/0
/members/沈万钧/equipment/0/name
```

**操作示例：**

```xml
<!-- 成员状态变更 -->
<vars>[{"op":"replace","path":"/members/沈万钧/status","value":"闭关"}]</vars>

<!-- 寿元减少 -->
<vars>[{"op":"delta","path":"/members/沈万钧/lifespan/current","value":"-10"}]</vars>

<!-- 新增成员（insert 到 Record） -->
<vars>[{"op":"insert","path":"/members/林青羽","value":{"id":"m5","name":"林青羽","daoName":"青羽子","realm":"筑基期后期","role":"内门弟子","status":"坐镇","talent":"乙上","color":"purple","stats":{"杀伐":45,"防御":38,"身法":52},"baseStats":{"杀伐":45,"防御":38,"身法":52},"lifespan":{"current":120,"max":300},"loyalty":60,"mood":80,"skills":[],"equipment":[]}}]</vars>

<!-- 移除成员 -->
<vars>[{"op":"remove","path":"/members/林青羽"}]</vars>

<!-- 提升忠诚度 -->
<vars>[{"op":"delta","path":"/members/沈万钧/loyalty","value":"5"}]</vars>

<!-- 给成员添加功法 -->
<vars>[{"op":"insert","path":"/members/沈万钧/skills/-","value":"紫霄神雷诀（第一层）"}]</vars>
```

---

## 三、财务（finance）

**路径前缀**：`/finance`

| 字段 | 类型 | 默认值 | 约束 | 说明 |
|------|------|--------|------|------|
| `gold` | number | `12580` | ≥0 | 灵石存量 |
| `income` | number | `8420` | — | 月收入 |
| `expense` | number | `5680` | — | 月支出 |
| `prestige` | number | `1800` | ≥0 | 威望值 |
| `realmTitle` | string | `"一洲正道魁首"` | — | 位阶称号 |

**操作示例：**

```xml
<!-- 消耗灵石 -->
<vars>[{"op":"delta","path":"/finance/gold","value":"-1000"}]</vars>

<!-- 增加威望 -->
<vars>[{"op":"delta","path":"/finance/prestige","value":"200"}]</vars>

<!-- 修改位阶称号 -->
<vars>[{"op":"replace","path":"/finance/realmTitle","value":"东荒第一宗"}]</vars>
```

---

## 四、宝库（treasury）

**路径前缀**：`/treasury`

### 4.1 顶层字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | array | `[]` | 物品列表（见 TreasuryItemSchema） |
| `arrayName` | string | `"九曜星辰阵"` | 护山大阵名称 |
| `arrayRank` | string | `"地阶上品"` | 护山大阵品阶 |
| `arrayDesc` | string | `"聚灵护山，攻防一体"` | 护山大阵描述 |

### 4.2 items 中对象的字段（TreasuryItemSchema）

| 字段 | 类型 | 默认值 | 可取值/约束 | 说明 |
|------|------|--------|-------------|------|
| `id` | string | `""` | — | 唯一标识 |
| `name` | string | `""` | — | 物品名 |
| `type` | enum | `"杂物"` | 武器/防具/遁具/饰品/丹药/材料/功法/法宝/杂物 | 类型 |
| `rank` | string | `"黄阶下品"` | — | 品阶 |
| `quantity` | number | `1` | ≥0 | 数量 |
| `color` | enum | `"jade"` | jade/purple/pink/gold | UI 配色 |
| `description` | string | `""` | — | 描述 |
| `owner` | string | `""` | — | 持有者姓名，空字符串表示在库房 |
| `effects.杀伐` | number | `0` | — | 装备效果：杀伐加成 |
| `effects.防御` | number | `0` | — | 装备效果：防御加成 |
| `effects.身法` | number | `0` | — | 装备效果：身法加成 |

**路径示例：**

```
/treasury/items/0/name
/treasury/items/0/owner
/treasury/arrayName
/treasury/items/-   (数组末尾追加)
```

**操作示例：**

```xml
<!-- 添加物品到宝库 -->
<vars>[{"op":"insert","path":"/treasury/items/-","value":{"id":"t1","name":"筑基丹","type":"丹药","rank":"黄阶上品","quantity":5,"color":"jade","description":"辅助筑基的灵丹","owner":"","effects":{"杀伐":0,"防御":0,"身法":0}}}]</vars>

<!-- 修改物品持有者（分配给成员） -->
<vars>[{"op":"replace","path":"/treasury/items/0/owner","value":"沈万钧"}]</vars>

<!-- 移除宝库中第 0 个物品 -->
<vars>[{"op":"remove","path":"/treasury/items/0"}]</vars>

<!-- 修改护山大阵描述 -->
<vars>[{"op":"replace","path":"/treasury/arrayDesc","value":"以九星之力聚灵，攻防兼备"}]</vars>
```

---

## 五、藏经阁（library）

**类型**：数组  
**路径前缀**：`/library/{索引}`

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `id` | string | `""` | — | 唯一标识 |
| `name` | string | `""` | — | 功法名 |
| `type` | enum | `"道修"` | 道修/神修/魔修/体修/修行百艺 | 流派 |
| `rank` | string | `"黄阶"` | — | 品阶，如 天阶上品/地阶中品/玄阶/黄阶/凡阶 |
| `desc` | string | `""` | — | 功法介绍 |
| `color` | enum | `"jade"` | jade/purple/pink/gold | UI 配色 |

**操作示例：**

```xml
<!-- 新增功法 -->
<vars>[{"op":"insert","path":"/library/-","value":{"id":"s_new","name":"太虚剑意","type":"道修","rank":"天阶中品","desc":"以太虚之力化剑，一剑破万法","color":"jade"}}]</vars>

<!-- 移除第 0 个功法 -->
<vars>[{"op":"remove","path":"/library/0"}]</vars>
```

---

## 六、机遇（opportunities）

**类型**：数组  
**路径前缀**：`/opportunities/{索引}`

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `id` | string | `""` | — | 唯一标识 |
| `title` | string | `""` | — | 标题 |
| `desc` | string | `""` | — | 描述 |
| `category` | enum | `"tianshi"` | tianshi/dili/renhe | 分类：天时/地利/人和 |
| `cost` | number | `1` | ≥0 | 消耗体力 |
| `completed` | boolean | `false` | — | 是否已完成 |

**操作示例：**

```xml
<!-- 新增机遇 -->
<vars>[{"op":"insert","path":"/opportunities/-","value":{"id":"o_new","title":"灵脉异动","desc":"云璃峰地下灵脉出现异常波动","category":"dili","cost":2,"completed":false}}]</vars>

<!-- 标记机遇完成 -->
<vars>[{"op":"replace","path":"/opportunities/0/completed","value":true}]</vars>

<!-- 移除第 0 个机遇 -->
<vars>[{"op":"remove","path":"/opportunities/0"}]</vars>
```

---

## 七、外交（diplomacy）

**类型**：Record，key 为势力名。  
**路径前缀**：`/diplomacy/{势力名}`

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `name` | string | `""` | — | 势力名（与 Record key 相同） |
| `relation` | enum | `"中立"` | 盟友/友好/中立/警惕/敌对 | 关系等级 |
| `value` | number | `50` | 0–100 | 关系值 |
| `desc` | string | `""` | — | 关系描述 |
| `color` | enum | `"gold"` | jade/purple/pink/gold | UI 配色 |
| `leader` | string | `""` | — | 掌权者 |

**操作示例：**

```xml
<!-- 降低关系值 -->
<vars>[{"op":"delta","path":"/diplomacy/天剑宗/value","value":"-15"}]</vars>

<!-- 改变关系等级 -->
<vars>[{"op":"replace","path":"/diplomacy/天剑宗/relation","value":"警惕"}]</vars>

<!-- 新增势力 -->
<vars>[{"op":"insert","path":"/diplomacy/青云宗","value":{"name":"青云宗","relation":"中立","value":50,"desc":"新兴宗门，态度暧昧","color":"gold","leader":"宗主·青云子"}}]</vars>
```

---

## 八、任务（quests）

**路径前缀**：`/quests`

### 8.1 主线（quests.main）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentStage` | string | `"玄云密信"` | 当前主线阶段名 |
| `completedStages` | string[] | `[]` | 已完成的主线阶段列表 |

### 8.2 支线（quests.side）

数组，每个元素：

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `id` | string | `""` | — | 唯一标识 |
| `name` | string | `""` | — | 任务名 |
| `status` | enum | `"未触发"` | 未触发/进行中/已完成/已失败 | 状态 |
| `progress` | number | `0` | 0–100 | 进度百分比 |

**操作示例：**

```xml
<!-- 推进主线阶段 -->
<vars>[{"op":"replace","path":"/quests/main/currentStage","value":"九星连珠"}]</vars>

<!-- 记录已完成阶段 -->
<vars>[{"op":"insert","path":"/quests/main/completedStages/-","value":"玄云密信"}]</vars>

<!-- 新增支线任务 -->
<vars>[{"op":"insert","path":"/quests/side/-","value":{"id":"q1","name":"寻找失踪弟子","status":"进行中","progress":0}}]</vars>

<!-- 更新支线进度 -->
<vars>[{"op":"replace","path":"/quests/side/0/progress","value":50}]</vars>

<!-- 完成支线 -->
<vars>[{"op":"replace","path":"/quests/side/0/status","value":"已完成"}]</vars>

<!-- 移除第 0 个支线 -->
<vars>[{"op":"remove","path":"/quests/side/0"}]</vars>
```

---

## 九、世界（world）

**路径前缀**：`/world`

### 9.1 建筑（world.buildings）

数组，每个元素：

| 字段 | 类型 | 默认值 | 约束 | 说明 |
|------|------|--------|------|------|
| `name` | string | `""` | — | 建筑名 |
| `level` | number | `1` | 0–10 | 等级 |
| `unlocked` | boolean | `true` | — | 是否已解锁 |
| `description` | string | `""` | — | 描述 |

### 9.2 疆域（world.regions）

数组，每个元素：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | `""` | 区域名 |
| `unlocked` | boolean | `false` | 是否已探索 |
| `controlledBy` | string | `"未知"` | 掌控势力 |

**操作示例：**

```xml
<!-- 升级建筑 -->
<vars>[{"op":"replace","path":"/world/buildings/0/level","value":6}]</vars>

<!-- 解锁新建筑 -->
<vars>[{"op":"insert","path":"/world/buildings/-","value":{"name":"聚灵阵","level":1,"unlocked":true,"description":"汇聚天地灵气，加速修炼"}}]</vars>

<!-- 拆卸建筑 -->
<vars>[{"op":"remove","path":"/world/buildings/2"}]</vars>

<!-- 探索解锁区域 -->
<vars>[{"op":"replace","path":"/world/regions/1/unlocked","value":true}]</vars>

<!-- 区域控制权变更 -->
<vars>[{"op":"replace","path":"/world/regions/1/controlledBy","value":"云璃仙宗"}]</vars>

<!-- 新增区域 -->
<vars>[{"op":"insert","path":"/world/regions/-","value":{"name":"幽冥谷","unlocked":false,"controlledBy":"九幽教"}}]</vars>
```

---

## 十、开局创建元数据（_creationMeta）

游戏通过开局创建向导启动时，会将玩家选择存储在 `_creationMeta` 中，供 LLM 读取以了解宗门背景。

| 字段 | 类型 | 说明 |
|------|------|------|
| `sectName` | string | 宗门名称 |
| `path` | string | 修行法门（道修/神修/魔修/体修/旁门左道） |
| `specialty` | string | 宗门专长（剑/丹/炼器/法阵/符箓） |
| `crisis` | string | 开局困境 |
| `personality` | string[] | 玩家性格标签 |
| `appearance` | string[] | 玩家外貌标签 |
| `age` | number | 玩家年龄 |

> 注意：`_creationMeta` 仅作为提示词上下文使用，不直接影响游戏机制。

---

## 十一、操作类型速查

| op | 作用 | value 类型 | 适用路径 |
|----|------|------------|----------|
| `replace` | 完全替换目标值 | 任意 | 对象字段、Record 键、数组索引 |
| `delta` | 对数字做加减 | number / 数字字符串 | 数字类型字段 |
| `insert` | 插入元素 | 对象/值 | 数组（`-` 表示末尾）、Record 新键 |
| `remove` | 删除元素 | 忽略 | 数组索引、Record 键 |

**路径规则总结：**

- 对象字段：`/finance/gold`
- Record 键：`/members/沈万钧`（成员名作为键）
- 数组索引：`/world/buildings/0/level`
- 数组追加：`/treasury/items/-`

---

## 十二、批量操作示例

```xml
<vars>
[
  {"op":"delta","path":"/finance/gold","value":"-500"},
  {"op":"delta","path":"/finance/prestige","value":"50"},
  {"op":"replace","path":"/members/周明远/status","value":"外出"},
  {"op":"replace","path":"/quests/main/currentStage","value":"秘境探索"},
  {"op":"insert","path":"/quests/main/completedStages/-","value":"玄云密信"},
  {"op":"insert","path":"/quests/side/-","value":{"id":"q_ancient","name":"古战场侦察","status":"进行中","progress":20}},
  {"op":"insert","path":"/treasury/items/-","value":{"id":"treasure1","name":"上古玉简","type":"法宝","rank":"天阶下品","quantity":1,"color":"gold","description":"记载上古遗迹坐标的玉简","owner":"","effects":{"杀伐":0,"防御":0,"身法":0}}}
]
</vars>
```

---

## 十三、天赋资质与三维计算

角色三维（杀伐/防御/身法）由天赋资质和境界共同决定，LLM 在生成新成员时可参考此规则：

| 天赋 | 等级索引 | 相对于乙中的差值 |
|------|----------|------------------|
| 甲上 | 0 | +12 |
| 甲中 | 1 | +9 |
| 甲下 | 2 | +6 |
| 乙上 | 3 | +3 |
| 乙中 | 4 | 0 |
| 乙下 | 5 | −3 |
| 丙上 | 6 | −6 |
| 丙中 | 7 | −9 |
| 丙下 | 8 | −12 |
| 丁上 | 9 | −15 |
| 丁中 | 10 | −18 |
| 丁下 | 11 | −21 |

**计算公式：**

```
base = 50 + talentDiff × 3
stageMultiplier = 1.5 ^ stageIndex   // 前期=0, 中期=1, 后期=2, 圆满=3
realmMultiplier = 10 ^ realmIndex    // 练气=0, 筑基=1, 金丹=2, 元婴=3, 化神=4, 道祖=5
value = round(base × stageMultiplier × realmMultiplier)
```

**示例：**
- 乙中 + 练气期前期 = 50
- 乙上 + 练气期前期 = 53
- 乙中 + 练气期中期 = 75
- 甲上 + 金丹期后期 = round(62 × 3.375 × 100) = 20925

---

## 十、玩家（player）

**路径前缀**：`/player`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | `""` | 玩家姓名 |
| `daoName` | string | `""` | 道号 |
| `realm` | string | `""` | 境界（含阶段，如"元婴期后期"） |
| `gender` | string | `""` | 性别 |
| `age` | number | `0` | 年龄 |
| `lifespan.current` | number | `100` | 当前寿元 |
| `lifespan.max` | number | `200` | 最大寿元 |
| `talent` | string | `""` | 天赋资质（如"甲上"） |
| `stats.杀伐` | number | `50` | 当前杀伐（含装备） |
| `stats.防御` | number | `50` | 当前防御（含装备） |
| `stats.身法` | number | `50` | 当前身法（含装备） |
| `baseStats.杀伐` | number | `50` | 基础杀伐（不含装备） |
| `baseStats.防御` | number | `50` | 基础防御（不含装备） |
| `baseStats.身法` | number | `50` | 基础身法（不含装备） |
| `skills` | string[] | `[]` | 已修功法列表 |
| `personality` | string[] | `[]` | 性格标签 |
| `appearance` | string[] | `[]` | 外貌标签 |
| `color` | enum | `"gold"` | UI 配色：jade/purple/pink/gold |

**操作示例：**

```xml
<vars>[{"op":"replace","path":"/player/realm","value":"化神期前期"},{"op":"delta","path":"/player/lifespan/current","value":"-10"},{"op":"insert","path":"/player/skills/-","value":"紫霄神雷诀（第一层）"}]</vars>
```

---

## 十一、宗门（sect）

**路径前缀**：`/sect`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | `""` | 宗门名称 |
| `foundedYear` | string | `""` | 创立时间 |
| `location` | string | `""` | 山门位置 |
| `founder` | string | `""` | 创派祖师 |
| `history` | string | `""` | 宗门历史 |
| `lineage` | string[] | `[]` | 历代掌门列表 |
| `description` | string | `""` | 宗门简介 |
| `motto` | string | `""` | 宗门箴言 |
| `arrayName` | string | `""` | 护山大阵名称 |
| `arrayRank` | string | `""` | 护山大阵品阶 |
| `arrayDesc` | string | `""` | 护山大阵描述 |

**操作示例：**

```xml
<vars>[{"op":"replace","path":"/sect/name","value":"青云宗"},{"op":"replace","path":"/sect/description","value":"东荒第一大宗..."}]</vars>
```

---

## 十二、近日要事（events）

**类型**：数组  
**路径前缀**：`/events/{索引}`

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `id` | string | `""` | — | 唯一标识 |
| `text` | string | `""` | — | 事件描述 |
| `time` | string | `""` | — | 时间标记 |
| `location` | string | `""` | — | 地点 |
| `people` | string | `""` | — | 涉及人物 |
| `type` | enum | `"normal"` | urgent/normal/info/success | 事件类型 |

**操作示例：**

```xml
<vars>[{"op":"insert","path":"/events/-","value":{"id":"e1","text":"天剑宗送来拜帖","time":"半日前","location":"天剑宗","people":"天剑宗使者","type":"info"}}]</vars>
```

---

*文档版本：v2.1 | 对应游戏版本：2026-04-19*
