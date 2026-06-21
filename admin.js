/* ============================================
   Admin Panel Script
   ============================================ */

(async function () {
    'use strict';

    // ==========================================
    // Default Config (same as main script)
    // ==========================================
    function getTomorrowDate() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }

    let DEFAULT_CONFIG = null;
    let config = null;

    async function loadConfig() {
        try {
            const res = await fetch('config.json');
            DEFAULT_CONFIG = await res.json();
            if (!DEFAULT_CONFIG.birthdayDate) {
                DEFAULT_CONFIG.birthdayDate = getTomorrowDate();
            }
            const saved = localStorage.getItem('harshuBdayConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                config = {
                    ...DEFAULT_CONFIG,
                    ...parsed,
                    cards: parsed.cards || DEFAULT_CONFIG.cards
                };
            } else {
                config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            }
        } catch (e) {
            console.warn('Failed to load config:', e);
            config = { name: 'Harshu', birthdayDate: getTomorrowDate(), title: 'Happy Birthday', cards: [] };
            DEFAULT_CONFIG = JSON.parse(JSON.stringify(config));
        }
    }

    function saveConfig(cfg) {
        localStorage.setItem('harshuBdayConfig', JSON.stringify(cfg));
    }

    // ==========================================
    // DOM Elements
    // ==========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const settingName = $('#settingName');
    const settingDate = $('#settingDate');
    const settingTitle = $('#settingTitle');
    const saveGeneralBtn = $('#saveGeneral');
    const cardsConfigList = $('#cardsConfigList');
    const expandAllBtn = $('#expandAll');
    const collapseAllBtn = $('#collapseAll');
    const exportBtn = $('#exportConfig');
    const importInput = $('#importConfig');
    const resetBtn = $('#resetConfig');
    const toast = $('#toast');
    const toastMsg = $('#toastMsg');

    // ==========================================
    // Toast
    // ==========================================
    let toastTimeout;
    function showToast(msg, icon = '✅') {
        toastMsg.textContent = msg;
        toast.querySelector('.toast-icon').textContent = icon;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==========================================
    // General Settings
    // ==========================================
    function loadGeneralSettings() {
        settingName.value = config.name;
        settingDate.value = config.birthdayDate;
        settingTitle.value = config.title;
    }

    saveGeneralBtn.addEventListener('click', () => {
        config.name = settingName.value.trim() || 'Harshu';
        config.birthdayDate = settingDate.value || getTomorrowDate();
        config.title = settingTitle.value.trim() || 'Happy Birthday';
        saveConfig(config);
        showToast('General settings saved!');
    });

    // ==========================================
    // Cards Configuration
    // ==========================================
    function renderCardsConfig() {
        cardsConfigList.innerHTML = '';

        config.cards.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'card-config-item';
            item.dataset.index = index;

            const hour = card.hour;
            const ampm = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
            const previewText = card.title || `Card #${card.id}`;
            const mediaBadge = card.mediaType ? ` [${card.mediaType}]` : '';

            item.innerHTML = `
                <div class="card-config-header" data-index="${index}">
                    <div class="card-config-header-left">
                        <div class="card-config-number">${card.id}</div>
                        <span class="card-config-preview">${previewText}${mediaBadge} — ${ampm}</span>
                    </div>
                    <span class="card-config-toggle">▼</span>
                </div>
                <div class="card-config-body">
                    <div class="card-config-fields">
                        <div class="form-group full-width">
                            <label>Card Title</label>
                            <input type="text" class="card-title-input" data-index="${index}" value="${escapeAttr(card.title)}" placeholder="e.g., Midnight Surprise 🎉">
                        </div>
                        <div class="form-group full-width">
                            <label>Card Message</label>
                            <textarea class="card-message-input" data-index="${index}" rows="3" placeholder="Write your heartfelt message...">${escapeHtml(card.message)}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Media Type</label>
                            <select class="card-mediatype-input" data-index="${index}">
                                <option value="" ${!card.mediaType ? 'selected' : ''}>None</option>
                                <option value="photo" ${card.mediaType === 'photo' ? 'selected' : ''}>📷 Photo</option>
                                <option value="audio" ${card.mediaType === 'audio' ? 'selected' : ''}>🎵 Audio</option>
                                <option value="video" ${card.mediaType === 'video' ? 'selected' : ''}>🎬 Video</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Media URL (Google Drive link)</label>
                            <input type="url" class="card-url-input" data-index="${index}" value="${escapeAttr(card.mediaUrl)}" placeholder="https://drive.google.com/file/d/...">
                        </div>
                        <div class="form-group full-width">
                            <button class="btn btn-primary btn-save-card" data-index="${index}">Save Card #${card.id}</button>
                        </div>
                    </div>
                </div>
            `;

            cardsConfigList.appendChild(item);
        });

        // Attach event listeners
        $$('.card-config-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                item.classList.toggle('expanded');
            });
        });

        $$('.btn-save-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                saveCardConfig(idx);
            });
        });
    }

    function saveCardConfig(index) {
        const titleInput = document.querySelector(`.card-title-input[data-index="${index}"]`);
        const messageInput = document.querySelector(`.card-message-input[data-index="${index}"]`);
        const mediaTypeInput = document.querySelector(`.card-mediatype-input[data-index="${index}"]`);
        const urlInput = document.querySelector(`.card-url-input[data-index="${index}"]`);

        config.cards[index].title = titleInput.value.trim();
        config.cards[index].message = messageInput.value.trim();
        config.cards[index].mediaType = mediaTypeInput.value;
        config.cards[index].mediaUrl = urlInput.value.trim();

        saveConfig(config);
        showToast(`Card #${config.cards[index].id} saved!`);
        renderCardsConfig(); // Re-render to update previews
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Expand / Collapse All
    expandAllBtn.addEventListener('click', () => {
        $$('.card-config-item').forEach(item => item.classList.add('expanded'));
    });

    collapseAllBtn.addEventListener('click', () => {
        $$('.card-config-item').forEach(item => item.classList.remove('expanded'));
    });

    // ==========================================
    // Export Config
    // ==========================================
    exportBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `harshu-birthday-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Config exported!', '📁');
    });

    // ==========================================
    // Import Config
    // ==========================================
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!imported.cards || !Array.isArray(imported.cards)) {
                    throw new Error('Invalid config format');
                }
                config = {
                    ...DEFAULT_CONFIG,
                    ...imported,
                    cards: imported.cards
                };
                saveConfig(config);
                loadGeneralSettings();
                renderCardsConfig();
                showToast('Config imported successfully!', '📥');
            } catch (err) {
                showToast('Failed to import: Invalid file format', '❌');
            }
        };
        reader.readAsText(file);
        importInput.value = ''; // Reset file input
    });

    // ==========================================
    // Reset Config
    // ==========================================
    resetBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone!')) return;
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        saveConfig(config);
        loadGeneralSettings();
        renderCardsConfig();
        showToast('Config reset to defaults!', '🔄');
    });

    // ==========================================
    // Initialize
    // ==========================================
    function init() {
        loadGeneralSettings();
        renderCardsConfig();
    }

    async function setupApp() {
        await loadConfig();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    setupApp();

})();
