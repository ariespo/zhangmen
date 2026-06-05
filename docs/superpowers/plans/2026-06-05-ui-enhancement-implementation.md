# 全部页面视觉升级 + GSAP 标题动画 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于深色主题全面升级全部页面的配色、框体、动效、交互，并用 GSAP 重制标题页面为产品级「开天辟地」动画。

**Architecture:** 单文件 HTML 架构。Phase 1 铺设 CSS 基础设施（配色变量、框体类、动效类）；Phase 2 重构标题页面 HTML 结构并编写 GSAP Timeline 三幕动画；Phase 3 逐个页面应用新样式和动效。

**Tech Stack:** Vanilla JS, GSAP 3.12.5 (CDN), CSS custom properties

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `index.html` | 所有 HTML/CSS/JS。新增：GSAP CDN script、配色变量、框体/动效/交互 CSS 类、标题页面新结构、GSAP Timeline JS、各页面改造 |
| `sillytavern/st-ui.js` | 可能需要微调以适应新主题变量 |
| `sillytavern/st-styles.css` | 可能需要微调以适应新主题变量 |

---

## Phase 1: CSS 基础设施

### Task 1: 添加新配色变量

**Files:**
- Modify: `index.html` — 在 `:root` 中添加新点缀色变量

- [ ] **Step 1: 添加新变量**

在默认 `:root`（深色主题已在 `:root[data-theme="dark"]` 中定义）中添加：

```css
:root {
  /* 新增点缀色 */
  --accent-gold-deep: #c8a86e;
  --accent-gold-glow: rgba(200, 168, 110, 0.3);
  --accent-purple: #8b7ec8;
  --accent-purple-soft: rgba(139, 126, 200, 0.15);
  --accent-pink: #d4728c;
  --accent-pink-soft: rgba(212, 114, 140, 0.15);
  --accent-green-life: #5cb85c;
  --accent-green-soft: rgba(92, 184, 92, 0.15);
}
```

在 `:root[data-theme="dark"]` 中也添加相同的变量（深色主题下值相同，因为标题页面固定深色，#app 也是深色默认）。

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 添加新点缀色CSS变量"
```

### Task 2: 创建层次框体系统

**Files:**
- Modify: `index.html` — 在 style 标签中添加新的 CSS 类

- [ ] **Step 1: 添加 `.tiered-frame` 类**

```css
/* === TIERED FRAME SYSTEM === */
.tiered-frame {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
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
.tiered-frame:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(110, 207, 207, 0.08),
              inset 0 0 20px rgba(110, 207, 207, 0.04);
}

/* 四角装饰增强 */
.tiered-frame .corner-tl,
.tiered-frame .corner-tr,
.tiered-frame .corner-bl,
.tiered-frame .corner-br {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
}
.tiered-frame .corner-tl { top: 6px; left: 6px; border-top: 1px solid rgba(200, 168, 110, 0.3); border-left: 1px solid rgba(200, 168, 110, 0.3); }
.tiered-frame .corner-tr { top: 6px; right: 6px; border-top: 1px solid rgba(200, 168, 110, 0.3); border-right: 1px solid rgba(200, 168, 110, 0.3); }
.tiered-frame .corner-bl { bottom: 6px; left: 6px; border-bottom: 1px solid rgba(200, 168, 110, 0.3); border-left: 1px solid rgba(200, 168, 110, 0.3); }
.tiered-frame .corner-br { bottom: 6px; right: 6px; border-bottom: 1px solid rgba(200, 168, 110, 0.3); border-right: 1px solid rgba(200, 168, 110, 0.3); }
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 添加层次框体系统CSS"
```

### Task 3: 添加基础动效 CSS 类

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加入场、悬浮、脉动、数字跳动动画**

```css
/* === ENTRANCE ANIMATIONS === */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* === PULSE HINT === */
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(110, 207, 207, 0.15); }
  50% { box-shadow: 0 0 20px rgba(110, 207, 207, 0.35); }
}
.pulse-hint {
  animation: pulseGlow 2.5s ease-in-out infinite;
}

/* === GOLDEN SWEEP === */
@keyframes goldenSweep {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
.golden-sweep {
  background: linear-gradient(90deg, transparent, rgba(200,168,110,0.1), transparent);
  background-size: 200% 100%;
}
.golden-sweep:hover {
  animation: goldenSweep 1.5s ease infinite;
}

/* === BRUSH UNDERLINE === */
.brush-btn {
  position: relative;
  overflow: hidden;
  cursor: pointer;
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
.brush-btn:active {
  transform: scale(0.97);
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 添加基础动效与交互CSS类"
```

---

## Phase 2: 标题页面 GSAP 动画重制

### Task 4: 添加 GSAP CDN 引入

**Files:**
- Modify: `index.html` — 在 `</head>` 前添加 script 标签

- [ ] **Step 1: 添加 GSAP CDN**

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/DrawSVGPlugin.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/SplitText.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 引入GSAP核心库及插件"
```

### Task 5: 重构标题页面 HTML 结构（7 层深度）

**Files:**
- Modify: `index.html` — `#title-screen` 内部结构

- [ ] **Step 1: 重构标题页面 HTML**

将现有的 `#title-screen` 内容替换为 7 层结构：

```html
<div id="title-screen">
  <!-- z-0: 星空背景层 -->
  <div class="layer-bg starfield"></div>

  <!-- z-1: 大气光晕层 -->
  <div class="layer-bg atmosphere"></div>

  <!-- z-2: 远景山脉 -->
  <div class="layer-mid mountains-far">
    <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
      <path class="mountain-far-path" d="M0,400 L0,280 Q200,200 400,260 T800,220 T1200,250 L1440,200 L1440,400 Z" fill="none" stroke="#1a3a3a" stroke-width="1"/>
    </svg>
  </div>

  <!-- z-3: 中景山脉 -->
  <div class="layer-mid mountains-mid">
    <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
      <path class="mountain-mid-path" d="M0,400 L0,320 Q300,220 600,300 T1000,260 L1440,300 L1440,400 Z" fill="none" stroke="#2d5a5a" stroke-width="1.5"/>
    </svg>
  </div>

  <!-- z-4: 近景山脉 -->
  <div class="layer-fg mountains-near">
    <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
      <path class="mountain-near-path" d="M0,400 L0,350 Q400,280 800,340 T1440,310 L1440,400 Z" fill="none" stroke="#4a8a8a" stroke-width="2"/>
    </svg>
  </div>

  <!-- z-5: 主标题 -->
  <div class="layer-fg title-content">
    <div class="opening-title" id="opening-title">宗门志</div>
    <div class="opening-subtitle" id="opening-subtitle">问道长生 · 经营宗门 · 你的仙道由你书写</div>
  </div>

  <!-- z-6: UI 按钮 -->
  <div class="layer-fg title-menu" id="title-menu">
    <button class="title-btn brush-btn" id="btn-new-game" onclick="startNewGame()">开始新游戏</button>
    <button class="title-btn brush-btn" id="btn-load-game" onclick="showLoadGame()">读取游戏</button>
  </div>

  <!-- z-7: 山巅雾气 -->
  <div class="layer-fg mountain-mist"></div>
</div>
```

同时添加对应的 CSS：

```css
#title-screen .layer-bg,
#title-screen .layer-mid,
#title-screen .layer-fg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
#title-screen .layer-fg.title-content,
#title-screen .layer-fg.title-menu {
  pointer-events: auto;
}

.starfield {
  background: radial-gradient(ellipse at bottom, #1a3a3a 0%, #0c1418 100%);
}
.atmosphere {
  background: radial-gradient(ellipse at 50% 30%, rgba(110,207,207,0.05) 0%, transparent 60%);
}

.mountains-far svg,
.mountains-mid svg,
.mountains-near svg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
}

.title-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.mountain-mist {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
  background: linear-gradient(to top, rgba(12,20,24,0.9) 0%, transparent 100%);
  z-index: 6;
  pointer-events: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 重构标题页面为7层深度结构"
```

### Task 6: 实现 Act I — 混沌初开（山脉绘制 + 粒子爆发）

**Files:**
- Modify: `index.html` — 在 `#title-screen` 的 script 区域添加 GSAP 代码

- [ ] **Step 1: 编写 Act I GSAP 代码**

```javascript
// === 标题页面 GSAP 动画 ===
(function initTitleAnimation() {
  // 注册插件
  gsap.registerPlugin(DrawSVGPlugin, SplitText, CustomEase);

  // 自定义缓动
  CustomEase.create("xianqi", "M0,0 C0.2,0 0.2,1 0.4,1 0.6,1 0.8,0.8 1,1");
  CustomEase.create("ningju", "M0,0 C0.3,0 0.5,1.2 0.7,1 0.85,0.9 1,1 1,1");

  // 初始隐藏动画元素
  gsap.set([
    ".mountain-far-path",
    ".mountain-mid-path",
    ".mountain-near-path",
    "#opening-title",
    "#opening-subtitle",
    "#title-menu"
  ], { visibility: "hidden" });

  // 主时间线
  const masterTl = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: startAmbientLoops
  });

  // === ACT I: 混沌初开 ===
  const act1 = gsap.timeline();

  // 0.0s: 背景渐变
  act1.fromTo("#title-screen",
    { backgroundColor: "#000000" },
    { backgroundColor: "#0d1f1f", duration: 1.2 }
  );

  // 0.8s: 星空粒子爆发
  act1.fromTo(".starfield",
    { opacity: 0 },
    { opacity: 1, duration: 1 },
    0.2
  );

  // 1.0s: 远景山脉绘制
  act1.fromTo(".mountain-far-path",
    { drawSVG: "0%", autoAlpha: 0 },
    { drawSVG: "100%", autoAlpha: 0.4, duration: 1.5, stagger: 0.2 },
    0.8
  );

  // 1.3s: 中景山脉
  act1.fromTo(".mountain-mid-path",
    { drawSVG: "0%", autoAlpha: 0, y: 40 },
    { drawSVG: "100%", autoAlpha: 0.7, y: 0, duration: 1.4, stagger: 0.15 },
    1.0
  );

  // 1.6s: 近景山脉
  act1.fromTo(".mountain-near-path",
    { drawSVG: "0%", autoAlpha: 0, y: 50 },
    { drawSVG: "100%", autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 },
    1.2
  );

  // 1.8s: 山巅雾气
  act1.fromTo(".mountain-mist",
    { autoAlpha: 0, y: -20 },
    { autoAlpha: 1, y: 0, duration: 1 },
    1.5
  );

  masterTl.add(act1, 0);

  // === 全局函数供后续 Act 使用 ===
  window._titleMasterTl = masterTl;
})();
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: GSAP Act I — 混沌初开（山脉绘制+粒子）"
```

### Task 7: 实现 Act II — 道成肉身（SplitText 标题 + 粒子爆发）

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 编写 Act II GSAP 代码**

在之前的 GSAP 代码后追加 Act II 和 Act III：

```javascript
  // === ACT II: 道成肉身 ===
  const act2 = gsap.timeline();

  // 2.0s: 天光降下
  act2.fromTo(".atmosphere",
    { scale: 0, autoAlpha: 0 },
    { scale: 3, autoAlpha: 0.6, duration: 1.5, ease: "power4.out" },
    0
  );

  // 2.2s: 标题逐字 reveal
  const titleSplit = SplitText.create("#opening-title", { type: "chars" });

  act2.fromTo(titleSplit.chars,
    { autoAlpha: 0, y: 40, filter: "blur(10px)", rotationY: 45 },
    {
      autoAlpha: 1, y: 0, filter: "blur(0px)", rotationY: 0,
      duration: 0.8,
      stagger: { amount: 0.5, from: "center" },
      ease: "expo.out"
    },
    0.5
  );

  // 同时：金色光晕
  act2.fromTo("#opening-title",
    { textShadow: "0 0 0px rgba(184,155,107,0)" },
    { textShadow: "0 0 80px rgba(184,155,107,0.5)", duration: 2, ease: "power2.out" },
    0.8
  );

  // 3.2s: 三字齐震
  act2.to("#opening-title", {
    y: "+=2",
    duration: 0.05,
    repeat: 5,
    yoyo: true,
    ease: "sine.inOut"
  }, 1.8);

  // 3.5s: 金色光环
  act2.fromTo(".title-content::before",
    { scale: 0, autoAlpha: 0 },
    { scale: 1, autoAlpha: 0.3, duration: 1 },
    2.0
  );

  masterTl.add(act2, 2.0);
  masterTl.addLabel("titleComplete", 4.0);

  // === ACT III: 人间显现 ===
  const act3 = gsap.timeline();

  // 副标题
  const subtitleSplit = SplitText.create("#opening-subtitle", { type: "chars" });
  act3.fromTo(subtitleSplit.chars,
    { autoAlpha: 0, letterSpacing: "16px" },
    {
      autoAlpha: 0.7,
      letterSpacing: "10px",
      duration: 0.6,
      stagger: 0.02,
      ease: "power2.out"
    },
    0
  );

  // 按钮 3D 翻转入场
  act3.fromTo("#title-menu .title-btn",
    { autoAlpha: 0, rotationX: -90, transformOrigin: "50% 0%" },
    {
      autoAlpha: 1,
      rotationX: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "back.out(1.4)"
    },
    0.8
  );

  masterTl.add(act3, "titleComplete-=0.3");
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: GSAP Act II/III — 标题reveal+按钮入场"
```

### Task 8: 实现环境循环 + 鼠标交互

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 编写环境循环和鼠标交互代码**

```javascript
  // === 环境循环动画 ===
  function startAmbientLoops() {
    // 雾气流动
    gsap.to(".mountain-mist", {
      x: "-20vw",
      duration: 30,
      repeat: -1,
      ease: "none"
    });

    // 标题呼吸
    gsap.to("#opening-title", {
      scale: 1.005,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  // === 鼠标视差 ===
  const xToBg = gsap.quickTo(".layer-bg", "x", { duration: 0.8, ease: "power3" });
  const xToMid = gsap.quickTo(".layer-mid", "x", { duration: 0.6, ease: "power3" });
  const xToFg = gsap.quickTo(".layer-fg:not(.title-content):not(.title-menu)", "x", { duration: 0.4, ease: "power3" });
  const yToBg = gsap.quickTo(".layer-bg", "y", { duration: 0.8, ease: "power3" });
  const yToMid = gsap.quickTo(".layer-mid", "y", { duration: 0.6, ease: "power3" });
  const yToFg = gsap.quickTo(".layer-fg:not(.title-content):not(.title-menu)", "y", { duration: 0.4, ease: "power3" });

  document.getElementById("title-screen").addEventListener("mousemove", (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    xToBg(dx * 10); yToBg(dy * 6);
    xToMid(dx * 25); yToMid(dy * 15);
    xToFg(dx * 40); yToFg(dy * 25);
  });

  // === 按钮 3D 磁性倾斜 ===
  document.querySelectorAll("#title-menu .title-btn").forEach(btn => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        rotationY: x * 0.08,
        rotationX: -y * 0.08,
        duration: 0.3,
        ease: "power2.out"
      });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)"
      });
    });
  });

  // === prefers-reduced-motion ===
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.set([
      ".mountain-far-path", ".mountain-mid-path", ".mountain-near-path",
      "#opening-title", "#opening-subtitle", "#title-menu"
    ], { autoAlpha: 1, y: 0, rotationX: 0, rotationY: 0, filter: "blur(0px)" });
    if (window._titleMasterTl) window._titleMasterTl.kill();
    return () => {};
  });
})();
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: GSAP环境循环+鼠标视差+磁性按钮+无障碍支持"
```

---

## Phase 3: #app 主界面全面升级

### Task 9: 主界面卡片应用 tiered-frame

**Files:**
- Modify: `index.html` — 将 `.stat-card`, `.module-card` 等替换为 `.tiered-frame`

- [ ] **Step 1: 修改主页卡片类名**

搜索 `.stat-card` 的 HTML 结构，将 `class="stat-card"` 替换为 `class="stat-card tiered-frame"`。

搜索 `.module-card` 的 HTML 结构，将 `class="module-card"` 替换为 `class="module-card tiered-frame"`。

搜索 `.events-section` 的 HTML 结构，将 `class="events-section"` 替换为 `class="events-section tiered-frame"`。

- [ ] **Step 2: 验证浏览器显示正常**

启动本地服务器，确认卡片显示新的三层边框效果。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 主界面卡片应用层次框体"
```

### Task 10: 天机台和成员堂页面升级

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 天机台升级**

将 `.story-text-area`, `.story-toggle-bar`, `.story-choice-btn` 添加 `.tiered-frame` 类。

将 `.story-toggle-bar:hover` 的背景从硬编码 `rgba(110, 207, 207, 0.15)` 改为 `var(--glass-bg)` 或更合适的变量。

- [ ] **Step 2: 成员堂升级**

成员卡片添加 `.tiered-frame`。
属性条添加流光动画 CSS：

```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
.stat-bar-fill.shimmer {
  background: linear-gradient(90deg, var(--jade-glow) 0%, rgba(110,207,207,0.5) 50%, var(--jade-glow) 100%);
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 天机台和成员堂页面视觉升级"
```

### Task 11: 其他页面（藏经阁、外交、山河、宝库、任务）升级

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 批量添加 tiered-frame 和点缀色**

对所有页面的主要卡片/面板添加 `.tiered-frame` 类。
对藏经阁的功法卡片按稀有度添加边框颜色类：
- 普通：`border-color: var(--jade-glow)`
- 稀有：`border-color: var(--accent-purple)`
- 传说：`border-color: var(--accent-gold-deep)`

对外交/山河的势力卡片按关系添加颜色：
- 友好：`--accent-green-life`
- 中立：`--jade-glow`
- 敌对：`--accent-pink`

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: 藏经阁/外交/山河/宝库/任务页面视觉升级"
```

### Task 12: 创建页面和加载页面动效

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 创建页面分步动效**

为 `#creation-page` 的表单字段添加 `.animate-in` 类，配合 stagger delay：

```javascript
// 在创建页面显示时触发
function animateCreationFields() {
  gsap.fromTo("#creation-page .form-field",
    { autoAlpha: 0, y: 15 },
    { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
  );
}
```

- [ ] **Step 2: 加载页面存档卡片动效**

为 `.load-save-item` 添加 stagger 入场动画：

```javascript
function animateLoadCards() {
  gsap.fromTo(".load-save-item",
    { autoAlpha: 0, y: 20 },
    { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 创建页和加载页GSAP入场动效"
```

### Task 13: 数字跳动动画

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 实现数字跳动函数**

```javascript
function animateNumber(element, from, to, duration = 600) {
  const start = performance.now();
  const diff = to - from;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(from + diff * eased);
    element.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
```

- [ ] **Step 2: 应用到资源栏**

在资源数值更新时调用 `animateNumber()`。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 资源数值数字跳动动画"
```

---

## 验证清单

- [ ] 标题页面 GSAP 动画流畅播放，三幕衔接自然
- [ ] 鼠标视差响应灵敏，各层移动比例正确
- [ ] 按钮 3D 磁性倾斜效果自然
- [ ] prefers-reduced-motion 下直接显示最终状态
- [ ] 主界面卡片有三层边框效果
- [ ] 各页面点缀色正确区分功能模块
- [ ] 数字跳动动画平滑
- [ ] 创建/加载页面入场 stagger 正常
- [ ] 深色主题仍为默认
- [ ] 浅色主题切换后样式正常

---

## 自我审查

1. **Spec coverage**: 配色 ✅ 框体 ✅ 动效 ✅ 交互 ✅ 标题 GSAP ✅ 各页面 ✅
2. **Placeholder scan**: 无 TBD/TODO
3. **Type consistency**: GSAP 变量名、CSS 类名在 plan 中一致
