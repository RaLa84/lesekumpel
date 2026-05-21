/* ============================================================
   Lesekumpel v2 — Story-Seiten Scripts
   Navbar/Footer sind inline — kein Partial-Loader nötig.
   ============================================================ */

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

document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('js-on');
});

/* ----- Reading Toolbar ----- */
function toggleBody(cls, btn) {
  document.body.classList.toggle(cls);
  if (btn) btn.classList.toggle('active');
}

let __fStep = 0;
function cycleFontSize(btn) {
  document.body.classList.remove('text-large', 'text-x-large');
  __fStep = (__fStep + 1) % 3;
  if (__fStep === 1) document.body.classList.add('text-large');
  if (__fStep === 2) document.body.classList.add('text-x-large');
  if (btn) btn.textContent = ['A+ Schrift', 'A++ Schrift', 'A normal'][__fStep];
}

let __ttsActive = false;
function speakStory(btn) {
  if (__ttsActive) {
    window.speechSynthesis.cancel();
    __ttsActive = false;
    if (btn) btn.classList.remove('active');
    return;
  }
  const t = document.getElementById('story-text');
  if (!t) return;
  const text = t.innerText;
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.95;
  u.onend = () => {
    __ttsActive = false;
    if (btn) btn.classList.remove('active');
  };
  window.speechSynthesis.speak(u);
  __ttsActive = true;
  if (btn) btn.classList.add('active');
}
