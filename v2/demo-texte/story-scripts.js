/* ============================================================
   Lesekumpel v2 — Story-Scripts (Lese-Seiten, volle Feature-Parität)

   Erwartet folgende Globals, die pro Story inline injiziert werden
   (n8n-Platzhalter in Klammern):
     rawStory             ({{RAW_STORY_TEXT}})    — Text mit "-" Silbentrennern
     emojiStory           ({{EMOJI_STORY_TEXT}})  — Emoji-Variante
     rawSummary           ({{RAW_SUMMARY_TEXT}})  — einfache Zusammenfassung
     emojiSummary         ({{EMOJI_SUMMARY_TEXT}})
     quizData             ({{QUIZ_DATA_JSON}})    — [{q, a:[], correct}]
     rawDictionaryEntry   ({{DICTIONARY_JSON}})   — [{wort, silben, bedeutung}]
     weitererzaehlenData  ({{WEITERERZAEHLEN_JSON}})
     schatzsucheData      ({{SCHATZSUCHE_JSON}})

   Fehlt ein Global, wird das zugehörige Feature still ausgeblendet.
   ============================================================ */

/* ---------- Navbar (Duplikat aus scripts.js — Story-Seiten laden
   nur diese eine Datei) ---------- */
function toggleMenu() {
  const m = document.getElementById('mobile-menu');
  const b = document.querySelector('.burger');
  if (!m || !b) return;
  m.classList.toggle('open');
  b.setAttribute('aria-expanded', m.classList.contains('open') ? 'true' : 'false');
}

function comingSoon(ev) {
  if (ev) ev.preventDefault();
  alert('Diese Funktion kommt bald — komm später wieder vorbei. 🚀');
}

/* ---------- Daten-Zugriff mit Guards ---------- */
function g(name, fallback) {
  try {
    const v = window[name];
    return (typeof v === 'undefined' || v === null) ? fallback : v;
  } catch (e) { return fallback; }
}

const LK = {
  story: '',
  emojiStory: '',
  summary: '',
  emojiSummary: '',
  quiz: [],
  dictRaw: [],
  weiter: null,
  schatz: null,
  dictionary: {},
};

/* ---------- Neurotyp ---------- */
let ntClass = 'nt-standard';
let isAutismus = false, isLRS = false, isADHS = false;

/* ---------- Lese-State ---------- */
let state = {
  syllables: false,
  emojis: false,
  summary: false,
  wordReader: false,
  chunkIndex: 0,
  chunks: [],
  chunkImages: [],
  chunkHeadings: [],
};
let inlineImages = [];
let schatzState = { active: false, found: [] };

/* ============================================================
   Text-Rendering
   ============================================================ */

function renderText() {
  const view = document.getElementById('full-text-view');
  if (!view) return;

  const activeStory = state.emojis && LK.emojiStory ? LK.emojiStory : LK.story;
  const activeSummary = state.emojis && LK.emojiSummary ? LK.emojiSummary : LK.summary;
  const raw = state.summary && activeSummary ? activeSummary : activeStory;

  // In Sektionen aufteilen (Leerzeilen), Überschriften (**…**) erkennen
  const sections = raw.split(/\n\n+/);
  const allGroups = [];
  sections.forEach(section => {
    const lines = section.split(/\n/);
    let heading = null;
    const bodyLines = [];
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (i === 0 && /^\*\*.*\*\*$/.test(trimmed)) {
        heading = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
      } else if (trimmed) {
        bodyLines.push(trimmed);
      }
    });
    const body = bodyLines.join(' ');
    let sentences = body.match(/[^.!?]*[.!?]+["“”„]?(?:\s*,\s*[^.!?]*[.!?]+["“”„]?)*(?:\s+|$)/g);
    if (!sentences && body.trim()) sentences = [body];
    if (!sentences) sentences = [];

    let isFirstGroup = true;
    let tempGroup = '', sentCount = 0;
    sentences.forEach((sent, index) => {
      tempGroup += sent; sentCount++;
      if (sentCount >= 2 || index === sentences.length - 1) {
        allGroups.push({ heading: isFirstGroup ? heading : null, text: tempGroup.trim() });
        isFirstGroup = false;
        tempGroup = ''; sentCount = 0;
      }
    });
    if (sentences.length === 0 && heading) {
      allGroups.push({ heading: heading, text: '' });
    }
  });
  if (allGroups.length === 0) allGroups.push({ heading: null, text: raw });

  // Inline-Bilder gleichmäßig verteilen
  const imgPositions = {};
  if (inlineImages.length > 0 && !state.summary) {
    if (document.body.classList.contains('haeppchen-active')) {
      const interval = Math.max(1, Math.floor(allGroups.length / inlineImages.length));
      inlineImages.forEach((url, i) => {
        let pos = interval * i;
        if (pos >= allGroups.length) pos = allGroups.length - 1;
        imgPositions[pos] = url;
      });
    } else {
      const interval = Math.max(1, Math.floor(allGroups.length / (inlineImages.length + 1)));
      inlineImages.forEach((url, i) => {
        let pos = interval * (i + 1);
        if (pos >= allGroups.length) pos = allGroups.length - 1;
        imgPositions[pos] = url;
      });
    }
  }

  const html = allGroups.map((group, i) => {
    const imgTag = imgPositions[i] ? `<img src="${imgPositions[i]}" alt="Illustration" class="story-inline-img" onerror="this.style.display='none'">` : '';
    let headingHtml = '';
    if (group.heading) {
      const processedH = group.heading.split(/\s+/).map(w => processWord(w)).join(' ');
      headingHtml = `<h3 class="story-section-heading">${processedH}</h3>`;
    }
    let textHtml = '';
    if (group.text) {
      const processed = group.text.split(/\s+/).map(w => processWord(w)).join(' ');
      textHtml = `<p>${processed}</p>`;
    }
    return imgTag + headingHtml + textHtml;
  }).join('');
  view.innerHTML = html;

  if (document.body.classList.contains('fahrplan-active')) addParagraphNumbers();

  // Chunks für Häppchen-Modus
  state.chunks = allGroups.map(grp => grp.text ? grp.text.trim().split(/\s+/).map(w => processWord(w)).join(' ') : '');
  state.chunkHeadings = allGroups.map(grp => grp.heading ? grp.heading.split(/\s+/).map(w => processWord(w)).join(' ') : null);
  state.chunkImages = allGroups.map((_, i) => imgPositions[i] || null);
  updateChunkDisplay();
  updateButtons();
}

function processWord(raw) {
  let isBold = false;
  if (raw.includes('**')) { isBold = true; raw = raw.replace(/\*\*/g, ''); }
  else if (raw.includes('*')) { isBold = true; raw = raw.replace(/\*/g, ''); }
  const clean = raw.replace(/­/g, '').replace(/-/g, '').replace(/[.,!?:;„"“”()]/g, '');
  let display = raw.replace(/­/g, '').replace(/-/g, '');
  const cleanLower = clean.toLowerCase();
  const dictKey = Object.keys(LK.dictionary).find(k => k.toLowerCase() === cleanLower);
  if (state.syllables) {
    const parts = raw.replace(/­/g, '-').split('-');
    if (parts.length > 1) {
      display = parts.map((p, i) => `<span class="${i % 2 === 0 ? 'syl-a' : 'syl-b'}">${p}</span>`).join('');
    }
  }
  const style = isBold ? 'font-weight:bold;' : '';
  const defAttr = dictKey ? ` data-def="${LK.dictionary[dictKey].replace(/"/g, '&quot;')}"` : '';
  const defClass = dictKey ? ' word-has-definition' : '';
  return `<span class="word-interactive${defClass}" style="${style}"${defAttr} onclick="clickWord(this, '${clean.replace(/'/g, '')}')">${display}</span>`;
}

/* ============================================================
   Toolbar-Funktionen
   ============================================================ */

function updateButtons() {
  const set = (id, on) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', !!on);
  };
  set('btn-syllables', state.syllables);
  set('btn-emojis', state.emojis);
  set('btn-summary', state.summary);
}

function toggleSyllables() { state.syllables = !state.syllables; document.body.classList.toggle('syllables-on', state.syllables); renderText(); }
function toggleEmojis()    { state.emojis = !state.emojis; renderText(); }
function toggleSummaryMode() { state.summary = !state.summary; state.chunkIndex = 0; renderText(); }

function changeFontSize(d) {
  const s = parseFloat(window.getComputedStyle(document.body).fontSize);
  const n = Math.max(12, Math.min(40, s + d));
  document.body.style.fontSize = n + 'px';
}

function toggleDyslexia(btn) {
  document.body.classList.toggle('dyslexia');
  if (btn) btn.classList.toggle('active');
}

function toggleContrast(btn) {
  document.body.classList.toggle('high-contrast');
  if (btn) btn.classList.toggle('active');
}

/* ---------- Ansicht-Modi (exklusiv) ---------- */
function deactivateOtherAnsichtModes(except) {
  if (except !== 'linien' && document.body.classList.contains('leselinien-active')) toggleLeselinien();
  if (except !== 'fahrplan' && document.body.classList.contains('fahrplan-active')) toggleFahrplan();
  if (except !== 'haeppchen' && document.body.classList.contains('haeppchen-active')) toggleViewMode();
}

function toggleLeselinien() {
  const btn = document.getElementById('btn-leselinien');
  const willActivate = !document.body.classList.contains('leselinien-active');
  if (willActivate) deactivateOtherAnsichtModes('linien');
  const active = document.body.classList.toggle('leselinien-active');
  if (btn) btn.classList.toggle('active', active);
  if (active && !state.syllables) toggleSyllables();
  if (!active && state.syllables) toggleSyllables();
  try { localStorage.setItem('lesekumpel-leselinien-default', active ? 'true' : 'false'); } catch (e) {}
}

function toggleFahrplan() {
  const btn = document.getElementById('btn-fahrplan');
  const willActivate = !document.body.classList.contains('fahrplan-active');
  if (willActivate) deactivateOtherAnsichtModes('fahrplan');
  const active = document.body.classList.toggle('fahrplan-active');
  if (btn) btn.classList.toggle('active', active);
  if (active) addParagraphNumbers(); else removeParagraphNumbers();
  try { localStorage.setItem('lesekumpel-fahrplan-default', active ? 'true' : 'false'); } catch (e) {}
}

function addParagraphNumbers() {
  document.querySelectorAll('#full-text-view p').forEach((p, i) => {
    if (p.querySelector('.para-num')) return;
    const marker = document.createElement('span');
    marker.className = 'para-num';
    marker.textContent = (i + 1);
    p.prepend(marker);
  });
}
function removeParagraphNumbers() {
  document.querySelectorAll('.para-num').forEach(el => el.remove());
}

/* ---------- Häppchen-Modus ---------- */
function toggleViewMode() {
  const full = document.getElementById('full-text-view');
  const chunk = document.getElementById('chunk-view');
  const btn = document.getElementById('view-toggle-btn');
  if (!full || !chunk) return;
  if (full.classList.contains('hidden')) {
    full.classList.remove('hidden');
    chunk.classList.add('hidden');
    if (btn) btn.classList.remove('active');
    document.body.classList.remove('haeppchen-active');
    renderText();
    try { localStorage.setItem('lesekumpel-haeppchen-default', 'false'); } catch (e) {}
  } else {
    deactivateOtherAnsichtModes('haeppchen');
    full.classList.add('hidden');
    chunk.classList.remove('hidden');
    if (btn) btn.classList.add('active');
    document.body.classList.add('haeppchen-active');
    state.chunkIndex = 0;
    renderText();
    updateChunkDisplay();
    setupSwipeIfNeeded();
    const hint = document.getElementById('swipe-hint');
    if (hint) hint.style.display = 'block';
    try { localStorage.setItem('lesekumpel-haeppchen-default', 'true'); } catch (e) {}
  }
}

function updateChunkDisplay() {
  const display = document.getElementById('chunk-display');
  if (!display) return;
  if (state.chunkIndex >= state.chunks.length) state.chunkIndex = 0;
  let imgHtml = '';
  let imgUrl = null;
  if (state.chunkImages) {
    for (let j = state.chunkIndex; j >= 0; j--) {
      if (state.chunkImages[j]) { imgUrl = state.chunkImages[j]; break; }
    }
  }
  if (imgUrl) imgHtml = `<img src="${imgUrl}" alt="Illustration" class="story-inline-img" onerror="this.style.display='none'">`;
  let headingHtml = '';
  if (state.chunkHeadings && state.chunkHeadings[state.chunkIndex]) {
    headingHtml = `<div class="chunk-heading">${state.chunkHeadings[state.chunkIndex]}</div>`;
  }
  display.innerHTML = imgHtml + headingHtml + (state.chunks[state.chunkIndex] || '');
  const current = state.chunkIndex + 1, total = state.chunks.length;
  const ring = document.getElementById('chunk-progress');
  if (ring) {
    ring.innerText = current + '/' + total;
    ring.style.setProperty('--p', ((current / total) * 100) + '%');
  }
  const bar = document.getElementById('adhs-progress-fill');
  if (bar) bar.style.width = ((current / total) * 100) + '%';
}

function nextChunk() {
  if (state.chunkIndex < state.chunks.length - 1) {
    state.chunkIndex++;
    updateChunkDisplay();
    if (document.body.classList.contains('haeppchen-active')) {
      playTickSound();
      if (state.chunkIndex === state.chunks.length - 1) setTimeout(showConfetti, 500);
    }
  }
}
function prevChunk() {
  if (state.chunkIndex > 0) { state.chunkIndex--; updateChunkDisplay(); }
}

let swipeInitialized = false;
function setupSwipeIfNeeded() {
  if (swipeInitialized) return;
  swipeInitialized = true;
  const chunkEl = document.getElementById('chunk-display');
  if (!chunkEl) return;
  let startX = 0, startY = 0, dragging = false;
  chunkEl.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; dragging = true; }, { passive: true });
  chunkEl.addEventListener('touchend', function (e) {
    if (!dragging) return; dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? nextChunk() : prevChunk(); }
  }, { passive: true });
  chunkEl.addEventListener('mousedown', function (e) { startX = e.clientX; dragging = true; });
  chunkEl.addEventListener('mouseup', function (e) {
    if (!dragging) return; dragging = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50) { dx < 0 ? nextChunk() : prevChunk(); }
  });
}

/* ---------- TTS (ganze Geschichte mit Wort-Highlight) ---------- */
function toggleTTS() {
  const btn = document.getElementById('btn-tts');
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (btn) btn.classList.remove('active');
    clearHighlights();
    return;
  }
  const chunkView = document.getElementById('chunk-view');
  const container = (chunkView && !chunkView.classList.contains('hidden'))
    ? document.getElementById('chunk-display')
    : document.getElementById('full-text-view');
  if (!container) return;
  const spans = container.querySelectorAll('.word-interactive');
  let speechText = '';
  const wordMap = [];
  spans.forEach(span => {
    const word = span.innerText, start = speechText.length;
    speechText += word + ' ';
    wordMap.push({ start, end: speechText.length - 1, el: span });
  });
  if (!speechText.trim()) return;
  const u = new SpeechSynthesisUtterance(speechText);
  u.lang = 'de-DE';
  u.rate = 0.9;
  u.onboundary = function (event) {
    if (event.name === 'word') {
      const current = wordMap.find(w => event.charIndex >= w.start && event.charIndex < w.end);
      clearHighlights();
      if (current) current.el.classList.add('highlight-active');
    }
  };
  u.onend = function () { if (btn) btn.classList.remove('active'); clearHighlights(); };
  window.speechSynthesis.speak(u);
  if (btn) btn.classList.add('active');
}

function clearHighlights() {
  document.querySelectorAll('.highlight-active').forEach(el => el.classList.remove('highlight-active'));
}

/* ---------- Wörter hören + Wortschatz-Tooltip ---------- */
function toggleWordReader() {
  state.wordReader = !state.wordReader;
  const btn = document.getElementById('btn-word-reader');
  if (btn) btn.classList.toggle('active', state.wordReader);
}

function clickWord(el, word) {
  if (schatzState.active) { checkSchatzwort(el, word); return; }
  const def = el.getAttribute('data-def');
  if (def) { showVocabTooltip(el, def); return; }
  if (!state.wordReader) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(el.innerText);
  u.lang = 'de-DE';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function showVocabTooltip(el, definition) {
  document.querySelectorAll('.vocab-tooltip').forEach(t => t.remove());
  const tooltip = document.createElement('div');
  tooltip.className = 'vocab-tooltip';
  tooltip.innerHTML = '<strong>' + el.innerText + '</strong><br>' + definition;
  el.style.position = 'relative';
  el.appendChild(tooltip);
  setTimeout(() => { if (tooltip.parentNode) tooltip.remove(); }, 4000);
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!el.contains(e.target)) {
        if (tooltip.parentNode) tooltip.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 10);
}

/* ============================================================
   Activity-Hub: Quiz / Weiterdenken / Schatz / Wortschatz
   ============================================================ */

function renderQuiz() {
  const quizWrapper = document.getElementById('quiz-wrapper');
  const tab = document.querySelector('[data-tab="quiz"]');
  const panel = document.getElementById('panel-quiz');
  if (!quizWrapper) return;
  if (!LK.quiz || LK.quiz.length === 0) {
    if (tab) tab.style.display = 'none';
    if (panel) panel.style.display = 'none';
    return;
  }
  let qHTML = '';
  LK.quiz.forEach((item, i) => {
    qHTML += `<div class="quiz-question" data-correct="${item.correct}">
                <div class="q-text">${i + 1}. ${item.q}</div>
                <div class="quiz-options">`;
    item.a.forEach((ans, j) => {
      const isCorrect = (j === item.correct);
      qHTML += `<div class="quiz-option" onclick="checkQuizAnswer(this, ${isCorrect})"><span>${ans}</span></div>`;
    });
    qHTML += `</div><button type="button" class="quiz-reveal-btn" onclick="revealQuizAnswer(this)">💡 Auflösen</button></div>`;
  });
  quizWrapper.innerHTML = qHTML;
}

function checkQuizAnswer(element, isCorrect) {
  if (element.classList.contains('correct') || element.classList.contains('try-again')) return;
  if (isCorrect) { element.classList.add('correct'); element.innerHTML += ' 🌟'; }
  else { element.classList.add('try-again'); }
}

function revealQuizAnswer(btn) {
  const q = btn.closest('.quiz-question');
  if (!q) return;
  const correctIdx = parseInt(q.dataset.correct, 10);
  const options = q.querySelectorAll('.quiz-option');
  options.forEach((opt, j) => {
    if (j === correctIdx) {
      if (!opt.classList.contains('correct')) {
        opt.classList.remove('try-again');
        opt.classList.add('correct');
        opt.innerHTML += ' 💡';
      }
    } else if (!opt.classList.contains('try-again')) {
      opt.classList.add('try-again');
    }
  });
  btn.remove();
}

/* ---------- Weiterdenken ---------- */
function renderWeitererzaehlen() {
  const data = LK.weiter;
  const tab = document.querySelector('[data-tab="weiterdenken"]');
  const panel = document.getElementById('panel-weiterdenken');
  const wrapper = document.getElementById('weitererzaehlen-wrapper');
  if (!wrapper) return;
  if (!data || !Array.isArray(data.optionen) || data.optionen.length === 0) {
    if (tab) tab.style.display = 'none';
    if (panel) panel.style.display = 'none';
    return;
  }
  const introEl = document.querySelector('.weitererzaehlen-intro');
  if (data.frage && introEl) {
    introEl.innerHTML = data.frage + ' <span class="weitererzaehlen-subline">Hier gibt es kein richtig oder falsch.</span>';
  }
  let html = '';
  data.optionen.forEach((opt, i) => {
    html += `<div class="weitererzaehlen-card" onclick="toggleWeitererzaehlen(${i})" id="wet-card-${i}">
              <div class="weitererzaehlen-card-header">
                <span class="weitererzaehlen-emoji">${opt.emoji || '✨'}</span>
                <span class="weitererzaehlen-titel">${opt.titel || ''}</span>
                <span class="weitererzaehlen-chevron">▼</span>
              </div>
              <div class="weitererzaehlen-text">
                <div class="weitererzaehlen-text-body">${opt.text || ''}</div>
                <div class="weitererzaehlen-hinweis">So könnte es sein — oder ganz anders. Was denkst du?</div>
              </div>
            </div>`;
  });
  wrapper.innerHTML = html;
}

function toggleWeitererzaehlen(index) {
  const card = document.getElementById('wet-card-' + index);
  if (card) card.classList.toggle('open');
}

/* ---------- Wortschatz-Panel ---------- */
function renderWortschatz() {
  const panel = document.getElementById('wortschatz-wrapper');
  const tab = document.querySelector('[data-tab="wortschatz"]');
  if (!panel) return;
  const entries = Array.isArray(LK.dictRaw) ? LK.dictRaw.filter(it => typeof it === 'object' && it.wort) : [];
  if (entries.length === 0) {
    if (tab) tab.style.display = 'none';
    const p = document.getElementById('panel-wortschatz');
    if (p) p.style.display = 'none';
    return;
  }
  panel.innerHTML = entries.map(it => `
    <div class="wortschatz-card">
      <div class="wortschatz-head">
        <span class="wortschatz-wort">${it.wort.replace(/-/g, '')}</span>
        ${it.silben ? `<span class="wortschatz-silben">${it.silben}</span>` : ''}
        <button type="button" class="wortschatz-speak" onclick="speakWord('${it.wort.replace(/-/g, '').replace(/'/g, '')}')" aria-label="Wort vorlesen">🔊</button>
      </div>
      <div class="wortschatz-bedeutung">${it.bedeutung || ''}</div>
    </div>`).join('');
}

function speakWord(word) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'de-DE';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

/* ---------- Tabs ---------- */
function switchActivityTab(tabName) {
  const tabs = document.querySelectorAll('.activity-tab');
  const panels = document.querySelectorAll('.activity-panel');
  tabs.forEach(t => {
    const isActive = t.dataset.tab === tabName;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + tabName));
  try { localStorage.setItem('lesekumpel-activity-tab', tabName); } catch (e) {}
}

function initActivityTabs() {
  const availableTabs = Array.from(document.querySelectorAll('.activity-tab'))
    .filter(t => t.style.display !== 'none')
    .map(t => t.dataset.tab);
  if (availableTabs.length === 0) {
    const hub = document.querySelector('.activity-hub');
    if (hub) hub.style.display = 'none';
    return;
  }
  if (availableTabs.length === 1) {
    const tabsBar = document.querySelector('.activity-tabs');
    if (tabsBar) tabsBar.style.display = 'none';
    switchActivityTab(availableTabs[0]);
    return;
  }
  let saved = null;
  try { saved = localStorage.getItem('lesekumpel-activity-tab'); } catch (e) {}
  const target = (saved && availableTabs.includes(saved)) ? saved
    : (availableTabs.includes('quiz') ? 'quiz' : availableTabs[0]);
  switchActivityTab(target);
}

/* ---------- Schatzsuche ---------- */
function renderSchatzsuche() {
  const data = LK.schatz;
  const panel = document.getElementById('panel-schatz');
  const tab = document.querySelector('[data-tab="schatz"]');
  if (!panel) return;
  if (!data || !Array.isArray(data.schatzwoerter) || data.schatzwoerter.length === 0 || !data.ziel) {
    if (tab) tab.style.display = 'none';
    panel.style.display = 'none';
    return;
  }
  if (schatzState.found.length >= data.ziel) renderSchatzComplete(panel, data);
  else renderSchatzIntro(panel, data);
}

function renderSchatzIntro(panel, data) {
  const found = schatzState.found.length;
  const buttonLabel = found > 0 ? 'Weitersuchen' : 'Los geht’s!';
  panel.innerHTML = `
    <div class="schatz-intro-card">
      <span class="schatz-intro-emoji">${data.emoji || '🔍'}</span>
      <h3 class="schatz-intro-title">Schatz-Suche</h3>
      <p class="schatz-intro-thema">„${data.thema || ''}“</p>
      <p class="schatz-intro-text">${data.einleitung || 'Finde versteckte Wörter im Text. Tippe sie einfach an!'}</p>
      <div class="schatz-progress">Gefunden: <span class="schatz-progress-number">${found}</span> / ${data.ziel}</div>
      <button type="button" class="btn btn-primary schatz-start-btn" onclick="startSchatzsuche()">
        <span>🔍</span><span>${buttonLabel}</span>
      </button>
    </div>`;
}

function renderSchatzComplete(panel, data) {
  const chips = schatzState.found.map(w => {
    const pretty = w.charAt(0).toUpperCase() + w.slice(1);
    return `<li class="schatz-found-chip">${pretty}</li>`;
  }).join('');
  panel.innerHTML = `
    <div class="schatz-complete">
      <span class="schatz-complete-emoji">🏆</span>
      <h3 class="schatz-complete-title">Schatz gefunden!</h3>
      <p class="schatz-complete-text">Du hast ${data.ziel} ${(data.thema || '').toLowerCase()} entdeckt:</p>
      <ul class="schatz-found-list">${chips}</ul>
      <button type="button" class="btn btn-secondary schatz-start-btn" onclick="resetSchatzsuche()">
        <span>🔄</span><span>Nochmal spielen</span>
      </button>
    </div>`;
}

function startSchatzsuche() {
  if (!LK.schatz) return;
  schatzState.active = true;
  showSchatzBanner();
  updateSchatzBanner();
  const chunkView = document.getElementById('chunk-view');
  const chunkVisible = chunkView && !chunkView.classList.contains('hidden');
  const target = chunkVisible ? chunkView : document.getElementById('full-text-view');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function endSchatzsuche() {
  schatzState.active = false;
  hideSchatzBanner();
  renderSchatzsuche();
}

function resetSchatzsuche() {
  schatzState.found = [];
  document.querySelectorAll('.word-schatz-treffer').forEach(el => el.classList.remove('word-schatz-treffer'));
  startSchatzsuche();
  renderSchatzsuche();
}

function checkSchatzwort(el, word) {
  if (!LK.schatz) return;
  const lw = (word || '').toLowerCase();
  const isSchatz = LK.schatz.schatzwoerter.includes(lw);
  if (isSchatz && !schatzState.found.includes(lw)) {
    schatzState.found.push(lw);
    document.querySelectorAll('.word-interactive').forEach(w => {
      const txt = (w.innerText || '').toLowerCase().replace(/[.,!?:;„"“”()-]/g, '');
      if (txt === lw) w.classList.add('word-schatz-treffer');
    });
    try { playTickSound(); } catch (e) {}
    updateSchatzBanner();
    if (schatzState.found.length >= LK.schatz.ziel) showSchatzsucheComplete();
  } else if (!isSchatz) {
    el.classList.add('word-schatz-miss');
    setTimeout(() => el.classList.remove('word-schatz-miss'), 500);
  }
}

function showSchatzBanner() {
  const banner = document.getElementById('schatz-banner');
  const thema = document.getElementById('schatz-banner-thema');
  if (banner) banner.hidden = false;
  if (thema && LK.schatz && LK.schatz.thema) thema.textContent = 'Finde ' + LK.schatz.thema.toLowerCase();
}

function hideSchatzBanner() {
  const banner = document.getElementById('schatz-banner');
  if (banner) {
    banner.hidden = true;
    banner.classList.remove('celebrate');
  }
}

function updateSchatzBanner() {
  const count = document.getElementById('schatz-banner-count');
  if (count && LK.schatz) count.textContent = schatzState.found.length + '/' + LK.schatz.ziel;
}

function showSchatzsucheComplete() {
  schatzState.active = false;
  try { showConfetti(); } catch (e) {}
  const banner = document.getElementById('schatz-banner');
  const thema = document.getElementById('schatz-banner-thema');
  if (banner) banner.classList.add('celebrate');
  if (thema) thema.textContent = 'Schatz gefunden! ✨';
  updateSchatzBanner();
  setTimeout(() => { hideSchatzBanner(); renderSchatzsuche(); }, 3500);
}

/* ============================================================
   Belohnungs-Effekte
   ============================================================ */

function playTickSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.value = 0.08;
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

function showConfetti() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const container = document.createElement('div');
  container.className = 'confetti-container';
  const colors = ['#2FB8A6', '#F97352', '#7D6AE6', '#FFD95A', '#2B3140'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 2 + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 4000);
}

/* ---------- Survey ---------- */
function vote(dir) {
  alert(dir === 'up' ? '🎉 Toll! Danke für dein Feedback.' : '😢 Schade — sag uns gern, was nicht gepasst hat.');
}

/* ============================================================
   Initialisierung
   ============================================================ */

function initStoryPage() {
  // 1. Daten einsammeln (Soft-Hyphen-Konvention wie altes Template)
  LK.story = g('rawStory', '');
  LK.emojiStory = g('emojiStory', '').replace(/-/g, '­');
  LK.summary = g('rawSummary', '');
  LK.emojiSummary = g('emojiSummary', '').replace(/-/g, '­');
  LK.quiz = g('quizData', []);
  LK.dictRaw = g('rawDictionaryEntry', []);
  LK.weiter = g('weitererzaehlenData', null);
  LK.schatz = g('schatzsucheData', null);

  // Dictionary-Parser (Objekt-, "Wort (Def)"- und "Wort: Def"-Formate)
  if (Array.isArray(LK.dictRaw)) {
    LK.dictRaw.forEach(item => {
      let key = '', value = '';
      if (typeof item === 'object' && item && item.wort) {
        key = item.wort.replace(/­/g, '').replace(/-/g, '');
        value = item.bedeutung || '';
      } else if (typeof item === 'string' && item.includes('(') && item.includes(')')) {
        const parts = item.split('(');
        key = parts[0].trim().replace(/­/g, '').replace(/-/g, '');
        value = parts[1].replace(')', '').trim();
      } else if (typeof item === 'string' && item.includes(':')) {
        const parts = item.split(':');
        key = parts[0].trim().replace(/­/g, '').replace(/-/g, '');
        value = parts.slice(1).join(':').trim();
      }
      if (key && value) LK.dictionary[key] = value;
    });
  } else if (LK.dictRaw && typeof LK.dictRaw === 'object') {
    LK.dictionary = LK.dictRaw;
  }

  // 2. Neurotyp aus Meta-Tag
  const ntMeta = document.querySelector('meta[name="neurotype"]');
  const ntValue = ntMeta ? ntMeta.content.trim() : 'Standard';
  const ntMap = {
    'LRS': 'nt-lrs', 'LRS/Legasthenie': 'nt-lrs',
    'Autismus': 'nt-autismus', 'Autismus-Spektrum': 'nt-autismus',
    'ADHS': 'nt-adhs',
    'Standard': 'nt-standard', 'Neurotypisch': 'nt-standard'
  };
  ntClass = ntMap[ntValue] || 'nt-standard';
  document.body.classList.add(ntClass);
  isAutismus = ntClass === 'nt-autismus';
  isLRS = ntClass === 'nt-lrs';
  isADHS = ntClass === 'nt-adhs';

  // Neurotyp-Defaults für Text-Modi
  state.syllables = isLRS;
  state.emojis = isAutismus;
  document.body.classList.toggle('syllables-on', state.syllables);

  // 3. Inline-Bilder einsammeln (alle .hero-image im Dokument).
  // Bilder im Tafel-Pool bleiben im DOM — tafel.js braucht sie als Quelle;
  // wir übernehmen nur die URLs für die Text-Verteilung.
  document.querySelectorAll('.hero-image').forEach(img => {
    inlineImages.push(img.src);
    if (!img.closest('.tafel-image-pool')) img.remove();
  });

  // 4. Rendern
  renderText();
  renderQuiz();
  renderWeitererzaehlen();
  renderWortschatz();
  renderSchatzsuche();
  initActivityTabs();

  // 5. Ansicht-Modus: explizite localStorage-Wahl > Neurotyp-Default
  let lsPref = null, fpPref = null, hpPref = null;
  try {
    lsPref = localStorage.getItem('lesekumpel-leselinien-default');
    fpPref = localStorage.getItem('lesekumpel-fahrplan-default');
    hpPref = localStorage.getItem('lesekumpel-haeppchen-default');
  } catch (e) {}
  let viewMode = null;
  if (lsPref === 'true') viewMode = 'linien';
  else if (fpPref === 'true') viewMode = 'fahrplan';
  else if (hpPref === 'true') viewMode = 'haeppchen';
  else if (lsPref !== 'false' && ntClass === 'nt-lrs') viewMode = 'linien';
  else if (fpPref !== 'false' && ntClass === 'nt-autismus') viewMode = 'fahrplan';
  else if (hpPref !== 'false' && ntClass === 'nt-adhs') viewMode = 'haeppchen';
  if (viewMode === 'linien') toggleLeselinien();
  else if (viewMode === 'fahrplan') toggleFahrplan();
  else if (viewMode === 'haeppchen') toggleViewMode();
}

document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('js-on');
  // Nur auf Lese-Seiten initialisieren (erkennt das Story-Text-Element)
  if (document.getElementById('full-text-view')) initStoryPage();
});
