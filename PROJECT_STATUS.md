# 云璃仙宗 — 项目进度与开发文档

## 一、项目简介

基于 SillyTavern Web 前端构建的修仙掌门决策类游戏。核心设计理念：**除剧情正文、天道运转、选项、近日要事外，其余全部信息由变量系统驱动**，支持前端操作与 LLM 输出双向更新，且按聊天存档独立持久化。

---

## 二、当前进展

### ✅ 已完成功能

| 模块 | 状态 | 说明 |
|------|------|------|
| **天机正文** | 已完成 | 支持富文本渲染： `"…"` 对话、`（…）` 心理活动、`《…》` 功法/秘籍等颜色区分 |
| **近日要事** | 已完成 | 事件卡片化，清晰展示时间 / 地点 / 人物 / 事件 |
| **变量系统（核心）** | 已完成 | Schema-first 设计，深度 Proxy 响应式，JSON Patch-like 操作（replace/delta/insert/remove），按 chat 持久化到 IndexedDB |
| **成员堂** | 已接入变量 | `members` 为 Record（key = 姓名），成员列表、详情弹窗、资源栏人数全部走变量 |
| **合纵阁（外交）** | 已接入变量 | `diplomacy` 为 Record（key = 势力名），卡片展示关系值与描述 |
| **山河殿（建筑/疆域）** | 已接入变量 | 新增导航与页面，含「山门建筑」「疆域舆图」两个标签页，读取 `world.buildings` 与 `world.regions`，支持锁定/解锁状态 |
| **资源栏自动刷新** | 已完成 | 灵石、威望、位阶、人数订阅变量变化，实时更新 |
| **LLM 流式解析** | 已完成 | 支持 `<maintext>`、`<option>`、`<thinking>`、`<sum>`、`<vars>` 标签捕获与处理 |
| **SillyTavern 集成** | 已完成 | 增强版 Prompt 组装、Lorebook 关键词匹配、上下文截断、Token 估算 |

### ⚠️ 部分完成 / 待接入变量

| 模块 | 状态 | 说明 |
|------|------|------|
| **万宝阁（宝库）** | 页面已有，待接入 | `treasury` Schema 已定义，但前端页面仍使用硬编码数据 |
| **任务系统** | Schema 已有，UI 待完善 | `quests.main` 与 `quests.side` 已定义，但缺少独立任务页面或总览卡片 |
| **藏经阁（功法）** | 页面已有，待接入 | `library-page` 存在，但功法数据仍为硬编码 |
| **机遇/操作记录** | 页面已有，待接入 | `opportunity` 页面与 `action-log` 机制存在，但数据未变量化 |

### 🚧 尚未开始

| 模块 | 说明 |
|------|------|
| **战斗/探索系统** | 无页面与 Schema |
| **邮件/传讯系统** | 无页面与 Schema |
| **时间推进系统** | 目前事件依赖 LLM 驱动，未来可考虑加入回合/月份机制 |
| **Prompt 工程文档** | 需要为 LLM 编写 `<vars>` 使用说明与示例 |

---

## 三、项目地址与访问方式

- **GitHub 仓库**：`https://github.com/ariespo/zhangmen.git`
- **Vercel 部署控制台**：`https://vercel.com/klymds-projects/zhangmen`
- **线上预览地址**：`https://zhangmen.vercel.app/`（如已启用生产域名）或从 Vercel 控制台查看具体 URL

> 注：Vercel 已关联 GitHub 仓库，每次 `push` 到 `main` 分支会自动触发部署。

---

## 四、GitHub → Vercel 同步方法

### 方法 A：使用项目内的 `sync.sh`（推荐）

在项目根目录执行：

```bash
./sync.sh "提交说明"
```

该脚本会自动完成 `git add .` → `git commit` → `git push origin main`，并提示 Vercel 部署链接。

### 方法 B：手动提交

```bash
cd H:/zhangmen-main
git add .
git commit -m "你的提交说明"
git push origin main
```

推送成功后，Vercel 会在 30 秒 ~ 2 分钟内自动部署最新版本。

### 部署验证

1. 推送后访问 Vercel 控制台查看 Build 状态
2. 或等待几分钟后直接刷新线上地址

---

## 五、关键文件说明

| 文件 | 职责 |
|------|------|
| `index.html` | 主界面、页面路由、UI 渲染、事件绑定、LLM 流式解析 |
| `sillytavern/game-state.js` | 变量系统核心：Schema DSL、GameStateManager、Patch 应用、IndexedDB 持久化 |
| `sillytavern/st-prompt.js` | Prompt 组装、宏替换、历史截断、Token 估算 |
| `sillytavern/st-engine.js` | Lorebook 关键词匹配引擎 |
| `sillytavern/st-core.js` | SillyTavern  IndexedDB 封装与底层存储 |
| `sillytavern/st-integration.js` | SillyTavern Web 增强初始化、消息发送 |
| `sillytavern/st-ui.js` | SillyTavern 通用 UI 组件与逻辑 |

---

## 六、变量系统使用方式（给 LLM / 开发者）

LLM 在输出中可携带 `<vars>` 标签来更新游戏状态：

```xml
<vars>[{"op":"delta","path":"/finance/gold","value":"-500"},{"op":"replace","path":"/members/沈万钧/status","value":"闭关"}]</vars>
```

支持的 `op`：
- `replace`：替换值
- `delta`：对数字做加减
- `insert`：向数组或对象插入
- `remove`：从数组或对象删除

路径规则：以 `/` 分隔，Record 用 key（如 `/members/沈万钧`），Array 用索引（如 `/world/buildings/0/level`）。

---

## 七、近期已修复的关键 Bug

- **变量系统初始化失败导致导航无响应**：`renderMembers` 等函数在 `gameStateManager` 初始化前被调用，引发 TypeError 并导致后续脚本（含 `isLLMProcessing` 声明）未执行。已将过早的渲染调用移至模块初始化完成后。

---

## 八、下一步建议（按优先级）

1. **完善 Prompt 文档**
   - 编写一份 `PROMPT_GUIDE.md`，明确告诉 LLM 何时使用 `<vars>`、各字段含义与示例

2. **接入剩余页面的变量系统**
   - 万宝阁（`treasury`）硬编码数据替换为变量渲染
   - 藏经阁（`library`）功法数据变量化
   - 总览页中的「机遇」模块变量化

3. **设计任务系统 UI**
   - 在总览页或新建「任务」页面展示主线阶段与支线列表

4. **测试 LLM 端到端效果**
   - 跑一局完整对话，验证 `<vars>` 标签是否能正确修改状态并刷新 UI

5. **考虑加入时间/回合机制**
   - 在 Schema 中加入 `world.turn` 或 `world.date`，让 LLM 可以推进游戏时间

---

*文档更新时间：2026-04-17*
