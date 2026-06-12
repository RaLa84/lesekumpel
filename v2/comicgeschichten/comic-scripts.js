/* ============================================================
   Lesekumpel v2 — Comic-Scripts (Bildgeschichten)

   Erwartet ein Global, das pro Comic inline injiziert wird:
     comicPages  ({{COMIC_PAGES_JSON}})  — [{image, text}]

   Abwärtskompatibel: Liegt stattdessen das alte `inputData`-Format
   vor ({content: {tileN, download_url_N}}), wird es konvertiert.
   ============================================================ */

/* ---------- Navbar ---------- */
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

/* ---------- Seiten-Daten ---------- */
let pages = [];
let currentPageIndex = 0;
let comicState = { wordReader: false, syllables: false };

function collectPages() {
  // typeof-Checks statt window.*: die Injektion nutzt let/const, die nicht
  // auf window landen, aber lexikalisch über Script-Grenzen sichtbar sind.
  // Neues Format: comicPages = [{image, text}]
  if (typeof comicPages !== 'undefined' && Array.isArray(comicPages)) {
    return comicPages.filter(p => p && (p.text || p.image));
  }
  // Altes Format: inputData.content.tileN / download_url_N
  if (typeof inputData !== 'undefined' && inputData && inputData.content) {
    const c = inputData.content;
    const out = [];
    let i = 1;
    while (c['tile' + i] !== undefined || c['download_url_' + i] !== undefined) {
      out.push({
        image: c['download_url_' + i] || '',
        text: (c['tile' + i] || '').replace(/"/g, '').trim(),
      });
      i++;
    }
    return out;
  }
  return [];
}

/* ---------- Rendering ---------- */
function updateView() {
  const domImage = document.getElementById('story-image');
  const domText = document.getElementById('story-text');
  const domPageNum = document.getElementById('page-num');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (!domText) return;
  if (pages.length === 0) {
    domText.innerText = 'Keine Daten gefunden.';
    return;
  }
  const pageData = pages[currentPageIndex];

  if (domImage) domImage.style.opacity = 0;
  window.speechSynthesis.cancel();
  const ttsBtn = document.getElementById('btn-tts');
  if (ttsBtn) ttsBtn.classList.remove('active');

  setTimeout(() => {
    if (domImage) {
      if (pageData.image && pageData.image.indexOf('http') === 0) {
        domImage.src = pageData.image;
        domImage.style.display = 'block';
      } else {
        domImage.style.display = 'none';
      }
      domImage.style.opacity = 1;
    }

    renderComicText(pageData.text);

    if (domPageNum) domPageNum.innerText = (currentPageIndex + 1) + ' / ' + pages.length;
    renderPageDots();

    if (btnPrev) btnPrev.disabled = currentPageIndex === 0;

    const finish = document.getElementById('comic-finish');
    const isLast = currentPageIndex === pages.length - 1;
    if (finish) finish.classList.toggle('visible', isLast);
    if (btnNext) {
      btnNext.innerHTML = isLast ? 'Nochmal &#8634;' : 'Weiter &rarr;';
      btnNext.onclick = isLast ? restartComic : function () { changePage(1); };
    }
  }, 200);
}

function renderComicText(textStr) {
  const domText = document.getElementById('story-text');
  if (!domText) return;
  if (!textStr) {
    domText.innerHTML = '…';
    return;
  }
  const words = textStr.split(' ');
  const html = words.map(word => {
    let displayHTML = word;
    const cleanWord = word.replace(/[.,!?:;„"“”()]/g, '');
    if (comicState.syllables) displayHTML = colorizeSyllables(word);
    return `<span class="word-interactive" onclick="handleWordClick(this, '${cleanWord.replace(/'/g, '')}')">${displayHTML}</span>`;
  }).join(' ');
  domText.innerHTML = html;
}

/* Silben-Heuristik (Comic-Texte haben keine "-"-Trenner):
   Vokalgruppen-basierte Aufteilung, alternierend syl-a / syl-b. */
function colorizeSyllables(word) {
  const parts = word.match(/[^aeiouäöüAEIOUÄÖÜ]*[aeiouäöüAEIOUÄÖÜ]+(?:[^aeiouäöüAEIOUÄÖÜ]*$|[^aeiouäöüAEIOUÄÖÜ](?=[^aeiouäöüAEIOUÄÖÜ]))?/gi) || [word];
  return parts.map((part, i) => `<span class="${i % 2 === 0 ? 'syl-a' : 'syl-b'}">${part}</span>`).join('');
}

function renderPageDots() {
  const dots = document.getElementById('page-dots');
  if (!dots) return;
  dots.innerHTML = pages.map((_, i) => {
    let cls = 'page-dot';
    if (i === currentPageIndex) cls += ' active';
    else if (i < currentPageIndex) cls += ' read';
    return `<span class="${cls}"></span>`;
  }).join('');
}

/* ---------- Navigation ---------- */
function changePage(dir) {
  const newIndex = currentPageIndex + dir;
  if (newIndex >= 0 && newIndex < pages.length) {
    currentPageIndex = newIndex;
    updateView();
  }
}

function restartComic() {
  currentPageIndex = 0;
  updateView();
}

/* ---------- Werkzeuge ---------- */
function toggleTTS() {
  const btn = document.getElementById('btn-tts');
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (btn) btn.classList.remove('active');
  } else {
    const textToRead = pages[currentPageIndex] && pages[currentPageIndex].text;
    if (!textToRead) return;
    const u = new SpeechSynthesisUtterance(textToRead);
    u.lang = 'de-DE';
    u.rate = 0.9;
    u.onend = function () { if (btn) btn.classList.remove('active'); };
    window.speechSynthesis.speak(u);
    if (btn) btn.classList.add('active');
  }
}

function toggleWordReader() {
  comicState.wordReader = !comicState.wordReader;
  const btn = document.getElementById('btn-word-reader');
  if (btn) btn.classList.toggle('active', comicState.wordReader);
}

function handleWordClick(el, cleanWord) {
  if (!comicState.wordReader) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cleanWord);
  u.lang = 'de-DE';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function toggleSyllables() {
  comicState.syllables = !comicState.syllables;
  const btn = document.getElementById('btn-syllables');
  if (btn) btn.classList.toggle('active', comicState.syllables);
  if (pages[currentPageIndex]) renderComicText(pages[currentPageIndex].text);
}

function changeFontSize(delta) {
  const domText = document.getElementById('story-text');
  if (!domText) return;
  const size = parseFloat(window.getComputedStyle(domText).fontSize);
  domText.style.fontSize = Math.max(16, Math.min(56, size + delta)) + 'px';
}

function toggleDyslexia(btn) {
  document.body.classList.toggle('dyslexia');
  if (btn) btn.classList.toggle('active');
}

function vote(dir) {
  alert(dir === 'up' ? '🎉 Toll! Danke für dein Feedback.' : '😢 Schade — sag uns gern, was nicht gepasst hat.');
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('js-on');
  pages = collectPages();
  if (document.getElementById('story-text')) {
    updateView();
    // Tastatur-Navigation (Pfeiltasten)
    document.addEventListener('keydown', function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') changePage(1);
      if (e.key === 'ArrowLeft') changePage(-1);
    });
  }
});
