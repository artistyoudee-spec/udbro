/* ============================================
   Harshu Birthday Website - Main Script
   ============================================ */

(async function () {
    'use strict';

    // ==========================================
    // Default Configuration
    // ==========================================
    function getTomorrowDate() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    let DEFAULT_CONFIG = null;
    let config = null;

    async function loadConfig() {
        try {
            const res = await fetch('config.json?v=' + new Date().getTime(), { cache: 'no-store' });
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
                config = { ...DEFAULT_CONFIG };
            }
        } catch (e) {
            console.warn('Failed to load config:', e);
            DEFAULT_CONFIG = { name: 'Harshu', birthdayDate: getTomorrowDate(), title: 'Happy Birthday', cards: [] };
            config = { ...DEFAULT_CONFIG };
        }
    }

    // ==========================================
    // DOM Elements
    // ==========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const birthdayTitle = $('#birthdayTitle');
    const birthdayName = $('#birthdayName');
    const footerName = $('#footerName');
    const countdownLabel = $('#countdownLabel');
    const countdownWrapper = $('#countdownWrapper');
    const countDays = $('#countDays');
    const countHours = $('#countHours');
    const countMinutes = $('#countMinutes');
    const countSeconds = $('#countSeconds');
    const nextCardTimer = $('#nextCardTimer');
    const nextCardText = $('#nextCardText');
    const nextCardTime = $('#nextCardTime');
    const cardsGrid = $('#cardsGrid');
    const cardModal = $('#cardModal');
    const modalClose = $('#modalClose');
    const modalCardNumber = $('#modalCardNumber');
    const modalTitle = $('#modalTitle');
    const modalMessage = $('#modalMessage');
    const modalMedia = $('#modalMedia');
    const heartsBg = $('#heartsBg');
    const confettiCanvas = $('#confettiCanvas');
    const scrollHint = $('#scrollHint');

    const bgMusic = $('#bgMusic');
    const enterScreen = $('#enterScreen');
    const enterTimer = $('#enterTimer');
    const entDays = $('#entDays');
    const entHours = $('#entHours');
    const entMinutes = $('#entMinutes');
    const entSeconds = $('#entSeconds');
    const enterBtn = $('#enterBtn');

    // ==========================================
    // Birthday & Time Logic
    // ==========================================
    function getBirthdayMidnight() {
        const [y, m, d] = config.birthdayDate.split('-').map(Number);
        return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    function getBirthdayEnd() {
        const bday = getBirthdayMidnight();
        return new Date(bday.getTime() + 24 * 60 * 60 * 1000);
    }

    function getUnlockedCardCount() {
        const now = new Date();
        const midnight = getBirthdayMidnight();

        if (now < midnight) return 0;

        const end = getBirthdayEnd();
        if (now >= end) return 24;

        const hoursSinceMidnight = Math.floor((now - midnight) / (1000 * 60 * 60));
        return Math.min(hoursSinceMidnight + 1, 24);
    }

    function getNextUnlockTime() {
        const now = new Date();
        const midnight = getBirthdayMidnight();
        const end = getBirthdayEnd();

        if (now < midnight) return midnight;
        if (now >= end) return null;

        const hoursSinceMidnight = Math.floor((now - midnight) / (1000 * 60 * 60));
        const nextHour = hoursSinceMidnight + 1;
        if (nextHour >= 24) return null;

        return new Date(midnight.getTime() + nextHour * 60 * 60 * 1000);
    }

    // ==========================================
    // Timer Update
    // ==========================================
    function updateTimers() {
        const now = new Date();
        const midnight = getBirthdayMidnight();
        const end = getBirthdayEnd();

        // --- NEW: Bulletproof Enter Screen Lock Logic ---
        try {
            if (enterScreen && !enterScreen.classList.contains('hidden-overlay')) {
                if (now < midnight) {
                    // Lock the button
                    if (enterBtn) {
                        enterBtn.disabled = true;
                        enterBtn.innerHTML = '🔒 Unlocks at Midnight';
                    }
                    if (enterTimer) enterTimer.classList.remove('hidden');
                    
                    // Update timer numbers safely
                    const ms = midnight - now;
                    if (entDays) entDays.textContent = String(Math.floor(ms / (1000 * 60 * 60 * 24))).padStart(2, '0');
                    if (entHours) entHours.textContent = String(Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
                    if (entMinutes) entMinutes.textContent = String(Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
                    if (entSeconds) entSeconds.textContent = String(Math.floor((ms % (1000 * 60)) / 1000)).padStart(2, '0');
                } else {
                    // Birthday has arrived! Unlock the button
                    if (enterBtn) {
                        enterBtn.disabled = false;
                        enterBtn.innerHTML = '🎁 Click to Open 🎁';
                    }
                    if (enterTimer) enterTimer.classList.add('hidden');
                }
            }
        } catch (e) {
            console.error("Timer failed to update:", e);
        }
        // --- END NEW LOGIC ---

        if (now < midnight) {
            // Before birthday — countdown to birthday
            countdownLabel.textContent = 'Birthday Countdown';
            const diff = midnight - now;
            updateCountdownDisplay(diff);
            nextCardTimer.classList.remove('hidden');
            nextCardText.innerHTML = `First card unlocks in: <strong id="nextCardTime">${formatDuration(diff)}</strong>`;
        } else if (now >= end) {
            // After birthday — all unlocked
            countdownLabel.textContent = 'Birthday Celebration!';
            countdownWrapper.querySelector('.countdown-timer').innerHTML = `
                <div class="time-block" style="min-width:auto;padding:1rem 2rem;">
                    <span class="time-value" style="color:#ffd700;font-family:'Dancing Script',cursive;font-size:1.8rem;">🎉 All 24 Cards Unlocked! 🎉</span>
                </div>`;
            nextCardTimer.classList.add('hidden');
            document.body.classList.add('celebration');
        } else {
            // Birthday in progress
            countdownLabel.textContent = '🎂 It\'s Birthday Time! 🎂';
            const remaining = end - now;
            updateCountdownDisplay(remaining);

            const nextUnlock = getNextUnlockTime();
            if (nextUnlock) {
                nextCardTimer.classList.remove('hidden');
                const timeLeft = nextUnlock - now;
                nextCardText.innerHTML = `Next card unlocks in: <strong>${formatDuration(timeLeft)}</strong>`;
            } else {
                nextCardTimer.classList.add('hidden');
            }
        }
    }

    function updateCountdownDisplay(ms) {
        if (ms <= 0) ms = 0;
        const d = Math.floor(ms / (1000 * 60 * 60 * 24));
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((ms % (1000 * 60)) / 1000);

        countDays.textContent = String(d).padStart(2, '0');
        countHours.textContent = String(h).padStart(2, '0');
        countMinutes.textContent = String(m).padStart(2, '0');
        countSeconds.textContent = String(s).padStart(2, '0');
    }

    function formatDuration(ms) {
        if (ms <= 0) return '00:00:00';
        const h = Math.floor(ms / (1000 * 60 * 60));
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((ms % (1000 * 60)) / 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // ==========================================
    // Render Cards
    // ==========================================
    function renderCards() {
        const unlockedCount = getUnlockedCardCount();
        cardsGrid.innerHTML = '';

        config.cards.forEach((card, index) => {
            const isUnlocked = index < unlockedCount;
            const cardEl = document.createElement('div');
            cardEl.className = `birthday-card ${isUnlocked ? 'card-unlocked' : 'card-locked'}`;
            cardEl.dataset.index = index;

            const hour = card.hour;
            const ampm = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

            if (isUnlocked) {
                const mediaIcon = card.mediaType === 'photo' ? '📷' : card.mediaType === 'audio' ? '🎵' : card.mediaType === 'video' ? '🎬' : '';
                cardEl.innerHTML = `
                    <div class="card-front">
                        <div class="card-number">${card.id}</div>
                        <div class="card-number-label">${ampm}</div>
                        <div class="card-open-icon">🎁</div>
                        ${card.title ? `<div class="card-title-preview">${escapeHtml(card.title.replace(/^Hour \d+ — /, ''))}</div>` : ''}
                        ${mediaIcon ? `<span class="media-badge">${mediaIcon}</span>` : ''}
                    </div>
                `;
                cardEl.addEventListener('click', () => openCard(index));
            } else {
                cardEl.innerHTML = `
                    <div class="card-front">
                        <div class="card-lock-icon">🔒</div>
                        <div class="card-number">${card.id}</div>
                        <div class="card-number-label">${ampm}</div>
                        <div class="card-unlock-time">Unlocks at ${ampm}</div>
                    </div>
                `;
                cardEl.style.cursor = 'not-allowed';
            }

            cardsGrid.appendChild(cardEl);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==========================================
    // Open Card Modal
    // ==========================================
    // ==========================================
    // Open Card Modal
    // ==========================================
    function openCard(index) {
        const card = config.cards[index];
        if (!card) return;

        modalCardNumber.textContent = `Card #${card.id}`;
        modalTitle.textContent = card.title || `Hour ${card.id}`;
        modalMessage.textContent = card.message || '';
        modalMedia.innerHTML = '';

        // Pause background music if this card has audio or video
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && (card.mediaType === 'audio' || card.mediaType === 'video')) {
            bgMusic.pause();
        }

        // Media rendering
        if (card.mediaUrl && card.mediaType) {
            const isDriveLink = isGoogleDriveUrl(card.mediaUrl);

            if (isDriveLink) {
                renderDriveMedia(card);
            } else {
                renderDirectMedia(card);
            }
        }

        cardModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Spawn mini hearts in modal
        spawnModalHearts();
    }

    // Check if URL is a Google Drive link
    function isGoogleDriveUrl(url) {
        return url.includes('drive.google.com') || url.includes('docs.google.com');
    }

    // Extract Google Drive File ID from various URL formats
    function getDriveFileId(url) {
        // Format: /file/d/FILE_ID/view
        let match = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
        if (match) return match[1];

        // Format: /open?id=FILE_ID
        match = url.match(/drive\.google\.com\/open\?id=([\w-]+)/);
        if (match) return match[1];

        // Format: /uc?id=FILE_ID or /uc?export=download&id=FILE_ID
        match = url.match(/[?&]id=([\w-]+)/);
        if (match) return match[1];

        return null;
    }

    // Render media from Google Drive links (ALL types use iframe for reliability)
    function renderDriveMedia(card) {
        const fileId = getDriveFileId(card.mediaUrl);

        if (!fileId) {
            // Can't parse the URL — show fallback link
            modalMedia.innerHTML = buildFallbackLink(card.mediaUrl, 'Open media in new tab');
            return;
        }

        const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

        switch (card.mediaType) {
            case 'photo':
                // Try thumbnail first (most reliable for images), then fallback to iframe
                const thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                modalMedia.innerHTML = `
                    <div class="media-container photo-container">
                        <img 
                            src="${escapeAttr(thumbUrl)}" 
                            alt="${escapeAttr(card.title)}" 
                            loading="lazy"
                            class="media-img"
                            onerror="handleImageError(this, '${escapeAttr(embedUrl)}')"
                        >
                        <a href="https://drive.google.com/file/d/${fileId}/view" target="_blank" rel="noopener" class="media-open-link">🔗 Open full image</a>
                    </div>`;
                break;

            case 'audio':
                // Google Drive audio cannot be played via <audio> tag due to CORS.
                // Use iframe embed which provides a built-in player.
                modalMedia.innerHTML = `
                    <div class="media-container audio-container">
                        <div class="audio-embed-wrapper">
                            <iframe 
                                src="${escapeAttr(embedUrl)}" 
                                allow="autoplay" 
                                loading="lazy"
                                class="media-iframe"
                            ></iframe>
                        </div>
                        <a href="https://drive.google.com/file/d/${fileId}/view" target="_blank" rel="noopener" class="media-open-link">🔗 Open audio file</a>
                    </div>`;
                break;

            case 'video':
                // The "Desktop-Scale Trick": Tricks Drive into rendering tiny desktop controls
                // by doubling the iframe size, then shrinking it down to fit the phone screen.
                // This handles BOTH horizontal and vertical videos perfectly.
                modalMedia.innerHTML = `
                    <div class="media-container video-container" style="position: relative; width: 100%; height: 50vh; min-height: 380px; overflow: hidden; border-radius: 12px; background: #000; margin-bottom: 10px;">
                        <iframe 
                            src="https://drive.google.com/file/d/${fileId}/preview" 
                            style="position: absolute; top: 0; left: 0; width: 200%; height: 200%; transform: scale(0.5); transform-origin: top left; border: none;"
                            allow="autoplay" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <a href="https://drive.google.com/file/d/${fileId}/view" target="_blank" rel="noopener" class="media-open-link">🔗 Open video in Drive</a>
                `;
                break;

            default:
                modalMedia.innerHTML = buildFallbackLink(card.mediaUrl, 'Open media');
        }
    }

    // Render media from direct (non-Drive) URLs
    function renderDirectMedia(card) {
        switch (card.mediaType) {
            case 'photo':
                modalMedia.innerHTML = `
                    <div class="media-container photo-container">
                        <img 
                            src="${escapeAttr(card.mediaUrl)}" 
                            alt="${escapeAttr(card.title)}" 
                            loading="lazy"
                            class="media-img"
                        >
                    </div>`;
                break;

            case 'audio':
                modalMedia.innerHTML = `
                    <div class="media-container audio-container">
                        <audio controls preload="metadata" class="media-audio">
                            <source src="${escapeAttr(card.mediaUrl)}" type="audio/mpeg">
                            <source src="${escapeAttr(card.mediaUrl)}" type="audio/ogg">
                            <source src="${escapeAttr(card.mediaUrl)}" type="audio/wav">
                            Your browser does not support audio.
                        </audio>
                        <a href="${escapeAttr(card.mediaUrl)}" target="_blank" rel="noopener" class="media-open-link">🔗 Open audio</a>
                    </div>`;
                break;

            case 'video':
                modalMedia.innerHTML = `
                    <div class="media-container video-container">
                        <video controls preload="metadata" class="media-video">
                            <source src="${escapeAttr(card.mediaUrl)}" type="video/mp4">
                            <source src="${escapeAttr(card.mediaUrl)}" type="video/webm">
                            Your browser does not support video.
                        </video>
                        <a href="${escapeAttr(card.mediaUrl)}" target="_blank" rel="noopener" class="media-open-link">🔗 Open video</a>
                    </div>`;
                break;

            default:
                modalMedia.innerHTML = buildFallbackLink(card.mediaUrl, 'Open media');
        }
    }

    // Fallback link when media can't be embedded
    function buildFallbackLink(url, text) {
        return `
            <div class="media-fallback">
                <p>Media cannot be embedded directly.</p>
                <a href="${escapeAttr(url)}" target="_blank" rel="noopener" class="media-open-link">🔗 ${text}</a>
            </div>`;
    }

    // Handle image load error — fallback to iframe embed
    window.handleImageError = function(imgEl, embedUrl) {
        const container = imgEl.parentElement;
        imgEl.style.display = 'none';
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.className = 'media-iframe';
        iframe.allow = 'autoplay';
        iframe.loading = 'lazy';
        container.insertBefore(iframe, container.querySelector('.media-open-link'));
    };

    function escapeAttr(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function closeModal() {
        cardModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Stop all playing media — iframes, audio, video
        const iframes = modalMedia.querySelectorAll('iframe');
        iframes.forEach(iframe => { iframe.src = iframe.src; }); // Reload to stop playback
        const audio = modalMedia.querySelector('audio');
        const video = modalMedia.querySelector('video');
        if (audio) audio.pause();
        if (video) video.pause();

        // Resume background music when modal closes
        const bgMusic = document.getElementById('bgMusic');
        const enterScreen = document.getElementById('enterScreen');
        // Check if the user has already passed the enter screen
        if (bgMusic && enterScreen && enterScreen.classList.contains('hidden-overlay')) {
            // A gentle delay makes the transition feel smoother
            setTimeout(() => {
                bgMusic.play().catch(err => console.log("Audio resume failed:", err));
            }, 300);
        }
    }

    modalClose.addEventListener('click', closeModal);
    cardModal.addEventListener('click', (e) => {
        if (e.target === cardModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ==========================================
    // Floating Hearts Background
    // ==========================================
    function createFloatingHearts() {
        const hearts = ['❤️', '💕', '💖', '💗', '💓', '💝', '🩷', '♥️'];
        const container = heartsBg;

        for (let i = 0; i < 20; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart-float';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.setProperty('--size', `${Math.random() * 20 + 12}px`);
            heart.style.setProperty('--opacity', `${Math.random() * 0.12 + 0.05}`);
            heart.style.setProperty('--duration', `${Math.random() * 10 + 8}s`);
            heart.style.setProperty('--delay', `${Math.random() * 10}s`);
            heart.style.setProperty('--left', `${Math.random() * 100}%`);
            container.appendChild(heart);
        }
    }

    // ==========================================
    // Modal Mini Hearts
    // ==========================================
    function spawnModalHearts() {
        const container = cardModal.querySelector('.modal-hearts');
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('span');
            heart.textContent = '❤️';
            heart.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 14 + 8}px;
                opacity: ${Math.random() * 0.3 + 0.1};
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: floatUp ${Math.random() * 5 + 3}s linear infinite;
                animation-delay: ${Math.random() * 3}s;
            `;
            container.appendChild(heart);
        }
    }

    // ==========================================
    // Confetti Effect
    // ==========================================
    function initConfetti() {
        const ctx = confettiCanvas.getContext('2d');
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#e91e63', '#ffd700', '#ff6f00', '#f48fb1', '#9c27b0', '#ff1744', '#ff9100'];

        function createParticle() {
            return {
                x: Math.random() * confettiCanvas.width,
                y: -10,
                size: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 2 + 1,
                speedX: Math.random() * 2 - 1,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 5 - 2.5,
                opacity: 1
            };
        }

        let confettiActive = false;
        let animFrame;

        function animateConfetti() {
            if (!confettiActive) return;
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

            // Add new particles
            if (Math.random() < 0.3) {
                particles.push(createParticle());
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.003;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();

                if (p.y > confettiCanvas.height || p.opacity <= 0) {
                    particles.splice(i, 1);
                }
            }

            animFrame = requestAnimationFrame(animateConfetti);
        }

        // Trigger confetti on birthday
        function checkConfetti() {
            const now = new Date();
            const midnight = getBirthdayMidnight();
            const end = getBirthdayEnd();

            if (now >= midnight && now < end && !confettiActive) {
                confettiActive = true;
                animateConfetti();
                // Stop after 30 seconds
                setTimeout(() => {
                    confettiActive = false;
                    cancelAnimationFrame(animFrame);
                    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                }, 30000);
            }
        }

        checkConfetti();

        window.addEventListener('resize', () => {
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;
        });
    }

    // ==========================================
    // Admin Access (Triple-click footer)
    // ==========================================
    let clickCount = 0;
    let clickTimer = null;

    const adminTrigger = $('#adminTrigger');
    if (adminTrigger) {
        adminTrigger.addEventListener('click', () => {
            clickCount++;
            if (clickTimer) clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 600);

            if (clickCount >= 3) {
                clickCount = 0;
                window.location.href = 'admin.html';
            }
        });
    }

    // Also allow keyboard shortcut: Ctrl+Shift+A
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            window.location.href = 'admin.html';
        }
    });

    // ==========================================
    // Scroll Hint Auto-hide
    // ==========================================
    if (scrollHint) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollHint.style.opacity = '0';
                scrollHint.style.pointerEvents = 'none';
            }
        }, { passive: true });
    }

    // ==========================================
    // Initialize
    // ==========================================
    function init() {
    // ==========================================
    // Background Music & Enter Screen
    // ==========================================
    

    bgMusic.volume = 0.05; // Set volume to 20%

    enterBtn.addEventListener('click', () => {
        // 1. Play the music
        bgMusic.play().catch(err => console.log("Audio play failed:", err));
        
        // 2. Hide the enter screen gracefully
        enterScreen.classList.add('hidden-overlay');
        
        // Optional: Trigger your confetti right when they enter!
        initConfetti();
    });
        // Apply config
        birthdayTitle.textContent = config.title;
        birthdayName.textContent = `${config.name} ❤️`;
        footerName.textContent = config.name;
        document.title = `Happy Birthday ${config.name} ❤️`;

        // Create floating hearts
        createFloatingHearts();

        // Render cards
        renderCards();

        // Start timers
        updateTimers();
        setInterval(() => {
            updateTimers();
            // Re-render cards every minute to check for unlocks
            renderCards();
        }, 1000);

        // Init confetti
        initConfetti();
    }

    async function setupApp() {
        await loadConfig();
        // Run when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    setupApp();

})();
