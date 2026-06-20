/* ============================================
   Admin Panel Script
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // Default Config (same as main script)
    // ==========================================
    const DEFAULT_CONFIG = {
        name: 'Harshu',
        birthdayDate: getTomorrowDate(),
        title: 'Happy Birthday',
        cards: generateDefaultCards()
    };

    function getTomorrowDate() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }

    function generateDefaultCards() {
        const cards = [];
        const defaultMessages = [
            "The moment the clock strikes midnight, my heart skips a beat knowing it's YOUR day! 🎉",
            "At 1 AM, the world is quiet but my love for you is loud and clear! 💕",
            "2 AM thoughts? Just you, always you. 💫",
            "Even at 3 AM, you're the most beautiful dream I've ever had. 🌙",
            "4 AM and I'm still thinking about how lucky I am to have you. 🍀",
            "5 AM: The sun is getting ready, just like my love — always rising for you. 🌅",
            "6 AM: Good morning, birthday queen! The world is brighter because of you. 👑",
            "7 AM: Rise and shine, my love! Today is YOUR day! ☀️",
            "8 AM: Breakfast tastes sweeter knowing it's your birthday. 🥞",
            "9 AM: Every smile you give today makes the world a better place. 😊",
            "10 AM: Sending you a thousand hugs and a million kisses! 💋",
            "11 AM: Halfway through the morning, but my celebration for you never stops! 🎊",
            "12 PM: Happy noon, birthday star! Keep shining bright! ⭐",
            "1 PM: Afternoon delight? More like having YOU in my life is the real delight! 💝",
            "2 PM: My love for you grows stronger with every passing hour. 💪",
            "3 PM: Afternoon vibes and birthday smiles! You deserve it all! 😄",
            "4 PM: You make every moment magical, my love. ✨",
            "5 PM: The golden hour is just like you — absolutely stunning. 🌄",
            "6 PM: Sunset colors remind me of the warmth you bring to my life. 🧡",
            "7 PM: Evening falls, but my love for you never dims. 🌆",
            "8 PM: Dinner time! May your birthday feast be as sweet as you! 🎂",
            "9 PM: The night is young and so is our love story! 💃",
            "10 PM: Under the stars, I wish you the happiest birthday ever! 🌟",
            "11 PM: The day is almost over, but my love for you is forever. 💖"
        ];

        for (let i = 0; i < 24; i++) {
            const hour = i;
            const ampm = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
            cards.push({
                id: i + 1,
                hour: hour,
                title: `Hour ${i + 1} — ${ampm}`,
                message: defaultMessages[i],
                mediaType: '',
                mediaUrl: ''
            });
        }
        return cards;
    }

    // ==========================================
    // Config Manager
    // ==========================================
    function loadConfig() {
        try {
            const saved = localStorage.getItem('harshuBdayConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...DEFAULT_CONFIG,
                    ...parsed,
                    cards: parsed.cards || DEFAULT_CONFIG.cards
                };
            }
        } catch (e) {
            console.warn('Failed to load config:', e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    function saveConfig(config) {
        localStorage.setItem('harshuBdayConfig', JSON.stringify(config));
    }

    let config = loadConfig();

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
