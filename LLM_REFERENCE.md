# 宗门志 — LLM 参考手册（扩展版）

> 本文档供 LLM 按需查阅，包含完整数据结构、天赋三维计算速查表、及所有可用路径。

---

## 一、顶层数据结构

```json
{
  "members": {},      // Record<姓名, 成员对象>
  "finance": {},      // 财务
  "treasury": {},     // 宝库
  "library": [],      // 藏经阁功法数组
  "opportunities": [], // 机遇数组
  "diplomacy": {},    // Record<势力名, 外交对象>
  "quests": {},       // 任务（主线+支线）
  "world": {},        // 世界（建筑+疆域）
  "player": {},       // 玩家（掌门）
  "sect": {},         // 宗门信息
  "events": []        // 近日要事（前端自动生成，一般无需手动操作）
}
```

---

## 二、成员（members）

类型：Record，key 为成员姓名。

```json
{
  "id": "",
  "name": "",
  "daoName": "",
  "realm": "炼气期",
  "role": "成员",
  "status": "坐镇",
  "talent": "乙中",
  "color": "jade",
  "stats": { "杀伐": 50, "防御": 50, "身法": 50 },
  "baseStats": { "杀伐": 50, "防御": 50, "身法": 50 },
  "lifespan": { "current": 100, "max": 200 },
  "loyalty": 60,
  "mood": 70,
  "personality": [],
  "appearance": [],
  "skills": [],
  "equipment": []
}
```

### 字段说明

| 字段 | 类型 | 可取值 |
|------|------|--------|
| `realm` | string | 炼气期/筑基期/金丹期/元婴期/化神期/道祖，可含阶段如"炼气期前期" |
| `role` | enum | 掌门/大长老/执法首座/丹峰长老/藏经长老/守山长老/内门弟子/外门弟子/成员 |
| `status` | enum | 坐镇/巡查/炼丹/研习/闭关/外出/受伤 |
| `talent` | string | 甲上/甲中/甲下/乙上/乙中/乙下/丙上/丙中/丙下/丁上/丁中/丁下 |
| `color` | enum | jade / purple / pink / gold |

### 装备字段（equipment 数组元素）

```json
{
  "name": "",
  "rank": "黄阶下品",
  "color": "jade",
  "type": "武器"
}
```

`type` 可取值：武器 / 防具 / 饰品 / 法宝

---

## 三、财务（finance）

```json
{
  "gold": 0,
  "income": 0,
  "expense": 0,
  "prestige": 0,
  "realmTitle": ""
}
```

---

## 四、宝库（treasury）

```json
{
  "items": [],
  "arrayName": "",
  "arrayRank": "",
  "arrayDesc": ""
}
```

### 物品字段（items 数组元素）

```json
{
  "id": "",
  "name": "",
  "type": "杂物",
  "rank": "黄阶下品",
  "quantity": 1,
  "color": "jade",
  "description": "",
  "owner": "",
  "effects": { "杀伐": 0, "防御": 0, "身法": 0 }
}
```

`type` 可取值：武器 / 防具 / 遁具 / 饰品 / 丹药 / 材料 / 功法 / 法宝 / 杂物

---

## 五、藏经阁（library）

数组元素：

```json
{
  "id": "",
  "name": "",
  "type": "道修",
  "rank": "黄阶",
  "desc": "",
  "color": "jade"
}
```

`type` 可取值：道修 / 神修 / 魔修 / 体修 / 修行百艺

---

## 六、机遇（opportunities）

数组元素：

```json
{
  "id": "",
  "title": "",
  "desc": "",
  "category": "tianshi",
  "cost": 1,
  "completed": false
}
```

`category` 可取值：tianshi（天时）/ dili（地利）/ renhe（人和）

---

## 七、外交（diplomacy）

Record，key 为势力名。

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

`relation` 可取值：盟友 / 友好 / 中立 / 警惕 / 敌对

---

## 八、任务（quests）

```json
{
  "main": {
    "currentStage": "",
    "completedStages": []
  },
  "side": []
}
```

### 支线任务字段（side 数组元素）

```json
{
  "id": "",
  "name": "",
  "status": "未触发",
  "progress": 0
}
```

`status` 可取值：未触发 / 进行中 / 已完成 / 已失败

---

## 九、世界（world）

### 建筑（buildings）

```json
{
  "name": "",
  "level": 1,
  "unlocked": true,
  "description": ""
}
```

### 疆域（regions）

```json
{
  "name": "",
  "unlocked": false,
  "controlledBy": "未知"
}
```

---

## 十、玩家（player）

```json
{
  "name": "",
  "daoName": "",
  "realm": "",
  "gender": "",
  "age": 0,
  "lifespan": { "current": 100, "max": 200 },
  "talent": "",
  "stats": { "杀伐": 50, "防御": 50, "身法": 50 },
  "baseStats": { "杀伐": 50, "防御": 50, "身法": 50 },
  "skills": [],
  "personality": [],
  "appearance": [],
  "color": "gold"
}
```

---

## 十一、宗门（sect）

```json
{
  "name": "",
  "foundedYear": "",
  "location": "",
  "founder": "",
  "history": "",
  "lineage": [],
  "description": "",
  "motto": ""
}
```

---

## 十二、天赋资质与三维计算

### 天赋索引表

| 天赋 | 索引 | 相对于乙中的差值 |
|------|------|------------------|
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

### 计算公式

```
base = 50 + talentDiff × 3
stageMultiplier = 1.5 ^ stageIndex   // 前期=0, 中期=1, 后期=2, 圆满=3
realmMultiplier = 10 ^ realmIndex    // 练气=0, 筑基=1, 金丹=2, 元婴=3, 化神=4, 道祖=5
value = round(base × stageMultiplier × realmMultiplier)
```

### 速查表

| 天赋 | 练气前期 | 练气中期 | 练气后期 | 练气圆满 | 筑基前期 | 金丹前期 | 元婴前期 |
|------|----------|----------|----------|----------|----------|----------|----------|
| 甲上 | 86 | 129 | 194 | 290 | 860 | 8600 | 86000 |
| 甲中 | 77 | 116 | 173 | 260 | 770 | 7700 | 77000 |
| 甲下 | 68 | 102 | 153 | 230 | 680 | 6800 | 68000 |
| 乙上 | 59 | 89 | 133 | 199 | 590 | 5900 | 59000 |
| **乙中** | **50** | **75** | **113** | **169** | **500** | **5000** | **50000** |
| 乙下 | 41 | 62 | 92 | 138 | 410 | 4100 | 41000 |
| 丙上 | 32 | 48 | 72 | 108 | 320 | 3200 | 32000 |
| 丙中 | 23 | 35 | 52 | 78 | 230 | 2300 | 23000 |
| 丙下 | 14 | 21 | 32 | 47 | 140 | 1400 | 14000 |
| 丁上 | 5 | 8 | 11 | 17 | 50 | 500 | 5000 |
| 丁中 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 丁下 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

### 计算示例

- 乙中 + 练气期前期 = 50
- 乙中 + 练气期中期 = round(50 × 1.5) = 75
- 乙中 + 金丹期后期 = round(50 × 2.25 × 100) = 11250
- 甲上 + 元婴期圆满 = round(86 × 3.375 × 1000) = 290250

---

## 十三、完整路径表

### members 路径

```
/members/{姓名}/name
/members/{姓名}/daoName
/members/{姓名}/realm              // 修改时同步更新 baseStats 和 stats
/members/{姓名}/role
/members/{姓名}/status
/members/{姓名}/talent
/members/{姓名}/color
/members/{姓名}/stats/杀伐
/members/{姓名}/stats/防御
/members/{姓名}/stats/身法
/members/{姓名}/baseStats/杀伐
/members/{姓名}/baseStats/防御
/members/{姓名}/baseStats/身法
/members/{姓名}/lifespan/current
/members/{姓名}/lifespan/max
/members/{姓名}/loyalty
/members/{姓名}/mood
/members/{姓名}/skills/{索引}
/members/{姓名}/skills/-           // 追加
/members/{姓名}/equipment/{索引}
/members/{姓名}/equipment/-        // 追加
/members/{姓名}                    // insert: 新增成员, remove: 移除成员
```

### finance 路径

```
/finance/gold
/finance/income
/finance/expense
/finance/prestige
/finance/realmTitle
```

### treasury 路径

```
/treasury/items/{索引}
/treasury/items/-                  // 追加
/treasury/items/{索引}/name
/treasury/items/{索引}/owner       // 分配给成员时修改
/treasury/arrayName
/treasury/arrayRank
/treasury/arrayDesc
```

### library 路径

```
/library/{索引}
/library/-                         // 追加
```

### opportunities 路径

```
/opportunities/{索引}
/opportunities/-                   // 追加
/opportunities/{索引}/completed
```

### diplomacy 路径

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

### quests 路径

```
/quests/main/currentStage
/quests/main/completedStages/-     // 追加已完成阶段
/quests/side/{索引}
/quests/side/-                     // 追加支线
/quests/side/{索引}/status
/quests/side/{索引}/progress
```

### world 路径

```
/world/buildings/{索引}
/world/buildings/-                 // 追加
/world/buildings/{索引}/level
/world/buildings/{索引}/unlocked
/world/regions/{索引}
/world/regions/-                   // 追加
/world/regions/{索引}/unlocked
/world/regions/{索引}/controlledBy
```

### player 路径

```
/player/name
/player/daoName
/player/realm                      // 修改时同步更新 baseStats 和 stats
/player/gender
/player/age
/player/lifespan/current
/player/lifespan/max
/player/talent
/player/stats/杀伐
/player/stats/防御
/player/stats/身法
/player/baseStats/杀伐
/player/baseStats/防御
/player/baseStats/身法
/player/skills/-                   // 追加
```

### sect 路径

```
/sect/name
/sect/foundedYear
/sect/location
/sect/founder
/sect/history
/sect/lineage/-                    // 追加
/sect/description
/sect/motto
```

---

*文档版本：v1.0 | 适用游戏版本：2026-04-21*
