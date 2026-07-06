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
     Auflockerung für Lektion 1.1: konkrete Nomen/Verben/Familie bekommen ein
     Emoji, Farben einen Farb-Swatch. Emoji bewusst statt Lucide gewählt — nur
     für diese Lern-Icons — weil die Abdeckung viel größer ist (Tiere, Familie,
     Tun-Wörter) und bunte Bilder für 5–6-Jährige besser erkennbar sind.
     Abstrakte Funktions-/Eigenschaftswörter (und, ist, gut, viel …) bleiben
     bewusst ohne Bild. Schlüssel = Wort in Kleinschreibung.
     QUELLE DER WAHRHEIT — gespiegelt in n8n-config/demo-template.html (REBUS_PIC). */
  var TOP100_PIC = {
    // Tiere
    'hund': { emoji: '🐕' }, 'katze': { emoji: '🐈' }, 'maus': { emoji: '🐭' }, 'vogel': { emoji: '🐦' },
    'fisch': { emoji: '🐟' }, 'pferd': { emoji: '🐴' }, 'kuh': { emoji: '🐄' }, 'schwein': { emoji: '🐷' },
    // Natur
    'sonne': { emoji: '☀️' }, 'mond': { emoji: '🌙' }, 'baum': { emoji: '🌳' }, 'blume': { emoji: '🌸' },
    'wasser': { emoji: '💧' }, 'wald': { emoji: '🌲' },
    // Dinge
    'schule': { emoji: '🏫' }, 'buch': { emoji: '📖' }, 'heft': { emoji: '📓' }, 'stift': { emoji: '✏️' },
    'haus': { emoji: '🏠' }, 'bett': { emoji: '🛏️' }, 'auto': { emoji: '🚗' }, 'ball': { emoji: '⚽' }, 'sofa': { emoji: '🛋️' },
    // Menschen & Familie
    'mama': { emoji: '👩' }, 'papa': { emoji: '👨' }, 'oma': { emoji: '👵' }, 'opa': { emoji: '👴' },
    'kind': { emoji: '🧒' }, 'baby': { emoji: '👶' }, 'bruder': { emoji: '👦' }, 'schwester': { emoji: '👧' },
    // Tun-Wörter
    'lesen': { emoji: '📖' }, 'malen': { emoji: '🎨' }, 'schreiben': { emoji: '✍️' }, 'singen': { emoji: '🎤' },
    'lachen': { emoji: '😂' }, 'weinen': { emoji: '😢' }, 'gehen': { emoji: '🚶' }, 'laufen': { emoji: '🏃' },
    'rennen': { emoji: '🏃' }, 'rufen': { emoji: '📣' }, 'essen': { emoji: '🍽️' }, 'trinken': { emoji: '🥤' },
    'schlafen': { emoji: '😴' }, 'sehen': { emoji: '👀' }, 'sagen': { emoji: '💬' },
    // Wie-Wörter
    'kalt': { emoji: '❄️' }, 'warm': { emoji: '☀️' }, 'laut': { emoji: '🔊' }, 'leise': { emoji: '🔇' },
    'schnell': { emoji: '⚡' }, 'gut': { emoji: '👍' }, 'lieb': { emoji: '❤️' },
    // Farben → Swatch
    'rot': { color: '#E5484D' }, 'blau': { color: '#4A7BEC' }, 'grün': { color: '#46B26A' }, 'gelb': { color: '#F5C518' }
  };
  function wordPicture(wort) {
    var p = TOP100_PIC[String(wort || '').toLowerCase()];
    if (!p) return '';
    if (p.color) return '<span class="ue-wordpic is-color" style="background:' + p.color + '" aria-hidden="true"></span>';
    return '<span class="ue-wordpic ue-emoji" aria-hidden="true">' + p.emoji + '</span>';
  }

  /* ---------- STYLES (einmalig; .ue-* liegt in konto.css) ---------- */
  function injectStyles() {
    if (window.Lautlese) Lautlese.injectStyles(); // .ll-*-Klassen
    if (document.getElementById('ue-pic-styles')) return;
    var css =
      '.ue-wordpic{flex-shrink:0;width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(47,184,166,.12);color:var(--navy,#2B3140);}' +
      '.ue-wordpic.ue-emoji{font-size:2rem;line-height:1;}' +
      '.ue-wordpic.is-color{border:2px solid rgba(43,49,64,.12);}' +
      '.ll-row.is-success .ue-wordpic{background:rgba(47,184,166,.2);}' +
      '@media(max-width:480px){.ue-wordpic{width:46px;height:46px;border-radius:13px;}.ue-wordpic.ue-emoji{font-size:1.6rem;}}' +
      /* Top-100: Gruppen-Chips + Story-Links */
      '.t100-h{font-family:var(--font-heading,Fredoka),sans-serif;font-size:1.15rem;color:var(--navy,#2B3140);margin:22px 0 10px;}' +
      '.t100-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));}' +
      '.t100-lc{font-size:1rem!important;line-height:1.2;}' +
      '.t100-story{display:flex;flex-direction:column;gap:2px;background:var(--bg-card,#fff);border:2px solid var(--border,#D9D4CC);border-radius:16px;padding:12px 16px;margin-bottom:8px;text-decoration:none;transition:border-color .15s,transform .12s;}' +
      '.t100-story:hover{border-color:var(--mint,#2FB8A6);transform:translateY(-1px);}' +
      '.t100-story-title{font-family:var(--font-heading,Fredoka),sans-serif;font-weight:600;color:var(--navy,#2B3140);}' +
      '.t100-story-reason{font-size:.85rem;color:var(--text-muted,#7a7468);}';
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

  /* ---------- TOP-100 (Wort-Gruppen wählen → üben → passende Geschichten) ----------
     Analog zu "Meine Laute": Das Kind wählt eine Wort-Gruppe (Tiere, Farben …),
     übt deren Wörter als Karten und bekommt darunter passende Geschichten verlinkt. */
  var ROUND_SIZE = 10;

  function getTop100Gruppe() { var lp = getLernpfad(); return (lp.top100 && lp.top100.gruppe) || null; }
  function setTop100Gruppe(name) { var lp = getLernpfad(); lp.top100.gruppe = name; saveLernpfad(lp); }

  // Story-Index für "Geschichten mit deinen Wörtern" (Callback-Puffer wie kind.html)
  var _t100idx = null, _t100idxState = 0, _t100idxCbs = [];
  function loadT100Index(cb) {
    if (_t100idxState === 2) { cb(_t100idx); return; }
    _t100idxCbs.push(cb);
    if (_t100idxState === 1) return;
    _t100idxState = 1;
    function done(d) { _t100idx = d; _t100idxState = 2; var c = _t100idxCbs; _t100idxCbs = []; c.forEach(function (f) { f(d); }); }
    try { fetch('stories-index.json').then(function (r) { return r.json(); }).then(done).catch(function () { done(null); }); }
    catch (e) { done(null); }
  }

  function renderTop100(panel, lesson, opts) {
    panel.innerHTML = '<div class="info-card">Ich hole die W&ouml;rter&hellip;</div>';
    if (!window.Lernpfad) return;
    Lernpfad.loadTop100(function (data) {
      if (!data) { panel.innerHTML = '<div class="info-card">Die W&ouml;rter gibt es online auf der Webseite.</div>'; return; }
      var gruppen = data.gruppen || data.klassen || [];
      setTop100Totals(gruppen);
      injectStyles();
      var practiced = getLernpfad().top100.words;
      var focus = getTop100Gruppe();
      if (!focus || !gruppen.some(function (g) { return g.name === focus; })) {
        var openG = gruppen.filter(function (g) { return g.words.some(function (w) { return !practiced[w.wort.toLowerCase()]; }); });
        focus = ((openG[0] || gruppen[0]) || {}).name || null;
      }
      panel.innerHTML =
        '<div id="t100-groups"></div>' +
        '<div id="t100-practice"></div>' +
        '<div id="t100-stories"></div>';
      renderGroupChips(panel.querySelector('#t100-groups'), gruppen, focus, function (name) {
        setTop100Gruppe(name); renderTop100(panel, lesson, opts);
      });
      var grp = gruppen.filter(function (g) { return g.name === focus; })[0];
      if (grp) {
        renderGroupPractice(panel.querySelector('#t100-practice'), lesson, opts, grp);
        renderT100Stories(panel.querySelector('#t100-stories'), focus);
      }
    });
  }

  function renderGroupChips(box, gruppen, focus, onPick) {
    var practiced = getLernpfad().top100.words;
    box.innerHTML = '<h3 class="t100-h">Wähle deine Wörter</h3><div class="laute-grid t100-grid"></div>';
    var grid = box.querySelector('.laute-grid');
    gruppen.forEach(function (g) {
      var done = g.words.filter(function (w) { return practiced[w.wort.toLowerCase()]; }).length;
      var pct = Math.round(done / g.words.length * 100);
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'laut-chip' + (g.name === focus ? ' is-focus' : '') + (done >= g.words.length ? ' is-master' : '');
      el.innerHTML =
        '<span class="lc-label t100-lc">' + esc(g.name) + '</span>' +
        '<span class="lc-bsp">' + done + ' / ' + g.words.length + '</span>' +
        '<span class="lc-bar"><i style="width:' + pct + '%"></i></span>';
      el.addEventListener('click', function () { onPick(g.name); });
      grid.appendChild(el);
    });
  }

  function renderGroupPractice(box, lesson, opts, grp) {
    var practiced = getLernpfad().top100.words;
    var open = grp.words.filter(function (w) { return !practiced[w.wort.toLowerCase()]; });
    var roundWords = (open.length ? open : grp.words).slice(0, ROUND_SIZE);
    var items = roundWords.map(function (w) {
      return { id: 't100-' + w.wort.toLowerCase(), type: 'word', wort: w.wort, silben: w.silben, klasse: grp.name };
    });
    var total = grp.words.length;
    function doneCount() {
      var pw = getLernpfad().top100.words;
      return grp.words.filter(function (w) { return pw[w.wort.toLowerCase()]; }).length;
    }
    renderItems(box, lesson, opts, items, {
      countLabel: function () { return esc(grp.name) + ': ' + doneCount() + ' von ' + total + ' Wörtern'; },
      isPersisted: function (item) { return !!getLernpfad().top100.words[item.wort.toLowerCase()]; },
      persist: function (item) { return recordTop100(item.wort, item.klasse); },
      doneText: function () {
        var dc = doneCount();
        return dc >= total ? 'Wow — du hast alle „' + grp.name + '"-Wörter geübt!' : 'Runde geschafft! ' + dc + ' von ' + total + ' bei „' + grp.name + '".';
      },
      nextRound: true,
      nextRoundLabel: open.length > ROUND_SIZE ? 'Nächste Runde' : 'Nochmal üben',
      rerender: function () { renderGroupPractice(box, lesson, opts, grp); }
    });
  }

  function renderT100Stories(box, focus) {
    box.innerHTML = '<h3 class="t100-h">Geschichten mit deinen Wörtern</h3><div class="info-card">Ich suche passende Geschichten&hellip;</div>';
    loadT100Index(function (idx) {
      var head = '<h3 class="t100-h">Geschichten mit deinen Wörtern</h3>';
      if (!idx || !idx.stories) { box.innerHTML = ''; return; }
      var matches = idx.stories
        .filter(function (s) { return s.wortGruppen && s.wortGruppen[focus]; })
        .sort(function (a, b) {
          var na = a.niveau || 9, nb = b.niveau || 9;                       // erst Erstleser-Niveau
          if (na !== nb) return na - nb;
          return (b.wortGruppen[focus] || 0) - (a.wortGruppen[focus] || 0); // dann viele Gruppen-Wörter
        })
        .slice(0, 4);
      if (!matches.length) { box.innerHTML = head + '<div class="info-card">Dafür habe ich gerade keine passende Geschichte — probier eine andere Gruppe!</div>'; return; }
      box.innerHTML = head + matches.map(function (s) {
        var n = s.wortGruppen[focus];
        return '<a class="t100-story" href="' + esc(s.path) + '">' +
          '<span class="t100-story-title">' + esc(s.title || '') + '</span>' +
          '<span class="t100-story-reason">' + n + (n === 1 ? ' Wort' : ' Wörter') + ' aus „' + esc(focus) + '"</span></a>';
      }).join('');
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
