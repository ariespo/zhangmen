# 宗门志 — 完整初始变量表

> 本文档列出 `gameState` 中所有变量的 Schema 定义与默认初始值。若玩家通过开局创建向导启动，部分字段将被覆盖为玩家自定义值。

---

## 顶层结构

```json
{
  "members":       {},      // Record<姓名, 成员对象> — 默认含 4 名NPC成员
  "finance":       {},      // 财务数据
  "treasury":      {},      // 宝库（含护山大阵与物品列表）
  "library":       [],      // 功法数组 — 默认含 15 本功法
  "opportunities": [],      // 机遇数组 — 默认含 8 条机遇
  "diplomacy":     {},      // Record<势力名, 外交对象> — 默认含 6 个势力
  "quests":        {},      // 任务（主线+支线）
  "world":         {},      // 世界（建筑+疆域）
  "player":        {},      // 玩家（掌门）自身信息 — 默认空对象
  "sect":          {},      // 宗门信息 — 默认空对象
  "events":        []       // 近日要事列表 — 默认空数组
}
```

---

## 一、成员（members）

**类型**：Record，key 为成员姓名。  
**路径前缀**：`/members/{姓名}`

### 1.1 成员对象字段

| 字段 | 类型 | 默认值 | 约束 | 说明 |
|------|------|--------|------|------|
| `id` | string | `""` | — | 唯一标识 |
| `name` | string | `""` | — | 姓名（与 Record key 相同） |
| `daoName` | string | `""` | — | 道号 |
| `realm` | string | `"炼气期"` | — | 境界，如 炼气期/筑基期/金丹期/元婴期/化神期/道祖，含阶段则如 炼气期前期 |
| `role` | enum | `"成员"` | 掌门/大长老/执法首座/丹峰长老/藏经长老/守山长老/内门弟子/外门弟子/成员 | 职务 |
| `status` | enum | `"坐镇"` | 坐镇/巡查/炼丹/研习/闭关/外出/受伤 | 当前状态 |
| `talent` | string | `"乙中"` | 甲上~甲中~甲下~乙上~乙中~乙下~丙上~丙中~丙下~丁上~丁中~丁下 | 天赋资质 |
| `color` | enum | `"jade"` | jade/purple/pink/gold | UI 配色标识 |
| `stats.杀伐` | number | `50` | 0~100 | 当前杀伐（含装备加成） |
| `stats.防御` | number | `50` | 0~100 | 当前防御（含装备加成） |
| `stats.身法` | number | `50` | 0~100 | 当前身法（含装备加成） |
| `baseStats.杀伐` | number | `50` | 0~100 | 基础杀伐（不含装备） |
| `baseStats.防御` | number | `50` | 0~100 | 基础防御（不含装备） |
| `baseStats.身法` | number | `50` | 0~100 | 基础身法（不含装备） |
| `lifespan.current` | number | `100` | >=0 | 当前寿元 |
| `lifespan.max` | number | `200` | >=1 | 最大寿元 |
| `loyalty` | number | `60` | 0~100 | 忠诚度 |
| `mood` | number | `70` | 0~100 | 心情 |
| `skills` | string[] | `[]` | — | 已修功法列表 |
| `equipment` | object[] | `[]` | 见下 EquipmentSchema | 装备列表 |

### 1.2 装备对象（equipment 数组中的元素）

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `name` | string | `""` | — | 装备名 |
| `rank` | string | `"黄阶下品"` | — | 品阶 |
| `color` | enum | `"jade"` | jade/purple/pink/gold | 配色 |
| `type` | enum | `"武器"` | 武器/防具/饰品/法宝 | 装备类型 |

### 1.3 默认成员数据

```json
{
  "沈万钧": {
    "id": "m1", "name": "沈万钧", "daoName": "万钧真人",
    "realm": "元婴期后期", "role": "大长老", "status": "坐镇",
    "talent": "甲上", "color": "jade",
    "stats": { "杀伐": 88, "防御": 72, "身法": 45 },
    "baseStats": { "杀伐": 88, "防御": 72, "身法": 45 },
    "lifespan": { "current": 892, "max": 1500 },
    "loyalty": 85, "mood": 75,
    "skills": ["太虚真解（第三层）"], "equipment": []
  },
  "周明远": {
    "id": "m2", "name": "周明远", "daoName": "明远子",
    "realm": "元婴期初期", "role": "执法首座", "status": "巡查",
    "talent": "甲中", "color": "purple",
    "stats": { "杀伐": 82, "防御": 58, "身法": 62 },
    "baseStats": { "杀伐": 82, "防御": 58, "身法": 62 },
    "lifespan": { "current": 710, "max": 1200 },
    "loyalty": 78, "mood": 80,
    "skills": [], "equipment": []
  },
  "苏瑶": {
    "id": "m3", "name": "苏瑶", "daoName": "瑶光",
    "realm": "金丹期后期", "role": "丹峰长老", "status": "炼丹",
    "talent": "甲上", "color": "pink",
    "stats": { "杀伐": 55, "防御": 48, "身法": 52 },
    "baseStats": { "杀伐": 55, "防御": 48, "身法": 52 },
    "lifespan": { "current": 412, "max": 800 },
    "loyalty": 82, "mood": 72,
    "skills": [], "equipment": []
  },
  "林淮安": {
    "id": "m4", "name": "林淮安", "daoName": "静虚子",
    "realm": "金丹期中期", "role": "藏经长老", "status": "研习",
    "talent": "甲中", "color": "gold",
    "stats": { "杀伐": 42, "防御": 50, "身法": 38 },
    "baseStats": { "杀伐": 42, "防御": 50, "身法": 38 },
    "lifespan": { "current": 356, "max": 700 },
    "loyalty": 70, "mood": 68,
    "skills": [], "equipment": []
  }
}
```

---

## 二、财务（finance）

**路径前缀**：`/finance`

| 字段 | 类型 | 默认值 | 约束 | 说明 |
|------|------|--------|------|------|
| `gold` | number | `12580` | >=0 | 灵石存量 |
| `income` | number | `8420` | — | 月收入 |
| `expense` | number | `5680` | — | 月支出 |
| `prestige` | number | `1800` | >=0 | 威望值 |
| `realmTitle` | string | `"一洲正道魁首"` | — | 位阶称号 |

```json
{
  "gold": 12580,
  "income": 8420,
  "expense": 5680,
  "prestige": 1800,
  "realmTitle": "一洲正道魁首"
}
```

---

## 三、宝库（treasury）

**路径前缀**：`/treasury`

### 3.1 顶层字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | array | `[]` | 物品列表（见 3.2） |
| `arrayName` | string | `"九曜星辰阵"` | 护山大阵名称 |
| `arrayRank` | string | `"地阶上品"` | 护山大阵品阶 |
| `arrayDesc` | string | `"聚灵护山，攻防一体"` | 护山大阵描述 |

### 3.2 物品对象（items 数组中的元素）

| 字段 | 类型 | 默认值 | 可取值/约束 | 说明 |
|------|------|--------|-------------|------|
| `id` | string | `""` | — | 唯一标识 |
| `name` | string | `""` | — | 物品名 |
| `type` | enum | `"杂物"` | 武器/防具/遁具/饰品/丹药/材料/功法/法宝/杂物 | 类型 |
| `rank` | string | `"黄阶下品"` | — | 品阶 |
| `quantity` | number | `1` | >=0 | 数量 |
| `color` | enum | `"jade"` | jade/purple/pink/gold | UI 配色 |
| `description` | string | `""` | — | 描述 |
| `owner` | string | `""` | — | 持有者姓名，空字符串表示在库房 |
| `effects.杀伐` | number | `0` | — | 装备效果：杀伐加成 |
| `effects.防御` | number | `0` | — | 装备效果：防御加成 |
| `effects.身法` | number | `0` | — | 装备效果：身法加成 |

### 3.3 默认宝库数据

```json
{
  "arrayName": "九曜星辰阵",
  "arrayRank": "地阶上品",
  "arrayDesc": "聚灵护山，攻防一体",
  "items": [
    { "id": "w1", "name": "霜华剑", "type": "武器", "rank": "上品灵器", "quantity": 1, "color": "jade", "description": "剑身如霜，挥剑时可凝冰气伤人", "owner": "清虚子", "effects": { "杀伐": 45, "防御": 5, "身法": 8 } },
    { "id": "w2", "name": "碧落剑", "type": "武器", "rank": "上品灵器", "quantity": 1, "color": "jade", "description": "通体碧绿，传闻可引动天地灵气", "owner": "", "effects": { "杀伐": 42, "防御": 8, "身法": 10 } },
    { "id": "w3", "name": "紫电鞭", "type": "武器", "rank": "中品灵器", "quantity": 1, "color": "purple", "description": "鞭身缠绕紫电，中者麻痹难动", "owner": "苏瑶", "effects": { "杀伐": 35, "防御": 0, "身法": 15 } },
    { "id": "w4", "name": "玄铁枪", "type": "武器", "rank": "中品灵器", "quantity": 1, "color": "gold", "description": "玄铁铸成，势大力沉，一往无前", "owner": "", "effects": { "杀伐": 38, "防御": 12, "身法": -5 } },
    { "id": "w5", "name": "青锋剑", "type": "武器", "rank": "下品灵器", "quantity": 1, "color": "jade", "description": "入门成员常用的制式飞剑", "owner": "", "effects": { "杀伐": 22, "防御": 2, "身法": 5 } },
    { "id": "w6", "name": "噬魂刃", "type": "武器", "rank": "上品灵器", "quantity": 1, "color": "pink", "description": "魔道凶器，可伤敌神魂", "owner": "周明远", "effects": { "杀伐": 50, "防御": 0, "身法": 12 } },
    { "id": "a1", "name": "玄龟甲", "type": "防具", "rank": "中品灵器", "quantity": 1, "color": "jade", "description": "仿上古玄龟背甲所铸，坚不可摧", "owner": "清虚子", "effects": { "杀伐": 0, "防御": 40, "身法": -8 } },
    { "id": "a2", "name": "冰蚕衣", "type": "防具", "rank": "上品灵器", "quantity": 1, "color": "purple", "description": "万年冰蚕丝织成，水火不侵", "owner": "", "effects": { "杀伐": 5, "防御": 35, "身法": 10 } },
    { "id": "a3", "name": "金丝软甲", "type": "防具", "rank": "中品灵器", "quantity": 1, "color": "gold", "description": "金丝编织，轻便柔韧，贴身无形", "owner": "沈万钧", "effects": { "杀伐": 0, "防御": 28, "身法": 5 } },
    { "id": "a4", "name": "护体符", "type": "防具", "rank": "法器", "quantity": 1, "color": "pink", "description": "可激发护体灵光的防御符箓", "owner": "", "effects": { "杀伐": 0, "防御": 15, "身法": 0 } },
    { "id": "e1", "name": "遁空梭", "type": "遁具", "rank": "上品灵器", "quantity": 1, "color": "purple", "description": "可撕裂虚空，瞬息千里", "owner": "", "effects": { "杀伐": 0, "防御": 5, "身法": 50 } },
    { "id": "e2", "name": "踏云靴", "type": "遁具", "rank": "中品灵器", "quantity": 1, "color": "gold", "description": "穿上可踏云而行，速度大增", "owner": "", "effects": { "杀伐": 0, "防御": 0, "身法": 30 } },
    { "id": "e3", "name": "缩地符", "type": "遁具", "rank": "法器", "quantity": 1, "color": "jade", "description": "一步可达十里之外", "owner": "", "effects": { "杀伐": 0, "防御": 0, "身法": 18 } },
    { "id": "ac1", "name": "凝神玉佩", "type": "饰品", "rank": "上品灵器", "quantity": 1, "color": "jade", "description": "可凝神静气，抵御心魔", "owner": "", "effects": { "杀伐": 8, "防御": 15, "身法": 5 } },
    { "id": "ac2", "name": "储物戒指", "type": "饰品", "rank": "中品灵器", "quantity": 1, "color": "gold", "description": "内含独立空间，可储万物", "owner": "清虚子", "effects": { "杀伐": 0, "防御": 5, "身法": 5 } },
    { "id": "ac3", "name": "锁灵镯", "type": "饰品", "rank": "下品灵器", "quantity": 1, "color": "purple", "description": "可锁住周身灵气，隐匿身形", "owner": "", "effects": { "杀伐": 0, "防御": 10, "身法": 12 } }
  ]
}
```

---

## 四、藏经阁（library）

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

### 默认功法数据

```json
[
  { "id": "s1", "name": "太虚真解", "type": "道修", "rank": "天阶上品", "desc": "宗门根本功法，可贯通天地灵气，攻守兼备，修炼至大成可触摸天道门槛", "color": "jade" },
  { "id": "s2", "name": "紫霄神雷诀", "type": "道修", "rank": "地阶上品", "desc": "雷法秘术，引天雷入体，威力惊人，修炼者需承受雷霆淬体之痛", "color": "purple" },
  { "id": "s3", "name": "天罡剑诀", "type": "道修", "rank": "地阶中品", "desc": "上古剑法，凝聚天罡之力，一剑可破万法，剑修必修之术", "color": "gold" },
  { "id": "s4", "name": "碧波心经", "type": "道修", "rank": "玄阶上品", "desc": "水属性功法，可凝神静气，疗伤恢复，适合水木灵根修炼", "color": "jade" },
  { "id": "s5", "name": "基础剑术", "type": "道修", "rank": "黄阶", "desc": "入门剑法，简单实用，外门成员必修的基础剑道之术", "color": "jade" },
  { "id": "s6", "name": "神念九转", "type": "神修", "rank": "天阶下品", "desc": "以神识为根基，九转之后神念可覆盖千里，一念杀敌于无形", "color": "purple" },
  { "id": "s7", "name": "炼神诀", "type": "神修", "rank": "地阶上品", "desc": "锤炼神魂之法，可抵御心魔入侵，提升悟性", "color": "purple" },
  { "id": "s8", "name": "噬魂魔典", "type": "魔修", "rank": "天阶中品", "desc": "魔道至高功法，可吞噬他人魂魄提升修为，为正道所不容", "color": "pink" },
  { "id": "s9", "name": "血煞大法", "type": "魔修", "rank": "地阶下品", "desc": "以血为引，激发潜能，短时间内战力倍增，但会损伤根基", "color": "pink" },
  { "id": "s10", "name": "金刚不坏体", "type": "体修", "rank": "玄阶上品", "desc": "体修功法，可大幅提升肉身防御力，刀枪不入，水火不侵", "color": "gold" },
  { "id": "s11", "name": "龙象般若功", "type": "体修", "rank": "地阶中品", "desc": "搬运气血，淬炼肉身，修炼至大成可拥有龙象之力", "color": "gold" },
  { "id": "s12", "name": "九转还丹术", "type": "修行百艺", "rank": "地阶上品", "desc": "高阶丹方集录，含筑基丹、金丹丹方等，丹道宗师必修", "color": "pink" },
  { "id": "s13", "name": "玄天阵录", "type": "修行百艺", "rank": "地阶", "desc": "阵法宝典，囊括数十种攻防大阵的布置之法", "color": "purple" },
  { "id": "s14", "name": "灵药辨识经", "type": "修行百艺", "rank": "黄阶", "desc": "记载千余种灵药特性，炼丹入门必读", "color": "pink" },
  { "id": "s15", "name": "基础炼器诀", "type": "修行百艺", "rank": "凡阶", "desc": "炼器入门之法，教授如何辨识材料、掌控火候", "color": "jade" }
]
```

---

## 五、机遇（opportunities）

**类型**：数组  
**路径前缀**：`/opportunities/{索引}`

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `id` | string | `""` | — | 唯一标识 |
| `title` | string | `""` | — | 标题 |
| `desc` | string | `""` | — | 描述 |
| `category` | enum | `"tianshi"` | tianshi/dili/renhe | 分类：天时/地利/人和 |
| `cost` | number | `1` | >=0 | 消耗体力 |
| `completed` | boolean | `false` | — | 是否已完成 |

### 默认机遇数据

```json
[
  { "id": "o1", "title": "九星连珠", "desc": "天地剧变，星辰移位，未来三百年内气运之子出现概率大幅度增加，正是广收门徒的最佳时机", "category": "tianshi", "cost": 1, "completed": false },
  { "id": "o2", "title": "灵气复苏", "desc": "沉寂万年的上古灵脉开始苏醒，各大宗门都在寻找新出现的灵地，机不可失", "category": "tianshi", "cost": 1, "completed": false },
  { "id": "o3", "title": "太古遗迹现世", "desc": "据探子回报，东荒深处的「葬仙谷」有上古遗迹出世，传说其中有仙人遗留的传承", "category": "dili", "cost": 2, "completed": false },
  { "id": "o4", "title": "论剑大会", "desc": "天剑宗将于三个月后召开「万剑朝宗」论剑大会，邀请天下剑修共襄盛举", "category": "dili", "cost": 1, "completed": false },
  { "id": "o5", "title": "青阳道人讲法", "desc": "太玄学府的青阳居士将于下月在云梦泽开设法会，讲授「道法自然」之理", "category": "dili", "cost": 1, "completed": false },
  { "id": "o6", "title": "长老请愿", "desc": "大长老沈万钧请求上调执法堂成员俸禄，称近年宗门收入增加，理应惠及门人", "category": "renhe", "cost": 1, "completed": false },
  { "id": "o7", "title": "成员纷争", "desc": "成员林淮安与苏瑶因一处洞府归属产生激烈矛盾，请求掌门主持公道", "category": "renhe", "cost": 1, "completed": false },
  { "id": "o8", "title": "万象门求见", "desc": "万象门特使携带厚礼求见，希望能够与我宗建立更深层次的战略合作关系", "category": "renhe", "cost": 1, "completed": false }
]
```

---

## 六、外交（diplomacy）

**类型**：Record，key 为势力名。  
**路径前缀**：`/diplomacy/{势力名}`

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `name` | string | `""` | — | 势力名（与 Record key 相同） |
| `relation` | enum | `"中立"` | 盟友/友好/中立/警惕/敌对 | 关系等级 |
| `value` | number | `50` | 0~100 | 关系值 |
| `desc` | string | `""` | — | 关系描述 |
| `color` | enum | `"gold"` | jade/purple/pink/gold | UI 配色 |
| `leader` | string | `""` | — | 掌权者 |

### 默认外交数据

```json
{
  "天剑宗": { "name": "天剑宗", "relation": "盟友", "value": 82, "desc": "百年盟约，互为犄角之势", "color": "jade", "leader": "剑尊·凌霄子" },
  "万象门": { "name": "万象门", "relation": "友好", "value": 65, "desc": "近年来往密切，有意深化合作", "color": "purple", "leader": "门主·玄机老人" },
  "血影谷": { "name": "血影谷", "relation": "敌对", "value": 15, "desc": "魔修势力，多次侵犯边境", "color": "pink", "leader": "谷主·血罗" },
  "碧落宫": { "name": "碧落宫", "relation": "中立", "value": 50, "desc": "女修门派，鲜少涉及外界纷争", "color": "gold", "leader": "宫主·明月仙子" },
  "太玄学府": { "name": "太玄学府", "relation": "友好", "value": 70, "desc": "学术交流频繁，成员互有往来", "color": "jade", "leader": "府主·青阳居士" },
  "九幽教": { "name": "九幽教", "relation": "警惕", "value": 30, "desc": "行事诡秘，近来动向不明", "color": "pink", "leader": "教主·幽冥真人" }
}
```

---

## 七、任务（quests）

**路径前缀**：`/quests`

### 7.1 主线（quests.main）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentStage` | string | `"玄云密信"` | 当前主线阶段名 |
| `completedStages` | string[] | `[]` | 已完成的主线阶段列表 |

### 7.2 支线（quests.side）

数组，每个元素：

| 字段 | 类型 | 默认值 | 可取值 | 说明 |
|------|------|--------|--------|------|
| `id` | string | `""` | — | 唯一标识 |
| `name` | string | `""` | — | 任务名 |
| `status` | enum | `"未触发"` | 未触发/进行中/已完成/已失败 | 状态 |
| `progress` | number | `0` | 0~100 | 进度百分比 |

```json
{
  "main": {
    "currentStage": "玄云密信",
    "completedStages": []
  },
  "side": []
}
```

---

## 八、世界（world）

**路径前缀**：`/world`

### 8.1 建筑（world.buildings）

| 字段 | 类型 | 默认值 | 约束 | 说明 |
|------|------|--------|------|------|
| `name` | string | `""` | — | 建筑名 |
| `level` | number | `1` | 0~10 | 等级 |
| `unlocked` | boolean | `true` | — | 是否已解锁 |
| `description` | string | `""` | — | 描述 |

### 8.2 疆域（world.regions）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | `""` | 区域名 |
| `unlocked` | boolean | `false` | 是否已探索 |
| `controlledBy` | string | `"未知"` | 掌控势力 |

### 默认世界数据

```json
{
  "buildings": [
    { "name": "悟道殿", "level": 5, "unlocked": true, "description": "掌门修行之所" },
    { "name": "藏经阁", "level": 3, "unlocked": true, "description": "收藏功法典籍" },
    { "name": "炼丹房", "level": 2, "unlocked": true, "description": "炼制丹药" },
    { "name": "炼器峰", "level": 2, "unlocked": true, "description": "锻造法器" }
  ],
  "regions": [
    { "name": "云璃峰", "unlocked": true, "controlledBy": "云璃仙宗" },
    { "name": "苍梧山", "unlocked": false, "controlledBy": "苍梧山散修" },
    { "name": "万剑峡", "unlocked": false, "controlledBy": "天剑宗" }
  ]
}
```

---

## 九、玩家（player）

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

> 默认值为空对象 `{}`。若通过开局创建向导启动，将被填充为玩家自定义值。

---

## 十、宗门（sect）

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

> 默认值为空对象 `{}`。若通过开局创建向导启动，基础信息（如名称）将被填充，历史和传承由 LLM 根据玩家选择动态生成。

---

## 十一、近日要事（events）

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

> 默认值为空数组 `[]`。LLM 可通过 `<vars>` 标签追加新事件。

---

## 十二、开局创建元数据（_creationMeta）

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

> `_creationMeta` 仅作为提示词上下文使用，不直接影响游戏机制。

---

## 十三、操作类型速查

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

## 十四、批量操作示例

```xml
<vars>
[
  {"op":"delta","path":"/finance/gold","value":"-500"},
  {"op":"delta","path":"/finance/prestige","value":"50"},
  {"op":"replace","path":"/members/周明远/status","value":"外出"},
  {"op":"replace","path":"/quests/main/currentStage","value":"秘境探索"},
  {"op":"insert","path":"/quests/main/completedStages/-","value":"玄云密信"},
  {"op":"insert","path":"/quests/side/-","value":{"id":"q_ancient","name":"古战场侦察","status":"进行中","progress":20}},
  {"op":"insert","path":"/treasury/items/-","value":{"id":"treasure1","name":"上古玉简","type":"法宝","rank":"天阶下品","quantity":1,"color":"gold","description":"记载上古遗迹坐标的玉简","owner":"","effects":{"杀伐":0,"防御":0,"身法":0}}},
  {"op":"insert","path":"/events/-","value":{"id":"e_new","text":"天剑宗使者到访","time":"刚刚","location":"山门","people":"天剑宗使者","type":"info"}}
]
</vars>
```

---

## 十五、天赋资质与三维计算

角色三维（杀伐/防御/身法）由天赋资质和境界共同决定：

| 天赋 | 等级索引 | 相对于乙中的差值 |
|------|----------|------------------|
| 甲上 | 0 | +12 |
| 甲中 | 1 | +9 |
| 甲下 | 2 | +6 |
| 乙上 | 3 | +3 |
| 乙中 | 4 | 0 |
| 乙下 | 5 | -3 |
| 丙上 | 6 | -6 |
| 丙中 | 7 | -9 |
| 丙下 | 8 | -12 |
| 丁上 | 9 | -15 |
| 丁中 | 10 | -18 |
| 丁下 | 11 | -21 |

**计算公式：**

```
base = 50 + talentDiff * 3
stageMultiplier = 1.5 ^ stageIndex   // 前期=0, 中期=1, 后期=2, 圆满=3
realmMultiplier = 10 ^ realmIndex    // 练气=0, 筑基=1, 金丹=2, 元婴=3, 化神=4, 道祖=5
value = round(base * stageMultiplier * realmMultiplier)
```

**示例：**
- 乙中 + 练气期前期 = 50
- 乙上 + 练气期前期 = 53
- 乙中 + 练气期中期 = 75
- 甲上 + 金丹期后期 = round(62 * 3.375 * 100) = 20925

---

*文档版本：v2.1 | 对应游戏版本：2026-04-19*
