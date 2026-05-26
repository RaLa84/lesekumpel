/* ============================================================
   Lesekumpel v2 — Tafel-Modus (digitale Klassentafeln)
   Auto-generiert aus demo-texte/doenerella-im-weltall-11ym.html
   Quelle aktualisieren + scripts/migrate-tafel-to-v2.py erneut laufen lassen.
   ============================================================ */

// === TAFEL-ANSICHT v2: 2-Spalten-Layout mit Sticky-Bild ===
// Aktivierungs-Schichten (alle setzen body.view-tafel):
//   1. URL-Parameter ?view=tafel / ?view=desktop
//   2. matchMedia für sehr breite + touch Viewports (Auto-Erkennung)
//   3. Toggle-Button in der Toolbar

const TAFEL_MQ = window.matchMedia('(min-width: 2200px), (min-width: 1600px) and (pointer: coarse) and (hover: none)');

function readUrlView() { return new URLSearchParams(location.search).get('view'); }

function syncTafelClassFromContext() {
    const urlView = readUrlView();
    if (urlView === 'desktop') {
        document.body.classList.remove('view-tafel');
        document.body.classList.add('view-desktop');
        return;
    }
    if (urlView === 'tafel') {
        document.body.classList.remove('view-desktop');
        document.body.classList.add('view-tafel');
        return;
    }
    document.body.classList.remove('view-desktop');
    document.body.classList.toggle('view-tafel', TAFEL_MQ.matches);
}

function applyTafelLayout() {
    if (document.body.classList.contains('view-tafel')) {
        enterTafelLayout();
        // Defensive: in mehreren Ticks erneut Page zeigen falls Race mit asynchronem renderText
        setTimeout(() => document.querySelector('.tafel-section') && showSection(tafelCurrentIdx), 200);
        setTimeout(() => document.querySelector('.tafel-section') && showSection(tafelCurrentIdx), 700);
    } else {
        exitTafelLayout();
    }
}

let tafelObserver = null;
let tafelMutationObserver = null;
let tafelRebuildObserver = null;
let tafelRebuildLock = false;
let tafelCurrentIdx = 0;
let tafelPrevIdx = -1;

function enterTafelLayout() {
    const mainCard = document.querySelector('.story-wrap');
    if (!mainCard) return;

    // 1. Stage-Container anlegen, falls noch nicht da (kein Hero — Pagination beginnt direkt mit Szene 1)
    let stage = document.querySelector('.tafel-image-stage');
    if (!stage) {
        stage = document.createElement('div');
        stage.className = 'tafel-image-stage';
        // Stage-Aspect-Ratio aus Hero-Bild ableiten (gleiches Format wie Story-Bilder)
        const heroBg = document.querySelector('.story-hero .story-hero-img');
        if (heroBg) {
            const probe = new Image();
            probe.onload = () => {
                if (probe.naturalWidth && probe.naturalHeight) {
                    stage.style.aspectRatio = `${probe.naturalWidth} / ${probe.naturalHeight}`;
                }
            };
            probe.src = heroBg.src;
        }
        mainCard.prepend(stage);
    }

    // 2. Story-Wrapper anlegen und alle Story-Elemente hineinverschieben.
    //    Sonst stretcht Grid jedes einzelne Element auf die Höhe der Bild-Spalte.
    let storyCol = mainCard.querySelector('.tafel-story-col');
    if (!storyCol) {
        storyCol = document.createElement('div');
        storyCol.className = 'tafel-story-col';
        // Marker, um beim Exit die Elemente an Original-Stelle zurückzulegen
        const anchor = document.querySelector('.author-line');
        if (anchor) {
            const placeholder = document.createComment('tafel-story-col-anchor');
            anchor.insertAdjacentElement('beforebegin', storyCol);
            storyCol.parentNode.insertBefore(placeholder, storyCol);
            storyCol._tafelPlaceholder = placeholder;
        } else {
            mainCard.prepend(storyCol);
        }
        // Alle Story-relevanten Elemente verschieben
        const moveSelectors = ['.author-line', '.neurotype-hint', '#story-text', '#chunk-view'];
        moveSelectors.forEach(sel => {
            const el = mainCard.querySelector(sel);
            if (el) storyCol.appendChild(el);
        });
    }

    // 3. Titel umpflanzen (idempotent) — in den Story-Wrapper, ganz oben
    if (!document.querySelector('.tafel-title')) {
        const heroTitle = document.querySelector('.story-hero-text h1');
        if (heroTitle) {
            const title = document.createElement('h1');
            title.className = 'tafel-title';
            title.textContent = heroTitle.textContent;
            storyCol.prepend(title);
        }
    }

    // 4. Häppchen- und Fahrplan-Modus deaktivieren (passen nicht zu Tafel-Pagination)
    if (document.body.classList.contains('haeppchen-active') && typeof toggleViewMode === 'function') {
        toggleViewMode();
    }
    if (document.body.classList.contains('fahrplan-active') && typeof toggleFahrplan === 'function') {
        toggleFahrplan();
    }

    // 5. Story-Text in Sektionen (1 pro Bild-Szene) für Direkt-Pagination
    paginateStoryByScenes();

    // 6. Seiten-Indikator vor den Sektionen einfügen
    setupPageIndicator();

    // 7. Cover-Overlay (Titel + Autor auf Bild 1) anlegen
    setupTafelCoverOverlay();

    // 8. Erste Sektion aktivieren (zeigt direkt Szene 1)
    tafelCurrentIdx = 0;
    showSection(0);

    // 8. Spiele-Trigger anlegen + Activity-Hub als Floating Panel (collapsed)
    setupTafelGamesTrigger();

    // 9. Pagination-Pfeile (Vor/Zurück) anlegen
    setupTafelNav();

    // 10. Re-Pagination wenn renderText() das #story-text neu rendert
    //     (z.B. bei Silben-Toggle, Emoji-Toggle, Sprache wechseln)
    setupTafelRebuildWatcher();

    // 4. Inline-Bilder einsammeln & in Stage poolen (idempotent)
    populateStageFromInlineImages(stage);

    // 5. MutationObserver: renderText() läuft asynchron — sobald <p> und <img>
    //    in #story-text auftauchen, müssen wir paginieren + Bilder pollen + aktuelle Seite zeigen.
    const textView = document.getElementById('story-text');
    const expectedScenes = (window.imagePositions || []).length;
    if (textView) {
        if (tafelMutationObserver) tafelMutationObserver.disconnect();
        tafelMutationObserver = new MutationObserver(() => {
            const updatedStage = document.querySelector('.tafel-image-stage');
            if (!updatedStage) return;
            populateStageFromInlineImages(updatedStage);
            // Sektionen erstellen sobald <p> da sind
            if (!document.querySelector('.tafel-section')) {
                paginateStoryByScenes();
                if (document.querySelector('.tafel-section')) {
                    setupPageIndicator();
                }
            }
            // Nach jedem Tick: aktuelle Seite zeigen — im nächsten Frame, damit
            // alle DOM-Mutationen verarbeitet sind, bevor is-active gesetzt wird.
            requestAnimationFrame(() => showSection(tafelCurrentIdx));
            const haveImgs = updatedStage.querySelectorAll('.tafel-stage-img').length;
            const haveSecs = document.querySelectorAll('.tafel-section').length;
            if (haveImgs >= expectedScenes && haveSecs > 0) {
                tafelMutationObserver.disconnect();
                tafelMutationObserver = null;
            }
        });
        tafelMutationObserver.observe(textView, { childList: true, subtree: true });
    }
}

function populateStageFromInlineImages(stage) {
    const existingScenes = new Set(
        Array.from(stage.querySelectorAll('.tafel-stage-img')).map(i => i.dataset.scene)
    );
    const inlineImgs = document.querySelectorAll('#story-text img, .tafel-image-pool img');
    inlineImgs.forEach(src => {
        const m = src.src.match(/-(\d+)\.png(?:\?.*)?$/);
        if (!m) return;
        const scene = m[1];
        if (existingScenes.has(scene)) return;
        const stageImg = document.createElement('img');
        stageImg.className = 'tafel-stage-img';
        stageImg.dataset.scene = scene;
        stageImg.src = src.src;
        stageImg.alt = src.alt || '';
        stage.appendChild(stageImg);
        existingScenes.add(scene);
    });
}

function exitTafelLayout() {
    if (tafelObserver) { tafelObserver.disconnect(); tafelObserver = null; }
    if (tafelMutationObserver) { tafelMutationObserver.disconnect(); tafelMutationObserver = null; }
    if (tafelRebuildObserver) { tafelRebuildObserver.disconnect(); tafelRebuildObserver = null; }
    document.body.classList.remove('view-tafel-cover');
    document.querySelector('.tafel-image-stage')?.remove();
    document.querySelector('.tafel-title')?.remove();
    document.querySelector('.tafel-games-trigger')?.remove();
    document.querySelector('.tafel-nav')?.remove();
    document.querySelector('.tafel-page-indicator')?.remove();
    document.querySelector('.tafel-confetti')?.remove();
    tafelPrevIdx = -1;
    const sc = document.querySelector('.tafel-story-col');
    if (sc) delete sc.dataset.coverActive;
    // Activity-Hub aus Floating-Modus befreien
    document.querySelector('.activity-hub')?.classList.remove('tafel-collapsed');
    // Quiz-Pagination-Reste entfernen
    document.querySelector('.tafel-quiz-nav')?.remove();
    document.querySelector('.tafel-hub-close')?.remove();
    document.querySelectorAll('.quiz-question.is-tafel-current').forEach(q => q.classList.remove('is-tafel-current'));
    // Sektionen auflösen: <p>s zurück direkt unter #story-text (entfernt auch is-current)
    depaginateStory();
    tafelCurrentIdx = 0;
    // Story-Wrapper auflösen: Kinder zurück an die Original-Stelle hängen
    const storyCol = document.querySelector('.tafel-story-col');
    if (storyCol) {
        const placeholder = storyCol._tafelPlaceholder;
        const target = placeholder?.parentNode;
        while (storyCol.firstChild) {
            if (target && placeholder) target.insertBefore(storyCol.firstChild, placeholder);
            else storyCol.parentNode.insertBefore(storyCol.firstChild, storyCol);
        }
        placeholder?.remove();
        storyCol.remove();
    }
}

// === Pagination (Powerpoint-Style): 1 Cover-Slide + N Slides je 1 Absatz ===
function paginateStoryByScenes() {
    const view = document.getElementById('story-text');
    if (!view || view.querySelector('.tafel-section')) return;
    const paragraphs = Array.from(view.querySelectorAll(':scope > p'));
    const positions = (window.imagePositions || []).slice().sort((a, b) => a.paragraphIndex - b.paragraphIndex);
    if (!paragraphs.length) return;

    // Erste Slide: Cover (kein Text, nur Bild + Titel/Autor-Overlay)
    const coverScene = positions[0]?.scene || 1;
    const cover = document.createElement('section');
    cover.className = 'tafel-section is-cover-slide';
    cover.dataset.scene = String(coverScene);
    cover.dataset.cover = 'true';
    view.appendChild(cover);

    // Bild-Mapping: welcher Absatz gehört zu welcher Szene?
    // Wenn imagePositions early-dense (Pipeline-Daten zu früh gehäuft):
    // verteile Bilder gleichmäßig über die Absätze.
    const maxPosIdx = positions[positions.length - 1]?.paragraphIndex || 0;
    const earlyDense = positions.length > 0 && maxPosIdx < paragraphs.length * 0.6;

    function sceneForParagraph(pIdx) {
        if (!positions.length) return 1;
        if (earlyDense) {
            // gleichmäßig: pIdx auf positions.length-Bereiche mappen
            const bucket = Math.floor((pIdx * positions.length) / paragraphs.length);
            return positions[Math.min(bucket, positions.length - 1)].scene;
        }
        // Pipeline-Daten: letzte position mit paragraphIndex <= pIdx+1
        let best = positions[0].scene;
        for (const pos of positions) {
            if (pos.paragraphIndex <= pIdx + 1) best = pos.scene;
            else break;
        }
        return best;
    }

    // Pro Absatz eine Slide
    paragraphs.forEach((p, i) => {
        const section = document.createElement('section');
        section.className = 'tafel-section';
        section.dataset.scene = String(sceneForParagraph(i));
        section.appendChild(p);
        view.appendChild(section);
    });
}

// Permanenter MutationObserver: wenn renderText() #story-text neu rendert
// (Silben-Toggle, Emoji, Sprache), Sektionen sind weg → neu paginieren + aktuelle Page zeigen
function setupTafelRebuildWatcher() {
    if (tafelRebuildObserver) return;
    const view = document.getElementById('story-text');
    if (!view) return;
    tafelRebuildObserver = new MutationObserver(() => {
        if (tafelRebuildLock) return;
        if (!document.body.classList.contains('view-tafel')) return;
        // Wenn keine .tafel-section mehr im View aber <p>s da sind → re-paginieren
        if (!view.querySelector('.tafel-section') && view.querySelector('p')) {
            tafelRebuildLock = true;
            paginateStoryByScenes();
            if (document.querySelector('.tafel-section')) {
                showSection(tafelCurrentIdx);
            }
            // Lock kurz halten, damit die DOM-Mutationen aus paginate nicht den Observer triggern
            setTimeout(() => { tafelRebuildLock = false; }, 50);
        }
    });
    tafelRebuildObserver.observe(view, { childList: true });
}

function depaginateStory() {
    const view = document.getElementById('story-text');
    if (!view) return;
    view.querySelectorAll('.tafel-section').forEach(section => {
        while (section.firstChild) view.insertBefore(section.firstChild, section);
        section.remove();
    });
}

// === Direkt-Pagination: showSection wechselt sichtbare Sektion + Bild ===
function getTafelSections() {
    return Array.from(document.querySelectorAll('.tafel-section'));
}

function showSection(idx) {
    const sections = getTafelSections();
    if (!sections.length) return;
    idx = Math.max(0, Math.min(sections.length - 1, idx));
    tafelCurrentIdx = idx;
    sections.forEach((s, i) => s.classList.toggle('is-current', i === idx));
    const currentSec = sections[idx];
    // Bild zur Sektion aktivieren
    const targetScene = Number(currentSec.dataset.scene);
    document.querySelectorAll('.tafel-stage-img').forEach(img => {
        img.classList.toggle('is-active', Number(img.dataset.scene) === targetScene);
    });
    // Cover-Overlay + Bild-Blur nur auf Cover-Slide; End-Overlay auf letzter Slide
    const stage = document.querySelector('.tafel-image-stage');
    const overlay = document.querySelector('.tafel-cover-overlay');
    const endOverlay = document.querySelector('.tafel-end-overlay');
    const isCover = currentSec.dataset.cover === 'true';
    const isLast = idx === sections.length - 1;
    if (stage) stage.classList.toggle('is-cover-page', isCover);
    if (overlay) overlay.classList.toggle('is-active', isCover);
    if (endOverlay) endOverlay.classList.toggle('is-active', isLast && !isCover);
    // Body-Klasse für Cover-Modus: Layout auf 1-Spalte (Bild zentriert) statt 2-Spalten
    document.body.classList.toggle('view-tafel-cover', isCover);
    // Konfetti nur wenn wir frisch zur letzten Slide kommen (nicht bei Re-Render)
    if (isLast && !isCover && tafelPrevIdx !== idx) spawnTafelConfetti();
    tafelPrevIdx = idx;
    updatePageIndicator();
    updateTafelNavState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function spawnTafelConfetti() {
    // Vorherigen Confetti-Layer entfernen falls noch da
    document.querySelector('.tafel-confetti')?.remove();
    const container = document.createElement('div');
    container.className = 'tafel-confetti';
    document.body.appendChild(container);
    const colors = ['#D67171', '#FFD54F', '#2a9d8f', '#7209b7', '#00509d', '#FF6B9D', '#5aab5a'];
    const pieces = 80;
    for (let i = 0; i < pieces; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = (Math.random() * 100) + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 0.7) + 's';
        piece.style.animationDuration = (2.2 + Math.random() * 2.2) + 's';
        piece.style.width = (8 + Math.random() * 10) + 'px';
        piece.style.height = piece.style.width;
        // Manche als Kreis statt Quadrat
        if (Math.random() < 0.3) piece.style.borderRadius = '50%';
        container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 5500);
}

function setupTafelCoverOverlay() {
    const stage = document.querySelector('.tafel-image-stage');
    if (!stage) return;
    // Cover-Overlay
    if (!stage.querySelector('.tafel-cover-overlay')) {
        const heroTitle = document.querySelector('.story-hero-text h1');
        const author = document.querySelector('.author-line');
        const titleText = heroTitle ? heroTitle.textContent.trim() : '';
        const authorAvatarSrc = author?.querySelector('.author-line-avatar, .author-avatar')?.src || '';
        const authorCreditText = (author?.querySelector('.author-line-name, .author-credit')?.textContent.trim() ? 'geschrieben von ' + author.querySelector('.author-line-name, .author-credit').textContent.trim() : '') || '';
        const overlay = document.createElement('div');
        overlay.className = 'tafel-cover-overlay';
        overlay.innerHTML = `
            <h2 class="cover-title"></h2>
            <div class="cover-author">
                ${authorAvatarSrc ? '<img alt="">' : ''}
                <span></span>
            </div>
        `;
        overlay.querySelector('.cover-title').textContent = titleText;
        if (authorAvatarSrc) overlay.querySelector('img').src = authorAvatarSrc;
        overlay.querySelector('.cover-author span').textContent = authorCreditText;
        stage.appendChild(overlay);
    }
    // End-Overlay (nur auf letzter Sektion sichtbar)
    if (!stage.querySelector('.tafel-end-overlay')) {
        const end = document.createElement('div');
        end.className = 'tafel-end-overlay';
        end.innerHTML = '<span class="end-badge">✨ Ende ✨</span>';
        stage.appendChild(end);
    }
}

function setupPageIndicator() {
    const storyCol = document.querySelector('.tafel-story-col');
    if (!storyCol || storyCol.querySelector('.tafel-page-indicator')) return;
    const indicator = document.createElement('div');
    indicator.className = 'tafel-page-indicator';
    const view = document.getElementById('story-text');
    if (view) view.insertAdjacentElement('beforebegin', indicator);
}

function updatePageIndicator() {
    const indicator = document.querySelector('.tafel-page-indicator');
    if (!indicator) return;
    const sections = getTafelSections();
    const current = sections[tafelCurrentIdx];
    if (!current || current.dataset.cover === 'true') {
        indicator.textContent = '';
        indicator.style.visibility = 'hidden';
        return;
    }
    indicator.style.visibility = '';
    // Story-Slides = alle Sektionen außer Cover
    const storySlides = sections.filter(s => s.dataset.cover !== 'true');
    const storyIdx = storySlides.indexOf(current) + 1;
    indicator.textContent = `Abschnitt ${storyIdx} von ${storySlides.length}`;
}

// Pagination-Pfeile (Vor/Zurück) — wechseln direkt die Sektion
function setupTafelNav() {
    if (document.querySelector('.tafel-nav')) return;
    const nav = document.createElement('div');
    nav.className = 'tafel-nav';
    nav.innerHTML = `
        <button type="button" class="tafel-nav-prev" aria-label="Vorherige Seite" onclick="goToAdjacentPage(-1)">←</button>
        <button type="button" class="tafel-nav-next" aria-label="Nächste Seite" onclick="goToAdjacentPage(1)">→</button>
    `;
    document.body.appendChild(nav);
    updateTafelNavState();
}

function goToAdjacentPage(delta) {
    showSection(tafelCurrentIdx + delta);
}

function updateTafelNavState() {
    const sections = getTafelSections();
    const prevBtn = document.querySelector('.tafel-nav-prev');
    const nextBtn = document.querySelector('.tafel-nav-next');
    if (!sections.length || !prevBtn || !nextBtn) return;
    prevBtn.disabled = tafelCurrentIdx <= 0;
    nextBtn.disabled = tafelCurrentIdx >= sections.length - 1;
}

// === Spiele-Bubble links unten ===
function setupTafelGamesTrigger() {
    const hub = document.querySelector('.activity-hub');
    if (hub) hub.classList.add('tafel-collapsed');
    // Quiz für Tafel umbauen: Antworten in Wrapper, Pagination-Nav, erste Frage aktiv
    setupTafelQuiz();
    if (document.querySelector('.tafel-games-trigger')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tafel-games-trigger';
    btn.setAttribute('aria-label', 'Spiele öffnen');
    btn.innerHTML = '<span class="games-icon">🎮</span> Spiele';
    btn.onclick = toggleTafelGames;
    document.body.appendChild(btn);
}

let tafelQuizIdx = 0;

function setupTafelQuiz() {
    const questions = document.querySelectorAll('#panel-quiz .quiz-question');
    if (!questions.length) return;

    // Antworten in einen Wrapper für horizontales Flex-Layout packen (idempotent)
    questions.forEach(q => {
        if (q.querySelector('.quiz-options-wrap')) return;
        const opts = q.querySelectorAll('.quiz-option');
        if (!opts.length) return;
        const wrap = document.createElement('div');
        wrap.className = 'quiz-options-wrap';
        opts[0].parentNode.insertBefore(wrap, opts[0]);
        opts.forEach(o => wrap.appendChild(o));
    });

    // Erste Frage aktiv
    tafelQuizIdx = 0;
    questions.forEach((q, i) => q.classList.toggle('is-tafel-current', i === 0));

    // Nav-Leiste (Pfeile + Indikator) ans Ende vom Quiz-Wrapper hängen
    const wrapper = document.getElementById('quiz-wrapper');
    if (wrapper && !wrapper.querySelector('.tafel-quiz-nav')) {
        const nav = document.createElement('div');
        nav.className = 'tafel-quiz-nav';
        nav.innerHTML = `
            <button type="button" class="tafel-quiz-prev" aria-label="Vorherige Frage" onclick="tafelQuizGoTo(tafelQuizIdx - 1)">←</button>
            <span class="tafel-quiz-indicator">Frage 1 von ${questions.length}</span>
            <button type="button" class="tafel-quiz-next" aria-label="Nächste Frage" onclick="tafelQuizGoTo(tafelQuizIdx + 1)">→</button>
        `;
        wrapper.appendChild(nav);
        updateTafelQuizNav();
    }
}

function tafelQuizGoTo(i) {
    const questions = document.querySelectorAll('#panel-quiz .quiz-question');
    if (!questions.length) return;
    tafelQuizIdx = Math.max(0, Math.min(questions.length - 1, i));
    questions.forEach((q, j) => q.classList.toggle('is-tafel-current', j === tafelQuizIdx));
    updateTafelQuizNav();
}

function updateTafelQuizNav() {
    const questions = document.querySelectorAll('#panel-quiz .quiz-question');
    const ind = document.querySelector('.tafel-quiz-indicator');
    const prev = document.querySelector('.tafel-quiz-prev');
    const next = document.querySelector('.tafel-quiz-next');
    if (!questions.length || !ind) return;
    ind.textContent = `Frage ${tafelQuizIdx + 1} von ${questions.length}`;
    if (prev) prev.disabled = tafelQuizIdx <= 0;
    if (next) next.disabled = tafelQuizIdx >= questions.length - 1;
}

function toggleTafelGames() {
    const hub = document.querySelector('.activity-hub');
    if (!hub) return;
    const opening = hub.classList.contains('tafel-collapsed');
    hub.classList.toggle('tafel-collapsed');
    if (opening) {
        // renderQuiz läuft erst auf window.onload — Quiz beim ersten Öffnen ggf. neu setup
        setupTafelQuiz();
        // X-Schließen-Button (idempotent)
        if (!hub.querySelector('.tafel-hub-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'tafel-hub-close';
            closeBtn.setAttribute('aria-label', 'Spiele schließen');
            closeBtn.textContent = '×';
            closeBtn.onclick = toggleTafelGames;
            hub.appendChild(closeBtn);
        }
    }
}

function refreshTafelObserver() {
    const stage = document.querySelector('.tafel-image-stage');
    if (stage) setupTafelObserver(stage);
}

function setupTafelObserver(stage) {
    if (tafelObserver) { tafelObserver.disconnect(); tafelObserver = null; }
    const paragraphs = Array.from(document.querySelectorAll('#story-text p'));
    const stageImgs = Array.from(stage.querySelectorAll('.tafel-stage-img'));
    const positions = (window.imagePositions || []).slice().sort((a, b) => a.paragraphIndex - b.paragraphIndex);
    if (!paragraphs.length || !stageImgs.length) return;

    function activateScene(scene) {
        stageImgs.forEach(img => {
            img.classList.toggle('is-active', Number(img.dataset.scene) === scene);
        });
    }

    function sceneForParagraph(pIdx) {
        let bestScene = 0; // Hero
        for (const pos of positions) {
            // paragraphIndex ist 1-basiert in den Daten; pIdx ist 0-basierter Array-Index
            if (pos.paragraphIndex <= pIdx + 1) bestScene = pos.scene;
            else break;
        }
        return bestScene;
    }

    tafelObserver = new IntersectionObserver((entries) => {
        const inFocus = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!inFocus) return;
        const idx = paragraphs.indexOf(inFocus.target);
        if (idx < 0) return;
        activateScene(sceneForParagraph(idx));
    }, { threshold: [0.3, 0.6, 0.9], rootMargin: '-20% 0% -40% 0%' });

    paragraphs.forEach(p => tafelObserver.observe(p));
}

// === Initialisierung ===
syncTafelClassFromContext();
TAFEL_MQ.addEventListener('change', () => {
    syncTafelClassFromContext();
    applyTafelLayout();
});

// Layout erst aufbauen, nachdem das bestehende Story-Script die Bilder platziert hat
function initTafelOnce() { setTimeout(applyTafelLayout, 80); }
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTafelOnce);
} else {
    initTafelOnce();
}
