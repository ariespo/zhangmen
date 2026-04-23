# 宗门志 — 开发计划总览

## 手机端 UI 适配计划

### 目标
将《宗门志》从桌面端优先改造为移动端可用的响应式 UI。

### 执行阶段

#### Phase 1: 底部导航栏 ✅ 已完成
- [x] 新增 `#bottom-nav` 元素（默认隐藏，≤768px 显示）
- [x] 桌面 `#side-nav` 在 ≤768px 隐藏
- [x] 底部 nav 5 个入口：天机台、总览、成员、山河、外交
- [x] 底部 nav 样式：固定底部、图标+文字、活跃态高亮
- [x] 主内容区域底部预留 safe-area padding

#### Phase 2: 顶部资源栏适配 ✅ 已完成
- [x] ≤768px 时资源栏改为横向滚动 `overflow-x: auto`
- [x] 玩家信息区域简化（只保留头像+名字）
- [x] 天机推演按钮在移动端隐藏

#### Phase 3: 创建向导触控适配 ✅ 已完成
- [x] `.form-grid` 在 ≤768px 改为单列 `grid-template-columns: 1fr`
- [x] 步骤指示器紧凑化（小圆 + 短连接线）
- [x] 创建导航按钮适配移动端

#### Phase 4: 各页面内容适配 ✅ 已完成
- [x] 总览页/成员页/外交页/山河页卡片单列
- [x] 弹窗宽度改为 96%
- [x] 弟子卡片、标签更小更紧凑

#### Phase 5: 天机正文阅读优化 ✅ 已完成
- [x] 正文字号 16px（避免 iOS 自动缩放）
- [x] 行高 1.85
- [x] 选项按钮/发送按钮/输入框最小 48px

#### 额外：成员详情弹窗重设计 ✅ 已完成
- [x] 头部：头像 + 名字 + 道号/境界 + 徽章行
- [x] 忠诚度/心情彩色进度条
- [x] 三维属性卡片 + 装备差值
- [x] 性格/外貌 chip 标签
- [x] 功法《》装饰列表
- [x] 装备品质色卡
- [x] 分组标题渐变分隔线

---

## 多 API / 单 API 切换模式计划

### 目标
将剧情创作与变量更新拆分到两个独立的 LLM API，降低单个 LLM 的任务复杂度，提升变量更新质量。

### 执行阶段

#### Phase 1: 设置面板扩展 ✅ 已完成
- [x] API 模式切换（单 API / 多 API）
- [x] 第二 API 独立配置区（URL、Key、Model、Temperature、Max Tokens）
- [x] 第二 API 连通性测试按钮
- [x] 保存到 IndexedDB `settings.apiMode` 和 `settings.secondaryApi`

#### Phase 2: 世界书条目拆分 ✅ 已完成
- [x] 4 个条目：格式规范、变量规范（单 API），多 API 主格式、多 API 第二格式
- [x] `switchApiLorebookMode()` 切换模式时自动启用/禁用对应条目
- [x] 新增 `docs/LLM_FORMAT_SPEC_MAIN.md`（主 API 格式规范）
- [x] 新增 `docs/LLM_FORMAT_SPEC_SECOND.md`（第二 API 变量规范）

#### Phase 3: 双 API 调用流程 ✅ 已完成
- [x] `callSecondaryApi()`：非流式请求，读取规范文档，组装 gameState + maintext 提示词
- [x] `finalizeMainParagraph()`：maintext 完成后自动触发第二 API
- [x] `submitActions()`：设置 `window._currentApiMode`，finally 块等待第二 API 完成后解锁 UI
- [x] 错误处理：主 API 失败回滚快照，第二 API 失败提示"天道推演受阻"但保留正文

#### Phase 4: 长按菜单 ✅ 已完成
- [x] `story-text-area` 长按检测（≥800ms）
- [x] 弹出菜单：编辑正文 / 重 roll / 重新解析变量
- [x] 重 roll：利用 `snapshot` 回滚 gameState/actionLogs/stamina/聊天记录，重新发送
- [x] 重新解析变量：将当前正文发送给第二 API，应用返回的 vars

#### Phase 5: UI 状态指示器 ✅ 已完成
- [x] 主 API 处理中：现有"天道运转中" spinner
- [x] 第二 API 处理中：新增"天道推演中"金色脉冲指示器
- [x] 多 API 模式下两个 API 全部完成后才 `setLLMProcessing(false)`

---

## 当前状态
- **手机端适配**：全部完成 ✅
- **多 API 模式**：全部完成 ✅
- **代码已推送**：`f0fd714` 已推送到 GitHub / Vercel

## 验证命令
```bash
# 启动本地服务器
npx serve . -l 3000

# 然后浏览器打开 http://localhost:3000
# Chrome DevTools → Toggle Device Toolbar → 选择 iPhone SE / iPhone 14 Pro Max
```
