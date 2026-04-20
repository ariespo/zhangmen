# 读取游戏功能设计文档

**日期**: 2026-04-20  
**需求**: 标题页「读取游戏」实装。玩家按名称分组，每个角色下有 N 个独立存档槽。

---

## 1. 数据模型变更

### Chat 对象扩展

在现有 chat 结构基础上增加 `playerName` 字段：

```js
{
  id: crypto.randomUUID(),
  name: "张三 - 存档1",        // 显示名，创建时自动生成
  playerName: "张三",           // 玩家角色名，分组依据，创建后不再变更
  messages: [],
  variables: {
    gameState: { ... },         // 完整的游戏状态
  },
  presetId: string,
  lorebookIds: string[],
  userName: string,
  characterName: string,
  createdAt: number,
  updatedAt: number
}
```

### 关键原则

- `playerName` 在创建存档时从 `gameState.player.name` 写入，**之后不再随 player.name 变化而变**。分组稳定性优先于改名跟踪。
- `name` 字段为存档显示名，允许用户后续修改（可选功能）。

---

## 2. 读档界面

### 入口

标题页「读取游戏」按钮，点击后弹出全屏读档界面。

### 布局

```
┌──────────────────────────────────────────────────────┐
│  宗门志 · 读取游戏                                    │
├─────────────────┬────────────────────────────────────┤
│                 │                                    │
│  玩家角色         │  [张三] 的存档                      │
│  ────────────   │  ┌──────────────────────────────┐  │
│  ▶ 张三          │  │ 存档1                        │  │
│    李四          │  │ 末流小派 · 练气期前期 · 2弟子  │  │
│    王五          │  │ 2026-04-20 14:32             │  │
│                 │  │ [读取] [删除]                │  │
│  [+ 新建角色]    │  └──────────────────────────────┘  │
│                 │  ┌──────────────────────────────┐  │
│                 │  │ 存档2                        │  │
│                 │  │ 四流小宗 · 筑基期中期 · 5弟子  │  │
│                 │  │ 2026-04-19 09:15             │  │
│                 │  │ [读取] [删除]                │  │
│                 │  └──────────────────────────────┘  │
│                 │                                    │
│                 │  [+ 新建存档]                       │
│                 │                                    │
├─────────────────┴────────────────────────────────────┤
│  [返回标题]                                           │
└──────────────────────────────────────────────────────┘
```

### 左侧：玩家角色列表

- 从所有 `chat` 中按 `playerName` 去重分组
- 按字母/拼音排序
- 当前选中项高亮显示
- 每个角色行显示该角色的存档数量

### 右侧：存档列表

- 显示当前选中角色的所有存档
- 按 `updatedAt` 降序排列（最新的在上）
- 每个存档卡片显示：
  - 存档名（`chat.name`）
  - 宗门名称（`gameState.sect.name`）
  - 玩家境界（`gameState.player.realm`）
  - 弟子数（`Object.keys(gameState.members).length`）
  - 最后更新时间（格式化日期）
  - 操作按钮：读取、删除

### 操作按钮

| 按钮 | 行为 |
|------|------|
| **读取** | 加载该存档 → 进入游戏主界面 |
| **删除** | 确认弹窗 → 删除存档 → 刷新列表 |
| **+ 新建存档** | 在选中角色名下创建新存档槽 |
| **+ 新建角色** | 回到标题页 → 开始新游戏 |
| **返回标题** | 关闭读档界面，回到标题页 |

---

## 3. 核心流程

### 3.1 获取存档列表

```js
async function getAllSaves() {
  const chats = await db.chats.toArray();
  // 只保留有 playerName 的存档（过滤掉 SillyTavern 原生无游戏状态的对话）
  const gameSaves = chats.filter(c => c.playerName);
  // 按 playerName 分组
  const grouped = {};
  for (const chat of gameSaves) {
    if (!grouped[chat.playerName]) grouped[chat.playerName] = [];
    grouped[chat.playerName].push(chat);
  }
  // 每组内部按 updatedAt 降序
  for (const name in grouped) {
    grouped[name].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return grouped;
}
```

### 3.2 读取存档

```js
async function loadSave(chatId) {
  // 1. 加载游戏状态
  await window.gameStateManager.load(chatId);
  // 2. 加载 SillyTavern 对话
  await window.sillyTavernStore.loadChat(chatId);
  // 3. 刷新所有 UI 模块
  refreshAllUI();
  // 4. 关闭读档界面，进入游戏
  hideLoadGameScreen();
  showGameScreen();
}
```

### 3.3 创建存档（创建向导完成后）

```js
async function createNewSave(playerName, gameState) {
  // 1. 获取该玩家已有存档数，生成存档名
  const saves = await getSavesByPlayerName(playerName);
  const saveName = `${playerName} - 存档${saves.length + 1}`;
  // 2. 创建 SillyTavern chat
  const chat = await window.sillyTavernStore.createChat(saveName, { playerName });
  // 3. 保存初始 gameState
  await window.gameStateManager.load(chat.id); // 绑定 chatId
  Object.assign(window.gameStateManager.state, gameState);
  // 4. 触发一次保存
  window.gameStateManager._onChange(''); // 强制触发保存
}
```

### 3.4 删除存档

```js
async function deleteSave(chatId) {
  const confirmed = await confirmDialog('确定要删除这个存档吗？此操作不可撤销。');
  if (!confirmed) return;
  // 1. 如果删除的是当前活跃存档，先解除绑定
  if (window.gameStateManager._chatId === chatId) {
    window.gameStateManager.reset();
  }
  // 2. 从数据库删除
  await db.chats.delete(chatId);
  // 3. 刷新列表
  refreshSaveList();
}
```

### 3.5 新建存档（同一角色下）

```js
async function createSaveForPlayer(playerName) {
  const saves = await getSavesByPlayerName(playerName);
  const saveName = `${playerName} - 存档${saves.length + 1}`;
  const chat = await window.sillyTavernStore.createChat(saveName, { playerName });
  // 复制上一份存档的 gameState 作为初始状态（可选）
  // 或创建全新默认状态
  window.gameStateManager.load(chat.id);
  return chat;
}
```

---

## 4. API 改动

### 4.1 st-core.js

**`createChat(name, opts = {})`**

```js
async createChat(name = '新对话', opts = {}) {
  const chat = {
    id: crypto.randomUUID(),
    name,
    playerName: opts.playerName || '',  // ← 新增
    messages: [],
    variables: opts.variables || {},     // ← 新增：支持传入初始变量
    presetId: state.settings.activePresetId,
    lorebookIds: [...state.settings.activeLorebookIds],
    userName: state.settings.userName,
    characterName: state.settings.characterName,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.chats.put(chat);
  state.chats = await db.chats.toArray();
  state.settings.activeChatId = chat.id;
  await db.settings.put(state.settings);
  notify();
  return chat;
}
```

### 4.2 game-state.js

**新增 `getAllSaves()`**

```js
export async function getAllSaves() {
  try {
    const chats = await db.chats.toArray();
    const saves = chats.filter(c => c.playerName);
    const grouped = {};
    for (const chat of saves) {
      if (!grouped[chat.playerName]) grouped[chat.playerName] = [];
      grouped[chat.playerName].push(chat);
    }
    for (const name in grouped) {
      grouped[name].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return grouped;
  } catch (e) {
    console.error('[GameState] getAllSaves failed:', e);
    return {};
  }
}
```

**修改 `saveGameState()`**（可选：同步更新 chat.name 如果 user 修改了存档名）

当前不需要修改，因为 `playerName` 创建后不变，`name` 仅在创建时设置。

### 4.3 index.html

**新增 HTML 结构**

在 `title-screen` 同级添加 `load-game-screen`：

```html
<div id="load-game-screen" class="page-overlay" style="display:none;">
  <div class="load-game-container">
    <h2>读取游戏</h2>
    <div class="load-game-layout">
      <div class="player-list" id="load-player-list"></div>
      <div class="save-list" id="load-save-list"></div>
    </div>
    <button class="title-btn" onclick="hideLoadGameScreen()">返回标题</button>
  </div>
</div>
```

**新增 CSS**

读档界面样式：深色背景、分栏布局、存档卡片、悬停效果等。

**重写 `loadGame()`**

```js
window.loadGame = async function() {
  const saves = await getAllSaves();
  renderLoadGameScreen(saves);
  document.getElementById('load-game-screen').style.display = 'flex';
};
```

**修改 `initializeGameState()`**

创建游戏完成后：

```js
// 创建新的 SillyTavern 对话存档
const saveName = `${data.name} - 存档1`;
const chat = await window.sillyTavernStore.createChat(saveName, { playerName: data.name });
// 绑定 gameStateManager 到该存档
await window.gameStateManager.load(chat.id);
// 写入初始状态...
```

---

## 5. 错误处理

| 场景 | 处理 |
|------|------|
| 数据库为空/无存档 | 显示「暂无存档，请先开始新游戏」 |
| 读取存档失败 | 提示错误，保持在读档界面 |
| 删除当前活跃存档 | 先 `gameStateManager.reset()`，再删除，返回标题页 |
| IndexedDB 不可用 | 降级为 alert 提示 |

---

## 6. 边缘情况

1. **玩家改名后分组**：`playerName` 创建后固定，改名不影响分组。新名字在新存档中体现。
2. **同名不同玩家**：按 `playerName` 字符串分组，同名视为同一角色（预期行为）。
3. **旧存档兼容**：没有 `playerName` 的存档不显示在读档界面（仅显示在 SillyTavern 原生对话列表中）。
4. **同时打开多个标签页**：每个标签页独立操作 IndexedDB，最后写入的为准（与现有行为一致）。

---

## 7. 实现文件清单

| 文件 | 改动 |
|------|------|
| `sillytavern/st-core.js` | `createChat()` 增加 `opts.playerName` 和 `opts.variables` |
| `sillytavern/game-state.js` | 新增 `getAllSaves()` |
| `index.html` | 新增读档界面 HTML + CSS + JS，重写 `loadGame()`，修改 `initializeGameState()` |
