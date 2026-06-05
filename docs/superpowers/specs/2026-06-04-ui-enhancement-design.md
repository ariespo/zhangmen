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

### 5.1 标题页面 — GSAP 动画重制（产品级「开天辟地」）

**技术栈：**
- GSAP Core 3.12.5 (CDN)
- DrawSVGPlugin (SVG 轮廓绘制)
- SplitText (文字拆分动画)
- CustomEase (自定义缓动)
- 通过 `gsap.registerPlugin()` 注册

**视觉架构：7 层深度系统**

```
z-0  星空背景层（最远，视差系数 0.01）
z-1  大气光晕层（视差系数 0.02）
z-2  远景山脉层（视差系数 0.03）
z-3  中景山脉层（视差系数 0.05）
z-4  近景山脉层（视差系数 0.08）
z-5  主标题层（视差系数 0.10）
z-6  UI 按钮层（最近，视差系数 0.12）
```

**自定义缓动：**
```javascript
gsap.registerPlugin(CustomEase);
CustomEase.create("xianqi", "M0,0 C0.2,0 0.2,1 0.4,1 0.6,1 0.8,0.8 1,1");
CustomEase.create("ningju", "M0,0 C0.3,0 0.5,1.2 0.7,1 0.85,0.9 1,1 1,1");
```

**Act I — 混沌初开 (0.0s → 2.0s)**

| 时间 | 元素 | 动画 | 缓动 |
|------|------|------|------|
| 0.0s | 屏幕 | `#000000` 纯黑 | — |
| 0.2s | 天幕光线 | 水平金色细线 `scaleX: 0→1, opacity: 0→1` | `expo.out` |
| 0.4s | 天幕展开 | 光线向上下扩散 `scaleY: 0→1` | `power4.inOut` |
| 0.6s | 大气光晕 | 径向光晕 `scale: 0→3, opacity: 0.6→0` | `power2.out` |
| 0.8s | 星空粒子 | 30 个光点从中心爆发，stagger `from: "center"` | `expo.out` |
| 1.0s | 远景山脉 | SVG drawSVG `0%→100%` + `y: 40→0` | `power3.out` |
| 1.3s | 中景山脉 | 同上，stagger 0.15s | `power3.out` |
| 1.6s | 近景山脉 | 同上，stagger 0.1s | `power3.out` |
| 1.8s | 山巅雾气 | `y: -20→0, opacity: 0→0.3` | `sine.out` |

**Act II — 道成肉身 (2.0s → 4.8s)**

| 时间 | 元素 | 动画 | 缓动 |
|------|------|------|------|
| 2.0s | 天光降下 | 垂直金色光柱 `scaleY: 0→1` | `power4.out` |
| 2.2s | 「宗」字 | `blur(20px)→0`, `scale: 2→1`, `rotationY: 45°→0°` | `expo.out` |
| 2.5s | 「门」字 | `x: 100→0`, `rotationY: -30°→0°` | `elastic.out(1, 0.4)` |
| 2.8s | 「志」字 | `y: 60→0`, `rotationX: -20°→0°` | `back.out(1.7)` |
| 2.85s | 金色粒子 | 40 个粒子爆发（Physics2D velocity: 300, gravity: 200） | `power2.out` |
| 3.2s | 三字齐震 | 振幅 2px 微震 0.3s | `sine.inOut` |
| 3.5s | 金色光环 | SVG 圆环 `drawSVG: 0%→100%` | `power2.inOut` |
| 3.8s | 光晕扩散 | `box-shadow` 扩散到 `100px` | `power2.out` |
| 4.2s | 副标题 | SplitText 墨滴入水 mask reveal | `power3.out` |

**Act III — 人间显现 (4.8s → 7.0s)**

| 时间 | 元素 | 动画 | 缓动 |
|------|------|------|------|
| 4.8s | 分割线 | `scaleX: 0→1` | `expo.inOut` |
| 5.2s | 按钮1 | `rotationX: -90°→0°` | `back.out(1.4)` |
| 5.4s | 按钮2 | 同上，stagger 0.15s | `back.out(1.4)` |
| 5.8s | 能量线 | SVG path `drawSVG: 0%→100%` | `power2.inOut` |
| 6.2s | 场景调光 | `brightness(1.1)→brightness(1.0)` | `power2.out` |

**环境循环（Act III 结束后）：**
- 星空粒子：独立呼吸 `opacity + scale` 随机，stagger `from: "random"`
- 山脉雾气：`x: "-30vw"`，duration 30s，无限循环
- 标题呼吸：`scale: 1.005`，4s 周期
- 光粒子：上升+漂移 `y: "-=50"`

**鼠标交互：**
- 高性能视差：使用 `gsap.quickTo()` 为每层创建独立的 x/y 动画器
- 背景层移动 15px，中景 30px，前景 50px
- 按钮 hover：3D 磁性倾斜 `rotationY/X` 跟随鼠标位置，离开时用 `elastic.out` 回弹

**无障碍：**
```javascript
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: reduce)", () => {
  gsap.set([".mountain-path", ".opening-title", ".opening-subtitle", ".title-btn"], {
    autoAlpha: 1, y: 0, rotationX: 0, rotationY: 0, filter: "blur(0px)"
  });
  masterTl.kill();
  return () => {};
});
```

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
