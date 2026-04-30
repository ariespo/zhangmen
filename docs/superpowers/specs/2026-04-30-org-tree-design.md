# 宗门组织架构 — 技能树式 SVG 动态流光设计

> 将宗门组织架构从纵向列表改造为从上到下的树状技能图，掌门为树根，向下逐层展开。

---

## 1. 需求摘要

- **树状结构**：顶部是树尖（掌门），往下延伸，用线条连接
- **class 概念**：rank 相同为同一层级，横向排列
- **掌门自动绑定**：rank 0 掌门节点自动显示玩家角色名，不可分配/移除成员
- **同级多职务**：rank 1 可添加多个同级职务（如副掌门、太上长老）
- **视觉风格**：SVG 动态流光连线 + 玻璃拟态节点卡片

---

## 2. 数据结构（不变）

```json
{
  "sect": {
    "organization": [
      { "rank": 0, "name": "掌门", "members": [] },
      { "rank": 1, "name": "副掌门", "members": [] },
      { "rank": 1, "name": "太上长老", "members": [] },
      { "rank": 2, "name": "长老", "members": [] }
    ]
  }
}
```

- `rank` 决定层级，相同 `rank` 的 role 在同一水平行
- `members` 为担任该职务的成员姓名数组

---

## 3. 视觉设计

### 3.1 布局结构

```
<div class="org-tree">
  <svg class="org-tree-svg"><!-- SVG 连线层 --></svg>
  <div class="org-tree-levels"><!-- 节点层 --></div>
</div>
```

- SVG 绝对定位覆盖在节点层之上，pointer-events: none
- 节点层按 rank 分组，每行一个 flex 容器，居中排列

### 3.2 掌门节点（特殊样式）

- 尺寸：比普通节点大 20%
- 边框：金色光晕（`--gold-spirit`，box-shadow + border-color）
- 内容：职位名「掌门」+ 玩家角色名
- 不可点击分配成员，不可删除
- 节点内显示「👑 掌门」标识

### 3.3 普通节点

- 玻璃拟态卡片（复用现有 `--glass-bg`）
- 青色边框（`--jade-glow`）
- 内容：职位名 + 成员列表（名字 + 境界）
- 点击 → 弹出人员分配弹窗（复用现有 `showOrgRoleAssign`）
- hover → 节点上浮 + 对应连线亮度增加

### 3.4 SVG 连线

- 路径：父节点底部中心 → 子节点顶部中心，二次贝塞尔曲线
- 掌门到 rank 1 的连线：金色渐变
- 其他连线：青色渐变
- 发光效果：`<filter>` 高斯模糊
- 流光动画：`stroke-dasharray: 8 4` + `stroke-dashoffset` 循环位移，3s 一轮

### 3.5 新增职位交互

- 每行最右侧显示 `[+]` 小按钮
- 点击在当前 rank 后添加同级职务
- 底部有「+ 新增层级」按钮，添加一个新的 rank 层级

---

## 4. 渲染逻辑

### 4.1 数据预处理

```js
function groupByRank(organization) {
  const groups = {};
  organization.forEach(role => {
    if (!groups[role.rank]) groups[role.rank] = [];
    groups[role.rank].push(role);
  });
  return Object.entries(groups)
    .sort((a, b) => a[0] - b[0])
    .map(([rank, roles]) => ({ rank: parseInt(rank), roles }));
}
```

### 4.2 渲染流程

1. 按 rank 分组生成层级 HTML
2. 插入 DOM
3. 等待 DOM 渲染完成后，计算每个节点的位置
4. 绘制 SVG 连线（从每个节点的中心到下一层对应节点的中心）
5. 绑定交互事件

### 4.3 连线绘制

```js
function drawLines() {
  const svg = document.querySelector('.org-tree-svg');
  const levels = document.querySelectorAll('.org-tree-level');
  // 获取每层节点的中心坐标
  // 为每对相邻层级绘制连线
}
```

---

## 5. CSS 动画

```css
/* 流光动画 */
@keyframes flowLight {
  to { stroke-dashoffset: -24; }
}

.org-tree-line {
  stroke-dasharray: 8 4;
  animation: flowLight 3s linear infinite;
}

/* 节点 hover */
.org-tree-node:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(110, 207, 207, 0.2);
}
```

---

## 6. 交互保持

- 点击普通节点 → `showOrgRoleAssign(rank, name)`（复用现有弹窗）
- 点击成员标签 → `showOrgMemberDetail(name, roleName)`（复用）
- 新增职位 → `addOrgRole(name)`（复用，需传入 rank 参数）
- 移除职位 → `removeOrgRole(rank, name)`（复用）
- 移除成员 → `removeOrgMember(rank, roleName, memberName)`（复用）

---

## 7. 边界处理

- 无 organization 数据时，显示默认 7 级结构（但按 rank 分组渲染）
- 掌门 rank 0 必须存在，不存在时自动创建
- 窗口 resize 时重绘 SVG 连线
- 弹窗打开/关闭后重绘连线（节点内容变化可能导致位置偏移）

---

*设计版本：v1.0 | 日期：2026-04-30*
