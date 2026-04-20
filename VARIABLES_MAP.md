# 宗门志 — 变量路径映射表

> 本文档列出 `GAME_VARIABLES.json` 中每个中文字段对应的 `<vars>` 标签技术路径。

---

## 一、宗门概况

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 宗门名称 | `/sect/name` | string |
| 创立时间 | `/sect/foundedYear` | string |
| 山门位置 | `/sect/location` | string |
| 创派祖师 | `/sect/founder` | string |
| 宗门箴言 | `/sect/motto` | string |
| 宗门历史 | `/sect/history` | string |
| 宗门简介 | `/sect/description` | string |
| 历代掌门 | `/sect/lineage` | string[] |

---

## 二、掌门信息

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 姓名 | `/player/name` | string |
| 道号 | `/player/daoName` | string |
| 性别 | `/player/gender` | string |
| 年龄 | `/player/age` | number |
| 境界 | `/player/realm` | string |
| 天赋资质 | `/player/talent` | string |
| 当前寿元 | `/player/lifespan/current` | number |
| 最大寿元 | `/player/lifespan/max` | number |
| 性格标签 | `/player/personality` | string[] |
| 外貌标签 | `/player/appearance` | string[] |
| 已修功法 | `/player/skills` | string[] |

---

## 三、宗门状态

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 灵石 | `/finance/gold` | number |
| 月收入 | `/finance/income` | number |
| 月支出 | `/finance/expense` | number |
| 威望 | `/finance/prestige` | number |
| 位阶称号 | `/finance/realmTitle` | string |
| 护山大阵名称 | `/treasury/arrayName` | string |
| 护山大阵品阶 | `/treasury/arrayRank` | string |
| 护山大阵描述 | `/treasury/arrayDesc` | string |

---

## 四、成员

**类型**：Record，key 为成员姓名。

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 成员 | `/members/{姓名}` | object |

### 成员内字段

| 中文键名 | 技术路径（以沈万钧为例） | 类型 |
|----------|--------------------------|------|
| 唯一标识 | `/members/沈万钧/id` | string |
| 姓名 | `/members/沈万钧/name` | string |
| 道号 | `/members/沈万钧/daoName` | string |
| 境界 | `/members/沈万钧/realm` | string |
| 职务 | `/members/沈万钧/role` | enum |
| 当前状态 | `/members/沈万钧/status` | enum |
| 天赋资质 | `/members/沈万钧/talent` | string |
| UI配色 | `/members/沈万钧/color` | enum |
| 当前杀伐 | `/members/沈万钧/stats/杀伐` | number |
| 当前防御 | `/members/沈万钧/stats/防御` | number |
| 当前身法 | `/members/沈万钧/stats/身法` | number |
| 基础杀伐 | `/members/沈万钧/baseStats/杀伐` | number |
| 基础防御 | `/members/沈万钧/baseStats/防御` | number |
| 基础身法 | `/members/沈万钧/baseStats/身法` | number |
| 当前寿元 | `/members/沈万钧/lifespan/current` | number |
| 最大寿元 | `/members/沈万钧/lifespan/max` | number |
| 忠诚度 | `/members/沈万钧/loyalty` | number |
| 心情 | `/members/沈万钧/mood` | number |
| 已修功法 | `/members/沈万钧/skills` | string[] |
| 装备列表 | `/members/沈万钧/equipment` | object[] |

#### 装备内字段

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 装备名 | `equipment/{索引}/name` | string |
| 品阶 | `equipment/{索引}/rank` | string |
| 配色 | `equipment/{索引}/color` | enum |
| 类型 | `equipment/{索引}/type` | enum |

---

## 五、宝库

**类型**：数组，每个元素为物品对象。  
**路径前缀**：`/treasury/items/{索引}`

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 唯一标识 | `items/{索引}/id` | string |
| 物品名 | `items/{索引}/name` | string |
| 类型 | `items/{索引}/type` | enum |
| 品阶 | `items/{索引}/rank` | string |
| 数量 | `items/{索引}/quantity` | number |
| 配色 | `items/{索引}/color` | enum |
| 描述 | `items/{索引}/description` | string |
| 持有者 | `items/{索引}/owner` | string（空=库房） |
| 杀伐加成 | `items/{索引}/effects/杀伐` | number |
| 防御加成 | `items/{索引}/effects/防御` | number |
| 身法加成 | `items/{索引}/effects/身法` | number |

---

## 六、藏经阁

**类型**：数组，每个元素为功法对象。  
**路径前缀**：`/library/{索引}`

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 唯一标识 | `library/{索引}/id` | string |
| 功法名 | `library/{索引}/name` | string |
| 流派 | `library/{索引}/type` | enum |
| 品阶 | `library/{索引}/rank` | string |
| 介绍 | `library/{索引}/desc` | string |
| 配色 | `library/{索引}/color` | enum |

---

## 七、外交

**类型**：Record，key 为势力名。  
**路径前缀**：`/diplomacy/{势力名}`

| 中文键名 | 技术路径（以天剑宗为例） | 类型 |
|----------|--------------------------|------|
| 势力名 | `/diplomacy/天剑宗/name` | string |
| 关系等级 | `/diplomacy/天剑宗/relation` | enum |
| 关系值 | `/diplomacy/天剑宗/value` | number |
| 关系描述 | `/diplomacy/天剑宗/desc` | string |
| 配色 | `/diplomacy/天剑宗/color` | enum |
| 掌权者 | `/diplomacy/天剑宗/leader` | string |

---

## 八、机遇

**类型**：数组，每个元素为机遇对象。  
**路径前缀**：`/opportunities/{索引}`

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 唯一标识 | `opportunities/{索引}/id` | string |
| 标题 | `opportunities/{索引}/title` | string |
| 描述 | `opportunities/{索引}/desc` | string |
| 分类 | `opportunities/{索引}/category` | enum |
| 消耗体力 | `opportunities/{索引}/cost` | number |
| 是否完成 | `opportunities/{索引}/completed` | boolean |

---

## 九、任务

### 9.1 主线

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 当前主线 | `/quests/main/currentStage` | string |
| 已完成主线 | `/quests/main/completedStages` | string[] |

### 9.2 支线

**类型**：数组，每个元素为支线任务对象。  
**路径前缀**：`/quests/side/{索引}`

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 唯一标识 | `quests/side/{索引}/id` | string |
| 任务名 | `quests/side/{索引}/name` | string |
| 状态 | `quests/side/{索引}/status` | enum |
| 进度 | `quests/side/{索引}/progress` | number |

---

## 十、山河殿

### 10.1 建筑

**类型**：数组。  
**路径前缀**：`/world/buildings/{索引}`

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 建筑名 | `world/buildings/{索引}/name` | string |
| 等级 | `world/buildings/{索引}/level` | number |
| 是否解锁 | `world/buildings/{索引}/unlocked` | boolean |
| 描述 | `world/buildings/{索引}/description` | string |

### 10.2 疆域

**类型**：数组。  
**路径前缀**：`/world/regions/{索引}`

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 区域名 | `world/regions/{索引}/name` | string |
| 是否探索 | `world/regions/{索引}/unlocked` | boolean |
| 掌控势力 | `world/regions/{索引}/controlledBy` | string |

---

## 十一、近日要事

**类型**：数组，每个元素为事件对象。  
**路径前缀**：`/events/{索引}`

| 中文键名 | 技术路径 | 类型 |
|----------|----------|------|
| 唯一标识 | `events/{索引}/id` | string |
| 事件描述 | `events/{索引}/text` | string |
| 时间标记 | `events/{索引}/time` | string |
| 地点 | `events/{索引}/location` | string |
| 涉及人物 | `events/{索引}/people` | string |
| 事件类型 | `events/{索引}/type` | enum |

---

## 操作类型速查

| op | 作用 | value 类型 | 适用路径 |
|----|------|------------|----------|
| `replace` | 完全替换目标值 | 任意 | 对象字段、Record 键、数组索引 |
| `delta` | 对数字做加减 | number / 数字字符串 | 数字类型字段 |
| `insert` | 插入元素 | 对象/值 | 数组（`-` 表示末尾）、Record 新键 |
| `remove` | 删除元素 | 忽略 | 数组索引、Record 键 |

---

*文档版本：v1.0 | 对应游戏版本：2026-04-19*
