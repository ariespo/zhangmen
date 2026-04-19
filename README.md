# 宗门志

> 问道长生 · 经营宗门 · 你的仙道由你书写

基于 SillyTavern Web 前端构建的修仙掌门决策类游戏。核心设计理念：**除剧情正文、天道运转、选项、近日要事外，其余全部信息由变量系统驱动**，支持前端操作与 LLM 输出双向更新，且按聊天存档独立持久化。

## 快速开始

```bash
npx serve .
```

或直接打开 `index.html`。

## 项目地址

- **GitHub**：`https://github.com/ariespo/zhangmen.git`
- **Vercel**：`https://vercel.com/klymds-projects/zhangmen`

每次 `push` 到 `main` 分支自动触发部署。

## 技术栈

- 零构建纯静态 HTML/CSS/JS
- GSAP（CDN）驱动开场动画
- Schema-first 响应式变量系统（Proxy + JSON Patch + IndexedDB）
- SillyTavern Web 集成（Prompt 组装、Lorebook 匹配、上下文截断）

## 核心特性

- **四步开局创建向导**：玩家信息 → 宗门概况 → **弟子信息** → 确认
- **弟子个性化配置**：姓名、性别、道号、境界、年龄、职务、天赋、忠诚度、性格标签、外貌标签；骰子随机生成
- **天赋资质系统**：甲乙丙丁 × 上中下（12 档），驱动角色三维计算
- **对话级独立存档**：每个对话 = 一个独立存档槽，自动持久化到 IndexedDB
- **快照回滚**：发送前 snapshot，API 失败自动回滚全部状态
- **LLM 标签解析**：`<maintext>`、`<option>`、`<sum>`、`<vars>`、`<var>` 流式解析

## 文档索引

| 文档 | 内容 |
|------|------|
| `PROJECT_STATUS.md` | 功能进度、关键文件说明、GitHub→Vercel 同步方法 |
| `VARIABLES.md` | 完整变量表、`<vars>` 路径规则、操作示例 |
| `INITIAL_STATE.md` | 默认初始状态（未经创建向导时） |
| `PROMPT_GUIDE.md` | LLM Prompt 工程指南、输出标签规范、最佳实践 |

---

Created with [Omma](https://omma.build)
