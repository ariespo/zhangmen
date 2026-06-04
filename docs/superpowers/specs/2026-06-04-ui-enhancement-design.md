# 全部页面视觉升级 + GSAP 标题动画 设计文档

> **日期**: 2026-06-04
> **范围**: 全部页面（标题页面、创建页面、加载页面、#app 主界面）
> **默认主题**: 深色（用户已确认）

---

## 一、配色系统升级

### 核心配色表

| 层级 | 颜色值 | 用途 |
|------|--------|------|
| **主调** | `#6ecfcf` 青绿 | 主按钮、选中态、边框高光、进度条 |
| **尊贵** | `#c8a86e` 暗金 | 稀有/高级标签、重要操作按钮、成就徽章、标题金色 |
| **机缘** | `#8b7ec8` 淡紫 | 特殊事件、机缘提示、VIP相关、天机台 accent |
| **警示** | `#d4728c` 莲粉 | 危险/警告、负面数值、战斗相关、删除操作 |
| **生命** | `#5cb85c` 翠绿 | 正面增益、治疗、修为提升、正向数值 |

### 页面专属点缀

- **天机台**：青绿 + 暗金（天道推演，尊贵感）
- **成员堂**：青绿 + 翠绿（生命/修为）
- **藏经阁**：青绿 + 暗金（古籍，珍贵）
- **外交/山河**：青绿 + 淡紫（机缘，变化）
- **宝库**：青绿 + 暗金（财富，珍贵）
- **任务**：青绿 + 翠绿（正向激励）

### 深色主题背景层级

| 层级 | 颜色 | 用途 |
|------|------|------|
| 页面背景 | `#0d1f1f` | body / #app 底层 |
| 面板背景 | `rgba(26, 58, 58, 0.55)` | 卡片、面板（glass-bg） |
| 面板悬浮 | `rgba(26, 58, 58, 0.7)` | hover 状态 |
| 输入框背景 | `rgba(13, 31, 31, 0.8)` | 表单输入 |

---

## 二、框体与卡片质感（层次框体系统）

### 三层框体 `.tiered-frame`

```
┌─────────────────────────────┐  ← Layer 1: 外层墨绿细边框 1px rgba(110,207,207,0.12)
│  ┌───────────────────────┐  │  ← Layer 2: 中间金色高光 1px rgba(200,168,110,0.15)
│  │  ┌─────────────────┐  │  │  ← Layer 3: 内层毛玻璃面板
│  │  │                 │  │  │
│  │  │   内容区域       │  │  │
│  │  │                 │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### CSS 实现

```css
.tiered-frame {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 16px;
}
.tiered-frame::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 13px;
  border: 1px solid rgba(110, 207, 207, 0.12);
  pointer-events: none;
}
.tiered-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 1px solid rgba(200, 168, 110, 0.15);
  pointer-events: none;
}
```

### 四角装饰

保留并增强现有的四角金饰：
- 外角：12px x 12px，墨绿色，opacity 0.3
- 内角：8px x 8px，金色，opacity 0.5

---

## 三、动效系统（中等丰富）

### 3.1 入场动画

**页面切换/元素首次出现：**
- 元素 stagger 淡入，延迟 40ms
- 从 `opacity: 0, translateY: 12px` → `opacity: 1, translateY: 0`
- 持续时间：0.4s，缓动：`cubic-bezier(0.22, 1, 0.36, 1)`

**标题文字 reveal：**
- 从 `blur(6px), scale(0.96), opacity: 0` → `blur(0), scale(1), opacity: 1`
- 持续时间：0.8s

### 3.2 卡片悬浮

```css
.tiered-frame {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.tiered-frame:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(110, 207, 207, 0.08),
              inset 0 0 20px rgba(110, 207, 207, 0.04);
}
```

### 3.3 数字跳动

资源数值变化时的滚动数字效果：
- 使用 `requestAnimationFrame` 实现平滑过渡
- 持续时间：0.6s
- 缓动：ease-out

### 3.4 脉动提示

重要通知/可交互元素的呼吸灯效果：

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(110, 207, 207, 0.15); }
  50% { box-shadow: 0 0 20px rgba(110, 207, 207, 0.35); }
}
.pulse-hint {
  animation: pulse-glow 2.5s ease-in-out infinite;
}
```

---

## 四、交互反馈（笔刷下划线）

### 按钮悬停

```css
.brush-btn {
  position: relative;
  overflow: hidden;
}
.brush-btn::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 80%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-spirit), transparent);
  transform: translateX(-50%) scaleX(0);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.brush-btn:hover::after {
  transform: translateX(-50%) scaleX(1);
}
```

### 点击涟漪

```css
.brush-btn:active {
  transform: scale(0.97);
}
```

---

## 五、页面级改造清单

### 5.1 标题页面 — GSAP 动画重制

**技术：** CDN 引入 GSAP 3.12.5 (`gsap.min.js` + `ScrollTrigger` 可选)

**Timeline 序列（共 5.5 秒）：**

| 时间 | 动画 | 详情 |
|------|------|------|
| 0.0s | 背景渐变淡入 | `#0c1418` → 完整渐变，duration: 0.8s |
| 0.2s | 远景山脉升起 | `translateY(60px)→0, opacity: 0→1`, duration: 1.2s, ease: `power3.out` |
| 0.6s | 中景山脉升起 | 同上，delay: 0.4s |
| 1.0s | 近景山脉升起 | 同上，delay: 0.8s |
| 1.8s | 标题「宗门志」reveal | `scale: 0.85→1, blur: 10px→0, opacity: 0→1`, duration: 1.0s, ease: `expo.out` |
| 2.0s | 金色光晕扩散 | `box-shadow` 从 `0 0 0` 到 `0 0 60px rgba(184,155,107,0.3)`，duration: 1.5s |
| 2.8s | 副标题淡入 | `opacity: 0→0.7, letter-spacing: 14px→10px`, duration: 0.8s |
| 3.4s | 按钮滑入 | `translateY: 20px→0, opacity: 0→1`, stagger: 0.12s, duration: 0.5s |
| 4.0s | 云雾开始流动 | 无限循环 `translateX`, duration: 40s, linear |
| 全程 | 粒子飘动 | 10-15 个光点，random 轨迹，opacity 呼吸，使用 GSAP `to` + `yoyo` |

**粒子系统（GSAP 实现）：**
```javascript
const particles = [];
for (let i = 0; i < 15; i++) {
  const p = document.createElement('div');
  p.className = 'title-particle';
  // random position, size, opacity
  gsap.to(p, {
    x: `random(-100, 100)`,
    y: `random(-50, 50)`,
    opacity: `random(0.1, 0.5)`,
    duration: `random(3, 6)`,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}
```

**SVG 山脉绘制动画：**
使用 GSAP `DrawSVGPlugin` 或手动实现 `stroke-dashoffset` 动画，让山脉轮廓从无到有绘制出来。

### 5.2 创建页面 — 分步骤动效

- **步骤指示器**：当前步骤有金色高亮边框，已完成步骤有绿色对勾，未完成步骤灰色
- **表单字段 stagger 入场**：每进入一步，字段从下方淡入，stagger 0.08s
- **AI 设计按钮**：脉动提示（`pulse-hint`），hover 时有金色扫光
- **预览区域**：内容更新时有淡入切换效果

### 5.3 加载页面 — 存档卡片动效

- **存档卡片 stagger 入场**：从下方淡入，stagger 0.06s
- **选中卡片**：金色边框高亮 + 轻微放大（`scale: 1.02`）
- **删除操作**：卡片先 shake 再淡出（`translateX` 左右晃动）
- **空状态**：有淡淡的墨晕图案作为背景装饰

### 5.4 #app 主界面 — 全面升级

#### 顶部栏
- 资源标签：数值变化时有数字跳动动画
- 通知红点：脉动提示

#### 侧边栏
- 按钮：笔刷下划线 hover 效果
- 当前选中：墨晕 active 效果（径向渐变背景）
- 拖拽时的反馈：透明度变化

#### 主页（总览）
- **统计卡片**：tiered-frame 框体，hover 上浮 + 内发光
- **模块卡片**：悬浮时边框金色亮度提升，图标有微光
- **事件列表**：stagger 入场，新事件从顶部滑入

#### 天机台
- **故事文本区**：新段落淡入
- **选择按钮**：hover 时金色边框高亮
- **天道运转提示**：脉动发光
- **发送按钮**：hover 扫光

#### 成员堂
- **成员卡片**：头像有圆形金色边框，hover 上浮
- **属性条**：进度条有流光动画（shimmer）

#### 藏经阁
- **功法卡片**：稀有度用边框颜色区分（普通=青绿，稀有=紫色，传说=金色）
- **创造功法按钮**：脉动提示

#### 外交/山河
- **势力卡片**：关系值用颜色区分（友好=翠绿，中立=青绿，敌对=莲粉）
- **地图区域**：hover 时有区域高亮

---

## 六、技术实现要点

### 6.1 GSAP 引入

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
```

### 6.2 性能优化

- 所有动画使用 `transform` 和 `opacity`（GPU 加速）
- 大量使用 `will-change` 在动画开始前添加，动画结束后移除
- 粒子系统限制数量（最多 20 个）
- 使用 `prefers-reduced-motion` 媒体查询关闭动画

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.3 渐进增强

- GSAP 加载失败时回退到原有 CSS 动画
- 不支持 `backdrop-filter` 的浏览器回退到纯色背景

---

## 七、边界情况

- 低性能设备：提供设置选项关闭动效
- 首次加载：标题动画只播放一次，后续直接显示
- 页面切换频繁：入场动画使用 CSS 而非 GSAP，避免 JS 开销
- 深色/浅色切换：所有颜色通过 CSS 变量，切换即时生效
