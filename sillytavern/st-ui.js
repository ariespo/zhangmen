/**
 * SillyTavern Web v2.0 - UI Module
 * Comprehensive UI for lorebooks, presets, chats, settings, and prompt preview
 */

import {
  db, importLorebook, exportLorebook, exportPreset, exportAllData, importAllData,
  clearAllData, importJsonFile, exportToJson, importPreset, DEFAULT_PRESET
} from './st-core.js';
import { previewPrompt } from './st-prompt.js';
import { extractVariables, formatVariablesForPrompt } from './st-variables.js';

// ===== Modal Rendering =====
export function renderModal(state, store) {
  const overlay = document.getElementById('st-modal-overlay') || createModalOverlay();
  const body = overlay.querySelector('.st-modal-body');
  const title = overlay.querySelector('.st-modal-title');

  if (!state.activeModal) {
    overlay.classList.remove('active');
    return;
  }

  overlay.classList.add('active');

  // Use innerHTML for full re-render, but preserve scroll where possible
  switch (state.activeModal) {
    case 'lorebook':
      title.textContent = '📚 创意工坊';
      body.innerHTML = renderLorebookModal(state, store);
      attachLorebookListeners(state, store);
      break;
    case 'preset':
      title.textContent = '⚙️ 预设管理';
      body.innerHTML = renderPresetModal(state, store);
      attachPresetListeners(state, store);
      break;
    case 'chat':
      title.textContent = '💬 对话管理';
      body.innerHTML = renderChatModal(state, store);
      attachChatListeners(state, store);
      break;
    case 'settings':
      title.textContent = '🔧 系统设置';
      body.innerHTML = renderSettingsModal(state, store);
      attachSettingsListeners(state, store);
      break;
    case 'prompt-preview':
      title.textContent = '🔍 提示词预览';
      body.innerHTML = renderPromptPreviewModal(state, store);
      attachPromptPreviewListeners(state, store);
      break;
    case 'variables':
      title.textContent = '📊 变量面板';
      body.innerHTML = renderVariablesModal(state, store);
      attachVariablesListeners(state, store);
      break;
  }
}

function createModalOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'st-modal-overlay';
  overlay.className = 'st-modal-overlay';
  overlay.innerHTML = `
    <div class="st-modal">
      <div class="st-modal-header">
        <span class="st-modal-title">创意工坊</span>
        <button class="st-modal-close" id="st-modal-close">×</button>
      </div>
      <div class="st-modal-body"></div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  overlay.querySelector('#st-modal-close').addEventListener('click', closeModal);
  document.body.appendChild(overlay);
  return overlay;
}

function closeModal() {
  window.sillyTavernStore?.setState({
    activeModal: null,
    editingEntryId: null,
    promptPreview: null
  });
}

// ===== Lorebook Modal =====
function renderLorebookModal(state, store) {
  const selectedBook = state.lorebooks.find(b => b.id === state.selectedBookId);
  const editingEntry = selectedBook && state.editingEntryId
    ? selectedBook.entries.find(e => e.id === state.editingEntryId)
    : null;

  return `
    <div class="st-split">
      <div class="st-sidebar">
        <div class="st-toolbar">
          <button class="st-btn-primary" id="st-new-book">+ 新建世界书</button>
          <button class="st-btn-secondary" id="st-import-book">导入 JSON</button>
        </div>
        ${state.isCreatingBook ? renderCreateBookForm() : ''}
        <div class="st-list" id="st-book-list">
          ${renderBookList(state)}
        </div>
      </div>
      <div class="st-main" id="st-book-detail">
        ${selectedBook
          ? (editingEntry
              ? renderEntryEditor(editingEntry, selectedBook)
              : renderBookDetail(selectedBook, state))
          : renderBookEmpty()}
      </div>
    </div>
  `;
}

function renderCreateBookForm() {
  return `
    <div class="st-card" style="margin-bottom:12px">
      <input type="text" class="st-input" id="st-new-book-name" placeholder="世界书名称">
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="st-btn-primary" id="st-confirm-create">创建</button>
        <button class="st-btn-secondary" id="st-cancel-create">取消</button>
      </div>
    </div>
  `;
}

function renderBookList(state) {
  if (state.lorebooks.length === 0) {
    return '<div class="st-empty">暂无世界书，点击上方按钮创建或导入</div>';
  }

  return state.lorebooks.map(book => `
    <div class="st-item ${state.selectedBookId === book.id ? 'active' : ''}" data-book-id="${book.id}">
      <div style="flex:1;min-width:0">
        <div class="st-item-name">${escapeHtml(book.name)}</div>
        <div class="st-item-meta">${book.entries.length} 条目 · ${book.recursiveScanning ? '递归' : '单次'}扫描</div>
      </div>
      <input type="checkbox" class="st-checkbox st-book-toggle"
        ${state.settings.activeLorebookIds.includes(book.id) ? 'checked' : ''}
        data-book-id="${book.id}" title="激活">
    </div>
  `).join('');
}

function renderBookEmpty() {
  return `
    <div class="st-empty" style="padding:80px 20px">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px;opacity:0.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <p>选择一个世界书查看详情</p>
      <p style="font-size:12px;margin-top:8px;opacity:0.6">或从左侧创建/导入 SillyTavern 格式</p>
    </div>
  `;
}

function renderBookDetail(book, state) {
  return `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px">
        <div style="flex:1;min-width:0">
          <h3 style="font-family:'ZCOOL XiaoWei',serif;font-size:20px;color:var(--jade-glow);margin-bottom:4px">${escapeHtml(book.name)}</h3>
          <p style="font-size:12px;color:rgba(168,230,230,0.5)">${escapeHtml(book.description) || '无描述'}</p>
        </div>
        <div class="st-toolbar" style="margin:0">
          <button class="st-btn-secondary" id="st-export-book" data-book-id="${book.id}">导出</button>
          <button class="st-btn-danger" id="st-delete-book" data-book-id="${book.id}">删除</button>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;background:rgba(0,0,0,0.2);padding:12px;border-radius:10px">
        <label class="st-checkbox-label">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="recursiveScanning" ${book.recursiveScanning ? 'checked' : ''}>
          <span>递归扫描</span>
        </label>
        <label class="st-checkbox-label">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="caseSensitive" ${book.caseSensitive ? 'checked' : ''}>
          <span>区分大小写</span>
        </label>
        <label class="st-checkbox-label">
          <input type="checkbox" class="st-book-setting" data-book-id="${book.id}" data-key="matchWholeWords" ${book.matchWholeWords ? 'checked' : ''}>
          <span>全词匹配</span>
        </label>
      </div>
      <div class="st-toolbar">
        <button class="st-btn-primary" id="st-add-entry" data-book-id="${book.id}">+ 添加条目</button>
      </div>
    </div>
    <div id="st-entries-list" style="max-height:480px;overflow-y:auto">
      ${book.entries.length > 0
        ? book.entries.map(entry => renderEntryCard(entry, book.id)).join('')
        : '<div class="st-empty" style="padding:40px">暂无条目，点击上方按钮添加</div>'}
    </div>
  `;
}

function renderEntryCard(entry, bookId) {
  const isDisabled = entry.enabled === false;
  const displayName = entry.comment || (entry.keys.length > 0 ? entry.keys.slice(0, 3).join(', ') + (entry.keys.length > 3 ? '...' : '') : (entry.content ? entry.content.slice(0, 30) + (entry.content.length > 30 ? '...' : '') : '未命名条目'));
  return `
    <div class="st-entry-card ${isDisabled ? 'disabled' : ''}" data-entry-id="${entry.id}">
      <div class="st-entry-row">
        <div class="st-entry-title">
          <span class="st-entry-arrow">▸</span>
          <span class="st-entry-name">${escapeHtml(displayName)}</span>
          ${entry.constant ? `<span class="st-tag pink" style="padding:1px 6px;font-size:10px">常时</span>` : ''}
          ${entry.probability < 100 ? `<span class="st-tag orange" style="padding:1px 6px;font-size:10px">${entry.probability}%</span>` : ''}
        </div>
        <div class="st-entry-actions">
          <button class="st-icon-btn st-delete-entry" data-book-id="${bookId}" data-entry-id="${entry.id}" title="删除">×</button>
          <label class="st-toggle-switch" title="启用">
            <input type="checkbox" class="st-checkbox st-entry-toggle" ${!isDisabled ? 'checked' : ''} data-book-id="${bookId}" data-entry-id="${entry.id}">
            <span class="st-toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="st-entry-details">
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
          ${entry.keys.slice(0, 8).map(k => `<span class="st-tag">${escapeHtml(k)}</span>`).join('')}
          ${entry.keys.length > 8 ? `<span class="st-tag purple">+${entry.keys.length - 8}</span>` : ''}
          ${entry.selective ? `<span class="st-tag cyan">筛选</span>` : ''}
          ${entry.depth !== undefined && entry.depth !== null ? `<span class="st-tag" style="background:rgba(110,207,207,0.1);color:#6ecfcf">深度${entry.depth}</span>` : ''}
          ${entry.role && entry.role !== 'system' ? `<span class="st-tag" style="background:rgba(139,126,200,0.15);color:#8b7ec8">${entry.role}</span>` : ''}
          <span class="st-tag" style="background:rgba(0,0,0,0.25);color:rgba(168,230,230,0.5)">顺序:${entry.order}</span>
          <span class="st-tag" style="background:rgba(0,0,0,0.25);color:rgba(168,230,230,0.5)">位置:${POSITION_NAMES[entry.position] || entry.position}</span>
        </div>
        <div class="st-entry-content" style="margin-bottom:8px">${escapeHtml(entry.content)}</div>
        <div style="display:flex;gap:8px">
          <button class="st-btn-secondary st-edit-entry" data-book-id="${bookId}" data-entry-id="${entry.id}" style="padding:4px 12px;font-size:12px">编辑条目</button>
        </div>
      </div>
    </div>
  `;
}

const POSITION_NAMES = {
  before_char: '角色前',
  after_char: '角色后',
  before_example: '示例前',
  after_example: '示例后',
  at_depth: '指定深度',
  example_msg_top: '示例顶',
  example_msg_bottom: '示例底',
  outlet: '出口'
};

function renderEntryEditor(entry, book) {
  const isNew = !entry.id;
  const e = entry || {};
  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="font-family:'ZCOOL XiaoWei',serif;font-size:20px;color:var(--jade-glow)">${isNew ? '新建条目' : '编辑条目'}</h3>
        <span style="font-size:12px;color:rgba(168,230,230,0.4)">所属: ${escapeHtml(book.name)}</span>
      </div>

      <div class="st-form-group">
        <label class="st-label">关键词（用逗号分隔）</label>
        <input type="text" class="st-input" id="st-entry-keys" value="${escapeHtml((e.keys || []).join(', '))}" placeholder="例如: 修仙, 宗门, 灵气, 突破">
      </div>

      <div class="st-form-group">
        <label class="st-label">二次筛选词（可选，逗号分隔）</label>
        <input type="text" class="st-input" id="st-entry-secondary" value="${escapeHtml((e.secondaryKeys || []).join(', '))}" placeholder="仅在启用二次筛选时生效">
      </div>

      <div class="st-form-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
        <div>
          <label class="st-label">顺序</label>
          <input type="number" class="st-input" id="st-entry-order" value="${e.order ?? 100}">
        </div>
        <div>
          <label class="st-label">位置</label>
          <select class="st-input" id="st-entry-position" style="background:rgba(0,0,0,0.3)">
            ${Object.entries(POSITION_NAMES).map(([k, v]) =>
              `<option value="${k}" ${e.position === k ? 'selected' : ''}>${v}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="st-label">深度</label>
          <input type="number" class="st-input" id="st-entry-depth" value="${e.depth ?? ''}" placeholder="可选">
        </div>
        <div>
          <label class="st-label">概率 %</label>
          <input type="number" class="st-input" id="st-entry-probability" value="${e.probability ?? 100}" min="0" max="100">
        </div>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
        <label class="st-checkbox-label">
          <input type="checkbox" id="st-entry-enabled" ${e.enabled !== false ? 'checked' : ''}>
          <span>启用条目</span>
        </label>
        <label class="st-checkbox-label">
          <input type="checkbox" id="st-entry-selective" ${e.selective ? 'checked' : ''}>
          <span>启用二次筛选</span>
        </label>
        <label class="st-checkbox-label">
          <input type="checkbox" id="st-entry-constant" ${e.constant ? 'checked' : ''}>
          <span>始终插入</span>
        </label>
      </div>

      <div class="st-form-group">
        <label class="st-label">内容（支持 {{user}} {{char}} 宏）</label>
        <textarea class="st-input" id="st-entry-content" rows="10" placeholder="输入世界书条目内容，匹配关键词时自动插入到提示词中...">${escapeHtml(e.content || '')}</textarea>
      </div>

      <div class="st-toolbar">
        <button class="st-btn-primary" id="st-save-entry" data-book-id="${book.id}" data-entry-id="${e.id || ''}">保存条目</button>
        <button class="st-btn-secondary" id="st-cancel-entry">取消</button>
      </div>
    </div>
  `;
}

// ===== Preset Modal =====
function renderPresetModal(state, store) {
  const selectedPreset = state.presets.find(p => p.id === state.selectedPresetId);

  return `
    <div class="st-split">
      <div class="st-sidebar">
        <div class="st-toolbar">
          <button class="st-btn-primary" id="st-new-preset">+ 新建预设</button>
          <button class="st-btn-secondary" id="st-import-preset">导入</button>
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
  if (state.presets.length === 0) {
    return '<div class="st-empty">暂无预设</div>';
  }
  return state.presets.map(preset => `
    <div class="st-item ${state.selectedPresetId === preset.id ? 'active' : ''}" data-preset-id="${preset.id}">
      <div style="flex:1;min-width:0">
        <div class="st-item-name">${escapeHtml(preset.name)}</div>
        <div class="st-item-meta">T:${preset.parameters.temperature} · Max:${preset.parameters.maxTokens} · ${preset.promptOrder.length} 块</div>
      </div>
      ${state.settings.activePresetId === preset.id ? '<span class="st-tag" style="background:rgba(110,207,207,0.3)">当前</span>' : ''}
    </div>
  `).join('');
}

function renderPresetEmpty() {
  return `
    <div class="st-empty" style="padding:80px 20px">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px;opacity:0.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6"/>
      </svg>
      <p>选择一个预设查看详情</p>
      <p style="font-size:12px;margin-top:8px;opacity:0.6">预设决定 AI 如何理解提示词和生成回复</p>
    </div>
  `;
}

function renderPresetDetail(preset, state) {
  const activeTab = state.activeTab || 'general';

  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px">
        <div style="flex:1;min-width:0">
          <h3 style="font-family:'ZCOOL XiaoWei',serif;font-size:20px;color:var(--jade-glow);margin-bottom:4px">${escapeHtml(preset.name)}</h3>
          <p style="font-size:12px;color:rgba(168,230,230,0.5)">${escapeHtml(preset.description) || '无描述'}</p>
        </div>
        <div class="st-toolbar" style="margin:0">
          <button class="st-btn-primary" id="st-activate-preset" data-preset-id="${preset.id}">设为当前</button>
          <button class="st-btn-secondary" id="st-export-preset" data-preset-id="${preset.id}">导出</button>
          <button class="st-btn-danger" id="st-delete-preset" data-preset-id="${preset.id}">删除</button>
        </div>
      </div>

      <div class="st-tabs" style="margin-bottom:16px">
        <button class="st-tab ${activeTab === 'general' ? 'active' : ''}" data-tab="general">基本信息</button>
        <button class="st-tab ${activeTab === 'blocks' ? 'active' : ''}" data-tab="blocks">提示词块</button>
        <button class="st-tab ${activeTab === 'params' ? 'active' : ''}" data-tab="params">生成参数</button>
      </div>

      <div class="st-preset-content">
        ${activeTab === 'general' ? renderPresetGeneral(preset) :
          activeTab === 'blocks' ? renderPresetBlocks(preset) :
          renderPresetParams(preset)}
      </div>

      <div class="st-toolbar" style="margin-top:16px">
        <button class="st-btn-primary" id="st-save-preset-detail" data-preset-id="${preset.id}">保存修改</button>
      </div>
    </div>
  `;
}

function renderPresetGeneral(preset) {
  return `
    <div style="max-width:600px">
      <div class="st-form-group">
        <label class="st-label">预设名称</label>
        <input type="text" class="st-input" id="st-preset-name" value="${escapeHtml(preset.name)}" placeholder="例如: 修仙对话">
      </div>
      <div class="st-form-group">
        <label class="st-label">描述</label>
        <input type="text" class="st-input" id="st-preset-desc" value="${escapeHtml(preset.description)}" placeholder="简短描述这个预设的用途">
      </div>
      <div class="st-form-row" style="margin-bottom:12px">
        <div>
          <label class="st-label">上下文长度 (Context)</label>
          <select class="st-input" id="st-preset-context" style="background:rgba(0,0,0,0.3)">
            <option value="2048" ${preset.contextLength === 2048 ? 'selected' : ''}>2048</option>
            <option value="4096" ${preset.contextLength === 4096 ? 'selected' : ''}>4096</option>
            <option value="8192" ${preset.contextLength === 8192 ? 'selected' : ''}>8192</option>
            <option value="16384" ${preset.contextLength === 16384 ? 'selected' : ''}>16384</option>
            <option value="32768" ${preset.contextLength === 32768 ? 'selected' : ''}>32768</option>
            <option value="131072" ${preset.contextLength === 131072 ? 'selected' : ''}>131072</option>
          </select>
        </div>
        <div>
          <label class="st-label">模型覆盖（可选）</label>
          <input type="text" class="st-input" id="st-preset-model" value="${escapeHtml(preset.modelOverride || '')}" placeholder="留空使用全局模型">
        </div>
      </div>
    </div>
  `;
}

function renderPresetBlocks(preset) {
  const blocks = preset.promptOrder || [];
  return `
    <div style="max-height:420px;overflow-y:auto">
      <div style="margin-bottom:12px;font-size:12px;color:rgba(168,230,230,0.6)">
        提示词块按顺序组装成最终发送给 AI 的消息。点击条目展开详情。
      </div>
      <div id="st-block-list">
        ${blocks.map((b, idx) => `
          <div class="st-block-item" data-block-index="${idx}">
            <div class="st-block-row">
              <div class="st-block-title">
                <span class="st-block-arrow">▸</span>
                <span class="st-block-name">${escapeHtml(b.name)}</span>
                ${b.marker ? `<span class="st-tag pink" style="padding:1px 6px;font-size:10px">标记</span>` : ''}
              </div>
              <div class="st-block-actions">
                <button class="st-icon-btn st-delete-block" data-index="${idx}" title="删除">×</button>
                <label class="st-toggle-switch" title="启用">
                  <input type="checkbox" class="st-block-enabled" data-index="${idx}" ${b.enabled ? 'checked' : ''}>
                  <span class="st-toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="st-block-details">
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
                <span class="st-block-id">${b.id}</span>
                <span class="st-block-role">${b.role || 'system'}</span>
                ${b.injectionPosition !== undefined ? `<span class="st-tag cyan" style="padding:1px 6px;font-size:10px">注入位${b.injectionPosition}</span>` : ''}
                ${b.injectionDepth !== undefined ? `<span class="st-tag orange" style="padding:1px 6px;font-size:10px">深度${b.injectionDepth}</span>` : ''}
              </div>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                <span style="font-size:12px;color:rgba(168,230,230,0.6)">位置</span>
                <input type="number" class="st-input st-block-position" data-index="${idx}" value="${b.position}" style="width:80px;padding:4px 8px;font-size:12px;margin:0">
                <button class="st-btn-secondary st-move-block-up" data-index="${idx}" style="padding:2px 8px;font-size:12px">▲</button>
                <button class="st-btn-secondary st-move-block-down" data-index="${idx}" style="padding:2px 8px;font-size:12px">▼</button>
              </div>
              ${b.id !== 'history' && b.id !== 'user_input' && b.id !== 'world_info' ? `
                <textarea class="st-input st-block-content" data-index="${idx}" rows="4" style="font-size:13px;background:rgba(0,0,0,0.2);margin:0">${escapeHtml(b.content || '')}</textarea>
              ` : `
                <div style="font-size:12px;color:rgba(168,230,230,0.4);font-style:italic;padding:8px 0">
                  ${b.id === 'history' ? '此块自动插入聊天历史' : b.id === 'user_input' ? '此块自动插入当前用户输入' : '此块自动插入匹配的世界书条目'}
                </div>
              `}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="st-btn-secondary" id="st-add-block" style="margin-top:12px">+ 添加自定义块</button>
    </div>
  `;
}

function renderPresetParams(preset) {
  const p = preset.parameters || {};
  return `
    <div style="max-width:600px">
      <div class="st-form-row" style="margin-bottom:16px">
        <div>
          <label class="st-label">Temperature: <span id="st-temp-val">${p.temperature}</span></label>
          <input type="range" min="0" max="2" step="0.05" value="${p.temperature}" class="st-slider" id="st-param-temperature">
          <p style="font-size:11px;color:rgba(168,230,230,0.4);margin-top:4px">越低越保守，越高越创意</p>
        </div>
        <div>
          <label class="st-label">Max Tokens: <span id="st-maxtokens-val">${p.maxTokens}</span></label>
          <input type="range" min="256" max="8192" step="256" value="${p.maxTokens}" class="st-slider" id="st-param-maxTokens">
        </div>
      </div>
      <div class="st-form-row" style="margin-bottom:16px">
        <div>
          <label class="st-label">Top P: <span id="st-topp-val">${p.topP ?? 0.9}</span></label>
          <input type="range" min="0" max="1" step="0.05" value="${p.topP ?? 0.9}" class="st-slider" id="st-param-topP">
        </div>
        <div>
          <label class="st-label">Frequency Penalty: <span id="st-freq-val">${p.frequencyPenalty ?? 0}</span></label>
          <input type="range" min="-2" max="2" step="0.1" value="${p.frequencyPenalty ?? 0}" class="st-slider" id="st-param-frequencyPenalty">
        </div>
      </div>
      <div class="st-form-row" style="margin-bottom:16px">
        <div>
          <label class="st-label">Presence Penalty: <span id="st-pres-val">${p.presencePenalty ?? 0}</span></label>
          <input type="range" min="-2" max="2" step="0.1" value="${p.presencePenalty ?? 0}" class="st-slider" id="st-param-presencePenalty">
        </div>
      </div>
    </div>
  `;
}

// ===== Chat Modal =====
function renderChatModal(state, store) {
  const activeChat = store.getActiveChat();

  return `
    <div style="max-width:600px;margin:0 auto">
      <div class="st-toolbar" style="margin-bottom:16px">
        <button class="st-btn-primary" id="st-new-chat">+ 新建对话</button>
        <button class="st-btn-secondary" id="st-rename-chat" ${activeChat ? '' : 'disabled'}>重命名</button>
        <button class="st-btn-danger" id="st-delete-chat" ${activeChat ? '' : 'disabled'}>删除</button>
      </div>
      <div class="st-list" id="st-chat-list">
        ${state.chats.length === 0
          ? '<div class="st-empty">暂无对话记录</div>'
          : state.chats.map(chat => `
            <div class="st-item ${state.settings.activeChatId === chat.id ? 'active' : ''}" data-chat-id="${chat.id}">
              <div style="flex:1;min-width:0">
                <div class="st-item-name">${escapeHtml(chat.name)}</div>
                <div class="st-item-meta">${chat.messages.length} 条 · ${new Date(chat.updatedAt).toLocaleString()}</div>
              </div>
              ${state.settings.activeChatId === chat.id ? '<span class="st-tag" style="background:rgba(110,207,207,0.3)">当前</span>' : ''}
            </div>
          `).join('')}
      </div>
      ${activeChat ? renderChatDetail(activeChat) : ''}
    </div>
  `;
}

function renderChatDetail(chat) {
  return `
    <div class="st-card" style="margin-top:16px">
      <h4 style="color:var(--jade-glow);margin-bottom:12px">当前对话: ${escapeHtml(chat.name)}</h4>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div style="background:rgba(0,0,0,0.2);padding:8px 12px;border-radius:8px;font-size:12px">
          <span style="color:rgba(168,230,230,0.5)">消息数:</span> ${chat.messages.length}
        </div>
        <div style="background:rgba(0,0,0,0.2);padding:8px 12px;border-radius:8px;font-size:12px">
          <span style="color:rgba(168,230,230,0.5)">变量数:</span> ${Object.keys(chat.variables || {}).length}
        </div>
      </div>
      <div style="font-size:12px;color:rgba(168,230,230,0.5)">
        提示: 在消息上悬停可编辑、删除后续或分支
      </div>
    </div>
  `;
}

// ===== Settings Modal =====
function renderSettingsModal(state, store) {
  return `
    <div class="st-tabs" style="margin-bottom:16px">
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
        <div id="st-model-select-container" style="margin-top:8px;display:none"></div>
      </div>
      <div class="st-form-group">
        <label class="st-label">API基础URL</label>
        <input type="text" class="st-input" id="st-base-url" value="${escapeHtml(state.settings.api.baseUrl)}" placeholder="https://api.openai.com/v1">
        <p style="font-size:11px;color:rgba(168,230,230,0.4);margin-top:4px">支持 OpenAI / DeepSeek / Kimi / 本地模型等兼容端点</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="st-btn-primary" id="st-save-api">保存设置</button>
        <button class="st-btn-secondary" id="st-fetch-models">获取模型列表</button>
      </div>
    </div>
  `;
}

function renderProfileSettings(state) {
  return `
    <div style="max-width:500px">
      <div class="st-form-group">
        <label class="st-label">你的名称 (User)</label>
        <input type="text" class="st-input" id="st-user-name" value="${escapeHtml(state.settings.userName)}" placeholder="清虚子">
        <p style="font-size:12px;color:rgba(168,230,230,0.4);margin-top:4px">用于替换 {{user}} 宏变量</p>
      </div>
      <div class="st-form-group">
        <label class="st-label">AI角色名 (Character)</label>
        <input type="text" class="st-input" id="st-char-name" value="${escapeHtml(state.settings.characterName)}" placeholder="云璃仙子">
        <p style="font-size:12px;color:rgba(168,230,230,0.4);margin-top:4px">用于替换 {{char}} 宏变量</p>
      </div>
      <button class="st-btn-primary" id="st-save-profile">保存设置</button>
    </div>
  `;
}

function renderBackupSettings() {
  return `
    <div style="max-width:500px">
      <div class="st-card" style="margin-bottom:16px">
        <h4 style="color:var(--jade-glow);margin-bottom:8px">导出数据</h4>
        <p style="font-size:13px;color:rgba(168,230,230,0.6);margin-bottom:12px">将所有世界书、预设、设置、对话导出为JSON文件</p>
        <button class="st-btn-primary" id="st-export-all">导出全部数据</button>
      </div>
      <div class="st-card" style="margin-bottom:16px;border-color:rgba(139,126,200,0.2)">
        <h4 style="color:var(--mist-purple);margin-bottom:8px">导入数据</h4>
        <p style="font-size:13px;color:rgba(168,230,230,0.6);margin-bottom:12px">从之前导出的备份文件恢复数据</p>
        <button class="st-btn-secondary" id="st-import-all">导入备份文件</button>
      </div>
      <div class="st-card" style="border-color:rgba(212,114,140,0.2)">
        <h4 style="color:var(--lotus-pink);margin-bottom:8px">清除数据</h4>
        <p style="font-size:13px;color:rgba(168,230,230,0.6);margin-bottom:12px">清除所有本地存储的数据（不可恢复）</p>
        <button class="st-btn-danger" id="st-clear-all">清除所有数据</button>
      </div>
    </div>
  `;
}

// ===== Prompt Preview Modal =====
function renderPromptPreviewModal(state, store) {
  const preview = state.promptPreview;
  if (!preview) {
    return '<div class="st-empty">暂无预览数据</div>';
  }

  return `
    <div style="display:flex;flex-direction:column;gap:12px;max-height:70vh">
      <div class="st-card" style="background:rgba(0,0,0,0.3)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h4 style="color:var(--jade-glow)">Token 估算</h4>
          <span class="st-tag">${preview.tokenEstimate.total} / ${preview.tokenEstimate.maxContext}</span>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:rgba(168,230,230,0.7)">
          <span>可用: ${preview.tokenEstimate.available}</span>
          <span>历史: ${preview.tokenEstimate.history} 条</span>
          <span>世界书: ${preview.tokenEstimate.lorebookEntries} 条</span>
        </div>
      </div>
      <div style="flex:1;overflow:auto;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;padding:16px">
        <pre style="white-space:pre-wrap;word-break:break-word;font-family:'Noto Serif SC',serif;font-size:13px;line-height:1.7;color:var(--cloud-white);margin:0">${escapeHtml(preview.text)}</pre>
      </div>
    </div>
  `;
}

// ===== Variables Modal =====
function renderVariablesModal(state, store) {
  const chat = store.getActiveChat();
  const globalVars = chat?.variables || {};

  return `
    <div style="max-width:500px">
      <div class="st-toolbar" style="margin-bottom:12px">
        <button class="st-btn-primary" id="st-add-variable">+ 添加变量</button>
      </div>
      ${Object.keys(globalVars).length === 0
        ? '<div class="st-empty">暂无变量，可手动添加或让 AI 在回复中使用 &lt;var name="..." value="..." /&gt; 标签自动创建</div>'
        : `<div class="st-variable-list">
            ${Object.entries(globalVars).map(([k, v]) => `
              <div class="st-variable-item">
                <input type="text" class="st-input st-var-name" value="${escapeHtml(k)}" placeholder="变量名" style="margin:0;flex:1">
                <input type="text" class="st-input st-var-value" data-key="${escapeHtml(k)}" value="${escapeHtml(String(v))}" placeholder="值" style="margin:0;flex:2">
                <button class="st-btn-danger st-delete-var" data-key="${escapeHtml(k)}" style="padding:4px 10px">删除</button>
              </div>
            `).join('')}
           </div>`}
      <div style="margin-top:16px;padding:12px;background:rgba(110,207,207,0.05);border-radius:8px;font-size:12px;color:rgba(168,230,230,0.6)">
        <strong style="color:var(--jade-glow)">自动变量:</strong> 当 AI 回复包含 <code>&lt;var name="hp" value="100" /&gt;</code> 时，系统会自动提取并更新此面板中的值。
      </div>
    </div>
  `;
}

// ===== Event Bindings =====
export function bindEvents(store) {
  document.getElementById('st-btn-lorebook')?.addEventListener('click', () => {
    store.setState({ activeModal: 'lorebook' });
  });

  document.getElementById('st-btn-preset')?.addEventListener('click', () => {
    store.setState({ activeModal: 'preset', activeTab: 'general' });
  });

  document.getElementById('st-btn-settings')?.addEventListener('click', () => {
    store.setState({ activeModal: 'settings', activeTab: 'api' });
  });

  document.getElementById('st-btn-chat')?.addEventListener('click', () => {
    store.setState({ activeModal: 'chat' });
  });

  document.getElementById('st-btn-variables')?.addEventListener('click', () => {
    store.setState({ activeModal: 'variables' });
  });

  document.getElementById('st-btn-prompt-preview')?.addEventListener('click', async () => {
    const state = store.getState();
    const chat = store.getActiveChat();
    const { previewPrompt } = await import('./st-prompt.js');
    const preview = previewPrompt({
      userInput: '',
      history: chat?.messages || [],
      preset: store.getActivePreset(),
      lorebooks: store.getActiveLorebooks(),
      userName: state.settings.userName || '用户',
      characterName: state.settings.characterName || 'AI',
      variables: chat?.variables || {}
    });
    store.setState({ activeModal: 'prompt-preview', promptPreview: preview });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ----- Lorebook Listeners -----
function attachLorebookListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  body.querySelectorAll('#st-book-list .st-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('st-book-toggle') || e.target.closest('.st-book-toggle')) return;
      store.setState({ selectedBookId: el.dataset.bookId, editingEntryId: null });
    });
  });

  body.querySelectorAll('.st-book-toggle').forEach(cb => {
    cb.addEventListener('change', async () => {
      const bookId = cb.dataset.bookId;
      const activeIds = new Set(state.settings.activeLorebookIds);
      cb.checked ? activeIds.add(bookId) : activeIds.delete(bookId);
      await store.saveSettings({ activeLorebookIds: Array.from(activeIds) });
    });
  });

  body.querySelectorAll('.st-book-setting').forEach(cb => {
    cb.addEventListener('change', async () => {
      const book = state.lorebooks.find(b => b.id === cb.dataset.bookId);
      if (book) {
        book[cb.dataset.key] = cb.checked;
        await store.saveLorebook(book);
      }
    });
  });

  body.querySelector('#st-new-book')?.addEventListener('click', () => store.setState({ isCreatingBook: true }));
  body.querySelector('#st-cancel-create')?.addEventListener('click', () => store.setState({ isCreatingBook: false }));

  body.querySelector('#st-confirm-create')?.addEventListener('click', async () => {
    const name = document.getElementById('st-new-book-name')?.value.trim();
    if (!name) return;
    const newBook = {
      id: crypto.randomUUID(), name, description: '', entries: [],
      recursiveScanning: false, caseSensitive: false, matchWholeWords: false,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    await store.saveLorebook(newBook);
    store.setState({ isCreatingBook: false, selectedBookId: newBook.id });
  });

  body.querySelector('#st-import-book')?.addEventListener('click', async () => {
    const result = await importJsonFile();
    if (!result) {
      alert('导入失败: 无法读取文件（可能不是有效的 JSON）');
      return;
    }
    const { data, fileName } = result;
    try {
      let rawBook = null;
      // SillyTavern native exports entries as an object; our format uses an array
      if (data.entries && (Array.isArray(data.entries) || typeof data.entries === 'object')) {
        rawBook = data;
      } else if (Array.isArray(data.data?.lorebooks) && data.data.lorebooks.length > 0) {
        rawBook = data.data.lorebooks[0];
      } else if (Array.isArray(data.lorebooks) && data.lorebooks.length > 0) {
        rawBook = data.lorebooks[0];
      }
      if (!rawBook) {
        console.error('[Import Book] Unrecognized format. Keys:', Object.keys(data));
        throw new Error('无法识别的文件格式（缺少 entries 或 lorebooks 字段）');
      }
      const book = importLorebook(rawBook, fileName);
      await store.saveLorebook(book);
      store.setState({ selectedBookId: book.id });
      store.showToast('世界书导入成功');
    } catch (err) {
      console.error('[Import Book] Error:', err);
      alert('导入失败: ' + err.message);
    }
  });

  body.querySelector('#st-export-book')?.addEventListener('click', () => {
    const bookId = body.querySelector('#st-export-book')?.dataset.bookId;
    const book = state.lorebooks.find(b => b.id === bookId);
    if (book) exportToJson(exportLorebook(book), `${book.name}.json`);
  });

  body.querySelector('#st-delete-book')?.addEventListener('click', async () => {
    const bookId = body.querySelector('#st-delete-book')?.dataset.bookId;
    if (!bookId || !confirm('确定要删除这个世界书吗？')) return;
    await store.deleteLorebook(bookId);
  });

  body.querySelector('#st-add-entry')?.addEventListener('click', () => {
    const bookId = body.querySelector('#st-add-entry')?.dataset.bookId;
    store.setState({ editingEntryId: 'new', selectedBookId: bookId });
  });

  body.querySelectorAll('.st-edit-entry').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.setState({ editingEntryId: btn.dataset.entryId });
    });
  });

  body.querySelectorAll('.st-delete-entry').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('确定删除此条目？')) return;
      const book = state.lorebooks.find(b => b.id === btn.dataset.bookId);
      if (book) {
        book.entries = book.entries.filter(e => e.id !== btn.dataset.entryId);
        await store.saveLorebook(book);
      }
    });
  });

  body.querySelectorAll('.st-entry-toggle').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      e.stopPropagation();
      const book = state.lorebooks.find(b => b.id === cb.dataset.bookId);
      if (!book) return;
      const entry = book.entries.find(e => e.id === cb.dataset.entryId);
      if (entry) {
        entry.enabled = cb.checked;
        await store.saveLorebook(book);
      }
    });
  });

  // Entry expand/collapse
  body.querySelectorAll('.st-entry-card').forEach(card => {
    const row = card.querySelector('.st-entry-row');
    row?.addEventListener('click', (e) => {
      if (e.target.closest('.st-entry-actions') || e.target.closest('.st-icon-btn') || e.target.closest('.st-toggle-switch')) return;
      card.classList.toggle('expanded');
    });
  });

  body.querySelector('#st-save-entry')?.addEventListener('click', async () => {
    const bookId = body.querySelector('#st-save-entry')?.dataset.bookId;
    const entryId = body.querySelector('#st-save-entry')?.dataset.entryId;
    const book = state.lorebooks.find(b => b.id === bookId);
    if (!book) return;

    const entryData = {
      id: entryId || crypto.randomUUID(),
      keys: (document.getElementById('st-entry-keys')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      secondaryKeys: (document.getElementById('st-entry-secondary')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      content: (document.getElementById('st-entry-content')?.value || '').trim(),
      order: Number(document.getElementById('st-entry-order')?.value) || 100,
      position: document.getElementById('st-entry-position')?.value || 'after_char',
      depth: document.getElementById('st-entry-depth')?.value ? Number(document.getElementById('st-entry-depth').value) : undefined,
      enabled: document.getElementById('st-entry-enabled')?.checked !== false,
      selective: document.getElementById('st-entry-selective')?.checked || false,
      selectiveLogic: 'or',
      constant: document.getElementById('st-entry-constant')?.checked || false,
      probability: Math.min(100, Math.max(0, Number(document.getElementById('st-entry-probability')?.value) || 100)),
      role: 'system',
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

  body.querySelector('#st-cancel-entry')?.addEventListener('click', () => {
    store.setState({ editingEntryId: null });
  });
}

// ----- Preset Listeners -----
function attachPresetListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  body.querySelectorAll('#st-preset-list .st-item').forEach(el => {
    el.addEventListener('click', () => store.setState({ selectedPresetId: el.dataset.presetId }));
  });

  body.querySelector('#st-new-preset')?.addEventListener('click', async () => {
    const newPreset = {
      ...JSON.parse(JSON.stringify(DEFAULT_PRESET)),
      id: crypto.randomUUID(),
      name: '新预设 ' + new Date().toLocaleTimeString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await store.savePreset(newPreset);
    store.setState({ selectedPresetId: newPreset.id, activeTab: 'general' });
  });

  body.querySelector('#st-import-preset')?.addEventListener('click', async () => {
    const result = await importJsonFile();
    if (!result) return;
    const { data, fileName } = result;
    try {
      let rawPreset = null;
      const isPreset =
        data.prompts || data.prompt_order || data.gen_params || data.parameters || data.promptOrder ||
        data.temp !== undefined || data.temperature !== undefined ||
        data.top_p !== undefined || data.max_length !== undefined || data.max_tokens !== undefined ||
        data.openai_max_context !== undefined || data.openai_max_tokens !== undefined ||
        data.rep_pen !== undefined || data.presence_penalty !== undefined;
      if (isPreset) {
        rawPreset = data;
      } else if (Array.isArray(data.data?.presets) && data.data.presets.length > 0) {
        rawPreset = data.data.presets[0];
      } else if (Array.isArray(data.presets) && data.presets.length > 0) {
        rawPreset = data.presets[0];
      }
      if (!rawPreset) throw new Error('无法识别的文件格式');
      const preset = await importPreset(rawPreset, fileName);
      await store.savePreset(preset);
      store.setState({ selectedPresetId: preset.id });
      store.showToast('预设导入成功');
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
  });

  body.querySelector('#st-activate-preset')?.addEventListener('click', async () => {
    const presetId = body.querySelector('#st-activate-preset')?.dataset.presetId;
    if (presetId) {
      await store.saveSettings({ activePresetId: presetId });
      store.showToast('预设已激活');
    }
  });

  body.querySelector('#st-delete-preset')?.addEventListener('click', async () => {
    const presetId = body.querySelector('#st-delete-preset')?.dataset.presetId;
    if (!presetId || !confirm('确定删除此预设？')) return;
    await store.deletePreset(presetId);
  });

  body.querySelector('#st-export-preset')?.addEventListener('click', () => {
    const presetId = body.querySelector('#st-export-preset')?.dataset.presetId;
    const preset = state.presets.find(p => p.id === presetId);
    if (preset) exportToJson(exportPreset(preset), `${preset.name}.json`);
  });

  // Tabs
  body.querySelectorAll('.st-tab').forEach(tab => {
    tab.addEventListener('click', () => store.setState({ activeTab: tab.dataset.tab }));
  });

  // Sliders
  body.querySelectorAll('.st-slider').forEach(input => {
    input.addEventListener('input', () => {
      const spanId = input.id.replace('st-param-', '') === 'temperature' ? 'st-temp-val' :
        input.id.replace('st-param-', '') === 'maxTokens' ? 'st-maxtokens-val' :
        input.id.replace('st-param-', '') === 'topP' ? 'st-topp-val' :
        input.id.replace('st-param-', '') === 'frequencyPenalty' ? 'st-freq-val' :
        input.id.replace('st-param-', '') === 'presencePenalty' ? 'st-pres-val' : null;
      const span = document.getElementById(spanId);
      if (span) span.textContent = input.value;
    });
  });

  // Block reordering
  body.querySelectorAll('.st-move-block-up').forEach(btn => {
    btn.addEventListener('click', () => moveBlock(state, store, Number(btn.dataset.index), -1));
  });
  body.querySelectorAll('.st-move-block-down').forEach(btn => {
    btn.addEventListener('click', () => moveBlock(state, store, Number(btn.dataset.index), 1));
  });
  body.querySelectorAll('.st-delete-block').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBlock(state, store, Number(btn.dataset.index));
    });
  });

  // Block expand/collapse
  body.querySelectorAll('.st-block-item').forEach(item => {
    const row = item.querySelector('.st-block-row');
    row?.addEventListener('click', (e) => {
      if (e.target.closest('.st-block-actions') || e.target.closest('.st-icon-btn') || e.target.closest('.st-toggle-switch')) return;
      item.classList.toggle('expanded');
    });
  });

  body.querySelector('#st-add-block')?.addEventListener('click', () => {
    const preset = state.presets.find(p => p.id === state.selectedPresetId);
    if (!preset) return;
    preset.promptOrder.push({
      id: 'custom_' + Date.now(),
      name: '自定义块',
      content: '',
      enabled: true,
      position: (preset.promptOrder[preset.promptOrder.length - 1]?.position || 0) + 10,
      insertionType: 'system',
      role: 'system'
    });
    store.setState({ presets: [...state.presets] });
  });

  // Save preset
  body.querySelector('#st-save-preset-detail')?.addEventListener('click', async () => {
    const presetId = body.querySelector('#st-save-preset-detail')?.dataset.presetId;
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return;

    const activeTab = state.activeTab || 'general';

    if (activeTab === 'general') {
      preset.name = document.getElementById('st-preset-name')?.value.trim() || preset.name;
      preset.description = document.getElementById('st-preset-desc')?.value.trim() || '';
      preset.contextLength = Number(document.getElementById('st-preset-context')?.value) || 4096;
      preset.modelOverride = document.getElementById('st-preset-model')?.value.trim() || undefined;
    }

    if (activeTab === 'blocks') {
      preset.promptOrder.forEach((b, idx) => {
        b.enabled = body.querySelector(`.st-block-enabled[data-index="${idx}"]`)?.checked ?? b.enabled;
        b.position = Number(body.querySelector(`.st-block-position[data-index="${idx}"]`)?.value) || b.position;
        const contentEl = body.querySelector(`.st-block-content[data-index="${idx}"]`);
        if (contentEl) b.content = contentEl.value;
      });
    }

    if (activeTab === 'params') {
      preset.parameters.temperature = Number(document.getElementById('st-param-temperature')?.value) || 0.8;
      preset.parameters.maxTokens = Number(document.getElementById('st-param-maxTokens')?.value) || 2048;
      preset.parameters.topP = Number(document.getElementById('st-param-topP')?.value) || 0.9;
      preset.parameters.frequencyPenalty = Number(document.getElementById('st-param-frequencyPenalty')?.value) || 0;
      preset.parameters.presencePenalty = Number(document.getElementById('st-param-presencePenalty')?.value) || 0;
    }

    await store.savePreset(preset);
    store.showToast('预设已保存');
  });
}

function moveBlock(state, store, index, direction) {
  const preset = state.presets.find(p => p.id === state.selectedPresetId);
  if (!preset) return;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= preset.promptOrder.length) return;

  // Swap positions instead of array indices to preserve IDs
  const temp = preset.promptOrder[index].position;
  preset.promptOrder[index].position = preset.promptOrder[newIndex].position;
  preset.promptOrder[newIndex].position = temp;

  // Re-sort
  preset.promptOrder.sort((a, b) => a.position - b.position);
  store.setState({ presets: [...state.presets] });
}

function deleteBlock(state, store, index) {
  const preset = state.presets.find(p => p.id === state.selectedPresetId);
  if (!preset || !confirm('确定删除此提示词块？')) return;
  preset.promptOrder.splice(index, 1);
  store.setState({ presets: [...state.presets] });
}

// ----- Chat Listeners -----
function attachChatListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  body.querySelectorAll('#st-chat-list .st-item').forEach(el => {
    el.addEventListener('click', () => store.loadChat(el.dataset.chatId));
  });

  body.querySelector('#st-new-chat')?.addEventListener('click', async () => {
    const name = prompt('新对话名称:', '新对话');
    if (name) await store.createChat(name);
  });

  body.querySelector('#st-rename-chat')?.addEventListener('click', async () => {
    const chat = store.getActiveChat();
    if (!chat) return;
    const name = prompt('重命名对话:', chat.name);
    if (name) await store.renameChat(chat.id, name);
  });

  body.querySelector('#st-delete-chat')?.addEventListener('click', async () => {
    const chat = store.getActiveChat();
    if (!chat || !confirm(`确定删除对话 "${chat.name}"？`)) return;
    await store.deleteChat(chat.id);
  });
}

// ----- Settings Listeners -----
function attachSettingsListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  body.querySelectorAll('.st-tab').forEach(tab => {
    tab.addEventListener('click', () => store.setState({ activeTab: tab.dataset.tab }));
  });

  body.querySelector('#st-save-api')?.addEventListener('click', async () => {
    await store.saveSettings({
      api: {
        ...state.settings.api,
        apiKey: document.getElementById('st-api-key')?.value || '',
        model: document.getElementById('st-model')?.value || '',
        baseUrl: document.getElementById('st-base-url')?.value || ''
      }
    });
    store.showToast('API 设置已保存');
  });

  body.querySelector('#st-fetch-models')?.addEventListener('click', async () => {
    const baseUrl = (document.getElementById('st-base-url')?.value || '').replace(/\/$/, '');
    const apiKey = document.getElementById('st-api-key')?.value || '';
    const container = document.getElementById('st-model-select-container');
    if (!baseUrl) {
      alert('请先填写 API 基础 URL');
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = (data.data || []).map(m => m.id).filter(Boolean).sort();
      if (models.length === 0) {
        alert('未获取到模型列表');
        return;
      }
      const select = document.createElement('select');
      select.className = 'st-input';
      select.style.background = 'rgba(0,0,0,0.3)';
      select.innerHTML = `<option value="">-- 选择模型 --</option>` + models.map(m =>
        `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`
      ).join('');
      select.addEventListener('change', () => {
        const modelInput = document.getElementById('st-model');
        if (modelInput && select.value) modelInput.value = select.value;
      });
      container.innerHTML = '';
      container.appendChild(select);
      container.style.display = 'block';
      store.showToast(`已获取 ${models.length} 个模型`);
    } catch (err) {
      alert('获取模型列表失败: ' + err.message);
    }
  });

  body.querySelector('#st-save-profile')?.addEventListener('click', async () => {
    await store.saveSettings({
      userName: document.getElementById('st-user-name')?.value || '用户',
      characterName: document.getElementById('st-char-name')?.value || 'AI'
    });
    store.showToast('角色设置已保存');
  });

  body.querySelector('#st-export-all')?.addEventListener('click', () => exportAllData());

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
        store.showToast('数据导入成功');
      } catch (err) {
        alert('导入失败: ' + err.message);
      }
    };
    input.click();
  });

  body.querySelector('#st-clear-all')?.addEventListener('click', async () => {
    if (!confirm('确定要清除所有 SillyTavern 数据吗？此操作不可恢复！')) return;
    await clearAllData();
    await store.loadData();
    store.showToast('数据已清除');
  });
}

// ----- Prompt Preview Listeners -----
function attachPromptPreviewListeners(state, store) {
  // Static view only
}

// ----- Variables Listeners -----
function attachVariablesListeners(state, store) {
  const body = document.querySelector('.st-modal-body');
  if (!body) return;

  body.querySelector('#st-add-variable')?.addEventListener('click', () => {
    const chat = store.getActiveChat();
    if (!chat) return;
    const key = prompt('变量名:');
    if (!key) return;
    const value = prompt('变量值:');
    store.setChatVariables(chat.id, { [key]: value ?? '' });
  });

  body.querySelectorAll('.st-var-value').forEach(input => {
    input.addEventListener('change', () => {
      const chat = store.getActiveChat();
      if (!chat) return;
      const key = input.dataset.key;
      const newKey = input.closest('.st-variable-item')?.querySelector('.st-var-name')?.value?.trim() || key;
      const value = input.value;
      if (newKey !== key) {
        const vars = { ...chat.variables };
        delete vars[key];
        vars[newKey] = value;
        store.setChatVariables(chat.id, vars);
      } else {
        store.setChatVariables(chat.id, { [key]: value });
      }
    });
  });

  body.querySelectorAll('.st-delete-var').forEach(btn => {
    btn.addEventListener('click', () => {
      const chat = store.getActiveChat();
      if (!chat) return;
      const vars = { ...chat.variables };
      delete vars[btn.dataset.key];
      store.setChatVariables(chat.id, vars);
    });
  });
}

// ===== Badge Updates =====
export function updateLorebookBadge(state) {
  const count = state.settings.activeLorebookIds?.length || 0;
  const badge = document.getElementById('st-lorebook-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

export function updateChatBadge(state) {
  const chat = state.chats.find(c => c.id === state.settings.activeChatId);
  const badge = document.getElementById('st-chat-count');
  if (badge) {
    const count = chat?.messages?.length || 0;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

export function renderToast(state) {
  let toast = document.getElementById('st-toast');
  if (!state.toast) {
    if (toast) toast.remove();
    return;
  }

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'st-toast';
    toast.className = 'st-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = state.toast.message;
  toast.className = 'st-toast show';
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
