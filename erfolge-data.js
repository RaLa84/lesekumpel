/* ============================================================
   Lesekumpel · erfolge-data.js
   Plaketten (Achievements) — geteilt von kind.html + erfolge.html.
   Selbstständiges Daten-Modul (braucht lernpfad-data.js NICHT).

   Philosophie: Spaß & Motivation, kein Druck.
   - In der echten App sehen Kinder NUR verdiente Plaketten
     (keine leeren Felder). erfolge.html zeigt als Mockup alle.
   - check(m) leitet aus vorhandenen Kind-Daten ab, ob eine
     Plakette verdient ist. check: null = braucht künftigen
     Lektionsfortschritt (child.lernpfad) → im Mockup "verborgen".

   Exponiert window.Erfolge.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- PHASEN-GRUPPEN (lokal, kein Zwang auf lernpfad-data.js) ---------- */
  var PHASE_NAMES = {
    0: 'Immer dabei',
    1: 'Der Start',
    2: 'Der Ausbau',
    3: 'Der Fluss',
    4: 'Die Geschichte',
    5: 'Der Profi'
  };
  var PHASE_COLORS = {
    0: { c: 'var(--mint)', cs: 'rgba(47,184,166,0.14)' },
    1: { c: 'var(--salmon)', cs: 'rgba(249,115,82,0.14)' },
    2: { c: 'var(--mint)', cs: 'rgba(47,184,166,0.14)' },
    3: { c: 'var(--yellow-ink)', cs: 'rgba(255,217,90,0.25)' },
    4: { c: 'var(--lila)', cs: 'rgba(125,106,230,0.14)' },
    5: { c: 'var(--navy)', cs: 'rgba(43,49,64,0.10)' }
  };

  /* ---------- KENNZAHLEN (einmal aus dem Kind-Objekt ableiten) ---------- */
  function metrics(child) {
    var c = child || {};
    var laute = (c.laute && c.laute.fortschritt) || {};
    var inv = (window.Lautlese && window.Lautlese.LAUT_INVENTORY) || [];
    var mastered = 0, practicedAny = false;
    inv.forEach(function (g) {
      var s = laute[g.id];
      if (s && s.mastered) mastered++;
      if (s && s.practiced > 0) practicedAny = true;
    });
    // Fallback ohne Lautlese: Fortschritts-Keys direkt zählen
    if (!inv.length) {
      Object.keys(laute).forEach(function (k) {
        if (laute[k] && laute[k].mastered) mastered++;
        if (laute[k] && laute[k].practiced > 0) practicedAny = true;
      });
    }
    var week = c.weekActivity || [];
    var activeDays = week.filter(function (n) { return n > 0; }).length;
    return {
      storiesRead: c.storiesRead || 0,
      quizzesSolved: c.quizzesSolved || 0,
      storiesRated: c.storiesRated || 0,
      lauteMastered: mastered,
      lauteTotal: inv.length || Object.keys(laute).length,
      lautePracticed: practicedAny,
      activeDays: activeDays,
      phase: (c.level && c.level.phase) || 1
    };
  }

  /* ---------- PLAKETTEN ----------
     phase 0 = "Immer dabei" (Lesen & Dranbleiben), 1–5 = Lernpfad-Phasen.
     check(m) = heute berechenbar; check: null = braucht künftigen
     Lektionsfortschritt (bleibt im Mockup gesperrt/"geheim").
     gold: true = die große Abschluss-Plakette. */
  var BADGES = [
    // --- Immer dabei: Lesen & Dranbleiben ---
    { id: 'startschuss', phase: 0, icon: 'rocket', title: 'Startschuss',
      description: 'Deine allererste Geschichte gelesen!',
      check: function (m) { return m.storiesRead >= 1; } },
    { id: 'buecher-entdecker', phase: 0, icon: 'book-open', title: 'Bücher-Entdecker',
      description: '5 Geschichten gelesen.',
      check: function (m) { return m.storiesRead >= 5; } },
    { id: 'buecherwurm', phase: 0, icon: 'library', title: 'Bücherwurm',
      description: '15 Geschichten gelesen.',
      check: function (m) { return m.storiesRead >= 15; } },
    { id: 'lese-drache', phase: 0, icon: 'flame', title: 'Lese-Drache',
      description: '30 Geschichten verschlungen!',
      check: function (m) { return m.storiesRead >= 30; } },
    { id: 'quiz-fuchs', phase: 0, icon: 'lightbulb', title: 'Quiz-Fuchs',
      description: '5 Quiz-Runden gelöst.',
      check: function (m) { return m.quizzesSolved >= 5; } },
    { id: 'quiz-meister', phase: 0, icon: 'brain', title: 'Quiz-Meister',
      description: '20 Quiz-Runden gelöst.',
      check: function (m) { return m.quizzesSolved >= 20; } },
    { id: 'sternchen-geber', phase: 0, icon: 'star', title: 'Sternchen-Geber',
      description: '5 Geschichten bewertet.',
      check: function (m) { return m.storiesRated >= 5; } },
    { id: 'fleissige-woche', phase: 0, icon: 'calendar-check', title: 'Fleißige Woche',
      description: 'An 5 Tagen in einer Woche gelesen.',
      check: function (m) { return m.activeDays >= 5; } },
    { id: 'jeden-tag-held', phase: 0, icon: 'calendar-heart', title: 'Jeden-Tag-Held',
      description: 'Eine ganze Woche jeden Tag gelesen!',
      check: function (m) { return m.activeDays >= 7; } },

    // --- Phase 1 · Der Start (Top-100) ---
    { id: 'woerter-sammler', phase: 1, icon: 'shapes', title: 'Wörter-Sammler',
      description: '25 der 100 wichtigsten Wörter gemeistert.', lessonId: '1.1', check: null },
    { id: 'woerter-jaeger', phase: 1, icon: 'target', title: 'Wörter-Jäger',
      description: '50 Wörter gemeistert — die Hälfte!', lessonId: '1.1', check: null },
    { id: 'hundert-held', phase: 1, icon: 'crown', title: 'Hundert-Held',
      description: 'Alle 100 Wörter! Du kennst die wichtigsten Wörter der Welt.', lessonId: '1.1', check: null },
    { id: 'familien-forscher', phase: 1, icon: 'users', title: 'Familien-Forscher',
      description: 'Eine ganze Wortfamilie komplett — zum Beispiel alle Tun-Wörter.', lessonId: '1.1', check: null },

    // --- Phase 2 · Der Ausbau ---
    { id: 'lauschohr', phase: 2, icon: 'ear', title: 'Lauschohr',
      description: 'Deinen ersten Laut geübt.', lessonId: '2.1',
      check: function (m) { return m.lautePracticed; } },
    { id: 'laute-sammler', phase: 2, icon: 'audio-lines', title: 'Laute-Sammler',
      description: '3 Laute gemeistert.', lessonId: '2.1',
      check: function (m) { return m.lauteMastered >= 3; } },
    { id: 'laute-champion', phase: 2, icon: 'trophy', title: 'Laute-Champion',
      description: 'Alle 13 Laute gemeistert!', lessonId: '2.1',
      check: function (m) { return m.lauteTotal > 0 && m.lauteMastered >= m.lauteTotal; } },
    { id: 'stolperstein-springer', phase: 2, icon: 'footprints', title: 'Stolperstein-Springer',
      description: 'Über alle Stolperwörter gehüpft.', lessonId: '2.2', check: null },
    { id: 'endungs-entdecker', phase: 2, icon: 'puzzle', title: 'Endungs-Entdecker',
      description: 'Die Lektion Endungen geschafft.', lessonId: '2.3', check: null },
    { id: 'wortriesen-baendiger', phase: 2, icon: 'mountain', title: 'Wortriesen-Bändiger',
      description: 'Richtig lange Wörter gelesen — wie Feu-er-wehr-au-to!', lessonId: '2.4', check: null },

    // --- Phase 3 · Der Fluss ---
    { id: 'zeitreisender', phase: 3, icon: 'hourglass', title: 'Zeitreisender',
      description: 'Erzählzeit gemeistert: Du liest jetzt wie im Märchen.', lessonId: '3.1', check: null },
    { id: 'wort-baumeister', phase: 3, icon: 'blocks', title: 'Wort-Baumeister',
      description: 'Vorsilben und Nachsilben zusammengebaut.', lessonId: '3.3', check: null },
    { id: 'satz-verbinder', phase: 3, icon: 'link', title: 'Satz-Verbinder',
      description: 'Bindewörter-Lektion geschafft: und, aber, weil …', lessonId: '3.4', check: null },

    // --- Phase 4 · Die Geschichte ---
    { id: 'satz-akrobat', phase: 4, icon: 'move', title: 'Satz-Akrobat',
      description: 'Satzklammer und Relativsätze gemeistert.', lessonId: '4.3', check: null },
    { id: 'dialog-star', phase: 4, icon: 'messages-square', title: 'Dialog-Star',
      description: 'Wörtliche Rede wie ein Schauspieler gelesen.', lessonId: '4.2', check: null },
    { id: 'vergleichs-dichter', phase: 4, icon: 'feather', title: 'Vergleichs-Dichter',
      description: 'Sprachbilder und Vergleiche verstanden.', lessonId: '4.4', check: null },

    // --- Phase 5 · Der Profi ---
    { id: 'woerter-zauberer', phase: 5, icon: 'wand-sparkles', title: 'Wörter-Zauberer',
      description: 'Synonyme: Für jedes Wort kennst du ein Zauberwort.', lessonId: '5.1', check: null },
    { id: 'sprichwort-schlaukopf', phase: 5, icon: 'quote', title: 'Sprichwort-Schlaukopf',
      description: 'Redewendungen geknackt — da steppt der Bär!', lessonId: '5.2', check: null },
    { id: 'goldener-lesekumpel', phase: 5, icon: 'award', title: 'Goldener Lesekumpel',
      description: 'Alle Lektionen geschafft: Du kannst lesen!', gold: true, check: null }
  ];

  function isEarned(badge, m) {
    return !!(badge.check && badge.check(m));
  }
  function earnedList(child) {
    var m = metrics(child);
    return BADGES.filter(function (b) { return isEarned(b, m); });
  }

  /* ---------- LUCIDE-INLINE-ICONS (Style-Guide: keine Emojis) ---------- */
  var ICON_PATHS = {
    'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    'library': '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'brain': '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>',
    'star': '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    'calendar-check': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    'calendar-heart': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M21.29 14.7a2.43 2.43 0 0 0-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z"/>',
    'shapes': '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'crown': '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
    'ear': '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
    'audio-lines': '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
    'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    'footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
    'puzzle': '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>',
    'mountain': '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    'hourglass': '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    'blocks': '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'move': '<path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>',
    'messages-square': '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
    'feather': '<path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
    'wand-sparkles': '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
    'quote': '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
    'award': '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'circle-help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>'
  };
  function icon(name) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>';
  }

  /* ---------- PUBLIC API ---------- */
  window.Erfolge = {
    BADGES: BADGES,
    PHASE_NAMES: PHASE_NAMES,
    PHASE_COLORS: PHASE_COLORS,
    metrics: metrics,
    isEarned: isEarned,
    earnedList: earnedList,
    icon: icon
  };
})();
