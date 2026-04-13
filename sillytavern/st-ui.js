/**
 * SillyTavern Web Enhancer - UI 渲染模块
 * 模态框渲染、事件处理
 */

import {
  db,
  exportLorebook,
  exportPreset,
  exportAllData,
  importAllData,
  clearAllData
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
  } else if (state.activeModal === 'preset') {
    body.innerHTML = renderPresetModal(state, store);
  } else if (state.activeModal === 'settings') {
    body.innerHTML = renderSettingsModal(state, store);
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
      window.sillyTavernStore?.setState({ activeModal: null });
    }
  });

  overlay.querySelector('#st-modal-close').addEventListener('click', () => {
    window.sillyTavernStore?.setState({ activeModal: null });
  });

  document.body.appendChild(overlay);
  return overlay;
}

// ===== 世界书模态框 =====
function renderLorebookModal(state, store) {
  document.getElementById('st-modal-title').textContent = '📚 创意工坊';

  const selectedBook = state.lorebooks.find(b => b.id === state.selectedBookId);

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
        ${selectedBook ? renderBookDetail(selectedBook, state) : renderBookEmpty()}
      </div>
    </div>
  `;
}

function renderCreateBookForm() {
  return `
    <div style="margin-bottom:12px">
      <input type="text" class="st-input" id="st-new-book-name" placeholder="世界书名称">
      <button class="st-btn-primary" id="st-confirm-create">创建</button>
      <button class="st-btn-secondary" id="st-cancel-create">取消</button>
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
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--jade-pale);cursor:pointer">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="recursiveScanning" ${book.recursiveScanning ? 'checked' : ''}> 递归扫描
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--jade-pale);cursor:pointer">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="caseSensitive" ${book.caseSensitive ? 'checked' : ''}> 区分大小写
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
    <div class="st-entry">
      <div class="st-entry-keys">
        ${entry.keys.slice(0, 5).map(k => `<span class="st-tag">${k}</span>`).join('')}
        ${entry.keys.length > 5 ? `<span class="st-tag purple">+${entry.keys.length - 5}</span>` : ''}
      </div>
      <div class="st-entry-content">${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span style="font-size:11px;color:rgba(168,230,230,0.4)">
          顺序:${entry.order} | 位置:${entry.position}${entry.depth ? `(${entry.depth})` : ''}${entry.constant ? ' | 始终插入' : ''}
        </span>
        <button class="st-btn-danger st-delete-entry" data-book-id="${bookId}" data-entry-id="${entry.id}">删除</button>
      </div>
    </div>
  `;
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
      </div>
    </div>
    <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:16px">
      <h4 style="color:var(--jade-pale);margin-bottom:12px;font-size:14px">生成参数</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div>
          <label class="st-label">Temperature: ${preset.parameters.temperature}</label>
          <input type="range" min="0" max="2" step="0.1" value="${preset.parameters.temperature}"
            class="st-input st-preset-param" data-preset-id="${preset.id}" data-param="temperature">
        </div>
        <div>
          <label class="st-label">Max Tokens: ${preset.parameters.maxTokens}</label>
          <input type="range" min="256" max="4096" step="256" value="${preset.parameters.maxTokens}"
            class="st-input st-preset-param" data-preset-id="${preset.id}" data-param="maxTokens">
        </div>
      </div>
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
        <input type="password" class="st-input" id="st-api-key" value="${state.settings.api.apiKey}" placeholder="sk-...">
      </div>
      <div class="st-form-group">
        <label class="st-label">模型名称</label>
        <input type="text" class="st-input" id="st-model" value="${state.settings.api.model}" placeholder="gpt-3.5-turbo">
      </div>
      <div class="st-form-group">
        <label class="st-label">API基础URL</label>
        <input type="text" class="st-input" id="st-base-url" value="${state.settings.api.baseUrl}" placeholder="https://api.openai.com/v1">
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
        <input type="text" class="st-input" id="st-user-name" value="${state.settings.userName}" placeholder="清虚子">
        <p style="font-size:12px;color:rgba(168,230,230,0.4);margin-top:4px">用于替换 {{user}} 宏</p>
      </div>
      <div class="st-form-group">
        <label class="st-label">AI角色名 (Character)</label>
        <input type="text" class="st-input" id="st-char-name" value="${state.settings.characterName}" placeholder="云璃仙子">
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

  // 模态框内的事件委托
  document.addEventListener('click', async (e) => {
    const target = e.target;

    // 标签切换
    if (target.classList.contains('st-tab')) {
      store.setState({ activeTab: target.dataset.tab });
    }

    // 选择世界书
    if (target.closest('.st-item') && target.closest('#st-book-list')) {
      const bookId = target.closest('.st-item').dataset.bookId;
      store.setState({ selectedBookId: bookId });
    }

    // 选择预设
    if (target.closest('.st-item') && target.closest('#st-preset-list')) {
      const presetId = target.closest('.st-item').dataset.presetId;
      store.setState({ selectedPresetId: presetId });
    }

    // 新建世界书
    if (target.id === 'st-new-book') {
      store.setState({ isCreatingBook: true });
    }

    // 取消创建
    if (target.id === 'st-cancel-create') {
      store.setState({ isCreatingBook: false });
    }
  });

  // ESC 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      store.setState({ activeModal: null });
    }
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
