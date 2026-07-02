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
  function childSwitcher() {
    var kids = Konto.getChildren(), act = Konto.getActiveChildId();
    if (kids.length < 2) return '';
    return '<div class="child-switcher"><span class="child-switcher-label">Kind:</span>' +
      '<select class="form-select" onchange="Eltern.switchChild(this.value)" aria-label="Kind auswählen">' +
      kids.map(function (c) { return '<option value="' + c.id + '"' + (c.id === act ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') +
      '</select></div>';
  }

  /* ================= START / DASHBOARD ================= */
  function energyCells(c) {
    var hist = (c.energyHistory || []).slice(-7);
    if (!hist.length) return '<span class="child-meta">Noch keine Check-ins</span>';
    return '<span class="cer-cells">' + hist.map(function (e) {
      var m = ENERGY_META[e] || ENERGY_META.mittel;
      return '<span class="cer-cell ' + m.cls + '" title="' + m.label + '">' + m.e + '</span>';
    }).join('') + '</span>';
  }
  function weekChart(c) {
    var wa = c.weekActivity || [0, 0, 0, 0, 0, 0, 0];
    var maxA = Math.max.apply(null, wa.concat([1]));
    return '<div class="activity-chart">' + wa.map(function (v, i) {
      var h = Math.round((v / maxA) * 90);
      return '<div class="chart-bar-wrap"><span class="chart-count">' + (v > 0 ? v : '') + '</span>' +
        '<div class="chart-bar" style="height:' + (h > 0 ? h : 4) + 'px;' + (v === 0 ? 'opacity:0.2;' : '') + '"></div>' +
        '<span class="chart-day">' + DAYS[i] + '</span></div>';
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
  function renderStart() {
    var p = Konto.getParent() || {}, kids = Konto.getChildren();
    var totalRead = kids.reduce(function (s, c) { return s + (c.storiesRead || 0); }, 0);
    var openTasks = kids.reduce(function (s, c) { return s + ((c.assignedTasks || []).filter(function (t) { return !t.done; }).length); }, 0);
    var html =
      '<div class="dashboard-card"><div class="account-header" style="display:flex;align-items:center;gap:14px;">' +
        '<div class="account-avatar-lg" style="font-size:2.4rem;">' + esc(p.emoji || '🧑') + '</div>' +
        '<div><h2 style="margin:0;font-family:var(--font-heading);">' + esc(p.name || 'Elternkonto') + '</h2>' +
        '<p class="child-meta" style="margin:2px 0 0;">' + esc(p.email || 'Prototyp-Konto') + '</p></div></div></div>' +
      '<div class="stats-grid">' +
        '<div class="stat-card"><span class="stat-number">' + kids.length + '</span><span class="stat-label">Kinder</span></div>' +
        '<div class="stat-card"><span class="stat-number">' + totalRead + '</span><span class="stat-label">Geschichten gelesen</span></div>' +
        '<div class="stat-card"><span class="stat-number">' + openTasks + '</span><span class="stat-label">Offene Aufgaben</span></div>' +
      '</div>' +
      '<h2 class="card-h3" style="margin:22px 0 12px;">Deine Kinder</h2>';

    html += kids.map(function (c) {
      var av = c.avatar || {};
      var cur = ENERGY_META[c.energy && c.energy.current] || ENERGY_META.mittel;
      return '<div class="dashboard-card">' +
        '<div style="display:flex;align-items:center;gap:14px;">' +
          '<div class="child-avatar" style="background:' + esc(av.bgColor || '#ffe0dc') + '">' + esc(av.base || '🦊') + '</div>' +
          '<div style="flex:1;min-width:0;"><div class="child-name" style="font-weight:700;font-size:1.15rem;">' + esc(c.name) + '</div>' +
          '<span class="lesestufe-badge">Phase ' + (c.level ? c.level.phase : '–') + ' · ' + esc(c.level ? c.level.label : '') + '</span></div>' +
        '</div>' +
        '<div class="child-energy-row"><span style="font-size:1.6rem;">' + cur.e + '</span>' +
          '<div><div style="font-weight:700;">' + cur.label + '</div>' +
          '<div class="child-meta">Letzte Tage: </div></div>' + energyCells(c) + '</div>' +
        weekChart(c) +
        '<div class="child-statline">' +
          '<span>⭐ <strong>' + computeStars(c) + '</strong> Sterne</span>' +
          '<span>📖 <strong>' + (c.storiesRead || 0) + '</strong> gelesen</span>' +
          '<span>Zuletzt aktiv: <strong>' + esc(c.lastActive || '–') + '</strong></span>' +
        '</div>' +
        childDetails(c) +
      '</div>';
    }).join('');

    // Kinder verwalten: neues Kind hinzufügen
    html += '<div class="dashboard-card"><h3 class="card-h3">Kind hinzufügen</h3>' +
      '<div class="elt-form">' +
        '<div class="elt-form-row"><label for="nc-name">Name</label><input type="text" id="nc-name" class="text-input" maxlength="30" placeholder="z. B. Emma"></div>' +
        '<div class="elt-form-row"><label for="nc-age">Alter</label><input type="number" id="nc-age" class="text-input" min="4" max="12" placeholder="7"></div>' +
        '<button type="button" class="btn-primary" onclick="Eltern.addChild()">Kind anlegen</button>' +
      '</div></div>';

    document.getElementById('elt-start-content').innerHTML = html;
  }

  /* ================= EMPFEHLUNGEN ================= */
  function renderEmpf() {
    var c = Konto.getActiveChild();
    var recs = c.recommendations || [];
    var html = childSwitcher();
    if (!recs.length) {
      html += '<div class="info-card">Noch keine Empfehlungen für ' + esc(c.name) + '. Sobald gelesen wird, lernen wir dazu.</div>';
    } else {
      html += recs.map(function (r) {
        var flag = r.kind === 'vorlesen' ? '<span class="status-pill status-vorlesen">Vorlesen</span>' : '<span class="status-pill status-selbst">Selbst lesen</span>';
        return '<div class="elt-item"><span class="elt-item-emoji">' + esc(r.icon || '📖') + '</span>' +
          '<div class="elt-item-body"><div class="elt-item-title">' + esc(r.title) + '</div>' +
          '<div class="elt-item-meta">' + esc(r.reason || '') + ' · Phase ' + (r.phase || '–') + ' ' + flag + '</div></div>' +
          '<button type="button" class="btn-assign" onclick="Eltern.assignRec(\'' + esc(r.id) + '\')">Zuweisen</button></div>';
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
        '<button type="button" class="type-chip" data-type="read">📖 Lesen</button>' +
        '<button type="button" class="type-chip" data-type="listen">🗣️ Hören</button>' +
        '<button type="button" class="type-chip" data-type="laut">🔤 Laut üben</button>' +
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
    var list = '<h3 class="card-h3" style="margin-top:8px;">Aktive Aufgaben</h3>';
    if (!tasks.length) {
      list += '<div class="info-card">Noch keine Aufgaben. Lege oben die erste an — sie erscheint in der Kinder-Ansicht. 💛</div>';
    } else {
      list += tasks.map(function (t) {
        var meta = t.done ? 'Erledigt' : (t.note || (t.type === 'laut' ? 'Laut-Übung' : 'Zum ' + (t.type === 'listen' ? 'Anhören' : 'Lesen')));
        return '<div class="elt-item' + (t.done ? ' is-done' : '') + '"><span class="elt-item-emoji">' + (t.emoji || '📝') + '</span>' +
          '<div class="elt-item-body"><div class="elt-item-title">' + esc(t.title) + '</div>' +
          '<div class="elt-item-meta">' + esc(meta) + ' · ' + (t.stars || 0) + ' ⭐</div></div>' +
          '<button type="button" class="icon-btn-sm" aria-label="Aufgabe löschen" onclick="Eltern.removeTask(\'' + esc(t.id) + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>';
      }).join('');
    }
    document.getElementById('elt-aufg-content').innerHTML = childSwitcher() + form + list;
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
      '<div class="elt-form-row"><label for="plan-neuro">Neurotyp</label><select id="plan-neuro" class="form-select">' + neuroOpts + '</select></div>' +
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
  }
  function childName(id) {
    var c = Konto.getChild(id);
    return c ? c.name : '—';
  }
  function planItemHtml(pl) {
    var wd = (pl.weekdays || []).slice().sort(function (a, b) { return a - b; }).map(function (n) { return DAYS[n - 1]; }).join(', ') || 'keine Tage';
    return '<div class="elt-item' + (pl.active ? '' : ' is-done') + '"><span class="elt-item-emoji">📅</span>' +
      '<div class="elt-item-body"><div class="elt-item-title">' + esc(pl.persona) + ' · ' + esc(pl.genre) + '</div>' +
      '<div class="elt-item-meta">Für ' + esc(childName(pl.childId)) + ' · ' + esc(pl.neurotyp) + ' · ' + esc(wd) + '</div></div>' +
      '<label class="switch" style="margin-right:6px;" title="Aktiv"><input type="checkbox" ' + (pl.active ? 'checked' : '') + ' onchange="Eltern.togglePlan(\'' + esc(pl.id) + '\',this.checked)" aria-label="Plan aktiv"><span class="track"></span><span class="thumb"></span></label>' +
      '<button type="button" class="icon-btn-sm" aria-label="Plan löschen" onclick="Eltern.removePlan(\'' + esc(pl.id) + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>';
  }

  /* ================= WOCHENPLAN / ÜBERSICHT ================= */
  function renderUeber() {
    var plans = Konto.getStoryPlans();
    var kids = Konto.getChildren();

    // Wochenraster
    var cols = DAYS.map(function (d, i) {
      var iso = i + 1;
      var dayPlans = plans.filter(function (p) { return (p.weekdays || []).indexOf(iso) >= 0; });
      var chips = dayPlans.length
        ? dayPlans.map(function (p) {
            return '<span class="weekplan-chip' + (p.active ? '' : ' is-off') + '"><span class="wp-persona">' + esc(p.persona) + '</span>' +
              esc(p.genre) + ' · ' + esc(childName(p.childId)) + '</span>';
          }).join('')
        : '<div class="weekplan-empty">—</div>';
      return '<div class="weekplan-col"><div class="weekplan-day">' + d + '</div>' + chips + '</div>';
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
        return '<div class="elt-item"><span class="elt-item-emoji">🔤</span>' +
          '<div class="elt-item-body"><div class="elt-item-title">Laut „' + esc(lautLabel(id)) + '"</div>' +
          '<div class="elt-item-meta">' + (f.practiced || 0) + '× geübt' + (words ? ' · ' + esc(words) : '') + '</div></div></div>';
      }).join('');
      return '<div class="dashboard-card"><h4 class="card-h3" style="font-size:1rem;margin:0 0 8px;">' + esc(c.name) + '</h4>' + rows + '</div>';
    }).join('');
    if (!any) stolper += '<div class="info-card">Aktuell keine offenen Laute — stark! ✨</div>';

    document.getElementById('elt-ueber-content').innerHTML =
      '<div class="weekplan-grid">' + cols + '</div>' + stats + stolper;
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
    addChild: function () {
      var name = (document.getElementById('nc-name').value || '').trim();
      var age = parseInt(document.getElementById('nc-age').value, 10) || 6;
      if (!name) { toast('Bitte gib einen Namen ein. 🙂'); return; }
      Konto.addChild({
        name: name, age: age,
        avatar: { base: '🐨', bgColor: '#e8f5e9', accessory: '' },
        interests: [],
        level: { phase: 1, sub: '1.1', label: 'Der Start', selfAssessed: 'anfaenger', miniTestScore: 0 },
        needs: [], readingHelp: Konto.deriveReadingHelp([]),
        energy: { current: 'mittel', checkedInAt: '' },
        laute: { fokus: null, fortschritt: {} },
        noDemandMode: true, rights: 'nur-lesen',
        storiesRead: 0, quizzesSolved: 0, storiesRated: 0,
        weekActivity: [0, 0, 0, 0, 0, 0, 0], energyHistory: [],
        lastActive: 'neu', library: [], recommendations: [], assignedTasks: [], friends: []
      });
      toast('„' + name + '" wurde angelegt! ✨');
      renderStart();
    },
    assignRec: function (recId) {
      var c = Konto.getActiveChild();
      var r = (c.recommendations || []).filter(function (x) { return x.id === recId; })[0];
      if (!r) return;
      var type = r.kind === 'vorlesen' ? 'listen' : 'read';
      Konto.addTask(c.id, {
        type: type, title: (type === 'listen' ? 'Hör: ' : 'Lies: ') + r.title,
        emoji: r.icon || '📖', storyPath: r.path || null, lautId: null,
        stars: 4, note: r.reason || ''
      });
      toast('Aufgabe für ' + c.name + ' erstellt. 💛');
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
      renderAufg();
    },
    addPlan: function () {
      var kurz = (document.getElementById('plan-kurz').value || '').trim();
      if (!planWeekdays.length) { toast('Bitte mindestens einen Wochentag wählen. 🙂'); return; }
      Konto.addStoryPlan({
        childId: parseInt(document.getElementById('plan-child').value, 10),
        persona: document.getElementById('plan-persona').value,
        neurotyp: document.getElementById('plan-neuro').value,
        genre: document.getElementById('plan-genre').value,
        bildstil: document.getElementById('plan-bild').value,
        kurzbeschreibung: kurz,
        weekdays: planWeekdays.slice()
      });
      toast('Plan gespeichert. 📅');
      renderPlan();
    },
    togglePlan: function (id, on) { Konto.updateStoryPlan(id, { active: !!on }); },
    removePlan: function (id) { Konto.removeStoryPlan(id); renderPlan(); }
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
