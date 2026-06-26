/* ============================================================
   Lesekumpel · lautlese.js
   Fibel-artiges Lautlesen: aus dem Geschichtentext werden per Code
   Wörter mit einem Fokus-Laut/Graphem (z. B. Sch, St) extrahiert; das
   Kind hört sie an und spricht sie einzeln ins Mikro nach.

   Eine geteilte, abhängigkeitsfreie Schicht (wie formkit.js / konto-fx.js):
   - LAUT_INVENTORY + Extraktion/Profil  (auch von kind.html & dem
     stories-index-Generator gespiegelt genutzt)
   - Einzelwort-Spracherkennung NUR als Ermutigung (nie „falsch", nie Hürde)
   - Selbst-Bootstrap auf Story-Seiten: hängt einen „Laute"-Tab in die
     bestehende Spielzeit-Aktivität (openSpiel/switchActivityTab) ein.

   Quelle der Wahrheit für Inventar + Extraktion. Bei Änderungen an
   LAUT_INVENTORY / matchesGrapheme / extractLautWords bitte die
   gespiegelte Logik in scripts/generate-stories-index.mjs mitpflegen.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- LAUT-INVENTAR (sanfte Fibel-Reihenfolge) ----------
     Reihenfolge = Empfehlung für den Lernpfad, NICHT blockierend.
     phase = grobe Zuordnung zur 5-Phasen-Systematik (docs/leseapp_konzeption.md).
     initialOnly: nur am Wortanfang zählt der Laut (St/Sp = „scht/schp"). */
  var LAUT_INVENTORY = [
    { id: 'ei', label: 'ei', beispiel: 'Eis',    phase: 1 },
    { id: 'au', label: 'au', beispiel: 'Baum',   phase: 1 },
    { id: 'ie', label: 'ie', beispiel: 'Wiese',  phase: 1 },
    { id: 'sch', label: 'Sch', beispiel: 'Schule', phase: 2 },
    { id: 'ch', label: 'ch', beispiel: 'Bach',   phase: 2 },
    { id: 'st', label: 'St', beispiel: 'Stern',  phase: 2, initialOnly: true },
    { id: 'sp', label: 'Sp', beispiel: 'Spiel',  phase: 2, initialOnly: true },
    { id: 'ck', label: 'ck', beispiel: 'Zucker', phase: 2 },
    { id: 'pf', label: 'Pf', beispiel: 'Pferd',  phase: 2 },
    { id: 'ng', label: 'ng', beispiel: 'Finger', phase: 2 },
    { id: 'eu', label: 'eu', beispiel: 'Feuer',  phase: 2 },
    { id: 'äu', label: 'äu', beispiel: 'Bäume',  phase: 3 },
    { id: 'qu', label: 'Qu', beispiel: 'Quelle', phase: 3 }
  ];
  var BY_ID = {};
  LAUT_INVENTORY.forEach(function (g) { BY_ID[g.id] = g; });

  // Mindestanzahl Wörter, damit sich eine Übung lohnt (sonst kein Tab/Vorschlag)
  var MIN_WORDS = 2;
  // Wie oft ein Laut geübt werden muss, bis er „gemeistert" gilt
  var MASTER_THRESHOLD = 12;

  /* ---------- TEXT-HELFER ---------- */
  // Soft Hyphen (U+00AD), Markdown-Sterne, Satzzeichen entfernen
  function cleanWord(raw) {
    return (raw || '')
      .replace(/\*\*/g, '').replace(/\*/g, '')
      .replace(/­/g, '')
      .replace(/[.,!?:;„“"»«‚'()\[\]…]/g, '')
      .replace(/[–—]/g, '')
      .trim();
  }
  // Wörter aus rawStory: Trenner = Whitespace; Bindestrich-Komposita bleiben 1 Wort
  function tokenize(text) {
    return String(text || '').split(/\s+/).map(cleanWord).filter(Boolean);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- GRAPHEM-ERKENNUNG ---------- */
  // Index des ersten relevanten Vorkommens (oder -1). Beachtet Sonderregeln.
  function graphemeIndex(word, g) {
    var lw = word.toLowerCase();
    if (g.initialOnly) return lw.indexOf(g.id) === 0 ? 0 : -1;
    if (g.id === 'ch') {
      // „ch" ja, aber nicht als Teil von „sch"
      var m = lw.match(/(^|[^s])ch/);
      if (!m) return -1;
      return m.index + m[1].length;
    }
    return lw.indexOf(g.id);
  }
  function matchesGrapheme(word, g) { return graphemeIndex(word, g) >= 0; }

  // Alle Wörter eines Textes mit dem Graphem g — dedupliziert (case-insensitiv),
  // erste Schreibweise gewinnt, sortiert nach Vorkommen. Liefert {wort, silben, html}.
  function extractLautWords(rawStory, gOrId, limit) {
    var g = typeof gOrId === 'string' ? BY_ID[gOrId] : gOrId;
    if (!g) return [];
    var seen = {}, out = [];
    tokenize(rawStory).forEach(function (w) {
      if (w.length < 2) return;
      var key = w.toLowerCase();
      if (seen[key]) return;
      if (!matchesGrapheme(w, g)) return;
      seen[key] = true;
      out.push({ wort: w, silben: silbenString(w), html: graphemeHtml(w, g) });
    });
    return typeof limit === 'number' ? out.slice(0, limit) : out;
  }

  // Map graphem-id -> Anzahl eindeutiger Treffer-Wörter im Text
  function profileStory(rawStory) {
    var words = tokenize(rawStory);
    var profile = {};
    LAUT_INVENTORY.forEach(function (g) {
      var seen = {}, n = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (w.length < 2) continue;
        var key = w.toLowerCase();
        if (seen[key]) continue;
        if (matchesGrapheme(w, g)) { seen[key] = true; n++; }
      }
      if (n > 0) profile[g.id] = n;
    });
    return profile;
  }

  // Welcher Laut wird in dieser Story geübt?
  // 1. Der gewählte Fokus-Laut, WENN der Text ihn (genug) hergibt.
  // 2. Sonst der reichhaltigste angebotene Laut (Angebot).
  // null, wenn der Text gar nichts Brauchbares hergibt.
  function pickFocusGraphem(profile, focusId) {
    if (focusId && (profile[focusId] || 0) >= MIN_WORDS) return focusId;
    var best = null, bestN = MIN_WORDS - 1;
    LAUT_INVENTORY.forEach(function (g) {
      var n = profile[g.id] || 0;
      if (n > bestN) { bestN = n; best = g.id; }
    });
    return best;
  }

  /* ---------- SILBENTRENNUNG (portiert aus n8n-config/emoji-parsen-v2.js) ---------- */
  function silbentrennung(wort) {
    if (wort.length <= 3) return wort;
    if (!/^[a-zäöüß]+$/i.test(wort)) return wort;
    var w = wort.toLowerCase();
    var einheiten = [];
    var i = 0;
    while (i < w.length) {
      if (i + 2 < w.length && w.substring(i, i + 3) === 'sch') { einheiten.push({ text: w.substring(i, i + 3), typ: 'K', pos: i, len: 3 }); i += 3; continue; }
      var zwei = i + 1 < w.length ? w.substring(i, i + 2) : '';
      if (['ch', 'ck', 'ph', 'th', 'qu', 'pf'].indexOf(zwei) !== -1) { einheiten.push({ text: zwei, typ: 'K', pos: i, len: 2 }); i += 2; continue; }
      if (['ei', 'au', 'eu', 'äu', 'ie', 'ai'].indexOf(zwei) !== -1) { einheiten.push({ text: zwei, typ: 'V', pos: i, len: 2 }); i += 2; continue; }
      var vokal = 'aeiouyäöü'.indexOf(w[i]) !== -1;
      einheiten.push({ text: w[i], typ: vokal ? 'V' : 'K', pos: i, len: 1 }); i++;
    }
    var vokalIndices = [];
    for (var e = 0; e < einheiten.length; e++) {
      if (einheiten[e].typ === 'V') {
        if (vokalIndices.length > 0 && vokalIndices[vokalIndices.length - 1].end === e) vokalIndices[vokalIndices.length - 1].end = e + 1;
        else vokalIndices.push({ start: e, end: e + 1 });
      }
    }
    if (vokalIndices.length < 2) return wort;
    var trennstellen = [];
    for (var v = 0; v < vokalIndices.length - 1; v++) {
      var nachVokal = vokalIndices[v].end;
      var vorVokal = vokalIndices[v + 1].start;
      var anzahlKons = vorVokal - nachVokal;
      var trennEinheit;
      if (anzahlKons === 0) trennEinheit = nachVokal;
      else if (anzahlKons === 1) trennEinheit = nachVokal;
      else {
        trennEinheit = vorVokal - 1;
        if (anzahlKons >= 2) {
          var vl = einheiten[vorVokal - 2]; var lt = einheiten[vorVokal - 1];
          if (vl.text === 's' && lt.text === 't') trennEinheit = vorVokal - 2;
        }
      }
      var charPos = einheiten[trennEinheit].pos;
      if (charPos > 0 && charPos < wort.length) trennstellen.push(charPos);
    }
    if (!trennstellen.length) return wort;
    var erg = '', letzte = 0;
    for (var t = 0; t < trennstellen.length; t++) { erg += wort.substring(letzte, trennstellen[t]) + '·'; letzte = trennstellen[t]; }
    return erg + wort.substring(letzte);
  }
  function silbenString(w) { return silbentrennung(w); }

  // Wort als HTML mit hervorgehobenem Graphem
  function graphemeHtml(word, g) {
    var idx = graphemeIndex(word, g);
    if (idx < 0) return escapeHtml(word);
    var len = g.id.length;
    return escapeHtml(word.slice(0, idx)) +
      '<span class="ll-graf">' + escapeHtml(word.slice(idx, idx + len)) + '</span>' +
      escapeHtml(word.slice(idx + len));
  }

  /* ---------- TTS (eigene, entkoppelte Vorlese-Funktion) ---------- */
  var _voice = null;
  function germanVoice() {
    if (_voice) return _voice;
    try {
      var vs = window.speechSynthesis.getVoices() || [];
      _voice = vs.filter(function (v) { return /de(-|_)/i.test(v.lang); })[0] || null;
    } catch (e) {}
    return _voice;
  }
  function speakWord(text, rate) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'de-DE';
      u.rate = rate || 0.85;
      var gv = germanVoice(); if (gv) u.voice = gv;
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  try {
    if ('speechSynthesis' in window && 'onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = function () { _voice = null; germanVoice(); };
    }
  } catch (e) {}

  /* ---------- WORT-VERGLEICH (faktorisiert aus der Story-ASR) ---------- */
  function normWord(s) {
    return (s || '').toLowerCase()
      .replace(/­/g, '')
      .replace(/[.,!?:;„“"»«‚'()\-–—…·]/g, '')
      .replace(/\s+/g, '').trim();
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    var prev = []; for (var k = 0; k <= n; k++) prev[k] = k;
    for (var i = 1; i <= m; i++) {
      var cur = [i];
      for (var j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }
  // Sehr großzügig — echte Kinder-ASR ist ungenau (siehe Story-Read-Aloud)
  function wordsMatch(said, target) {
    if (!said || !target) return false;
    if (said === target) return true;
    var shorter = said.length <= target.length ? said : target;
    var longer = said.length <= target.length ? target : said;
    if (shorter.length >= 3 && longer.indexOf(shorter) !== -1) return true;
    var p = Math.min(4, shorter.length);
    if (shorter.length >= 3 && said.slice(0, p) === target.slice(0, p)) return true;
    var tol = Math.max(1, Math.floor(longer.length * 0.4));
    return lev(said, target) <= tol;
  }

  /* ---------- FORTSCHRITT (localStorage, geteilt mit kind.html/Konto) ----------
     Schreibt in das aktive Kind (lk:children/lk:activeChildId), wenn vorhanden;
     sonst in einen Gast-Eimer. Struktur:
     child.laute = { fokus: 'sch', fortschritt: { sch:{practiced,words[],mastered} } } */
  function lsRead(key, fb) { try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (e) { return fb; } }
  function lsWrite(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  function activeChildRef() {
    var children = lsRead('lk:children', null);
    if (!children || !children.length) return null;
    var id = lsRead('lk:activeChildId', null);
    var child = null;
    if (id != null) { for (var i = 0; i < children.length; i++) if (children[i].id === id) { child = children[i]; break; } }
    if (!child) child = children[0];
    return { children: children, child: child };
  }
  function ensureLaute(child) {
    if (!child.laute) child.laute = { fokus: null, fortschritt: {} };
    if (!child.laute.fortschritt) child.laute.fortschritt = {};
    return child.laute;
  }
  function getProgress() {
    var ref = activeChildRef();
    if (ref) return ensureLaute(ref.child);
    return lsRead('lk:laute-gast', { fokus: null, fortschritt: {} });
  }
  function saveProgress(laute) {
    var ref = activeChildRef();
    if (ref) { ensureLaute(ref.child); ref.child.laute = laute; lsWrite('lk:children', ref.children); }
    else lsWrite('lk:laute-gast', laute);
  }
  function getFocus() { return (getProgress().fokus) || null; }
  function setFocus(id) { var p = getProgress(); p.fokus = id; saveProgress(p); }
  // Einen Übungsversuch verbuchen. recognized = ASR hat bestätigt (Extra-Stern).
  function recordAttempt(graphemeId, word, recognized) {
    var p = getProgress();
    var slot = p.fortschritt[graphemeId] || { practiced: 0, words: [], mastered: false };
    slot.practiced += 1;
    var lw = (word || '').toLowerCase();
    if (lw && slot.words.indexOf(lw) === -1) slot.words.push(lw);
    if (recognized) slot.recognized = (slot.recognized || 0) + 1;
    if (slot.practiced >= MASTER_THRESHOLD) slot.mastered = true;
    p.fortschritt[graphemeId] = slot;
    saveProgress(p);
    return slot;
  }

  /* ---------- MIKRO-CONSENT (gleicher Key wie die Story-Read-Aloud) ---------- */
  var MIC_KEY = 'lesekumpel-mic-consent';
  function hasConsent() { try { return localStorage.getItem(MIC_KEY) === '1'; } catch (e) { return false; } }
  function grantConsent() { try { localStorage.setItem(MIC_KEY, '1'); } catch (e) {} }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  function micSupported() { return !!SR; }

  function askConsent(onOk) {
    if (hasConsent()) { onOk(); return; }
    var ov = document.createElement('div');
    ov.className = 'll-modal';
    ov.innerHTML =
      '<div class="ll-modal-card" role="dialog" aria-modal="true" aria-label="Mikrofon erlauben">' +
      '<div class="ll-modal-ico">' + icon('mic') + '</div>' +
      '<h3>Darf ich dein Mikrofon nutzen?</h3>' +
      '<p>Dann kannst du die Wörter laut nachsprechen. Es wird nichts gespeichert.</p>' +
      '<div class="ll-modal-btns">' +
      '<button type="button" class="ll-btn ll-btn-ghost" data-no>Lieber nicht</button>' +
      '<button type="button" class="ll-btn ll-btn-primary" data-yes>Ja, los geht’s!</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    ov.querySelector('[data-yes]').addEventListener('click', function () { grantConsent(); ov.remove(); onOk(); });
    ov.querySelector('[data-no]').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
  }

  // Zuhören und gegen EIN Zielwort prüfen. Ergebnis via cb(recognized:boolean).
  // Robust wie das Story-Vorlesen: continuous + interimResults, prüft jeden
  // (Zwischen-)Treffer, startet bei vorzeitigem Chrome-Stop neu — bis Timeout.
  function listenOnce(target, onState, cb) {
    if (!SR) { cb(false); return null; }
    var rec;
    try { rec = new SR(); } catch (e) { cb(false); return null; }
    rec.lang = 'de-DE';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    var done = false;
    var tgt = normWord(target);
    var deadline = Date.now() + 7000;
    var timer = null;
    function finish(ok) {
      if (done) return; done = true;
      clearTimeout(timer);
      try { rec.onresult = rec.onerror = rec.onend = null; rec.stop(); } catch (e) {}
      if (onState) onState('idle');
      cb(ok);
    }
    function hit(transcript) {
      var toks = (transcript || '').split(/\s+/).map(normWord).filter(Boolean);
      for (var t = 0; t < toks.length; t++) if (wordsMatch(toks[t], tgt)) return true;
      return false;
    }
    rec.onresult = function (ev) {
      var full = '';
      for (var i = 0; i < ev.results.length; i++) {
        for (var j = 0; j < ev.results[i].length; j++) full += ' ' + (ev.results[i][j].transcript || '');
      }
      if (hit(full)) finish(true);
    };
    rec.onerror = function (e) {
      // Nur harte Fehler beenden; no-speech/network/aborted ignorieren (Timeout greift)
      if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) finish(false);
    };
    rec.onend = function () {
      if (done) return;
      // Chrome stoppt nach kurzer Stille — bis zum Timeout neu starten
      if (Date.now() < deadline) { try { rec.start(); } catch (e) { finish(false); } }
      else finish(false);
    };
    try { rec.start(); if (onState) onState('listening'); } catch (e) { finish(false); }
    timer = setTimeout(function () { finish(false); }, 7000);
    return rec;
  }

  /* ---------- LUCIDE-INLINE-ICONS (Style-Guide: keine Emojis) ---------- */
  function icon(name) {
    var P = {
      ear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
      mic: '<path d="M12 19v3"/><path d="M8 22h8"/><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/>',
      volume: '<path d="M11 4.7 6.5 8H3v8h3.5L11 19.3z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.5 6.5a9 9 0 0 1 0 11"/>',
      star: '<path d="M11.5 2.3 14 8l6.3.5-4.8 4 1.5 6.1-5.5-3.3L6 18.6l1.5-6.1-4.8-4L9 8z"/>',
      check: '<path d="M20 6 9 17l-5-5"/>',
      sound: '<path d="M2 10v4"/><path d="M6 6v12"/><path d="M10 3v18"/><path d="M14 8v8"/><path d="M18 5v14"/><path d="M22 10v4"/>'
    };
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  /* ---------- STYLES (einmalig injiziert, file://-fest) ---------- */
  function injectStyles() {
    if (document.getElementById('ll-styles')) return;
    var css =
      '.ll-graf{color:var(--accent-coral,#D67171);font-weight:800;}' +
      '#panel-lautlese .ll-intro-row{display:flex;align-items:flex-start;gap:10px;justify-content:center;max-width:580px;margin:0 auto 20px;}' +
      '#panel-lautlese .ll-intro{font-family:var(--font-heading,Fredoka),sans-serif;font-size:1.3rem;line-height:1.45;margin:0;color:var(--navy,#2B3140);text-align:left;}' +
      '#panel-lautlese .ll-intro b{color:var(--accent-coral,#D67171);}' +
      '.ll-intro-read{width:46px;height:46px;}' +
      '.ll-list{display:flex;flex-direction:column;gap:12px;max-width:580px;margin:0 auto;}' +
      '.ll-row{display:flex;align-items:center;gap:14px;background:var(--bg-card,#fff);border:2px solid var(--border,#D9D4CC);border-radius:22px;padding:16px 20px;transition:border-color .18s,background .18s,box-shadow .18s;}' +
      '.ll-row .ll-main{flex:1;min-width:0;text-align:left;}' +
      '.ll-row .ll-word{font-family:var(--font-heading,Fredoka),sans-serif;font-size:2rem;font-weight:600;line-height:1.15;color:var(--navy,#2B3140);}' +
      '.ll-row .ll-syl{font-size:1.05rem;color:var(--text-muted,#7a7468);letter-spacing:.02em;margin-top:2px;}' +
      '.ll-row .ll-status{font-size:.9rem;font-weight:700;margin-top:5px;display:none;align-items:center;gap:5px;}' +
      '.ll-row .ll-status svg{width:16px;height:16px;}' +
      '.ll-row .ll-side{display:flex;align-items:center;gap:12px;flex-shrink:0;}' +
      '.ll-row .ll-actions{display:flex;gap:8px;}' +
      '.ll-row.is-success{border-color:var(--mint,#2FB8A6);background:rgba(47,184,166,.09);}' +
      '.ll-row.is-success .ll-status{display:flex;color:#1A8676;}' +
      '.ll-row.is-almost{border-color:var(--primary-yellow,#FFD54F);background:rgba(255,213,79,.16);}' +
      '.ll-row.is-almost .ll-status{display:flex;color:#9a7400;}' +
      '.ll-iconbtn{width:52px;height:52px;border-radius:50%;border:2px solid var(--border,#D9D4CC);background:#fff;color:var(--navy,#2B3140);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
      '.ll-iconbtn svg{width:24px;height:24px;}' +
      '.ll-iconbtn.ll-hear{color:var(--mint,#2FB8A6);border-color:rgba(47,184,166,.5);}' +
      '.ll-iconbtn.ll-say{color:var(--accent-coral,#D67171);border-color:rgba(214,113,113,.5);}' +
      '.ll-iconbtn.listening{animation:llPulse 1s ease-in-out infinite;background:var(--accent-coral,#D67171);color:#fff;}' +
      '.ll-iconbtn:disabled{opacity:.4;cursor:default;}' +
      '.ll-stars{display:inline-flex;gap:3px;min-width:44px;justify-content:flex-end;color:#dcd7cd;}' +
      '.ll-stars .on{color:var(--primary-yellow,#FFD54F);}' +
      '.ll-stars svg{width:18px;height:18px;fill:currentColor;stroke:none;}' +
      '@media(max-width:480px){.ll-row .ll-word{font-size:1.65rem;}.ll-iconbtn{width:46px;height:46px;}#panel-lautlese .ll-intro{font-size:1.15rem;}}' +
      '.ll-done-banner{margin-top:18px;padding:16px;border-radius:18px;background:rgba(47,184,166,.12);color:var(--navy,#2B3140);text-align:center;font-weight:600;max-width:580px;margin:18px auto 0;}' +
      '@keyframes llPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.12);}}' +
      '@media(prefers-reduced-motion:reduce){.ll-iconbtn.listening{animation:none;}}' +
      /* Modal */
      '.ll-modal{position:fixed;inset:0;background:rgba(43,49,64,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}' +
      '.ll-modal-card{background:#fff;border-radius:24px;max-width:380px;padding:26px 24px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.25);}' +
      '.ll-modal-ico{color:var(--accent-coral,#D67171);}.ll-modal-ico svg{width:42px;height:42px;}' +
      '.ll-modal-card h3{font-family:var(--font-heading,Fredoka),sans-serif;margin:8px 0 6px;color:var(--navy,#2B3140);}' +
      '.ll-modal-card p{color:var(--text-muted,#7a7468);margin:0 0 18px;}' +
      '.ll-modal-btns{display:flex;gap:10px;justify-content:center;}' +
      '.ll-btn{border:none;border-radius:14px;padding:12px 18px;font-weight:700;cursor:pointer;font-family:inherit;}' +
      '.ll-btn-primary{background:var(--accent-coral,#D67171);color:#fff;}' +
      '.ll-btn-ghost{background:#f0ece4;color:var(--navy,#2B3140);}' +
      /* Album (kind.html) */
      '.laute-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px;}' +
      '.laut-chip{position:relative;border:2px solid var(--border,#D9D4CC);background:#fff;border-radius:18px;padding:14px 8px 12px;cursor:pointer;text-align:center;font-family:var(--font-heading,Fredoka),sans-serif;transition:transform .12s,border-color .12s,box-shadow .12s;}' +
      '.laut-chip:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(43,49,64,.1);}' +
      '.laut-chip .lc-label{font-size:1.6rem;color:var(--navy,#2B3140);line-height:1;}' +
      '.laut-chip .lc-bsp{font-size:.78rem;color:var(--text-muted,#7a7468);margin-top:3px;}' +
      '.laut-chip .lc-bar{height:6px;border-radius:4px;background:#eee;margin-top:8px;overflow:hidden;}' +
      '.laut-chip .lc-bar i{display:block;height:100%;background:var(--mint,#2FB8A6);}' +
      '.laut-chip.is-focus{border-color:var(--accent-coral,#D67171);box-shadow:0 0 0 3px rgba(214,113,113,.18);}' +
      '.laut-chip.is-master{border-color:var(--mint,#2FB8A6);background:rgba(47,184,166,.08);}' +
      '.laut-chip.is-next::after{content:"empfohlen";position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:var(--primary-yellow,#FFD54F);color:#5a4a00;font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:8px;font-family:var(--font-body,Quicksand),sans-serif;}';
    var st = document.createElement('style');
    st.id = 'll-styles';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- STORY-ÜBUNG (Panel-Inhalt rendern) ---------- */
  function inlineIcon(name) {
    return icon(name).replace('aria-hidden="true"', 'aria-hidden="true" style="width:1em;height:1em;vertical-align:-2px"');
  }
  function starsHtml(n) {
    var s = '<span class="ll-stars" aria-hidden="true">';
    for (var i = 0; i < 2; i++) s += '<span class="' + (i < n ? 'on' : '') + '">' + icon('star') + '</span>';
    return s + '</span>';
  }

  function renderExercise(panel, graphemeId, words) {
    var g = BY_ID[graphemeId];
    injectStyles();
    var total = words.length;
    var doneStars = {};

    var introText = 'Wir üben den ' + g.label + '-Laut! Tippe auf den Lautsprecher und hör zu. Sprich das Wort dann nach.';
    var head = '<div class="ll-intro-row">' +
      '<p class="ll-intro">Wir üben den <b>' + escapeHtml(g.label) + '</b>-Laut!<br>' +
      'Tippe auf ' + inlineIcon('volume') + ' und hör zu. Sprich das Wort dann nach.</p>' +
      '<button type="button" class="ll-iconbtn ll-hear ll-intro-read" aria-label="Aufgabe vorlesen">' + icon('volume') + '</button>' +
      '</div>';
    var rows = '<div class="ll-list">';
    words.forEach(function (w, i) {
      rows += '<div class="ll-row" data-i="' + i + '">' +
        '<div class="ll-main">' +
          '<div class="ll-word">' + w.html + '</div>' +
          '<div class="ll-syl">' + escapeHtml(w.silben) + '</div>' +
          '<div class="ll-status"></div>' +
        '</div>' +
        '<div class="ll-side">' +
          '<div class="ll-actions">' +
            '<button type="button" class="ll-iconbtn ll-hear" aria-label="Wort anhören">' + icon('volume') + '</button>' +
            '<button type="button" class="ll-iconbtn ll-say" aria-label="Wort nachsprechen"' + (micSupported() ? '' : ' disabled title="Mikro auf diesem Gerät nicht verfügbar"') + '>' + icon('mic') + '</button>' +
          '</div>' + starsHtml(0) +
        '</div>' +
      '</div>';
    });
    rows += '</div><div class="ll-done-banner" id="ll-done" hidden></div>';
    panel.innerHTML = head + rows;

    var introRead = panel.querySelector('.ll-intro-read');
    if (introRead) introRead.addEventListener('click', function () { speakWord(introText, 0.95); });

    var rowEls = panel.querySelectorAll('.ll-row');
    function setStars(row, n) {
      var holder = row.querySelector('.ll-stars');
      if (holder) holder.outerHTML = starsHtml(n);
    }
    function setStatus(row, kind) {
      var st = row.querySelector('.ll-status');
      st.style.display = ''; st.style.color = '';
      row.classList.remove('is-success', 'is-almost');
      if (kind === 'listening') { st.style.display = 'flex'; st.style.color = 'var(--accent-coral,#D67171)'; st.innerHTML = icon('mic') + ' Ich höre zu …'; }
      else if (kind === 'success') { row.classList.add('is-success'); st.innerHTML = icon('check') + ' Super, genau!'; }
      else if (kind === 'almost') { row.classList.add('is-almost'); st.innerHTML = icon('mic') + ' Fast! Sprich es noch einmal.'; }
    }
    function record(i, recognized) {
      var stars = Math.min(2, Math.max(doneStars[i] || 0, recognized ? 2 : 1));
      doneStars[i] = stars;
      setStars(rowEls[i], stars);
      setStatus(rowEls[i], recognized ? 'success' : 'almost');
      recordAttempt(graphemeId, words[i].wort, recognized);
      if (Object.keys(doneStars).length >= total) {
        var b = panel.querySelector('#ll-done');
        if (b) { b.hidden = false; b.innerHTML = icon('star') + ' Stark! Du hast alle ' + escapeHtml(g.label) + '-Wörter geübt.'; }
        celebrate(panel);
      }
    }

    rowEls.forEach(function (row, i) {
      row.querySelector('.ll-hear').addEventListener('click', function () { speakWord(words[i].wort); });
      var sayBtn = row.querySelector('.ll-say');
      if (!micSupported()) return;
      sayBtn.addEventListener('click', function () {
        askConsent(function () {
          try { window.speechSynthesis.cancel(); } catch (e) {}
          setStatus(row, 'listening');
          listenOnce(words[i].wort, function (state) {
            sayBtn.classList.toggle('listening', state === 'listening');
          }, function (recognized) {
            // Mikro ist reine Ermutigung: Versuch zählt IMMER.
            record(i, recognized);
          });
        });
      });
    });
  }

  function celebrate(scope) {
    try {
      if (window.KontoFX && typeof window.KontoFX.confetti === 'function') { window.KontoFX.confetti(); return; }
    } catch (e) {}
    try { if (typeof window.showConfetti === 'function') window.showConfetti(); } catch (e) {}
  }

  /* ---------- STORY-BOOTSTRAP ----------
     Hängt synchron (zur Eval-Zeit, vor DOMContentLoaded → initActivityTabs)
     einen „Laute"-Tab + Panel in die bestehende Spielzeit-Aktivität ein. */
  function bootstrapStory() {
    if (typeof rawStory === 'undefined') return;          // keine Story-Seite
    var chooser = document.querySelector('.activity-tabs.spiel-chooser');
    var content = document.querySelector('.spielzeit-content');
    if (!chooser || !content) return;
    if (document.getElementById('tab-lautlese')) return;  // idempotent

    var profile = profileStory(rawStory);
    var focus = pickFocusGraphem(profile, getFocus());
    if (!focus) return;                                   // Text gibt nichts her
    var words = extractLautWords(rawStory, focus, 6);
    if (words.length < MIN_WORDS) return;

    injectStyles();

    // Tab-Button (Lucide-Icon, kein Emoji — Style-Guide)
    var tab = document.createElement('button');
    tab.className = 'activity-tab';
    tab.id = 'tab-lautlese';
    tab.setAttribute('data-tab', 'lautlese');
    tab.setAttribute('onclick', "openSpiel('lautlese')");
    tab.innerHTML = '<span class="tab-icon">' + icon('ear') + '</span><span class="tab-label">Laute</span>';
    chooser.appendChild(tab);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'panel-lautlese';
    panel.className = 'activity-panel';
    content.appendChild(panel);

    // Titel für die Vollbild-Spielansicht (SPIEL_TITEL ist ein geteilter
    // Top-Level-const der Story-Skripte → über den Lexical-Scope erreichbar).
    try { if (typeof SPIEL_TITEL !== 'undefined') SPIEL_TITEL.lautlese = 'Laute üben'; } catch (e) {}

    renderExercise(panel, focus, words);
  }

  // Synchron versuchen (Script liegt am Body-Ende → Hub-DOM existiert bereits).
  try { bootstrapStory(); } catch (e) { /* niemals die Story kaputtmachen */ }

  /* ---------- PUBLIC API ---------- */
  window.Lautlese = {
    LAUT_INVENTORY: LAUT_INVENTORY,
    byId: function (id) { return BY_ID[id] || null; },
    MIN_WORDS: MIN_WORDS,
    MASTER_THRESHOLD: MASTER_THRESHOLD,
    cleanWord: cleanWord,
    matchesGrapheme: matchesGrapheme,
    extractLautWords: extractLautWords,
    profileStory: profileStory,
    pickFocusGraphem: pickFocusGraphem,
    silbentrennung: silbentrennung,
    graphemeHtml: graphemeHtml,
    speakWord: speakWord,
    icon: icon,
    injectStyles: injectStyles,
    renderExercise: renderExercise,
    // Fortschritt / Lernpfad
    getProgress: getProgress,
    getFocus: getFocus,
    setFocus: setFocus,
    recordAttempt: recordAttempt,
    micSupported: micSupported,
    listenOnce: listenOnce,
    wordsMatch: wordsMatch,
    normWord: normWord
  };
})();
