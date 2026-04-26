# 手机端适配 — 调研发现

## 现有响应式状态

### 已有媒体查询（index.html）
```css
@media (max-width: 1200px) {
  .sect-overview { grid-template-columns: repeat(2, 1fr); }
  .module-grid { grid-template-columns: repeat(2, 1fr); }
  .skill-grid, .item-grid { grid-template-columns: repeat(2, 1fr); }
  .building-grid, .region-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  #side-nav { width: 60px; }  /* 仅缩窄，未隐藏 */
  .sect-overview, .module-grid, .faction-list,
  .skill-grid, .item-grid, .sect-info-grid,
  .building-grid, .region-grid { grid-template-columns: 1fr; }
  .module-card.large { grid-column: span 1; }
}
```

### st-styles.css 中的响应式
```css
@media (max-width: 768px) {
  .st-split { grid-template-columns: 1fr; }
  .st-sidebar { border-right: none; border-bottom: ...; max-height: 220px; }
  .st-modal { width: 96%; max-height: 92vh; }
  .st-form-row { grid-template-columns: 1fr; }
  .st-btn span { display: none; }  /* 按钮只显示图标 */
}
```

## 导航栏结构（当前）
- `#side-nav`：固定 72px 宽（桌面）/ 60px（768px 以下），垂直排列
- 7 个按钮：天机台、总览、成员、合纵阁、山河、任务、设置
- 每个按钮：SVG 图标 + 11px 文字
- 在 60px 宽度下文字几乎不可读

## Top Bar 结构
- 左侧：logo 区域
- 中间：资源栏（灵石、威望、位阶、人数）— `display: flex; gap: 8px`
- 右侧：天机推演按钮 + 玩家信息
- 总高度 64px，在小屏上内容会溢出

## 创建向导结构
- 4 步：玩家信息 → 宗门概况 → 弟子信息 → 确认
- 表单使用 `.form-grid { grid-template-columns: 1fr 1fr; }`
- 弟子配置页左侧有骰子按钮，右侧是表单
- 步骤指示器有 4 个圆形+文字+连接线

## 需要新增/修改的 CSS 变量
- 底部导航高度：`--bottom-nav-height: 64px`
- Safe area inset：`env(safe-area-inset-bottom)`
