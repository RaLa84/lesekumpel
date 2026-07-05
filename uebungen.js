/* ============================================================
   Lesekumpel · uebungen.js
   Übungs-Engine für die Lernpfad-Lektionen (kind.html).
   Rendert die Items aus uebungen-data.js in 4 Formaten:
   word (Wortzeilen wie Meine Laute), build (Wort-Bausteine),
   choice (Auswählen), satz/dialog/text (Sätze & Dialoge).

   Abhängigkeiten (weich, alle via window.*):
   - Lautlese: speakWord, listenOnce, micSupported, askConsent,
     silbentrennung, injectStyles (.ll-*-Klassen werden wiederverwendet)
   - Lernpfad: icon(), loadTop100() (Lektion 1.1)
   - UebungenData: LESSONS

   Persistenz (Muster lautlese.js): schreibt direkt ins aktive Kind
   (lk:children/lk:activeChildId), sonst Gast-Eimer lk:lernpfad-gast.
   Struktur: child.lernpfad = {
     done:     { '2.2': '2026-07-02' },
     progress: { '2.2': { items: ['st1', …] } },
     top100:   { words: { 'ich': 'Funktionswörter' },
                 totals: { 'Funktionswörter': 30, … } }
   }
   Die Seite (kind.html) wird über opts.onItemDone/onComplete
   benachrichtigt und holt sich das Kind per Konto.getActiveChild().

   Philosophie: nichts blockiert, Mikro ist reine Ermutigung,
   falsche Antworten bleiben offen ("Fast! Probier es nochmal").
   ============================================================ */
(function () {
  'use strict';

  /* ---------- PERSISTENZ (Spiegel des lautlese.js-Musters) ---------- */
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
  function blankLernpfad() { return { done: {}, progress: {}, top100: { words: {}, totals: {} } }; }
  function ensureLernpfad(lp) {
    lp = lp || blankLernpfad();
    if (!lp.done) lp.done = {};
    if (!lp.progress) lp.progress = {};
    if (!lp.top100) lp.top100 = { words: {}, totals: {} };
    if (!lp.top100.words) lp.top100.words = {};
    if (!lp.top100.totals) lp.top100.totals = {};
    return lp;
  }
  function getLernpfad() {
    var ref = activeChildRef();
    if (ref) return ensureLernpfad(ref.child.lernpfad);
    return ensureLernpfad(lsRead('lk:lernpfad-gast', null));
  }
  function saveLernpfad(lp) {
    var ref = activeChildRef();
    if (ref) { ref.child.lernpfad = lp; lsWrite('lk:children', ref.children); }
    else lsWrite('lk:lernpfad-gast', lp);
  }
  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1); if (m.length < 2) m = '0' + m;
    var day = String(d.getDate()); if (day.length < 2) day = '0' + day;
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function markDone(lessonId) {
    var lp = getLernpfad();
    if (!lp.done[lessonId]) { lp.done[lessonId] = todayStr(); saveLernpfad(lp); }
  }
  // Item verbuchen; liefert true, wenn die Lektion damit komplett ist
  function recordItem(lessonId, itemId, totalItems) {
    var lp = getLernpfad();
    var slot = lp.progress[lessonId] || { items: [] };
    if (slot.items.indexOf(itemId) === -1) slot.items.push(itemId);
    lp.progress[lessonId] = slot;
    var complete = totalItems > 0 && slot.items.length >= totalItems;
    if (complete && !lp.done[lessonId]) lp.done[lessonId] = todayStr();
    saveLernpfad(lp);
    return complete;
  }
  function recordTop100(wort, klasse) {
    var lp = getLernpfad();
    lp.top100.words[String(wort).toLowerCase()] = klasse;
    var total = 0, done = 0, k;
    for (k in lp.top100.totals) if (lp.top100.totals.hasOwnProperty(k)) total += lp.top100.totals[k];
    done = Object.keys(lp.top100.words).length;
    var complete = total > 0 && done >= total;
    if (complete && !lp.done['1.1']) lp.done['1.1'] = todayStr();
    saveLernpfad(lp);
    return complete;
  }
  function setTop100Totals(klassen) {
    var lp = getLernpfad();
    var totals = {};
    (klassen || []).forEach(function (kl) { totals[kl.name] = kl.words.length; });
    lp.top100.totals = totals;
    saveLernpfad(lp);
  }

  /* ---------- HELFER ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  // Wort mit markiertem Teilstring (mark), optional am Wortende gesucht
  function markHtml(wort, mark, markAt) {
    if (!mark) return esc(wort);
    var idx = markAt === 'end'
      ? wort.toLowerCase().lastIndexOf(mark.toLowerCase())
      : wort.toLowerCase().indexOf(mark.toLowerCase());
    if (idx < 0) return esc(wort);
    return esc(wort.slice(0, idx)) +
      '<span class="ue-hi">' + esc(wort.slice(idx, idx + mark.length)) + '</span>' +
      esc(wort.slice(idx + mark.length));
  }
  // [Klammer]-Highlights in Sätzen → <span class="ue-hi">
  function satzHtml(satz) {
    var out = '', rest = String(satz || '');
    while (true) {
      var a = rest.indexOf('['), b = rest.indexOf(']');
      if (a < 0 || b < 0 || b < a) { out += esc(rest); break; }
      out += esc(rest.slice(0, a)) + '<span class="ue-hi">' + esc(rest.slice(a + 1, b)) + '</span>';
      rest = rest.slice(b + 1);
    }
    return out;
  }
  function stripMarkup(s) { return String(s || '').replace(/[\[\]]/g, ''); }
  function speak(text, rate) {
    if (window.Lautlese) Lautlese.speakWord(stripMarkup(text), rate || 0.9);
  }
  function icon(name) {
    if (window.Lernpfad) return Lernpfad.icon(name);
    return '';
  }
  function llIcon(name) {
    if (window.Lautlese) return Lautlese.icon(name);
    return '';
  }
  // Fisher-Yates auf Kopie
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- BILDKARTEN: Top-100-Wortbilder (nur bildbare Wörter) ----------
     Auflockerung für Lektion 1.1: konkrete Nomen/Farben bekommen ein Bild
     neben dem Wort. On-brand Inline-SVG (kein Emoji, Style-Guide) bzw. ein
     Farb-Swatch. Abstrakte Funktionswörter (ich, und, ist …) bleiben bewusst
     ohne Bild → Wortkarte fällt sauber auf die reine Textzeile zurück.
     Schlüssel = Wort in Kleinschreibung. */
  function picSvg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }
  var TOP100_PIC = {
    // Nomen / Natur / Dinge
    'sonne': { svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
    'mond': { svg: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
    'haus': { svg: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' },
    'baum': { svg: '<path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"/><path d="M12 19v3"/>' },
    'wasser': { svg: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>' },
    'buch': { svg: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>' },
    'auto': { svg: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>' },
    'bett': { svg: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
    'stift': { svg: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>' },
    'fisch': { svg: '<path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/><path d="m16.01 17.93-.23 1.67a.75.75 0 0 1-.94.62A6.44 6.44 0 0 1 10 15.44"/>' },
    'vogel': { svg: '<path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/>' },
    'katze': { svg: '<path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/>' },
    'hund': { svg: '<path d="M11.25 16.25h1.5L12 17z"/><path d="M16 14v.5"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/><path d="M8 14v.5"/><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>' },
    'maus': { svg: '<path d="M8 2h1a5 5 0 0 1 5 5 3 3 0 0 1-3 3H8"/><circle cx="6" cy="7" r="4"/><path d="M4 7h.01"/><path d="M14 10c2.8 0 5 2.2 5 5v1a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-1"/><path d="M9 19v2"/><path d="M13 19v2"/>' },
    'schule': { svg: '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10"/><path d="M18 5v17"/><path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>' },
    'baby': { svg: '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3"/>' },
    // Verben / Aktionen
    'lesen': { svg: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>' },
    'schreiben': { svg: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>' },
    'schlafen': { svg: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
    'sehen': { svg: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>' },
    'essen': { svg: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>' },
    'singen': { svg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
    'laufen': { svg: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>' },
    'rennen': { svg: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>' },
    // Adjektive
    'warm': { svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
    'laut': { svg: '<path d="M11 4.7 6.5 8H3v8h3.5L11 19.3z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.5 6.5a9 9 0 0 1 0 11"/>' },
    'leise': { svg: '<path d="M11 4.7 6.5 8H3v8h3.5L11 19.3z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>' },
    // Farben → Swatch
    'rot': { color: '#E5484D' },
    'blau': { color: '#4A7BEC' },
    'grün': { color: '#46B26A' },
    'gelb': { color: '#F5C518' }
  };
  function wordPicture(wort) {
    var p = TOP100_PIC[String(wort || '').toLowerCase()];
    if (!p) return '';
    if (p.color) return '<span class="ue-wordpic is-color" style="background:' + p.color + '" aria-hidden="true"></span>';
    return '<span class="ue-wordpic" aria-hidden="true">' + picSvg(p.svg) + '</span>';
  }

  /* ---------- STYLES (einmalig; .ue-* liegt in konto.css) ---------- */
  function injectStyles() {
    if (window.Lautlese) Lautlese.injectStyles(); // .ll-*-Klassen
    if (document.getElementById('ue-pic-styles')) return;
    var css =
      '.ue-wordpic{flex-shrink:0;width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(47,184,166,.12);color:var(--navy,#2B3140);}' +
      '.ue-wordpic svg{width:34px;height:34px;}' +
      '.ue-wordpic.is-color{border:2px solid rgba(43,49,64,.12);}' +
      '.ll-row.is-success .ue-wordpic{background:rgba(47,184,166,.2);}' +
      '@media(max-width:480px){.ue-wordpic{width:46px;height:46px;border-radius:13px;}.ue-wordpic svg{width:28px;height:28px;}}';
    var st = document.createElement('style');
    st.id = 'ue-pic-styles';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ============================================================
     RENDER: eine Lektion als Übungs-Ansicht in panel
     opts: { phase:{farbe, farbeSoft}, onItemDone(), onComplete(result) }
     ============================================================ */
  function renderExercise(panel, lesson, opts) {
    opts = opts || {};
    injectStyles();
    if (lesson.kind === 'top100') { renderTop100(panel, lesson, opts); return; }
    var data = window.UebungenData && UebungenData.get(lesson.id);
    if (!data) {
      panel.innerHTML = '<div class="info-card">Diese Lektion wird gerade vorbereitet. Schau bald wieder vorbei!</div>';
      return;
    }
    renderItems(panel, lesson, opts, data.items, {
      countLabel: function (done, total) { return done + ' von ' + total + ' geschafft'; },
      isPersisted: function (item) {
        var lp = getLernpfad();
        var slot = lp.progress[lesson.id];
        return !!(slot && slot.items.indexOf(item.id) !== -1);
      },
      persist: function (item) { return recordItem(lesson.id, item.id, data.items.length); },
      doneText: 'Stark! Du hast alle Aufgaben dieser Lektion geschafft.'
    });
  }

  /* ---------- TOP-100 (Runden à 10 aus der CSV) ---------- */
  var ROUND_SIZE = 10;
  function renderTop100(panel, lesson, opts) {
    panel.innerHTML = '<div class="info-card">Ich hole die W&ouml;rter&hellip;</div>';
    if (!window.Lernpfad) return;
    Lernpfad.loadTop100(function (data) {
      if (!data) {
        panel.innerHTML = '<div class="info-card">Die W&ouml;rter gibt es online auf der Webseite.</div>';
        return;
      }
      setTop100Totals(data.klassen);
      var lp = getLernpfad();
      var practiced = lp.top100.words;
      var all = [];
      data.klassen.forEach(function (kl) {
        kl.words.forEach(function (w) { all.push({ wort: w.wort, silben: w.silben, klasse: kl.name }); });
      });
      var total = all.length;
      var open = all.filter(function (w) { return !practiced[w.wort.toLowerCase()]; });
      var roundWords = (open.length ? open : all).slice(0, ROUND_SIZE);
      var items = roundWords.map(function (w) {
        return { id: 't100-' + w.wort.toLowerCase(), type: 'word', wort: w.wort, silben: w.silben, klasse: w.klasse };
      });
      var doneCount = function () { return Object.keys(getLernpfad().top100.words).length; };
      renderItems(panel, lesson, opts, items, {
        countLabel: function () { return doneCount() + ' von ' + total + ' Wörtern gesammelt'; },
        isPersisted: function (item) {
          return !!getLernpfad().top100.words[item.wort.toLowerCase()];
        },
        persist: function (item) { return recordTop100(item.wort, item.klasse); },
        // Funktion: wird erst bei Runden-Abschluss ausgewertet (aktueller Stand)
        doneText: function () {
          var dc = doneCount();
          return dc >= total
            ? 'Wow — du hast alle ' + total + ' Wörter geübt!'
            : 'Runde geschafft! Schon ' + dc + ' von ' + total + ' Wörtern gesammelt.';
        },
        nextRound: true,
        nextRoundLabel: open.length > ROUND_SIZE ? 'Nächste Runde' : 'Nochmal üben',
        rerender: function () { renderTop100(panel, lesson, opts); }
      });
    });
  }

  /* ---------- GEMEINSAMER ITEM-RENDERER ---------- */
  function renderItems(panel, lesson, opts, items, cfg) {
    var phase = opts.phase || {};
    var total = items.length;
    var state = {};   // itemId -> { done, played:{}, needQ, qDone }
    items.forEach(function (it) { state[it.id] = { done: cfg.isPersisted(it) }; });

    var introText = lesson.title + '. ' + (lesson.preview || '');
    var head =
      '<div class="ue-head" style="--lp-c:' + (phase.farbe || 'var(--mint)') + ';--lp-cs:' + (phase.farbeSoft || 'rgba(47,184,166,0.14)') + ';">' +
        '<div class="ue-head-ico" aria-hidden="true">' + icon(lesson.icon) + '</div>' +
        '<div class="ue-head-text">' +
          '<h3>' + esc(lesson.title) + '</h3>' +
          '<p>' + esc(lesson.preview || '') + '</p>' +
        '</div>' +
        '<button type="button" class="ll-read-btn ue-read" aria-label="Aufgabe vorlesen">' +
          llIcon('volume') + '<span class="ll-read-label">Vorlesen</span></button>' +
      '</div>' +
      '<div class="ll-progress-track" aria-hidden="true"><i id="ue-progress"></i></div>' +
      '<p class="ue-count" id="ue-count"></p>';

    var body = '<div class="ue-list">' + items.map(function (it) { return itemHtml(it, state[it.id].done); }).join('') + '</div>' +
      '<div class="ll-done-banner" id="ue-done" hidden></div>' +
      (cfg.nextRound ? '<button type="button" class="ue-next-btn" id="ue-next" hidden>' + esc(cfg.nextRoundLabel || 'Nächste Runde') + '</button>' : '');

    panel.innerHTML = head + body;
    panel.querySelector('.ue-read').addEventListener('click', function () { speak(introText, 0.95); });

    function doneCount() {
      var n = 0; items.forEach(function (it) { if (state[it.id].done) n++; });
      return n;
    }
    function updateProgress() {
      var fill = panel.querySelector('#ue-progress');
      if (fill) fill.style.width = Math.round(doneCount() / total * 100) + '%';
      var cnt = panel.querySelector('#ue-count');
      if (cnt) cnt.textContent = cfg.countLabel(doneCount(), total);
    }
    var completedThisSession = false;
    function completeItem(item, card) {
      var st = state[item.id];
      var wasDone = st.done;
      st.done = true;
      if (card) card.classList.add('is-done');
      var lessonComplete = false;
      if (!wasDone) {
        lessonComplete = cfg.persist(item);
        if (opts.onItemDone) opts.onItemDone(item);
      }
      updateProgress();
      if (doneCount() >= total && !completedThisSession) {
        completedThisSession = true;
        var b = panel.querySelector('#ue-done');
        var txt = typeof cfg.doneText === 'function' ? cfg.doneText() : cfg.doneText;
        if (b) { b.hidden = false; b.innerHTML = llIcon('star') + ' ' + esc(txt); }
        var nx = panel.querySelector('#ue-next');
        if (nx) { nx.hidden = false; nx.addEventListener('click', function () { cfg.rerender(); }); }
        if (opts.onComplete) opts.onComplete({ lesson: lesson.id, lessonDone: !!getLernpfad().done[lesson.id] });
      }
    }

    // Verkabeln je Item
    items.forEach(function (it) {
      var card = panel.querySelector('[data-item="' + it.id + '"]');
      if (!card) return;
      if (it.type === 'word') wireWord(it, card, completeItem);
      else if (it.type === 'build') wireBuild(it, card, completeItem);
      else if (it.type === 'choice') wireChoice(it, card, completeItem);
      else if (it.type === 'satz') wireSatz(it, card, completeItem);
      else if (it.type === 'dialog') wireDialog(it, card, completeItem);
      else if (it.type === 'text') wireText(it, card, completeItem);
    });
    updateProgress();
  }

  /* ---------- ITEM-MARKUP ---------- */
  function starsHtml(n) {
    var s = '<span class="ll-stars" aria-hidden="true">';
    for (var i = 0; i < 2; i++) s += '<span class="' + (i < n ? 'on' : '') + '">' + llIcon('star') + '</span>';
    return s + '</span>';
  }
  function hearBtn(label) {
    return '<button type="button" class="ll-iconbtn ll-hear" aria-label="' + esc(label || 'Anhören') + '">' + llIcon('volume') + '</button>';
  }
  function frageHtml(frage, optionen) {
    var f = esc(frage).replace(/___/g, '<span class="ue-gap">&nbsp;&nbsp;&nbsp;&nbsp;</span>');
    return '<div class="ue-frage">' + f + '</div>' +
      '<div class="ue-opts">' +
      shuffled(optionen.map(function (o, i) { return { text: o, right: i === 0 }; }))
        .map(function (o) {
          return '<button type="button" class="ue-opt" data-right="' + (o.right ? '1' : '0') + '">' + esc(o.text) + '</button>';
        }).join('') +
      '</div><div class="ue-feedback" aria-live="polite"></div>';
  }

  function itemHtml(it, isDone) {
    var doneCls = isDone ? ' is-done' : '';
    if (it.type === 'word') {
      var silben = it.silben || (window.Lautlese ? Lautlese.silbentrennung(it.wort) : it.wort);
      var mic = (window.Lautlese && Lautlese.micSupported())
        ? '<button type="button" class="ll-iconbtn ll-say" aria-label="Wort nachsprechen">' + llIcon('mic') + '</button>' : '';
      return '<div class="ll-row ue-item' + doneCls + '" data-item="' + esc(it.id) + '">' +
        wordPicture(it.wort) +
        '<div class="ll-main">' +
          '<div class="ll-word">' + markHtml(it.wort, it.mark, it.markAt) + '</div>' +
          '<div class="ll-syl">' + esc(silben) + '</div>' +
          '<div class="ll-status"></div>' +
        '</div>' +
        '<div class="ll-side"><div class="ll-actions">' + hearBtn('Wort anhören') + mic + '</div>' + starsHtml(isDone ? 1 : 0) + '</div>' +
        '</div>';
    }
    if (it.type === 'build') {
      var chips = it.teile.map(function (t, i) {
        return '<button type="button" class="ue-chip' + (i === it.hi ? ' is-hi' : '') + '" data-i="' + i + '">' + esc(t) + '</button>';
      }).join('<span class="ue-plus" aria-hidden="true">+</span>');
      return '<div class="ue-card ue-item' + doneCls + '" data-item="' + esc(it.id) + '">' +
        '<div class="ue-chips">' + chips + '</div>' +
        '<div class="ue-built" hidden><span class="ue-built-word"></span>' + hearBtn('Ganzes Wort anhören') + '</div>' +
        '<div class="ue-feedback" aria-live="polite">Tippe die Bausteine an!</div>' +
        '</div>';
    }
    if (it.type === 'choice') {
      var satz = it.satz
        ? '<div class="ue-zeile">' + hearBtn('Satz anhören') + '<div class="ue-satz">' + satzHtml(it.satz) + '</div></div>'
        : '';
      return '<div class="ue-card ue-item' + doneCls + '" data-item="' + esc(it.id) + '">' +
        satz + frageHtml(it.frage, it.optionen) + '</div>';
    }
    if (it.type === 'satz') {
      var q = it.frage ? frageHtml(it.frage.frage, it.frage.optionen) : '';
      return '<div class="ue-card ue-item' + doneCls + '" data-item="' + esc(it.id) + '">' +
        '<div class="ue-zeile">' + hearBtn('Satz anhören') + '<div class="ue-satz">' + satzHtml(it.satz) + '</div></div>' +
        '<div class="ue-feedback" aria-live="polite">Lies den Satz laut — hör ihn dir an, wenn du magst.</div>' + q +
        '</div>';
    }
    if (it.type === 'dialog') {
      var zeilen = it.zeilen.map(function (z, i) {
        return '<div class="ue-zeile" data-z="' + i + '">' + hearBtn('Zeile anhören') +
          '<div class="ue-satz"><span class="ue-sprecher ue-sp-' + (i % 3) + '">' + esc(z.sprecher) + ':</span> ' + esc(z.text) + '</div></div>';
      }).join('');
      var qd = it.frage ? frageHtml(it.frage.frage, it.frage.optionen) : '';
      return '<div class="ue-card ue-item' + doneCls + '" data-item="' + esc(it.id) + '">' +
        zeilen + '<div class="ue-feedback" aria-live="polite">Lies jede Rolle mit eigener Stimme!</div>' + qd +
        '</div>';
    }
    if (it.type === 'text') {
      var fragen = (it.fragen || []).map(function (f, i) {
        return '<div class="ue-subfrage" data-f="' + i + '">' + frageHtml(f.frage, f.optionen) + '</div>';
      }).join('');
      return '<div class="ue-card ue-item' + doneCls + '" data-item="' + esc(it.id) + '">' +
        '<div class="ue-zeile">' + hearBtn('Text anhören') + '<h4 class="ue-titel">' + esc(it.titel) + '</h4></div>' +
        '<p class="ue-text">' + esc(it.text) + '</p>' + fragen +
        '</div>';
    }
    return '';
  }

  /* ---------- ITEM-VERHALTEN ---------- */
  function setStatus(card, kind, msg) {
    var st = card.querySelector('.ll-status');
    if (!st) return;
    card.classList.remove('is-success', 'is-almost');
    if (kind === 'listening') { st.style.display = 'flex'; st.style.color = 'var(--accent-coral,#D67171)'; st.innerHTML = llIcon('mic') + ' Ich höre zu …'; }
    else if (kind === 'success') { st.style.display = 'flex'; st.style.color = ''; card.classList.add('is-success'); st.innerHTML = llIcon('check') + ' ' + (msg || 'Super, genau!'); }
    else if (kind === 'almost') { st.style.display = 'flex'; st.style.color = ''; card.classList.add('is-almost'); st.innerHTML = llIcon('mic') + ' Fast! Sprich es noch einmal.'; }
  }
  function setStars(card, n) {
    var holder = card.querySelector('.ll-stars');
    if (holder) holder.outerHTML = starsHtml(n);
    var ons = card.querySelectorAll('.ll-stars .on');
    if (ons.length) ons[ons.length - 1].classList.add('pop');
  }

  // word: Anhören ODER Nachsprechen zählt (Mikro = Extra-Stern)
  function wireWord(it, card, complete) {
    var hear = card.querySelector('.ll-hear');
    hear.addEventListener('click', function () {
      speak(it.wort, 0.85);
      setStars(card, Math.max(1, card.querySelectorAll('.ll-stars .on').length));
      complete(it, card);
    });
    var say = card.querySelector('.ll-say');
    if (say && window.Lautlese) {
      say.addEventListener('click', function () {
        Lautlese.askConsent(function () {
          try { window.speechSynthesis.cancel(); } catch (e) {}
          setStatus(card, 'listening');
          Lautlese.listenOnce(it.wort, function (state) {
            say.classList.toggle('listening', state === 'listening');
          }, function (recognized) {
            setStatus(card, recognized ? 'success' : 'almost');
            setStars(card, recognized ? 2 : 1);
            complete(it, card); // Versuch zählt IMMER — Ermutigung, keine Hürde
          });
        });
      });
    }
  }

  // build: alle Teile antippen -> Ganzwort erscheint + wird vorgelesen
  function wireBuild(it, card, complete) {
    var tapped = {};
    var fb = card.querySelector('.ue-feedback');
    card.querySelectorAll('.ue-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var i = chip.getAttribute('data-i');
        speak(it.teile[parseInt(i, 10)], 0.8);
        tapped[i] = true;
        chip.classList.add('is-tapped');
        if (Object.keys(tapped).length >= it.teile.length) {
          var built = card.querySelector('.ue-built');
          if (built.hidden) {
            var whole = it.teile.join('');
            var hiIdx = typeof it.hi === 'number' ? it.hi : -1;
            var html = '';
            it.teile.forEach(function (t, j) {
              html += j === hiIdx ? '<span class="ue-hi">' + esc(t) + '</span>' : esc(t);
            });
            card.querySelector('.ue-built-word').innerHTML = html;
            built.hidden = false;
            if (fb) fb.textContent = 'Zusammengebaut! Kannst du das ganze Wort lesen?';
            setTimeout(function () { speak(whole, 0.85); }, 350);
            built.querySelector('.ll-hear').addEventListener('click', function () { speak(whole, 0.85); });
            complete(it, card);
          }
        }
      });
    });
  }

  // choice: Optionen (gemischt), falsch bleibt offen, richtig schließt ab
  function wireChoiceBlock(root, onRight) {
    var fb = root.querySelector('.ue-feedback');
    root.querySelectorAll('.ue-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (root.getAttribute('data-solved') === '1') return;
        if (btn.getAttribute('data-right') === '1') {
          root.setAttribute('data-solved', '1');
          btn.classList.add('is-right');
          root.querySelectorAll('.ue-opt').forEach(function (b) { if (b !== btn) b.classList.add('is-off'); });
          var gap = root.querySelector('.ue-gap');
          if (gap) { gap.textContent = btn.textContent; gap.classList.add('is-filled'); }
          if (fb) { fb.textContent = 'Genau!'; fb.className = 'ue-feedback is-right'; }
          onRight();
        } else {
          btn.classList.add('is-again');
          if (fb) { fb.textContent = 'Fast! Probier es noch einmal.'; fb.className = 'ue-feedback is-again'; }
          setTimeout(function () { btn.classList.remove('is-again'); }, 600);
        }
      });
    });
  }
  function wireChoice(it, card, complete) {
    var hear = card.querySelector('.ll-hear');
    if (hear) hear.addEventListener('click', function () { speak(it.satz, 0.9); });
    wireChoiceBlock(card, function () { complete(it, card); });
  }

  // satz: einmal anhören (oder Frage richtig) = geschafft
  function wireSatz(it, card, complete) {
    var played = false, qDone = !it.frage;
    function check() { if (played && qDone) complete(it, card); }
    card.querySelector('.ll-hear').addEventListener('click', function () {
      speak(it.satz, 0.9);
      played = true;
      var fb = card.querySelector('.ue-feedback');
      if (fb && !it.frage) fb.textContent = 'Schön gelesen!';
      check();
    });
    if (it.frage) {
      wireChoiceBlock(card, function () { qDone = true; played = true; check(); });
    }
  }

  // dialog: alle Zeilen anhören + Frage (falls vorhanden)
  function wireDialog(it, card, complete) {
    var played = {}, qDone = !it.frage;
    function check() {
      if (Object.keys(played).length >= it.zeilen.length && qDone) complete(it, card);
    }
    card.querySelectorAll('.ue-zeile').forEach(function (z) {
      var i = z.getAttribute('data-z');
      if (i == null) return;
      z.querySelector('.ll-hear').addEventListener('click', function () {
        var line = it.zeilen[parseInt(i, 10)];
        speak(line.text, 0.9);
        played[i] = true;
        z.classList.add('is-played');
        check();
      });
    });
    if (it.frage) wireChoiceBlock(card, function () { qDone = true; check(); });
  }

  // text: beide Fragen richtig = geschafft (Anhören optional)
  function wireText(it, card, complete) {
    var hear = card.querySelector('.ll-hear');
    if (hear) hear.addEventListener('click', function () { speak(it.titel + '. ' + it.text, 0.92); });
    var solved = {};
    card.querySelectorAll('.ue-subfrage').forEach(function (sf) {
      wireChoiceBlock(sf, function () {
        solved[sf.getAttribute('data-f')] = true;
        if (Object.keys(solved).length >= (it.fragen || []).length) complete(it, card);
      });
    });
  }

  /* ---------- PUBLIC API ---------- */
  window.Uebungen = {
    renderExercise: renderExercise,
    injectStyles: injectStyles,
    // für lernpfad-data/erfolge-data (lesen ausschließlich child.lernpfad;
    // diese Helfer sind für Debug/Konsole gedacht)
    getLernpfad: getLernpfad
  };
})();
