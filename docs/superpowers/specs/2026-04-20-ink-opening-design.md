# Three.js 水墨粒子山水开场动画设计

**日期**: 2026-04-20  
**需求**: 用 Three.js shader 替换现有开场动画，实现真正的水墨晕染效果。

---

## 1. 视觉概念

### 四阶段动画

| 阶段 | 时间 | 内容 |
|------|------|------|
| **墨滴入水** | 0-3s | 纯黑背景，中央墨滴落下，perlin noise 驱动不规则晕染，边缘飞白 |
| **山水浮现** | 3-8s | 晕染墨迹中浮现三层山脉（远/中/近），由 fragment shader 实时生成 |
| **意境完善** | 8-12s | 云雾流动、水面倒影、花瓣/竹叶粒子飘落、仙鹤剪影 |
| **标题浮现** | 12-16s | 背景暗化虚化，"宗门志"书法笔触动画，副标题和菜单淡入 |

---

## 2. 技术架构

```
Three.js Scene
  ├─ OrthographicCamera (正交投影，2D 画布效果)
  ├─ FullscreenQuad (全屏着色器平面)
  │   ├─ ink-diffusion.frag (墨点晕染)
  │   ├─ mountain-form.frag (山脉轮廓生成)
  │   └─ compose.frag (最终合成：山水+倒影+调色)
  ├─ Points (花瓣/竹叶粒子系统)
  └─ 无 PostProcessing (bloom/blur 在 compose shader 内实现)
```

---

## 3. Shader 设计

### 3.1 ink-diffusion.frag (墨点晕染)

**Uniforms:**
- `u_time`: 动画时间
- `u_dropPos`: 墨滴落点 (0.5, 0.5)
- `u_dropRadius`: 墨滴半径 (随时间扩大)
- `u_diffusionSpeed`: 扩散速度

**算法:**
1. 从落点计算距离场
2. 叠加多层 perlin noise 制造不规则边缘
3. 边缘区域用 fbm noise 模拟飞白（dry brush）
4. 输出 `vec3 inkColor` (0=无墨, 1=浓墨) + `float edgeMask`

### 3.2 mountain-form.frag (山脉生成)

**Uniforms:**
- `u_time`: 动画时间（控制山脉浮现进度）
- `u_mountainLayers`: 3 (远/中/近)
- `u_revealProgress`: 0→1 (山脉浮现进度)

**算法:**
1. 对每层山脉：用 ridged fbm noise 生成轮廓线
2. 远山：低频率 noise + 高模糊 + 低对比度
3. 中山：中频率 + 中模糊
4. 近山：高频率 + 笔触纹理（用噪声模拟皴法）
5. 根据 `u_revealProgress` 从底部向上逐渐显示

### 3.3 compose.frag (最终合成)

**Inputs:** ink-diffusion 输出 + mountain-form 输出

**功能:**
1. 将山脉叠加到晕染背景上
2. 添加水面倒影（垂直翻转 + 波纹扭曲 + 透明度衰减）
3. 添加暗角 vignette
4. 添加轻微 bloom（对高光区域做模糊叠加）
5. 整体色调：宣纸黄（#f5f0e8）底色，墨色层次

---

## 4. 粒子系统

**花瓣/竹叶粒子:**
- 数量：50-100
- 形状：简单纹理（圆形花瓣或细长竹叶）
- 运动：缓慢飘落 + 随风摆动（sin 函数）
- 透明度：近不透明，远半透明
- 生命周期：循环，从顶部生成到底部消失

**仙鹤剪影:**
- 不做 3D 模型，用预渲染的 sprite 或简单几何体
- 从左侧飞入，右侧飞出
- 在第二阶段末尾出现，第三阶段飞过

---

## 5. 动画时序控制

由 `opening-scene.js` 统一管理：

```js
const PHASES = [
  { name: 'ink-drop',  start: 0,    end: 3.0 },
  { name: 'mountains', start: 2.0,  end: 8.0 },  // 与 ink 有重叠
  { name: 'ambient',   start: 7.0,  end: 12.0 }, // 与 mountains 有重叠
  { name: 'title',     start: 11.0, end: 16.0 }, // 与 ambient 有重叠
];
```

使用 `requestAnimationFrame` 循环，每帧更新所有 shader uniforms 和粒子位置。

---

## 6. 文件结构

```
opening/
├── shaders/
│   ├── ink-diffusion.frag
│   ├── mountain-form.frag
│   └── compose.frag
├── opening-scene.js    # Three.js 场景 + 动画时序
├── particles.js        # 花瓣/竹叶粒子系统
└── index.js            # 导出 initOpeningAnimation
```

`index.html` 修改：
- 移除现有 SVG 山脉 + GSAP/Motion 动画代码
- 添加 `<div id="opening-canvas"></div>`
- 引入 Three.js CDN + opening 模块

---

## 7. 依赖

| 库 | 来源 | 大小(gzip) |
|----|------|-----------|
| three | CDN | ~150KB |

无其他依赖。

---

## 8. 性能

- 单 fullscreen quad + 100 particles = 极低开销
- 低端设备目标 60fps
- 动画完成后调用 `renderer.dispose()` 释放 GPU 内存
- 标题页隐藏后移除 canvas DOM

---

## 9. 降级方案

若 WebGL 不可用或初始化失败：
- 回退到 CSS 渐变背景 + 淡入动画
- 标题和菜单仍然正常显示

---

## 10. 实现清单

| 文件 | 任务 |
|------|------|
| `opening/shaders/ink-diffusion.frag` | 墨点晕染 shader |
| `opening/shaders/mountain-form.frag` | 山脉生成 shader |
| `opening/shaders/compose.frag` | 合成 shader |
| `opening/particles.js` | 花瓣/竹叶粒子系统 |
| `opening/opening-scene.js` | Three.js 场景 + 时序控制 |
| `opening/index.js` | 入口导出 |
| `index.html` | 替换现有开场为 Three.js canvas |
