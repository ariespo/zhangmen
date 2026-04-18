# 云璃仙宗 — 初始状态表

> 游戏开局时的完整默认状态。LLM 以此为基础推进剧情，后续通过 `<vars>` 标签修改。

---

## 一、成员（members）

```json
{
  "沈万钧": {
    "id": "m1", "name": "沈万钧", "daoName": "万钧真人",
    "realm": "元婴后期", "role": "大长老", "status": "坐镇",
    "talent": "上上", "color": "jade",
    "stats": { "杀伐": 88, "防御": 72, "身法": 45 },
    "baseStats": { "杀伐": 88, "防御": 72, "身法": 45 },
    "lifespan": { "current": 892, "max": 1500 },
    "loyalty": 85, "mood": 75,
    "skills": ["太虚真解（第三层）"], "equipment": []
  },
  "周明远": {
    "id": "m2", "name": "周明远", "daoName": "明远子",
    "realm": "元婴初期", "role": "执法首座", "status": "巡查",
    "talent": "上", "color": "purple",
    "stats": { "杀伐": 82, "防御": 58, "身法": 62 },
    "baseStats": { "杀伐": 82, "防御": 58, "身法": 62 },
    "lifespan": { "current": 710, "max": 1200 },
    "loyalty": 78, "mood": 80,
    "skills": [], "equipment": []
  },
  "苏瑶": {
    "id": "m3", "name": "苏瑶", "daoName": "瑶光",
    "realm": "金丹后期", "role": "丹峰长老", "status": "炼丹",
    "talent": "上上", "color": "pink",
    "stats": { "杀伐": 55, "防御": 48, "身法": 52 },
    "baseStats": { "杀伐": 55, "防御": 48, "身法": 52 },
    "lifespan": { "current": 412, "max": 800 },
    "loyalty": 82, "mood": 72,
    "skills": [], "equipment": []
  },
  "林淮安": {
    "id": "m4", "name": "林淮安", "daoName": "静虚子",
    "realm": "金丹中期", "role": "藏经长老", "status": "研习",
    "talent": "上", "color": "gold",
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

```json
{
  "天剑宗":   { "name": "天剑宗", "relation": "盟友", "value": 82, "desc": "百年盟约，互为犄角之势", "color": "jade", "leader": "剑尊·凌霄子" },
  "万象门":   { "name": "万象门", "relation": "友好", "value": 65, "desc": "近年来往密切，有意深化合作", "color": "purple", "leader": "门主·玄机老人" },
  "血影谷":   { "name": "血影谷", "relation": "敌对", "value": 15, "desc": "魔修势力，多次侵犯边境", "color": "pink", "leader": "谷主·血罗" },
  "碧落宫":   { "name": "碧落宫", "relation": "中立", "value": 50, "desc": "女修门派，鲜少涉及外界纷争", "color": "gold", "leader": "宫主·明月仙子" },
  "太玄学府": { "name": "太玄学府", "relation": "友好", "value": 70, "desc": "学术交流频繁，成员互有往来", "color": "jade", "leader": "府主·青阳居士" },
  "九幽教":   { "name": "九幽教", "relation": "警惕", "value": 30, "desc": "行事诡秘，近来动向不明", "color": "pink", "leader": "教主·幽冥真人" }
}
```

---

## 七、任务（quests）

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

### 建筑

```json
[
  { "name": "悟道殿", "level": 5, "unlocked": true, "description": "掌门修行之所" },
  { "name": "藏经阁", "level": 3, "unlocked": true, "description": "收藏功法典籍" },
  { "name": "炼丹房", "level": 2, "unlocked": true, "description": "炼制丹药" },
  { "name": "炼器峰", "level": 2, "unlocked": true, "description": "锻造法器" }
]
```

### 疆域

```json
[
  { "name": "云璃峰", "unlocked": true, "controlledBy": "云璃仙宗" },
  { "name": "苍梧山", "unlocked": false, "controlledBy": "苍梧山散修" },
  { "name": "万剑峡", "unlocked": false, "controlledBy": "天剑宗" }
]
```

---

*文档版本：v1.0 | 对应游戏版本：2026-04-18*
