/**
 * SillyTavern Web Enhancer - UI 渲染模块
 * 模态框渲染、事件处理（整合 tavernlike 功能）
 */

import {
  db, importLorebook, exportLorebook, exportPreset, exportAllData, importAllData, clearAllData, importJsonFile, exportToJson
} from './st-core.js';

// ===== 渲染模态框 =====
export function renderModal(state, store) {
  const overlay = document.getElementById('st-modal-overlay') || createModalOverlay();
  const body = overlay.querySelector('.st-modal-body');

  if (!state.activeModal) {
    overlay.classList.remove('active');
    return;
  }

  overlay.classList.add('active');

  if (state.activeModal === 'lorebook') {
    body.innerHTML = renderLorebookModal(state, store);
    attachLorebookListeners(state, store);
  } else if (state.activeModal === 'preset') {
    body.innerHTML = renderPresetModal(state, store);
    attachPresetListeners(state, store);
  } else if (state.activeModal === 'settings') {
    body.innerHTML = renderSettingsModal(state, store);
    attachSettingsListeners(state, store);
  }
}

function createModalOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'st-modal-overlay';
  overlay.className = 'st-modal-overlay';
  overlay.innerHTML = `
    <div class="st-modal">
      <div class="st-modal-header">
        <span class="st-modal-title" id="st-modal-title">创意工坊</span>
        <button class="st-modal-close" id="st-modal-close">×</button>
      </div>
      <div class="st-modal-body"></div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      window.sillyTavernStore?.setState({ activeModal: null, editingEntryId: null });
    }
  });

  overlay.querySelector('#st-modal-close').addEventListener('click', () => {
    window.sillyTavernStore?.setState({ activeModal: null, editingEntryId: null });
  });

  document.body.appendChild(overlay);
  return overlay;
}

// ===== 世界书模态框 =====
function renderLorebookModal(state, store) {
  document.getElementById('st-modal-title').textContent = '📚 创意工坊';

  const selectedBook = state.lorebooks.find(b => b.id === state.selectedBookId);
  const editingEntry = selectedBook && state.editingEntryId
    ? selectedBook.entries.find(e => e.id === state.editingEntryId)
    : null;

  return `
    <div class="st-split">
      <div class="st-sidebar">
        <div class="st-toolbar">
          <button class="st-btn-primary" id="st-new-book">+ 新建</button>
          <button class="st-btn-secondary" id="st-import-book">导入</button>
        </div>
        ${state.isCreatingBook ? renderCreateBookForm() : ''}
        <div class="st-list" id="st-book-list">
          ${renderBookList(state)}
        </div>
      </div>
      <div class="st-main" id="st-book-detail">
        ${selectedBook
          ? (editingEntry
              ? renderEntryForm(editingEntry, selectedBook.id)
              : renderBookDetail(selectedBook, state))
          : renderBookEmpty()}
      </div>
    </div>
  `;
}

function renderCreateBookForm() {
  return `
    <div style="margin-bottom:12px">
      <input type="text" class="st-input" id="st-new-book-name" placeholder="世界书名称" style="margin-bottom:8px">
      <div style="display:flex;gap:8px">
        <button class="st-btn-primary" id="st-confirm-create">创建</button>
        <button class="st-btn-secondary" id="st-cancel-create">取消</button>
      </div>
    </div>
  `;
}

function renderBookList(state) {
  if (state.lorebooks.length === 0) {
    return '<div style="color:rgba(168,230,230,0.5);text-align:center;padding:20px">暂无世界书，点击新建或导入</div>';
  }

  return state.lorebooks.map(book => `
    <div class="st-item ${state.selectedBookId === book.id ? 'active' : ''}" data-book-id="${book.id}">
      <div>
        <div class="st-item-name">${book.name}</div>
        <div class="st-item-meta">${book.entries.length} 条目</div>
      </div>
      <input type="checkbox" class="st-checkbox st-book-toggle"
        ${state.settings.activeLorebookIds.includes(book.id) ? 'checked' : ''}
        data-book-id="${book.id}" title="激活">
    </div>
  `).join('');
}

function renderBookEmpty() {
  return `
    <div style="text-align:center;padding:60px 20px;color:rgba(168,230,230,0.4)">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px;opacity:0.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <p>选择一个世界书查看详情</p>
      <p style="font-size:12px;margin-top:8px">或从左侧创建/导入</p>
    </div>
  `;
}

function renderBookDetail(book, state) {
  return `
    <div style="margin-bottom:16px">
      <h3 style="font-family:'ZCOOL XiaoWei',serif;font-size:18px;color:var(--jade-glow);margin-bottom:8px">${book.name}</h3>
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--jade-pale);cursor:pointer">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="recursiveScanning" ${book.recursiveScanning ? 'checked' : ''}> 递归扫描
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--jade-pale);cursor:pointer">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="caseSensitive" ${book.caseSensitive ? 'checked' : ''}> 区分大小写
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--jade-pale);cursor:pointer">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="matchWholeWords" ${book.matchWholeWords ? 'checked' : ''}> 全词匹配
        </label>
      </div>
      <div class="st-toolbar">
        <button class="st-btn-primary" id="st-add-entry" data-book-id="${book.id}">+ 添加条目</button>
        <button class="st-btn-secondary" id="st-export-book" data-book-id="${book.id}">导出</button>
        <button class="st-btn-danger" id="st-delete-book" data-book-id="${book.id}">删除</button>
      </div>
    </div>
    <div id="st-entries-list">
      ${book.entries.map(entry => renderEntry(entry, book.id)).join('') ||
        '<div style="color:rgba(168,230,230,0.4);text-align:center;padding:40px">暂无条目，点击上方按钮添加</div>'}
    </div>
  `;
}

function renderEntry(entry, bookId) {
  return `
    <div class="st-entry" data-entry-id="${entry.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div class="st-entry-keys">
          ${entry.keys.slice(0, 5).map(k => `<span class="st-tag">${k}</span>`).join('')}
          ${entry.keys.length > 5 ? `<span class="st-tag purple">+${entry.keys.length - 5}</span>` : ''}
          ${entry.constant ? `<span class="st-tag pink">常时</span>` : ''}
        </div>
        <div style="display:flex;gap:6px">
          <button class="st-btn-secondary st-edit-entry" data-book-id="${bookId}" data-entry-id="${entry.id}" style="padding:4px 10px;font-size:12px">编辑</button>
          <button class="st-btn-danger st-delete-entry" data-book-id="${bookId}" data-entry-id="${entry.id}" style="padding:4px 10px;font-size:12px">删除</button>
        </div>
      </div>
      <div class="st-entry-content">${escapeHtml(entry.content.substring(0, 200))}${entry.content.length > 200 ? '...' : ''}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span style="font-size:11px;color:rgba(168,230,230,0.4)">
          顺序:${entry.order} | 位置:${entry.position}${entry.depth ? `(${entry.depth})` : ''}
          ${entry.selective ? ' | 二次筛选' : ''} | 概率:${entry.probability}%
        </span>
      </div>
    </div>
  `;
}

function renderEntryForm(entry, bookId) {
  const isNew = !entry.id;
  const e = entry || {};
  return `
    <div style="margin-bottom:16px">
      <h3 style="font-family:'ZCOOL XiaoWei',serif;font-size:18px;color:var(--jade-glow);margin-bottom:12px">${isNew ? '新建条目' : '编辑条目'}</h3>
      <div class="st-form-group">
        <label class="st-label">关键词（用逗号分隔）</label>
        <input type="text" class="st-input" id="st-entry-keys" value="${escapeHtml((e.keys || []).join(', '))}" placeholder="例如: 修仙, 宗门, 灵气">
      </div>
      <div class="st-form-group">
        <label class="st-label">二次筛选词（可选，逗号分隔）</label>
        <input type="text" class="st-input" id="st-entry-secondary" value="${escapeHtml((e.secondaryKeys || []).join(', '))}" placeholder="">
      </div>
      <div class="st-form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label class="st-label">顺序</label>
          <input type="number" class="st-input" id="st-entry-order" value="${e.order ?? 100}">
        </div>
        <div>
          <label class="st-label">位置</label>
          <select class="st-input" id="st-entry-position" style="background:rgba(0,0,0,0.3)">
            <option value="before_char" ${e.position === 'before_char' ? 'selected' : ''}>角色前</option>
            <option value="after_char" ${e.position === 'after_char' ? 'selected' : ''}>角色后</option>
            <option value="before_example" ${e.position === 'before_example' ? 'selected' : ''}>示例前</option>
            <option value="after_example" ${e.position === 'after_example' ? 'selected' : ''}>示例后</option>
            <option value="at_depth" ${e.position === 'at_depth' ? 'selected' : ''}>指定深度</option>
          </select>
        </div>
        <div>
          <label class="st-label">深度/概率</label>
          <input type="text" class="st-input" id="st-entry-depth-prob" value="${e.depth ?? ''}" placeholder="深度">
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--jade-pale);cursor:pointer">
          <input type="checkbox" id="st-entry-selective" ${e.selective ? 'checked' : ''}> 启用二次筛选
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--jade-pale);cursor:pointer">
          <input type="checkbox" id="st-entry-constant" ${e.constant ? 'checked' : ''}> 始终插入
        </label>
      </div>
      <div class="st-form-group">
        <label class="st-label">内容</label>
        <textarea class="st-input" id="st-entry-content" rows="8" placeholder="输入世界书条目内容...">${escapeHtml(e.content || '')}</textarea>
      </div>
      <div class="st-toolbar">
        <button class="st-btn-primary" id="st-save-entry" data-book-id="${bookId}" data-entry-id="${e.id || ''}">保存</button>
        <button class="st-btn-secondary" id="st-cancel-entry">取消</button>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== 预设模态框 =====
function renderPresetModal(state, store) {
  document.getElementById('st-modal-title').textContent = '⚙️ 预设管理';
  const selectedPreset = state.presets.find(p => p.id === state.selectedPresetId);

  return `
    <div class="st-split">
      <div class="st-sidebar">
        <div class="st-toolbar">
          <button class="st-btn-primary" id="st-new-preset">+ 新建</button>
        </div>
        <div class="st-list" id="st-preset-list">
          ${renderPresetList(state)}
        </div>
      </div>
      <div class="st-main" id="st-preset-detail">
        ${selectedPreset ? renderPresetDetail(selectedPreset, state) : renderPresetEmpty()}
      </div>
    </div>
  `;
}

function renderPresetList(state) {
  return state.presets.map(preset => `
    <div class="st-item ${state.selectedPresetId === preset.id ? 'active' : ''}" data-preset-id="${preset.id}">
      <div>
        <div class="st-item-name">${preset.name}</div>
        <div class="st-item-meta">T:${preset.parameters.temperature} | Max:${preset.parameters.maxTokens}</div>
      </div>
      ${state.settings.activePresetId === preset.id ? '<span class="st-tag" style="background:rgba(110,207,207,0.3)">当前</span>' : ''}
    </div>
  `).join('');
}

function renderPresetEmpty() {
  return `
    <div style="text-align:center;padding:60px 20px;color:rgba(168,230,230,0.4)">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px;opacity:0.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6"/>
      </svg>
      <p>选择一个预设查看详情</p>
    </div>
  `;
}

function renderPresetDetail(preset, state) {
  return `
    <div style="margin-bottom:16px">
      <h3 style="font-family:'ZCOOL XiaoWei',serif;font-size:18px;color:var(--jade-glow);margin-bottom:12px">${preset.name}</h3>
      <div class="st-toolbar">
        <button class="st-btn-primary" id="st-activate-preset" data-preset-id="${preset.id}">设为当前预设</button>
        <button class="st-btn-secondary" id="st-export-preset" data-preset-id="${preset.id}">导出</button>
        <button class="st-btn-danger" id="st-delete-preset" data-preset-id="${preset.id}">删除</button>
      </div>
    </div>
    <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:16px">
      <h4 style="color:var(--jade-pale);margin-bottom:12px;font-size:14px">生成参数</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div>
          <label class="st-label">Temperature: <span id="st-temp-val">${preset.parameters.temperature}</span></label>
          <input type="range" min="0" max="2" step="0.1" value="${preset.parameters.temperature}"
            class="st-input st-preset-param" data-preset-id="${preset.id}" data-param="temperature">
        </div>
        <div>
          <label class="st-label">Max Tokens: <span id="st-maxtokens-val">${preset.parameters.maxTokens}</span></label>
          <input type="range" min="256" max="4096" step="256" value="${preset.parameters.maxTokens}"
            class="st-input st-preset-param" data-preset-id="${preset.id}" data-param="maxTokens">
        </div>
      </div>
      <div class="st-form-group">
        <label class="st-label">系统提示</label>
        <textarea class="st-input" id="st-preset-system" rows="4">${escapeHtml(preset.promptOrder.find(b => b.id === 'system')?.content || '')}</textarea>
      </div>
      <div class="st-form-group">
        <label class="st-label">角色定义</label>
        <textarea class="st-input" id="st-preset-char" rows="3">${escapeHtml(preset.promptOrder.find(b => b.id === 'character')?.content || '')}</textarea>
      </div>
      <button class="st-btn-primary" id="st-save-preset-detail" data-preset-id="${preset.id}">保存修改</button>
    </div>
  `;
}

// ===== 设置模态框 =====
function renderSettingsModal(state, store) {
  document.getElementById('st-modal-title').textContent = '🔧 系统设置';

  return `
    <div class="st-tabs">
      <button class="st-tab ${state.activeTab === 'api' ? 'active' : ''}" data-tab="api">API配置</button>
      <button class="st-tab ${state.activeTab === 'profile' ? 'active' : ''}" data-tab="profile">角色</button>
      <button class="st-tab ${state.activeTab === 'backup' ? 'active' : ''}" data-tab="backup">备份</button>
    </div>
    ${state.activeTab === 'api' ? renderApiSettings(state) :
      state.activeTab === 'profile' ? renderProfileSettings(state) :
      renderBackupSettings()}
  `;
}

function renderApiSettings(state) {
  return `
    <div style="max-width:500px">
      <div class="st-form-group">
        <label class="st-label">API Key</label>
        <input type="password" class="st-input" id="st-api-key" value="${escapeHtml(state.settings.api.apiKey)}" placeholder="sk-...">
      </div>
      <div class="st-form-group">
        <label class="st-label">模型名称</label>
        <input type="text" class="st-input" id="st-model" value="${escapeHtml(state.settings.api.model)}" placeholder="gpt-3.5-turbo">
      </div>
      <div class="st-form-group">
        <label class="st-label">API基础URL</label>
        <input type="text" class="st-input" id="st-base-url" value="${escapeHtml(state.settings.api.baseUrl)}" placeholder="https://api.openai.com/v1">
      </div>
      <button class="st-btn-primary" id="st-save-api">保存设置</button>
    </div>
  `;
}

function renderProfileSettings(state) {
  return `
    <div style="max-width:500px">
      <div class="st-form-group">
        <label class="st-label">你的名称 (User)</label>
        <input type="text" class="st-input" id="st-user-name" value="${escapeHtml(state.settings.userName)}" placeholder="清虚子">
        <p style="font-size:12px;color:rgba(168,230,230,0.4);margin-top:4px">用于替换 {{user}} 宏</p>
      </div>
      <div class="st-form-group">
        <label class="st-label">AI角色名 (Character)</label>
        <input type="text" class="st-input" id="st-char-name" value="${escapeHtml(state.settings.characterName)}" placeholder="云璃仙子">
        <p style="font-size:12px;color:rgba(168,230,230,0.4);margin-top:4px">用于替换 {{char}} 宏</p>
      </div>
      <button class="st-btn-primary" id="st-save-profile">保存设置</button>
    </div>
  `;
}

function renderBackupSettings() {
  return `
    <div style="max-width:500px">
      <div style="background:rgba(110,207,207,0.05);border:1px solid var(--glass-border);border-radius:10px;padding:20px;margin-bottom:16px">
        <h4 style="color:var(--jade-glow);margin-bottom:8px">导出数据</h4>
        <p style="font-size:13px;color:rgba(168,230,230,0.6);margin-bottom:12px">将所有世界书、预设、设置导出为JSON文件</p>
        <button class="st-btn-primary" id="st-export-all">导出全部数据</button>
      </div>
      <div style="background:rgba(139,126,200,0.05);border:1px solid var(--glass-border);border-radius:10px;padding:20px;margin-bottom:16px">
        <h4 style="color:var(--mist-purple);margin-bottom:8px">导入数据</h4>
        <p style="font-size:13px;color:rgba(168,230,230,0.6);margin-bottom:12px">从之前导出的备份文件恢复数据</p>
        <button class="st-btn-secondary" id="st-import-all">导入备份文件</button>
      </div>
      <div style="background:rgba(212,114,140,0.05);border:1px solid rgba(212,114,140,0.2);border-radius:10px;padding:20px">
        <h4 style="color:var(--lotus-pink);margin-bottom:8px">清除数据</h4>
        <p style="font-size:13px;color:rgba(168,230,230,0.6);margin-bottom:12px">清除所有本地存储的数据（不可恢复）</p>
        <button class="st-btn-danger" id="st-clear-all">清除所有数据</button>
      </div>
    </div>
  `;
}

// ===== 事件绑定 =====
export function bindEvents(store) {
  // 按钮点击打开模态框
  document.getElementById('st-btn-lorebook')?.addEventListener('click', () => {
    store.setState({ activeModal: 'lorebook' });
  });

  document.getElementById('st-btn-preset')?.addEventListener('click', () => {
    store.setState({ activeModal: 'preset' });
  });

  document.getElementById('st-btn-settings')?.addEventListener('click', () => {
    store.setState({ activeModal: 'settings', activeTab: 'api' });
  });

  // ESC 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      store.setState({ activeModal: null, editingEntryId: null });
    }
  });
}

function attachLorebookListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  // 选择世界书
  body.querySelectorAll('#st-book-list .st-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('st-book-toggle') || e.target.closest('.st-book-toggle')) return;
      store.setState({ selectedBookId: el.dataset.bookId, editingEntryId: null });
    });
  });

  // 激活/停用世界书
  body.querySelectorAll('.st-book-toggle').forEach(cb => {
    cb.addEventListener('change', async () => {
      const bookId = cb.dataset.bookId;
      const active = cb.checked;
      const activeIds = new Set(state.settings.activeLorebookIds);
      if (active) activeIds.add(bookId);
      else activeIds.delete(bookId);
      await store.saveSettings({ activeLorebookIds: Array.from(activeIds) });
    });
  });

  // 世界书设置
  body.querySelectorAll('.st-book-setting').forEach(cb => {
    cb.addEventListener('change', async () => {
      const bookId = cb.dataset.bookId;
      const key = cb.dataset.key;
      const book = state.lorebooks.find(b => b.id === bookId);
      if (book) {
        book[key] = cb.checked;
        await store.saveLorebook(book);
      }
    });
  });

  // 新建世界书
  body.querySelector('#st-new-book')?.addEventListener('click', () => {
    store.setState({ isCreatingBook: true });
  });

  body.querySelector('#st-cancel-create')?.addEventListener('click', () => {
    store.setState({ isCreatingBook: false });
  });

  body.querySelector('#st-confirm-create')?.addEventListener('click', async () => {
    const name = document.getElementById('st-new-book-name')?.value.trim();
    if (!name) return;
    const newBook = {
      id: crypto.randomUUID(),
      name,
      description: '',
      entries: [],
      recursiveScanning: false,
      caseSensitive: false,
      matchWholeWords: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await store.saveLorebook(newBook);
    store.setState({ isCreatingBook: false, selectedBookId: newBook.id });
  });

  // 导入世界书
  body.querySelector('#st-import-book')?.addEventListener('click', async () => {
    const data = await importJsonFile();
    if (!data) return;
    try {
      const book = importLorebook(data);
      await store.saveLorebook(book);
      store.setState({ selectedBookId: book.id });
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
  });

  // 导出世界书
  body.querySelector('#st-export-book')?.addEventListener('click', () => {
    const bookId = document.querySelector('#st-export-book')?.dataset.bookId;
    const book = state.lorebooks.find(b => b.id === bookId);
    if (book) exportToJson(exportLorebook(book), `${book.name}.json`);
  });

  // 删除世界书
  body.querySelector('#st-delete-book')?.addEventListener('click', async () => {
    const bookId = document.querySelector('#st-delete-book')?.dataset.bookId;
    if (!bookId || !confirm('确定要删除这个世界书吗？')) return;
    await store.deleteLorebook(bookId);
  });

  // 添加条目
  body.querySelector('#st-add-entry')?.addEventListener('click', () => {
    const bookId = document.querySelector('#st-add-entry')?.dataset.bookId;
    store.setState({ editingEntryId: 'new', selectedBookId: bookId });
  });

  // 编辑条目
  body.querySelectorAll('.st-edit-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      store.setState({ editingEntryId: btn.dataset.entryId });
    });
  });

  // 删除条目
  body.querySelectorAll('.st-delete-entry').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('确定删除此条目？')) return;
      const bookId = btn.dataset.bookId;
      const entryId = btn.dataset.entryId;
      const book = state.lorebooks.find(b => b.id === bookId);
      if (book) {
        book.entries = book.entries.filter(e => e.id !== entryId);
        await store.saveLorebook(book);
      }
    });
  });

  // 保存条目
  body.querySelector('#st-save-entry')?.addEventListener('click', async () => {
    const bookId = document.querySelector('#st-save-entry')?.dataset.bookId;
    const entryId = document.querySelector('#st-save-entry')?.dataset.entryId;
    const book = state.lorebooks.find(b => b.id === bookId);
    if (!book) return;

    const keys = document.getElementById('st-entry-keys')?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
    const secondaryKeys = document.getElementById('st-entry-secondary')?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
    const content = document.getElementById('st-entry-content')?.value.trim() || '';
    const order = Number(document.getElementById('st-entry-order')?.value) || 100;
    const position = document.getElementById('st-entry-position')?.value || 'after_char';
    const depthProb = document.getElementById('st-entry-depth-prob')?.value;
    const selective = document.getElementById('st-entry-selective')?.checked || false;
    const constant = document.getElementById('st-entry-constant')?.checked || false;

    const entryData = {
      id: entryId || crypto.randomUUID(),
      keys,
      secondaryKeys,
      content,
      order,
      position,
      depth: depthProb ? Number(depthProb) : undefined,
      selective,
      selectiveLogic: 'or',
      constant,
      probability: 100,
      addMemo: false,
      comment: ''
    };

    if (entryId) {
      const idx = book.entries.findIndex(e => e.id === entryId);
      if (idx !== -1) book.entries[idx] = entryData;
      else book.entries.push(entryData);
    } else {
      book.entries.push(entryData);
    }

    await store.saveLorebook(book);
    store.setState({ editingEntryId: null });
  });

  // 取消编辑条目
  body.querySelector('#st-cancel-entry')?.addEventListener('click', () => {
    store.setState({ editingEntryId: null });
  });
}

function attachPresetListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  // 选择预设
  body.querySelectorAll('#st-preset-list .st-item').forEach(el => {
    el.addEventListener('click', () => {
      store.setState({ selectedPresetId: el.dataset.presetId });
    });
  });

  // 新建预设
  body.querySelector('#st-new-preset')?.addEventListener('click', async () => {
    const { DEFAULT_PRESET } = await import('./st-core.js');
    const newPreset = {
      ...JSON.parse(JSON.stringify(DEFAULT_PRESET)),
      id: crypto.randomUUID(),
      name: '新预设 ' + new Date().toLocaleTimeString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await store.savePreset(newPreset);
    store.setState({ selectedPresetId: newPreset.id });
  });

  // 激活预设
  body.querySelector('#st-activate-preset')?.addEventListener('click', async () => {
    const presetId = document.querySelector('#st-activate-preset')?.dataset.presetId;
    if (presetId) await store.saveSettings({ activePresetId: presetId });
  });

  // 删除预设
  body.querySelector('#st-delete-preset')?.addEventListener('click', async () => {
    const presetId = document.querySelector('#st-delete-preset')?.dataset.presetId;
    if (!presetId || !confirm('确定删除此预设？')) return;
    await store.deletePreset(presetId);
  });

  // 导出预设
  body.querySelector('#st-export-preset')?.addEventListener('click', () => {
    const presetId = document.querySelector('#st-export-preset')?.dataset.presetId;
    const preset = state.presets.find(p => p.id === presetId);
    if (preset) exportToJson(exportPreset(preset), `${preset.name}.json`);
  });

  // 参数滑块实时显示
  body.querySelectorAll('.st-preset-param').forEach(input => {
    input.addEventListener('input', () => {
      const spanId = input.dataset.param === 'temperature' ? 'st-temp-val' : 'st-maxtokens-val';
      const span = document.getElementById(spanId);
      if (span) span.textContent = input.value;
    });
  });

  // 保存预设详情
  body.querySelector('#st-save-preset-detail')?.addEventListener('click', async () => {
    const presetId = document.querySelector('#st-save-preset-detail')?.dataset.presetId;
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return;

    preset.parameters.temperature = Number(document.querySelector('[data-param="temperature"]')?.value) || 0.8;
    preset.parameters.maxTokens = Number(document.querySelector('[data-param="maxTokens"]')?.value) || 2048;

    const sysBlock = preset.promptOrder.find(b => b.id === 'system');
    if (sysBlock) sysBlock.content = document.getElementById('st-preset-system')?.value || '';

    const charBlock = preset.promptOrder.find(b => b.id === 'character');
    if (charBlock) charBlock.content = document.getElementById('st-preset-char')?.value || '';

    await store.savePreset(preset);
    alert('预设已保存');
  });
}

function attachSettingsListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  // 标签切换
  body.querySelectorAll('.st-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      store.setState({ activeTab: tab.dataset.tab });
    });
  });

  // 保存 API
  body.querySelector('#st-save-api')?.addEventListener('click', async () => {
    await store.saveSettings({
      api: {
        ...state.settings.api,
        apiKey: document.getElementById('st-api-key')?.value || '',
        model: document.getElementById('st-model')?.value || '',
        baseUrl: document.getElementById('st-base-url')?.value || ''
      }
    });
    alert('API 设置已保存');
  });

  // 保存角色
  body.querySelector('#st-save-profile')?.addEventListener('click', async () => {
    await store.saveSettings({
      userName: document.getElementById('st-user-name')?.value || '用户',
      characterName: document.getElementById('st-char-name')?.value || 'AI'
    });
    alert('角色设置已保存');
  });

  // 导出全部
  body.querySelector('#st-export-all')?.addEventListener('click', () => {
    exportAllData();
  });

  // 导入全部
  body.querySelector('#st-import-all')?.addEventListener('click', async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await importAllData(file);
        await store.loadData();
        alert('数据导入成功');
      } catch (err) {
        alert('导入失败: ' + err.message);
      }
    };
    input.click();
  });

  // 清除全部
  body.querySelector('#st-clear-all')?.addEventListener('click', async () => {
    if (!confirm('确定要清除所有 SillyTavern 数据吗？此操作不可恢复！')) return;
    await clearAllData();
    await store.loadData();
    alert('数据已清除');
  });
}

// ===== 更新徽章 =====
export function updateLorebookBadge(state) {
  const count = state.settings.activeLorebookIds?.length || 0;
  const badge = document.getElementById('st-lorebook-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}
