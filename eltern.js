/* ============================================================
   Lesekumpel · eltern.js
   Logik für den Elternbereich (eltern.html). Mobile-first SPA mit
   Bottom-Nav, analog zu kind.html. Nutzt window.Konto (State),
   window.KontoFX (FX), window.FormKit (escapeHtml) und window.Lautlese.
   Reiner localStorage-Prototyp — kein Backend.
   ============================================================ */
(function () {
  'use strict';

  Konto.seedIfEmpty();

  /* ---------- Konstanten ---------- */
  var ENERGY_META = {
    hoch: { e: '🔋', label: 'Voll Power', cls: 'energy-hoch' },
    mittel: { e: '🙂', label: 'Gut drauf', cls: 'energy-mittel' },
    niedrig: { e: '😴', label: 'Müde', cls: 'energy-niedrig' }
  };
  var HELP_META = {
    syllableColoring: ['Silben einfärben', 'Silben in zwei Farben — hilft beim Gliedern (LRS).'],
    dyslexiaFont: ['Legasthenie-Schrift', 'Gut lesbare Schrift mit klaren Buchstaben.'],
    karaokeTts: ['Mitlese-Vorlesen', 'Wörter werden beim Vorlesen mitmarkiert.'],
    chunkMode: ['Kurze Häppchen', 'Kürzere Texte und Abschnitte (ADHS-freundlich).'],
    interestPriority: ['Lieblingsthemen zuerst', 'Empfehlungen bevorzugen die Interessen des Kindes.'],
    clearMode: ['Klare, wörtliche Sprache', 'Keine Redewendungen, Gefühle werden benannt (Autismus).'],
    grammarColoring: ['Grammatik-Farben', 'Artikel/Wortarten farblich markiert (DaZ).'],
    highContrast: ['Hoher Kontrast', 'Starke Kontraste für besseres Sehen.'],
    focusZoom: ['Fokus-Zeile', 'Aktuelle Zeile hervorheben/vergrößern.'],
    wholeWord: ['Ganzwort-Methode', 'Wörter als Ganzes statt lautweise (Hören).'],
    moreImages: ['Mehr Bilder', 'Mehr Illustrationen zur Unterstützung.']
  };
  var DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']; // Index 0=Mo … 6=So (ISO-1)
  var INTEREST_CATALOG = [
    ['tiere', '🦊', 'Tiere'], ['weltraum', '🚀', 'Weltraum'], ['fussball', '⚽', 'Fußball'],
    ['fahrzeuge', '🚗', 'Fahrzeuge'], ['dinos', '🦖', 'Dinos'], ['fantasie', '✨', 'Fantasie'],
    ['freundschaft', '💛', 'Freundschaft'], ['abenteuer', '🏔️', 'Abenteuer'], ['natur', '🌳', 'Natur'],
    ['musik', '🎵', 'Musik'], ['meer', '🐠', 'Meer'], ['gaming', '🎮', 'Gaming']
  ];
  // Personas (Quelle: CLAUDE.md). Neurotyp gilt nur für Skill-Personas.
  var SKILL_PERSONAS = ['Pip Punkt', 'Mia Mitte', 'Peter Past', 'Stella Stimmenreich', 'Finja Feder'];
  var BONUS_PERSONAS = ['Samira Wissensfreund', 'Holzi Pixelkopf', 'Deniz Traumfänger', 'Jonas Entdecker'];
  var NEUROTYPEN = ['Standard', 'ADHS', 'Autismus', 'LRS'];
  var GENRES = ['Abenteuer', 'Tiere', 'Freundschaft', 'Weltraum', 'Fahrzeuge', 'Fantasie', 'Alltag', 'Natur', 'Sport', 'Gute-Nacht'];
  var BILDSTILE = [
    ['freundlich-bunt', 'Freundlich & bunt'], ['sanft-aquarell', 'Sanft (Aquarell)'],
    ['dynamisch-comic', 'Dynamisch (Comic)'], ['pastell-traum', 'Pastell-Traum'], ['klar-einfach', 'Klar & einfach']
  ];

  /* ---------- Helfer ---------- */
  function esc(s) { return FormKit.escapeHtml(String(s == null ? '' : s)); }
  function toast(msg) { KontoFX.toast(msg); }
  // energyHistory/weekActivity sind rollierende Fenster: letzter Eintrag = heute.
  // Labels daher rückwärts vom heutigen Tag, der letzte heißt "Heute".
  function lastDaysLabels(n) {
    var names = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], out = [], today = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      out.push(i === 0 ? 'Heute' : names[d.getDay()]);
    }
    return out;
  }
  function lucide(paths, fill) {
    return fill
      ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + paths + '</svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }
  var IC = {
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    volume: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/>',
    spell: '<path d="m6 16 6-12 6 12"/><path d="M8 12h8"/><path d="m16 20 2 2 4-4"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 18.6l-5.9 3.07 1.13-6.57L2.45 9.44l6.6-.96z"/>'
  };
  function starsHtml(n) {
    return '<span style="display:inline-flex;align-items:center;gap:3px;color:#E0982A;font-weight:700;">' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:13px;height:13px;">' + IC.star + '</svg>' + n + '</span>';
  }
  // Story-Thumbnail für Listen-Items (Cover mit Emoji-Fallback)
  function thumbHtml(path, emoji) {
    return '<span class="elt-thumb"><span aria-hidden="true">' + esc(emoji || '📖') + '</span>' +
      (path ? '<img src="' + esc(storyThumb(path)) + '" alt="" onerror="this.remove()">' : '') + '</span>';
  }
  function computeStars(c) {
    return (c.storiesRead || 0) * 5 + (c.quizzesSolved || 0) * 3 + (c.storiesRated || 0) * 2;
  }
  function lautLabel(id) {
    var g = (window.Lautlese && Lautlese.LAUT_INVENTORY || []).filter(function (x) { return x.id === id; })[0];
    return g ? g.label : id;
  }
  function storyOptions(c) {
    // library + recommendations, dedupliziert nach path
    var seen = {}, out = [];
    (c.library || []).concat(c.recommendations || []).forEach(function (s) {
      if (!s.path || seen[s.path]) return;
      seen[s.path] = 1;
      out.push({ path: s.path, title: s.title, icon: s.icon || '📖' });
    });
    return out;
  }

  /* ================= START / DASHBOARD ================= */
  function weekChart(c) {
    var wa = c.weekActivity || [0, 0, 0, 0, 0, 0, 0];
    var labels = lastDaysLabels(wa.length);
    var maxA = Math.max.apply(null, wa.concat([1]));
    return '<div class="activity-chart">' + wa.map(function (v, i) {
      var h = Math.round((v / maxA) * 90);
      return '<div class="chart-bar-wrap"><span class="chart-count">' + (v > 0 ? v : '') + '</span>' +
        '<div class="chart-bar" style="height:' + (h > 0 ? h : 4) + 'px;' + (v === 0 ? 'opacity:0.2;' : '') + '"></div>' +
        '<span class="chart-day">' + labels[i] + '</span></div>';
    }).join('') + '</div>';
  }
  function childDetails(c) {
    var sel = c.interests || [];
    var chips = INTEREST_CATALOG.map(function (it) {
      var on = sel.indexOf(it[0]) >= 0;
      return '<button type="button" class="interest-chip ' + (on ? '' : 'off') + '" onclick="Eltern.toggleInterest(' + c.id + ',\'' + it[0] + '\')">' + it[1] + ' ' + it[2] + '</button>';
    }).join('');
    var help = c.readingHelp || Konto.blankReadingHelp();
    var rows = Object.keys(HELP_META).map(function (k) {
      var meta = HELP_META[k], on = !!help[k];
      return '<div class="toggle-row"><div class="toggle-info"><div class="toggle-title">' + meta[0] + '</div>' +
        '<div class="toggle-desc">' + meta[1] + '</div></div>' +
        '<label class="switch"><input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="Eltern.toggleHelp(' + c.id + ',\'' + k + '\',this.checked)" aria-label="' + esc(meta[0]) + '">' +
        '<span class="track"></span><span class="thumb"></span></label></div>';
    }).join('');
    var nd = c.noDemandMode !== false;
    return '<details class="child-details"><summary>Interessen &amp; Lesehilfen</summary>' +
      '<h4 class="card-h3" style="font-size:0.95rem;margin:12px 0 6px;">Interessen</h4>' +
      '<div class="interest-chips">' + chips + '</div>' +
      '<h4 class="card-h3" style="font-size:0.95rem;margin:16px 0 2px;">Kein-Druck-Modus</h4>' +
      '<div class="toggle-row"><div class="toggle-info"><div class="toggle-title">Pausen immer erlauben</div>' +
      '<div class="toggle-desc">An müden Tagen zählt Vorlesen statt Druck.</div></div>' +
      '<label class="switch"><input type="checkbox" ' + (nd ? 'checked' : '') + ' onchange="Eltern.toggleNoDemand(' + c.id + ',this.checked)" aria-label="Kein-Druck-Modus"><span class="track"></span><span class="thumb"></span></label></div>' +
      '<h4 class="card-h3" style="font-size:0.95rem;margin:16px 0 2px;">Lesehilfen</h4>' + rows +
      '</details>';
  }
  function storySlug(path) { return String(path || '').split('/').pop().replace(/\.html$/, ''); }
  function storyThumb(path) { return path ? 'bilder/' + storySlug(path) + '-1.png' : ''; }
  function interestLabels(c) {
    var map = {}; INTEREST_CATALOG.forEach(function (it) { map[it[0]] = it[2]; });
    return (c.interests || []).map(function (i) { return map[i] || i; });
  }
  // Kind-Auswahl als Avatar-Tabs (Segment-Leiste)
  function childTabs() {
    var kids = Konto.getChildren(), act = Konto.getActiveChildId();
    return '<div class="child-tabs" role="tablist" aria-label="Kind auswählen">' + kids.map(function (c) {
      var av = c.avatar || {}, on = c.id === act;
      return '<button type="button" class="child-tab' + (on ? ' is-active' : '') + '" role="tab" aria-selected="' + (on ? 'true' : 'false') + '" onclick="Eltern.switchChild(' + c.id + ')">' +
        '<span class="ct-avatar" style="background:' + esc(av.bgColor || '#ffe0dc') + '">' + esc(av.base || '🦊') + '</span>' +
        '<span class="ct-name">' + esc(c.name) + '</span></button>';
    }).join('') + '</div>';
  }
  // Energie der letzten 7 Tage mit Tages-Labels (rollierend, letzter = Heute)
  function energyDayCells(c) {
    var hist = (c.energyHistory || []).slice(-7);
    if (!hist.length) return '<p class="child-meta">Noch keine Energie-Check-ins.</p>';
    var labels = lastDaysLabels(hist.length);
    return '<div class="insight-energy">' + hist.map(function (e, i) {
      var m = ENERGY_META[e] || ENERGY_META.mittel;
      var today = labels[i] === 'Heute';
      return '<div class="ie-day' + (today ? ' is-today' : '') + '"><span class="cer-cell ' + m.cls + '" title="' + m.label + '">' + m.e + '</span><span class="chart-day">' + labels[i] + '</span></div>';
    }).join('') + '</div>';
  }
  // Menschenlesbarer Energie-Hinweis (müde Tage benennen)
  function energyNote(c) {
    var hist = (c.energyHistory || []).slice(-7);
    if (!hist.length) return 'Sobald ' + esc(c.name) + ' die App startet, siehst du hier den Energie-Verlauf.';
    var labels = lastDaysLabels(hist.length), tired = [];
    hist.forEach(function (e, i) { if (e === 'niedrig') tired.push(labels[i]); });
    if (!tired.length) return esc(c.name) + ' war in den letzten Tagen gut in Balance. 🌿';
    var hasToday = tired.indexOf('Heute') >= 0;
    var rest = tired.filter(function (t) { return t !== 'Heute'; });
    var restTxt = rest.length === 1 ? 'am ' + rest[0] : rest.length > 1 ? 'an ' + rest.slice(0, -1).join(', ') + ' und ' + rest[rest.length - 1] : '';
    if (hasToday) {
      return (rest.length ? 'Heute und ' + restTxt + ' braucht ' : 'Heute braucht ') + esc(c.name) + ' mehr Ruhe — das ist völlig okay.';
    }
    return restTxt.charAt(0).toUpperCase() + restTxt.slice(1) + ' brauchte ' + esc(c.name) + ' mehr Ruhe — das ist völlig okay.';
  }
  function renderStart() {
    var c = Konto.getActiveChild();
    if (!c) { document.getElementById('elt-start-content').innerHTML = '<div class="info-card">Noch kein Kind angelegt. Leg im Onboarding los.</div>'; return; }
    var av = c.avatar || {};
    var totalRead = (c.weekActivity || []).reduce(function (s, v) { return s + v; }, 0);

    // 1) Kind-Auswahl + Kopf
    var html = childTabs() +
      '<div class="insight-head">' +
        '<div class="child-avatar" style="background:' + esc(av.bgColor || '#ffe0dc') + '">' + esc(av.base || '🦊') + '</div>' +
        '<div><h2 class="insight-title">Einblicke für ' + esc(c.name) + '</h2>' +
        '<p class="insight-sub">So erlebt ' + esc(c.name) + ' Lesen gerade — ohne Druck und mit Raum für den eigenen Weg.</p></div>' +
      '</div>';

    // 2) Grafik: Energie / Batterie
    html += '<div class="dashboard-card"><h3 class="card-h3">Wie geht es ' + esc(c.name) + '?</h3>' +
      energyDayCells(c) +
      '<p class="energy-note">' + energyNote(c) + '</p></div>';

    // 3) Grafik: Leseaktivität
    html += '<div class="dashboard-card"><h3 class="card-h3">Leseaktivität</h3>' +
      weekChart(c) +
      '<p class="energy-note">In den letzten 7 Tagen: <strong>' + totalRead + '</strong> ' + (totalRead === 1 ? 'Geschichte' : 'Geschichten') + ' gelesen.</p></div>';

    // 4) Empfehlungs-Regal
    var recs = (c.recommendations || []).slice(0, 6);
    var ints = interestLabels(c);
    var shelf = recs.length
      ? '<p class="insight-sub" style="margin-bottom:12px;">' + (ints.length ? 'Passend zu ' + esc(c.name) + 's Lieblingswelten: ' + esc(ints.join(', ')) : 'Frisch für ' + esc(c.name) + ' ausgewählt') + '.</p>' +
        '<div class="rec-shelf">' + recs.map(function (r) {
          return '<div class="rc-cover"><div class="rc-thumb"><span class="rc-emoji">' + esc(r.icon || '📖') + '</span>' +
            (r.path ? '<img class="rc-img" src="' + esc(storyThumb(r.path)) + '" alt="" onerror="this.remove()">' : '') +
            '</div><span class="rc-title">' + esc(r.title) + '</span></div>';
        }).join('') + '</div>' +
        '<button type="button" class="btn-assign" style="margin-top:14px;" onclick="Eltern.goEmpf()">Alle Empfehlungen ansehen</button>'
      : '<p class="child-meta">Noch keine Empfehlungen — sobald ' + esc(c.name) + ' liest, lernen wir dazu.</p>';
    html += '<div class="dashboard-card"><h3 class="card-h3">Geschichten, die ' + esc(c.name) + ' mögen könnte</h3>' + shelf + '</div>';

    // 5) Interessen & Lesehilfen (bewahrt)
    html += '<div class="dashboard-card">' + childDetails(c) + '</div>';

    document.getElementById('elt-start-content').innerHTML = html;
  }

  /* ================= EMPFEHLUNGEN ================= */
  function renderEmpf() {
    var c = Konto.getActiveChild();
    var recs = c.recommendations || [];
    // Bereits offene Aufgaben je Story — verhindert Doppel-Zuweisung
    var openPaths = {};
    (c.assignedTasks || []).forEach(function (t) { if (!t.done && t.storyPath) openPaths[t.storyPath] = 1; });
    var html = childTabs();
    if (!recs.length) {
      html += '<div class="info-card">Noch keine Empfehlungen für ' + esc(c.name) + '. Sobald gelesen wird, lernen wir dazu.</div>';
    } else {
      html += recs.map(function (r) {
        var flag = r.kind === 'vorlesen' ? '<span class="status-pill status-vorlesen">Vorlesen</span>' : '<span class="status-pill status-selbst">Selbst lesen</span>';
        var assigned = r.path && openPaths[r.path];
        var action = assigned
          ? '<span class="pill-done">' + lucide(IC.check) + 'Zugewiesen</span>'
          : '<button type="button" class="btn-assign" onclick="Eltern.assignRec(\'' + esc(r.id) + '\')">Zuweisen</button>';
        return '<div class="elt-item">' + thumbHtml(r.path, r.icon) +
          '<div class="elt-item-body"><div class="elt-item-title">' + esc(r.title) + '</div>' +
          '<div class="elt-item-meta">' + esc(r.reason || '') + ' · Phase ' + (r.phase || '–') + ' ' + flag + '</div></div>' +
          action + '</div>';
      }).join('');
    }
    document.getElementById('elt-empf-content').innerHTML = html;
  }

  /* ================= AUFGABEN ================= */
  var aufgType = 'read';
  function renderAufg() {
    var c = Konto.getActiveChild();
    var stories = storyOptions(c);
    var storyOpts = stories.map(function (s) { return '<option value="' + esc(s.path) + '">' + esc(s.title) + '</option>'; }).join('');
    var lautOpts = (window.Lautlese && Lautlese.LAUT_INVENTORY || []).map(function (g) {
      return '<option value="' + esc(g.id) + '">' + esc(g.label) + ' — wie in „' + esc(g.beispiel) + '"</option>';
    }).join('');
    var starOpts = [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (n === 4 ? ' selected' : '') + '>' + n + ' ⭐</option>'; }).join('');

    var form = '<div class="dashboard-card"><h3 class="card-h3">Neue Aufgabe für ' + esc(c.name) + '</h3><div class="elt-form">' +
      '<div class="type-chips" role="group" aria-label="Aufgabentyp">' +
        '<button type="button" class="type-chip" data-type="read">' + lucide(IC.book) + 'Lesen</button>' +
        '<button type="button" class="type-chip" data-type="listen">' + lucide(IC.volume) + 'Hören</button>' +
        '<button type="button" class="type-chip" data-type="laut">' + lucide(IC.spell) + 'Laut üben</button>' +
      '</div>' +
      '<div class="elt-form-row" id="aufg-story-row"><label for="aufg-story">Geschichte</label>' +
        '<select id="aufg-story" class="form-select">' + (storyOpts || '<option value="">— keine Geschichte hinterlegt —</option>') + '</select></div>' +
      '<div class="elt-form-row" id="aufg-laut-row" hidden><label for="aufg-laut">Laut</label>' +
        '<select id="aufg-laut" class="form-select">' + lautOpts + '</select></div>' +
      '<div class="elt-form-row"><label for="aufg-note">Notiz (optional)</label><input type="text" id="aufg-note" class="text-input" maxlength="80" placeholder="z. B. Nimm dir Zeit."></div>' +
      '<div class="elt-form-row"><label for="aufg-stars">Belohnung</label><select id="aufg-stars" class="form-select">' + starOpts + '</select></div>' +
      '<button type="button" class="btn-primary" onclick="Eltern.addTask()">Aufgabe hinzufügen</button>' +
      '</div></div>';

    var tasks = c.assignedTasks || [];
    var list = '<h3 class="card-h3" style="margin-top:8px;">Aufgaben für ' + esc(c.name) + '</h3>';
    if (!tasks.length) {
      list += '<div class="info-card">Noch keine Aufgaben. Lege oben die erste an — sie erscheint in der Kinder-Ansicht. 💛</div>';
    } else {
      list += tasks.map(function (t) {
        var meta = t.done ? 'Erledigt' : (t.note || (t.type === 'laut' ? 'Laut-Übung' : 'Zum ' + (t.type === 'listen' ? 'Anhören' : 'Lesen')));
        var lead = t.type === 'laut'
          ? '<span class="elt-item-icon">' + lucide(IC.spell) + '</span>'
          : thumbHtml(t.storyPath, t.emoji);
        return '<div class="elt-item' + (t.done ? ' is-done' : '') + '">' + lead +
          '<div class="elt-item-body"><div class="elt-item-title">' + esc(t.title) + '</div>' +
          '<div class="elt-item-meta">' + esc(meta) + ' · ' + starsHtml(t.stars || 0) + '</div></div>' +
          '<button type="button" class="icon-btn-sm" aria-label="Aufgabe löschen" onclick="Eltern.removeTask(\'' + esc(t.id) + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>';
      }).join('');
    }
    document.getElementById('elt-aufg-content').innerHTML = childTabs() + form + list;
    setAufgType(aufgType);
    document.querySelectorAll('#elt-aufg-content .type-chip').forEach(function (b) {
      b.addEventListener('click', function () { setAufgType(b.getAttribute('data-type')); });
    });
  }
  function setAufgType(type) {
    aufgType = type;
    document.querySelectorAll('#elt-aufg-content .type-chip').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-type') === type);
    });
    var storyRow = document.getElementById('aufg-story-row');
    var lautRow = document.getElementById('aufg-laut-row');
    if (storyRow) storyRow.hidden = (type === 'laut');
    if (lautRow) lautRow.hidden = (type !== 'laut');
  }

  /* ================= PLANEN ================= */
  var planWeekdays = [];
  function personaSelect() {
    return '<select id="plan-persona" class="form-select">' +
      '<optgroup label="Leseniveau (mit Neurotyp)">' + SKILL_PERSONAS.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('') + '</optgroup>' +
      '<optgroup label="Bonus-Personas">' + BONUS_PERSONAS.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('') + '</optgroup>' +
      '</select>';
  }
  function renderPlan() {
    var kids = Konto.getChildren();
    var kidOpts = kids.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');
    var neuroOpts = NEUROTYPEN.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('');
    var genreOpts = GENRES.map(function (g) { return '<option>' + esc(g) + '</option>'; }).join('');
    var stilOpts = BILDSTILE.map(function (b) { return '<option value="' + esc(b[0]) + '">' + esc(b[1]) + '</option>'; }).join('');
    var wdBtns = DAYS.map(function (d, i) {
      return '<button type="button" class="wd-btn" data-wd="' + (i + 1) + '" aria-pressed="false">' + d + '</button>';
    }).join('');

    var form = '<div class="dashboard-card"><h3 class="card-h3">Neue Geschichte planen</h3><div class="elt-form">' +
      '<div class="elt-form-row"><label for="plan-child">Für welches Kind?</label><select id="plan-child" class="form-select">' + kidOpts + '</select></div>' +
      '<div class="elt-form-row"><label for="plan-persona">Persona (Leseniveau)</label>' + personaSelect() + '</div>' +
      '<div class="elt-form-row" id="plan-neuro-row"><label for="plan-neuro">Neurotyp</label><select id="plan-neuro" class="form-select">' + neuroOpts + '</select></div>' +
      '<div class="elt-form-row"><label for="plan-genre">Genre</label><select id="plan-genre" class="form-select">' + genreOpts + '</select></div>' +
      '<div class="elt-form-row"><label for="plan-bild">Bildstil</label><select id="plan-bild" class="form-select">' + stilOpts + '</select></div>' +
      '<div class="elt-form-row"><label for="plan-kurz">Kurzbeschreibung</label><textarea id="plan-kurz" class="text-input" maxlength="240" placeholder="Worum soll die Geschichte gehen?"></textarea></div>' +
      '<div class="elt-form-row"><label>An welchen Wochentagen erstellen?</label><div class="weekday-picker">' + wdBtns + '</div></div>' +
      '<button type="button" class="btn-primary" onclick="Eltern.addPlan()">Plan speichern</button>' +
      '</div></div>' +
      '<div class="info-card">ℹ️ <strong>Prototyp-Hinweis:</strong> Pläne werden gespeichert und im Wochenplan angezeigt. Das automatische Erstellen an den gewählten Tagen folgt später über den Geschichten-Generator.</div>';

    var plans = Konto.getStoryPlans();
    var list = '<h3 class="card-h3" style="margin-top:8px;">Gespeicherte Pläne</h3>';
    if (!plans.length) {
      list += '<div class="info-card">Noch keine Pläne. Lege oben deinen ersten an.</div>';
    } else {
      list += plans.map(function (pl) { return planItemHtml(pl); }).join('');
    }
    document.getElementById('elt-plan-content').innerHTML = form + list;

    planWeekdays = [];
    document.querySelectorAll('#elt-plan-content .wd-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var wd = parseInt(b.getAttribute('data-wd'), 10);
        var i = planWeekdays.indexOf(wd);
        if (i >= 0) planWeekdays.splice(i, 1); else planWeekdays.push(wd);
        var on = planWeekdays.indexOf(wd) >= 0;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });

    // Bonus-Personas haben keinen Neurotyp-Parameter -> Zeile ausblenden
    var perSel = document.getElementById('plan-persona');
    function syncNeuro() {
      var row = document.getElementById('plan-neuro-row');
      if (row) row.hidden = BONUS_PERSONAS.indexOf(perSel.value) >= 0;
    }
    if (perSel) { perSel.addEventListener('change', syncNeuro); syncNeuro(); }
  }
  function childName(id) {
    var c = Konto.getChild(id);
    return c ? c.name : '—';
  }
  function planItemHtml(pl) {
    var wd = (pl.weekdays || []).slice().sort(function (a, b) { return a - b; }).map(function (n) { return DAYS[n - 1]; }).join(', ') || 'keine Tage';
    var meta = ['Für ' + esc(childName(pl.childId)), esc(pl.neurotyp || ''), esc(wd)].filter(Boolean).join(' · ');
    return '<div class="elt-item' + (pl.active ? '' : ' is-done') + '"><span class="elt-item-icon">' + lucide(IC.calendar) + '</span>' +
      '<div class="elt-item-body"><div class="elt-item-title">' + esc(pl.persona) + ' · ' + esc(pl.genre) + '</div>' +
      '<div class="elt-item-meta">' + meta + '</div></div>' +
      '<label class="switch" style="margin-right:6px;" title="Aktiv"><input type="checkbox" ' + (pl.active ? 'checked' : '') + ' onchange="Eltern.togglePlan(\'' + esc(pl.id) + '\',this.checked)" aria-label="Plan aktiv"><span class="track"></span><span class="thumb"></span></label>' +
      '<button type="button" class="icon-btn-sm" aria-label="Plan löschen" onclick="Eltern.removePlan(\'' + esc(pl.id) + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>';
  }

  /* ================= WOCHENPLAN / ÜBERSICHT ================= */
  function renderUeber() {
    var plans = Konto.getStoryPlans();
    var kids = Konto.getChildren();

    // Wochenraster — heutige Spalte hervorheben
    var todayIdx = (new Date().getDay() + 6) % 7; // ISO: 0=Mo … 6=So
    var cols = DAYS.map(function (d, i) {
      var iso = i + 1;
      var dayPlans = plans.filter(function (p) { return (p.weekdays || []).indexOf(iso) >= 0; });
      var chips = dayPlans.length
        ? dayPlans.map(function (p) {
            return '<span class="weekplan-chip' + (p.active ? '' : ' is-off') + '"><span class="wp-persona">' + esc(p.persona) + '</span>' +
              esc(p.genre) + ' · ' + esc(childName(p.childId)) + '</span>';
          }).join('')
        : '<div class="weekplan-empty">—</div>';
      return '<div class="weekplan-col' + (i === todayIdx ? ' is-today' : '') + '"><div class="weekplan-day">' + (i === todayIdx ? 'Heute' : d) + '</div>' + chips + '</div>';
    }).join('');

    // Statistik
    var active = plans.filter(function (p) { return p.active; });
    var perWeek = active.reduce(function (s, p) { return s + (p.weekdays || []).length; }, 0);
    var stats = '<div class="stats-grid" style="margin-top:20px;">' +
      '<div class="stat-card"><span class="stat-number">' + plans.length + '</span><span class="stat-label">Pläne gesamt</span></div>' +
      '<div class="stat-card"><span class="stat-number">' + active.length + '</span><span class="stat-label">Aktiv</span></div>' +
      '<div class="stat-card"><span class="stat-number">' + perWeek + '</span><span class="stat-label">Geschichten / Woche</span></div>' +
    '</div>';

    // Stolperwörter (nicht gemeisterte Laute je Kind)
    var stolper = '<h3 class="card-h3" style="margin-top:22px;">Übungsbedarf bei Lauten</h3>';
    var any = false;
    stolper += kids.map(function (c) {
      var fort = (c.laute && c.laute.fortschritt) || {};
      var ids = Object.keys(fort).filter(function (id) { return !fort[id].mastered; });
      if (!ids.length) return '';
      any = true;
      var rows = ids.map(function (id) {
        var f = fort[id];
        var words = (f.words || []).slice(0, 4).join(', ');
        return '<div class="elt-item"><span class="elt-item-icon">' + lucide(IC.spell) + '</span>' +
          '<div class="elt-item-body"><div class="elt-item-title">Laut „' + esc(lautLabel(id)) + '"</div>' +
          '<div class="elt-item-meta">' + (f.practiced || 0) + '× geübt' + (words ? ' · ' + esc(words) : '') + '</div></div></div>';
      }).join('');
      return '<div class="dashboard-card"><h4 class="card-h3" style="font-size:1rem;margin:0 0 8px;">' + esc(c.name) + '</h4>' + rows + '</div>';
    }).join('');
    if (!any) stolper += '<div class="info-card">Aktuell keine offenen Laute — stark! ✨</div>';

    document.getElementById('elt-ueber-content').innerHTML =
      '<div class="weekplan-grid">' + cols + '</div>' + stats + stolper;

    // Heute-Spalte in Sicht rücken (Raster scrollt horizontal)
    var grid = document.querySelector('#elt-ueber-content .weekplan-grid');
    var todayCol = grid && grid.querySelector('.is-today');
    if (grid && todayCol) grid.scrollLeft = Math.max(0, todayCol.offsetLeft - grid.clientWidth / 2 + todayCol.clientWidth / 2);
  }

  /* ================= AKTIONEN (öffentlich via window.Eltern) ================= */
  function currentSection() { return document.querySelector('[data-eltsec-panel]:not([hidden])'); }
  function rerender() {
    var panel = currentSection();
    if (panel) renderSection(panel.getAttribute('data-eltsec-panel'));
  }

  window.Eltern = {
    switchChild: function (id) { Konto.setActiveChild(id); rerender(); },
    toggleInterest: function (cid, v) {
      var c = Konto.getChild(cid); if (!c) return;
      var arr = (c.interests || []).slice(), i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      Konto.updateChild(cid, { interests: arr });
      renderStart();
    },
    toggleHelp: function (cid, k, on) {
      var c = Konto.getChild(cid); if (!c) return;
      var help = Object.assign({}, c.readingHelp || Konto.blankReadingHelp());
      help[k] = !!on;
      Konto.updateChild(cid, { readingHelp: help });
    },
    toggleNoDemand: function (cid, on) { Konto.updateChild(cid, { noDemandMode: !!on }); },
    goEmpf: function () { showSection('empfehlungen'); },
    assignRec: function (recId) {
      var c = Konto.getActiveChild();
      var r = (c.recommendations || []).filter(function (x) { return x.id === recId; })[0];
      if (!r) return;
      // Doppel-Zuweisung verhindern: gleiche Story ist schon als offene Aufgabe da
      var dup = r.path && (c.assignedTasks || []).some(function (t) { return !t.done && t.storyPath === r.path; });
      if (dup) { toast('„' + r.title + '" ist schon zugewiesen. 🙂'); renderEmpf(); return; }
      var type = r.kind === 'vorlesen' ? 'listen' : 'read';
      Konto.addTask(c.id, {
        type: type, title: (type === 'listen' ? 'Hör: ' : 'Lies: ') + r.title,
        emoji: r.icon || '📖', storyPath: r.path || null, lautId: null,
        stars: 4, note: r.reason || ''
      });
      toast('Aufgabe für ' + c.name + ' erstellt. 💛');
      renderEmpf();
    },
    addTask: function () {
      var c = Konto.getActiveChild();
      var stars = parseInt(document.getElementById('aufg-stars').value, 10) || 4;
      var note = (document.getElementById('aufg-note').value || '').trim();
      var task = { type: aufgType, stars: stars, note: note, storyPath: null, lautId: null };
      if (aufgType === 'laut') {
        var lid = document.getElementById('aufg-laut').value;
        task.lautId = lid; task.emoji = '🔤';
        task.title = 'Übe den ' + lautLabel(lid) + '-Laut';
      } else {
        var sel = document.getElementById('aufg-story');
        var path = sel ? sel.value : '';
        var story = storyOptions(c).filter(function (s) { return s.path === path; })[0];
        if (!story) { toast('Bitte eine Geschichte wählen. 🙂'); return; }
        task.storyPath = story.path; task.emoji = story.icon;
        task.title = (aufgType === 'listen' ? 'Hör: ' : 'Lies: ') + story.title;
      }
      Konto.addTask(c.id, task);
      toast('Aufgabe hinzugefügt. ✨');
      renderAufg();
    },
    removeTask: function (id) {
      var c = Konto.getActiveChild();
      Konto.removeTask(c.id, id);
      toast('Aufgabe entfernt.');
      renderAufg();
    },
    addPlan: function () {
      var kurz = (document.getElementById('plan-kurz').value || '').trim();
      if (!planWeekdays.length) { toast('Bitte mindestens einen Wochentag wählen. 🙂'); return; }
      var persona = document.getElementById('plan-persona').value;
      var isBonus = BONUS_PERSONAS.indexOf(persona) >= 0;
      Konto.addStoryPlan({
        childId: parseInt(document.getElementById('plan-child').value, 10),
        persona: persona,
        neurotyp: isBonus ? '' : document.getElementById('plan-neuro').value, // Bonus-Personas: fixer Stil, kein Neurotyp
        genre: document.getElementById('plan-genre').value,
        bildstil: document.getElementById('plan-bild').value,
        kurzbeschreibung: kurz,
        weekdays: planWeekdays.slice().sort(function (a, b) { return a - b; })
      });
      toast('Plan gespeichert. 📅');
      renderPlan();
    },
    togglePlan: function (id, on) { Konto.updateStoryPlan(id, { active: !!on }); },
    removePlan: function (id) { Konto.removeStoryPlan(id); toast('Plan entfernt.'); renderPlan(); }
  };

  /* ================= NAVIGATION ================= */
  function renderSection(name) {
    switch (name) {
      case 'start': renderStart(); break;
      case 'empfehlungen': renderEmpf(); break;
      case 'aufgaben': renderAufg(); break;
      case 'planen': renderPlan(); break;
      case 'uebersicht': renderUeber(); break;
    }
  }
  function showSection(name) {
    document.querySelectorAll('[data-eltsec-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-eltsec-panel') !== name;
    });
    document.querySelectorAll('.kbn-item[data-eltsec]').forEach(function (t) {
      var on = t.getAttribute('data-eltsec') === name;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    renderSection(name);
    window.scrollTo({ top: 0, behavior: FormKit.reducedMotion() ? 'auto' : 'smooth' });
  }
  document.querySelectorAll('.kbn-item[data-eltsec]').forEach(function (t) {
    t.addEventListener('click', function () { showSection(t.getAttribute('data-eltsec')); });
  });

  /* ---- Burger-Menü (global, via inline onclick) ---- */
  window.toggleMenu = function () {
    var menu = document.getElementById('mobile-menu');
    if (!menu) return;
    var btn = document.querySelector('.burger-icon');
    var open = menu.classList.toggle('open');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  function closeBurger() {
    var menu = document.getElementById('mobile-menu');
    if (menu && menu.classList.contains('open')) {
      menu.classList.remove('open');
      var btn = document.querySelector('.burger-icon');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }
  document.addEventListener('click', function (e) {
    var nav = document.querySelector('.nav-left');
    var menu = document.getElementById('mobile-menu');
    if (menu && menu.classList.contains('open') && nav && !nav.contains(e.target)) closeBurger();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBurger(); });

  /* ================= INIT ================= */
  showSection('start');
})();
