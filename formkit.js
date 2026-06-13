/* ============================================================
   Lesekumpel · formkit.js
   Geteilte, abhängigkeitsfreie Schicht für neuroinklusive Formulare:
   - Wizard (ein Schritt pro Bildschirm, Fortschritt, Validierung als Hinweis)
   - Vorlesen (TTS) überall + Auto-Vorlesen beim Schritt-Eintritt
   - Sprechen statt Tippen (Diktat) mit Fallback
   - Autosave & Fortsetzen (localStorage)
   - Frontend-only Vorschau-Modal (kein fetch)
   Erwartet formkit.css. Exponiert window.FormKit.
   ============================================================ */
(function () {
  'use strict';

  var synth = window.speechSynthesis || null;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- VORLESEN ---------- */
  function speak(text) {
    if (!synth || !text) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'de-DE';
      u.rate = 0.9;
      synth.speak(u);
    } catch (e) { /* TTS optional */ }
  }
  function stopSpeak() { if (synth) { try { synth.cancel(); } catch (e) {} } }

  // Wired ein 🔊-Button (btn) auf einen Text-Getter
  function attachReadAloud(btn, getText) {
    if (!btn) return;
    if (!synth) { btn.style.display = 'none'; return; }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      speak(typeof getText === 'function' ? getText() : getText);
    });
  }

  /* ---------- DIKTAT ---------- */
  function hasDictation() { return !!SR; }

  // Wired ein 🎤-Button auf ein Eingabefeld. Ohne API → Button weg, Tippen bleibt.
  function attachDictation(input, btn, onResult) {
    if (!btn) return;
    if (!SR || !input) { btn.style.display = 'none'; return; }
    var rec = new SR();
    rec.lang = 'de-DE';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    var active = false;
    rec.onresult = function (ev) {
      var t = ev.results[0][0].transcript;
      var sep = input.value && !/\s$/.test(input.value) ? ' ' : '';
      input.value = (input.value || '') + sep + t;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (typeof onResult === 'function') onResult(t);
    };
    rec.onerror = function () { stop(); };
    rec.onend = function () { stop(); };
    function start() { try { stopSpeak(); rec.start(); active = true; btn.classList.add('listening'); } catch (e) {} }
    function stop() { active = false; btn.classList.remove('listening'); }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (active) { try { rec.stop(); } catch (e2) {} stop(); }
      else { start(); }
    });
  }

  /* ---------- AUTOSAVE ---------- */
  function persist(key, obj) {
    if (!key) return;
    try { localStorage.setItem('fk:' + key, JSON.stringify(obj)); } catch (e) {}
  }
  function restore(key) {
    if (!key) return null;
    try { var raw = localStorage.getItem('fk:' + key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function clearSaved(key) { try { localStorage.removeItem('fk:' + key); } catch (e) {} }

  /* ---------- VORSCHAU-MODAL ---------- */
  function openPreview(modal) { if (modal) modal.classList.add('visible'); }
  function closePreview(modal) { stopSpeak(); if (modal) modal.classList.remove('visible'); }

  /* ---------- WIZARD ---------- */
  /*
     opts = {
       root:        .wizard-Container (enthält data-fk-progress/-remain/-nav + .wizard-step*)
       steps:       [{ validate?:fn->bool, optional?:bool }]  (index-parallel zu .wizard-step)
       storageKey:  string  (Autosave)
       getState:    ()->obj  (Snapshot fürs Autosave)
       applyState:  (obj)->void  (Wiederherstellen)
       onComplete:  ()->void  (letztes „Weiter")
       autoSpeak:   bool (Default true) – Frage beim Schritt-Eintritt vorlesen
       finalLabel:  string (Default „Fertig!")
     }
  */
  function Wizard(opts) {
    var root = opts.root;
    var stepEls = Array.prototype.slice.call(root.querySelectorAll('.wizard-step'));
    var steps = opts.steps || stepEls.map(function () { return {}; });
    var idx = 0;
    var autoSpeak = opts.autoSpeak !== false;

    var progressEl = root.querySelector('[data-fk-progress]');
    var remainEl = root.querySelector('[data-fk-remain]');
    var navEl = root.querySelector('[data-fk-nav]');

    // Progress-Punkte
    if (progressEl) {
      progressEl.innerHTML = stepEls.map(function () { return '<span class="wizard-dot"></span>'; }).join('');
    }
    var dots = progressEl ? Array.prototype.slice.call(progressEl.children) : [];

    // Navigation
    navEl.innerHTML =
      '<button type="button" class="btn-ghost" data-fk-back>← Zurück</button>' +
      '<button type="button" class="btn-skip" data-fk-skip hidden>Überspringen</button>' +
      '<button type="button" class="btn-primary" data-fk-next>Weiter →</button>';
    var backBtn = navEl.querySelector('[data-fk-back]');
    var skipBtn = navEl.querySelector('[data-fk-skip]');
    var nextBtn = navEl.querySelector('[data-fk-next]');

    // Vorlese-Knöpfe in den Schritten verdrahten
    stepEls.forEach(function (el) {
      var rb = el.querySelector('[data-fk-read]');
      if (rb) attachReadAloud(rb, function () { return el.getAttribute('data-question') || ''; });
    });

    backBtn.addEventListener('click', function () { go(idx - 1); });
    skipBtn.addEventListener('click', function () { advance(true); });
    nextBtn.addEventListener('click', function () { advance(false); });

    function isValid(i) {
      var s = steps[i] || {};
      if (typeof s.validate === 'function') return !!s.validate();
      return true;
    }

    function advance(skipped) {
      if (!skipped && !isValid(idx) && !(steps[idx] && steps[idx].optional)) { refresh(); return; }
      save();
      if (idx >= stepEls.length - 1) { if (opts.onComplete) opts.onComplete(); return; }
      go(idx + 1);
    }

    function go(i, noSave) {
      if (i < 0 || i >= stepEls.length) return;
      idx = i;
      stepEls.forEach(function (el, k) { el.classList.toggle('active', k === idx); });
      dots.forEach(function (d, k) {
        d.classList.toggle('active', k === idx);
        d.classList.toggle('done', k < idx);
      });
      backBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
      updateRemain();
      refresh();
      if (!noSave) save();
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
      if (autoSpeak) {
        var q = stepEls[idx].getAttribute('data-question');
        if (q) setTimeout(function () { speak(q); }, 250);
      }
      var focusEl = stepEls[idx].querySelector('input,textarea,button.choice-tile');
      if (focusEl && focusEl.tagName !== 'BUTTON') { try { focusEl.focus({ preventScroll: true }); } catch (e) {} }
    }

    function updateRemain() {
      if (!remainEl) return;
      var left = stepEls.length - 1 - idx;
      if (left <= 0) { remainEl.innerHTML = 'Letzter Schritt!'; return; }
      var nextQ = stepEls[idx + 1].getAttribute('data-next-label') || stepEls[idx + 1].getAttribute('data-question') || '';
      var word = left === 1 ? 'Schritt' : 'Schritte';
      remainEl.innerHTML = 'Noch ' + left + ' ' + word +
        (nextQ ? ' · <span class="next-hint">Als Nächstes: ' + escapeHtml(stripQ(nextQ)) + '</span>' : '');
    }

    // Aktiviert/deaktiviert Weiter + Skip; von Seiten bei Eingaben aufrufen
    function refresh() {
      var optional = !!(steps[idx] && steps[idx].optional);
      var valid = isValid(idx);
      var last = idx >= stepEls.length - 1;
      nextBtn.textContent = last ? (opts.finalLabel || 'Fertig!') : 'Weiter →';
      nextBtn.disabled = !(valid || optional);
      if (skipBtn) skipBtn.hidden = !(optional && !valid);
    }

    function save() {
      if (!opts.storageKey || !opts.getState) return;
      persist(opts.storageKey, { step: idx, data: opts.getState() });
    }

    // Autosave-Banner / Fortsetzen
    function offerResume(bannerEl) {
      if (!bannerEl || !opts.storageKey) { go(0, true); return; }
      var saved = restore(opts.storageKey);
      if (!saved || !saved.data) { go(0, true); return; }
      bannerEl.classList.add('show');
      bannerEl.querySelector('.resume-yes').addEventListener('click', function () {
        if (opts.applyState) opts.applyState(saved.data);
        bannerEl.classList.remove('show');
        go(Math.min(saved.step || 0, stepEls.length - 1));
      });
      bannerEl.querySelector('.resume-no').addEventListener('click', function () {
        clearSaved(opts.storageKey);
        bannerEl.classList.remove('show');
        go(0, true);
      });
    }

    go(0, true);

    return {
      refresh: refresh,
      go: go,
      get index() { return idx; },
      save: save,
      offerResume: offerResume,
      clearSaved: function () { clearSaved(opts.storageKey); }
    };
  }

  function stripQ(s) { return String(s).replace(/\s*\?+\s*$/, ''); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  window.FormKit = {
    speak: speak,
    stopSpeak: stopSpeak,
    attachReadAloud: attachReadAloud,
    attachDictation: attachDictation,
    hasDictation: hasDictation,
    reducedMotion: reducedMotion,
    persist: persist,
    restore: restore,
    clearSaved: clearSaved,
    openPreview: openPreview,
    closePreview: closePreview,
    Wizard: Wizard,
    escapeHtml: escapeHtml
  };
})();
