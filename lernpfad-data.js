/* ============================================================
   Lesekumpel · lernpfad-data.js
   Daten + Status-Ableitung für den Lernpfad in kind.html.
   Reines Daten-Modul (kein DOM): 5-Phasen-Modell aus
   docs/leseapp_konzeption.md ("Der Start" → "Der Profi").

   Alle Lektionen sind spielbar: 2.1 (Sonderlaute) über lautlese.js,
   alle anderen über uebungen.js + uebungen-data.js. Der Status
   kombiniert Einstufung (child.level.sub) und echten Übungs-
   fortschritt (child.lernpfad, geschrieben von uebungen.js):
   done = geübt ODER laut Einstufung schon vorbei; locked ist rein
   visuell ("noch nicht dran") — Antippen öffnet trotzdem die Übung.

   Exponiert window.Lernpfad.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 5 PHASEN / 17 LEKTIONEN ----------
     id-Konvention wie child.level.sub ('3.1'). kind:
     'top100' = Wortkarten-Runden aus der CSV (uebungen.js),
     'laute'  = live (bestehendes Meine-Laute-Feature),
     'uebung' = Items aus uebungen-data.js (uebungen.js). */
  var PHASES = [
    {
      id: 1, title: 'Der Start', farbe: 'var(--salmon)', farbeSoft: 'rgba(249,115,82,0.14)',
      motto: 'Die wichtigsten Wörter zuerst',
      lessons: [
        { id: '1.1', title: 'Top-100 Wörter', subtitle: 'Die 100 häufigsten Wörter', icon: 'sparkles', kind: 'top100',
          preview: 'Hier übst du die 100 Wörter, die in fast jeder Geschichte vorkommen. Wenn du sie kennst, liest du schon die Hälfte von jedem Text!' }
      ]
    },
    {
      id: 2, title: 'Der Ausbau', farbe: 'var(--mint)', farbeSoft: 'rgba(47,184,166,0.14)',
      motto: 'Knifflige Laute und lange Wörter',
      lessons: [
        { id: '2.1', title: 'Sonderlaute', subtitle: 'Sch, ei, au & Co.', icon: 'audio-lines', kind: 'laute' },
        { id: '2.2', title: 'Stolpersteine', subtitle: 'Schwierige Wörter meistern', icon: 'footprints', kind: 'uebung',
          preview: 'Manche Wörter sehen komisch aus — zum Beispiel „Fuchs" oder „Quatsch". Hier springst du über alle Stolperwörter, bis keins dich mehr aufhält.' },
        { id: '2.3', title: 'Endungen', subtitle: '-en, -er, -chen …', icon: 'puzzle', kind: 'uebung',
          preview: 'Wörter haben oft die gleichen Endstücke: -en, -er, -chen. Wenn du sie kennst, erkennst du das Ende von einem Wort blitzschnell.' },
        { id: '2.4', title: 'Lange Wörter', subtitle: 'Zusammengesetzt & mehrsilbig', icon: 'blocks', kind: 'uebung',
          preview: 'Feu-er-wehr-au-to! Lange Wörter sind wie Türme aus Bausteinen. Hier lernst du, sie Stück für Stück zu lesen — dann sind auch Riesenwörter leicht.' }
      ]
    },
    {
      id: 3, title: 'Der Fluss', farbe: 'var(--yellow)', farbeSoft: 'rgba(255,217,90,0.22)',
      motto: 'Flüssig lesen wie ein Bach',
      lessons: [
        { id: '3.1', title: 'Erzählzeit', subtitle: 'Es war einmal … (Präteritum)', icon: 'hourglass', kind: 'uebung',
          preview: 'Märchen und Abenteuer erzählen von früher: „Der Drache flog davon." Hier lernst du die Erzählzeit kennen — so liest du wie im Märchenbuch.' },
        { id: '3.2', title: 'Vorsilben', subtitle: 'ver-, be-, auf- …', icon: 'corner-down-right', kind: 'uebung',
          preview: 'Kleine Silben am Anfang verändern das ganze Wort: laufen, weglaufen, verlaufen. Hier entdeckst du, was Vorsilben alles können.' },
        { id: '3.3', title: 'Nachsilben', subtitle: '-ung, -heit, -keit …', icon: 'corner-down-left', kind: 'uebung',
          preview: 'Auch am Ende können Silben zaubern: aus „frei" wird „Freiheit". Hier lernst du die wichtigsten Nachsilben kennen.' },
        { id: '3.4', title: 'Bindewörter', subtitle: 'und, aber, weil …', icon: 'link', kind: 'uebung',
          preview: 'Bindewörter kleben Sätze zusammen: „Ich lese gern, WEIL Geschichten spannend sind." Hier übst du die kleinen Wörter mit der großen Wirkung.' }
      ]
    },
    {
      id: 4, title: 'Die Geschichte', farbe: 'var(--lila)', farbeSoft: 'rgba(125,106,230,0.14)',
      motto: 'Sätze, die Geschichten erzählen',
      lessons: [
        { id: '4.1', title: 'Satzklammer', subtitle: 'Sätze mit zwei Teilen', icon: 'brackets', kind: 'uebung',
          preview: '„Ich habe den Schatz gestern im Garten GEFUNDEN." Manchmal gehören zwei Wortteile zusammen, obwohl sie weit auseinander stehen. Hier knackst du solche Sätze.' },
        { id: '4.2', title: 'Dialoge', subtitle: 'Wörtliche Rede lesen', icon: 'messages-square', kind: 'uebung',
          preview: '„Los geht\'s!", rief Mia. Hier lernst du, wer in einer Geschichte gerade spricht — und liest Dialoge wie ein Schauspieler.' },
        { id: '4.3', title: 'Relativsätze', subtitle: 'Der Hund, der bellt …', icon: 'split', kind: 'uebung',
          preview: '„Das Mädchen, das den Drachen zähmte, hieß Juna." Eingeschobene Sätze verraten Extra-Infos. Hier lernst du, sie zu entwirren.' },
        { id: '4.4', title: 'Vergleiche', subtitle: 'Stark wie ein Bär', icon: 'scale', kind: 'uebung',
          preview: '„Schnell wie der Blitz" — Sprache kann Bilder malen! Hier entdeckst du Vergleiche und was sie wirklich bedeuten.' }
      ]
    },
    {
      id: 5, title: 'Der Profi', farbe: 'var(--navy)', farbeSoft: 'rgba(43,49,64,0.10)',
      motto: 'Du liest alles!',
      lessons: [
        { id: '5.1', title: 'Synonyme', subtitle: 'Viele Wörter, eine Bedeutung', icon: 'wand-sparkles', kind: 'uebung',
          preview: 'Gehen, schlendern, flitzen, schleichen — für fast alles gibt es viele Wörter. Hier sammelst du Zauberwörter für deinen Wortschatz.' },
        { id: '5.2', title: 'Redewendungen', subtitle: 'Tomaten auf den Augen?', icon: 'quote', kind: 'uebung',
          preview: '„Da steppt der Bär!" — aber es tanzt gar kein Bär? Hier knackst du Redewendungen und weißt, was wirklich gemeint ist.' },
        { id: '5.3', title: 'Abstrakte Wörter', subtitle: 'Mut, Glück, Freundschaft', icon: 'cloud', kind: 'uebung',
          preview: 'Manche Wörter kann man nicht anfassen: Mut, Glück, Freundschaft. Hier lernst du Wörter für Dinge, die man nur fühlen kann.' },
        { id: '5.4', title: 'Sachtexte', subtitle: 'Echtes Wissen lesen', icon: 'book-open', kind: 'uebung',
          preview: 'Wie schlafen Delfine? Warum ist der Himmel blau? Hier liest du echte Wissens-Texte — wie ein richtiger Forscher.' }
      ]
    }
  ];

  /* ---------- LUCIDE-INLINE-ICONS (Style-Guide: keine Emojis) ---------- */
  var ICON_PATHS = {
    'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
    'audio-lines': '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
    'footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
    'puzzle': '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>',
    'blocks': '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
    'hourglass': '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    'corner-down-right': '<polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>',
    'corner-down-left': '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'brackets': '<path d="M16 3h3v18h-3"/><path d="M8 21H5V3h3"/>',
    'messages-square': '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
    'split': '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>',
    'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    'wand-sparkles': '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
    'quote': '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
    'cloud': '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'sprout': '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    'award': '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    'map': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>'
  };
  function icon(name) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>';
  }

  /* ---------- STATUS-ABLEITUNG (nur lesen) ----------
     Vorrang: child.lernpfad.done[id] (echt geübt) → 'done'.
     Sonst Einstufung: child.level.sub ('3.1') = aktuelle Lektion,
     davor = done, danach = locked (rein visuell, trotzdem spielbar).
     Die Laute-Lektion hat einen eigenen Live-Status. */
  function currentSub(child) {
    var lvl = (child && child.level) || {};
    var sub = parseFloat(lvl.sub);
    if (!isNaN(sub)) return sub;
    var ph = parseInt(lvl.phase, 10);
    return (isNaN(ph) ? 1 : ph) + 0.1;
  }
  function lauteStats(child) {
    var inv = (window.Lautlese && window.Lautlese.LAUT_INVENTORY) || [];
    var f = (child && child.laute && child.laute.fortschritt) || {};
    var mastered = 0;
    inv.forEach(function (g) { if (f[g.id] && f[g.id].mastered) mastered++; });
    return { mastered: mastered, total: inv.length };
  }
  // Übungsfortschritt {done, total} einer Lektion aus child.lernpfad
  // (Item-Zahl lazy aus window.UebungenData; Top-100 aus lp.top100)
  function lessonProgress(lesson, child) {
    var lp = (child && child.lernpfad) || {};
    if (lesson.kind === 'top100') {
      var t100 = lp.top100 || {};
      var totals = t100.totals || {};
      var total = 0;
      for (var k in totals) if (totals.hasOwnProperty(k)) total += totals[k];
      if (!total) total = 100; // CSV noch nie geladen
      return { done: Object.keys(t100.words || {}).length, total: total };
    }
    var totalItems = (window.UebungenData && UebungenData.itemCount(lesson.id)) || 0;
    var slot = (lp.progress || {})[lesson.id];
    return { done: slot ? slot.items.length : 0, total: totalItems };
  }
  function lessonStatus(lesson, child) {
    if (lesson.kind === 'laute') {
      var s = lauteStats(child);
      return {
        state: (s.total && s.mastered === s.total) ? 'done' : 'live',
        mastered: s.mastered, total: s.total
      };
    }
    var prog = lessonProgress(lesson, child);
    var lpDone = ((child && child.lernpfad) || {}).done || {};
    if (lpDone[lesson.id]) return { state: 'done', done: prog.done, total: prog.total };
    var cur = currentSub(child);
    var id = parseFloat(lesson.id);
    var state = id < cur ? 'done' : (id === cur ? 'active' : 'locked');
    return { state: state, done: prog.done, total: prog.total };
  }
  // Fortschritt einer Phase 0..1 (Übungs-/Laute-Lektionen zählen anteilig)
  function phaseProgress(phase, child) {
    var sum = 0;
    phase.lessons.forEach(function (l) {
      var st = lessonStatus(l, child);
      if (st.state === 'done') sum += 1;
      else if (st.state === 'live' && st.total) sum += st.mastered / st.total;
      else if (st.total) sum += Math.min(1, (st.done || 0) / st.total);
    });
    return phase.lessons.length ? sum / phase.lessons.length : 0;
  }

  /* ---------- TOP-100-WÖRTER (lazy aus der CSV) ----------
     "Top 100 Wörter.csv": Wort (DE),Silbentrennung,Klasse.
     Liefert { klassen: [{ name, words: [{wort, silben}] }] } oder
     null (offline / file://). Callback-Puffer wie loadStoryIndex. */
  var _t100 = null, _t100State = 0, _t100Cbs = [];
  function parseTop100(text) {
    var lines = String(text || '').split('\n');
    var byName = {}, order = [];
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].replace(/\r/g, '').trim();
      if (!line) continue;
      var parts = line.split(',');
      if (parts.length < 3) continue;
      var wort = parts[0].trim(), silben = parts[1].trim(), klasse = parts[2].trim();
      var gruppe = (parts[3] || klasse).trim();   // 4. Spalte = kinderfreundliche Gruppe (Tiere, Farben …)
      if (!wort || !gruppe) continue;
      if (!byName[gruppe]) { byName[gruppe] = { name: gruppe, words: [] }; order.push(gruppe); }
      byName[gruppe].words.push({ wort: wort, silben: silben, gruppe: gruppe });
    }
    if (!order.length) return null;
    var arr = order.map(function (k) { return byName[k]; });
    return { klassen: arr, gruppen: arr };   // klassen bleibt als Alias (uebungen.js)
  }
  function loadTop100(cb) {
    if (_t100State === 2) { cb(_t100); return; }
    _t100Cbs.push(cb);
    if (_t100State === 1) return;
    _t100State = 1;
    function done(d) {
      _t100 = d; _t100State = 2;
      var cbs = _t100Cbs; _t100Cbs = [];
      cbs.forEach(function (f) { f(d); });
    }
    try {
      // no-cache: sonst klebt der Browser per Heuristik an einer alten CSV
      fetch('Top%20100%20W%C3%B6rter.csv', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
        .then(function (t) { done(parseTop100(t)); })
        .catch(function () { done(null); });
    } catch (e) { done(null); }
  }

  /* ---------- PUBLIC API ---------- */
  window.Lernpfad = {
    PHASES: PHASES,
    icon: icon,
    lessonStatus: lessonStatus,
    lessonProgress: lessonProgress,
    phaseProgress: phaseProgress,
    loadTop100: loadTop100
  };
})();
