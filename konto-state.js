/* ============================================================
   Lesekumpel · konto-state.js
   Einzige Quelle der Wahrheit für den Mein-Konto-Bereich.
   Speichert Profil, Kinder, Energie, Credits & Co. in localStorage
   (Präfix "lk:"). Reines Prototyp-State, kein Backend.
   Exponiert window.Konto. Alle Zugriffe sind try/catch-gekapselt
   (file://- & Privat-Modus-fest).
   ============================================================ */
(function () {
  'use strict';

  var PREFIX = 'lk:';

  /* ---------- LOW-LEVEL STORAGE ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(PREFIX + key); } catch (e) {} }

  /* ---------- DATUM ---------- */
  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (m.length < 2) m = '0' + m;
    if (day.length < 2) day = '0' + day;
    return d.getFullYear() + '-' + m + '-' + day;
  }

  /* ---------- FÖRDERBEDARF → LESEHILFEN ----------
     Mapping nach leseapp_konzeption.md ("Spezielle Zielgruppen").
     Liefert IMMER ein vollständiges readingHelp-Objekt mit allen Flags,
     damit die Config-Sektion verlässlich rendern kann. */
  function blankReadingHelp() {
    return {
      syllableColoring: false, // Silben einfärben (LRS)
      dyslexiaFont: false,     // Legasthenie-Schrift (Lexend)
      karaokeTts: false,       // Mitlese-Vorlesen (Wort-Hervorhebung)
      chunkMode: false,        // kurze Häppchen / kürzere Texte (ADHS)
      interestPriority: false, // Interessen zuerst empfehlen (ADHS-Hook)
      clearMode: false,        // wörtliche Sprache, keine Redewendungen (Autismus)
      grammarColoring: false,  // Artikel-/Grammatikfarben (DaZ)
      highContrast: false,     // hoher Kontrast (Sehen)
      focusZoom: false,        // Fokus-Zeile / Vergrößerung (Sehen)
      wholeWord: false,        // Ganzwort-Methode (Hören)
      moreImages: false        // mehr Bilder zum Text (Hören)
    };
  }

  function deriveReadingHelp(needs) {
    var h = blankReadingHelp();
    (needs || []).forEach(function (n) {
      switch (n) {
        case 'lrs':
          h.syllableColoring = true; h.dyslexiaFont = true; h.karaokeTts = true; break;
        case 'adhs':
          h.chunkMode = true; h.interestPriority = true; break;
        case 'autismus':
          h.clearMode = true; break;
        case 'daz':
          h.grammarColoring = true; break;
        case 'sehen':
          h.highContrast = true; h.focusZoom = true; break;
        case 'hoeren':
          h.wholeWord = true; h.moreImages = true; break;
      }
    });
    return h;
  }

  /* ---------- ELTERN ---------- */
  function getParent() {
    return read('parent', null);
  }
  function setParent(obj) { write('parent', obj); }

  /* ---------- KINDER ---------- */
  function getChildren() { return read('children', []); }
  function setChildren(arr) { write('children', arr || []); }
  function getChild(id) {
    id = parseInt(id, 10);
    return getChildren().filter(function (c) { return c.id === id; })[0] || null;
  }
  function updateChild(id, patch) {
    id = parseInt(id, 10);
    var arr = getChildren();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        for (var k in patch) { if (patch.hasOwnProperty(k)) arr[i][k] = patch[k]; }
        break;
      }
    }
    setChildren(arr);
    return getChild(id);
  }
  function addChild(child) {
    var arr = getChildren();
    var maxId = 0;
    arr.forEach(function (c) { if (c.id > maxId) maxId = c.id; });
    child.id = maxId + 1;
    arr.push(child);
    setChildren(arr);
    return child;
  }

  /* ---------- AKTIVES KIND ---------- */
  function getActiveChildId() {
    var id = read('activeChildId', null);
    if (id != null) return parseInt(id, 10);
    var arr = getChildren();
    return arr.length ? arr[0].id : null;
  }
  function setActiveChild(id) { write('activeChildId', parseInt(id, 10)); }
  function getActiveChild() { return getChild(getActiveChildId()); }

  /* ---------- ONBOARDING-STATUS ---------- */
  function isOnboarded() { return read('onboardingDone', false) === true; }
  function setOnboarded(v) { write('onboardingDone', v === true); }

  /* ---------- RESET (Dev/Prototyp) ---------- */
  function reset() {
    ['parent', 'children', 'activeChildId', 'onboardingDone'].forEach(remove);
    // formkit-Autosaves ebenfalls leeren
    try {
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf('fk:') === 0) kill.push(key);
      }
      kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    } catch (e) {}
  }

  /* ---------- SEED (Mock-Daten für Direktöffnen) ----------
     Damit mein-konto.html & kind.html auch ohne durchlaufenes
     Onboarding sinnvoll rendern. Wird übersprungen, sobald echte
     Daten vorhanden sind. */
  function seedIfEmpty() {
    if (getParent() && getChildren().length) return;

    setParent({
      name: 'Maria Musterfrau',
      email: 'maria@example.de',
      emoji: '🧑‍💻',
      tier: 'leseheld',
      tierLabel: 'Leseheld',
      credits: 18,
      password: 'demo',
      authors: [
        { name: 'Frau Sonnenschein', emoji: '🌻', style: 'Fröhlich und voller Naturmetaphern, einfache Satzstrukturen' },
        { name: 'Kapitän Abenteuer', emoji: '⚓', style: 'Spannend, kurze Sätze, viele Cliffhanger und Dialoge' }
      ]
    });

    setChildren([
      {
        id: 1, name: 'Lena', age: 7,
        avatar: { base: '🦊', bgColor: '#ffe0dc', accessory: '🎀' },
        interests: ['tiere', 'weltraum', 'freundschaft'],
        level: { phase: 3, sub: '3.1', label: 'Der Fluss', selfAssessed: 'geuebt', miniTestScore: 5 },
        needs: ['lrs'],
        readingHelp: deriveReadingHelp(['lrs']),
        energy: { current: 'mittel', checkedInAt: '' },
        motivation: { wantsToLearn: 'ja', focus: 'selbst', difficulty: 'mittel' },
        noDemandMode: true,
        rights: 'erstellen',
        storiesRead: 24, quizzesSolved: 12, storiesRated: 8,
        weekActivity: [3, 1, 2, 0, 4, 2, 1],
        energyHistory: ['hoch', 'mittel', 'mittel', 'niedrig', 'hoch', 'mittel', 'hoch'],
        lastActive: '19. März 2026',
        library: [
          { id: 'l1', title: 'Der Elefant im Pool', icon: '🐘', status: 'gelesen', phase: 3 },
          { id: 'l2', title: 'Die Schatzkarte', icon: '🗺️', status: 'neu', phase: 3 },
          { id: 'l3', title: 'Reise zum Mond', icon: '🌙', status: 'gelesen', phase: 2 },
          { id: 'l4', title: 'Amelie und der Regenbogen', icon: '🌈', status: 'gelesen', phase: 3 }
        ],
        recommendations: [
          { id: 'r1', title: 'Der kleine Drache lernt fliegen', icon: '🐉', reason: 'Weil du Tiere magst', phase: 3, kind: 'selbst' },
          { id: 'r2', title: 'Sternenstaub & Raketen', icon: '🚀', reason: 'Weil du den Weltraum magst', phase: 3, kind: 'selbst' },
          { id: 'r3', title: 'Gute-Nacht-Reise zum Mond', icon: '🌙', reason: 'Ganz ruhig zum Vorlesen', phase: 2, kind: 'vorlesen' },
          { id: 'r4', title: 'Der Müde-Bär schläft ein', icon: '🐻', reason: 'Kurz & kuschelig', phase: 2, kind: 'vorlesen' }
        ],
        friends: ['Max', 'Sophie', 'Tim']
      },
      {
        id: 2, name: 'Jonas', age: 6,
        avatar: { base: '🐻', bgColor: '#d8eaff', accessory: '⚽' },
        interests: ['fussball', 'fahrzeuge', 'dinos'],
        level: { phase: 1, sub: '1.1', label: 'Der Start', selfAssessed: 'anfaenger', miniTestScore: 2 },
        needs: ['adhs'],
        readingHelp: deriveReadingHelp(['adhs']),
        energy: { current: 'hoch', checkedInAt: '' },
        motivation: { wantsToLearn: 'unsicher', focus: 'gemischt', difficulty: 'leicht' },
        noDemandMode: true,
        rights: 'nur-lesen',
        storiesRead: 8, quizzesSolved: 3, storiesRated: 2,
        weekActivity: [1, 0, 1, 1, 0, 2, 0],
        energyHistory: ['hoch', 'hoch', 'mittel', 'hoch', 'niedrig', 'mittel', 'hoch'],
        lastActive: '18. März 2026',
        library: [
          { id: 'l5', title: 'Die Döner-Diebe', icon: '🌯', status: 'gelesen', phase: 1 },
          { id: 'l6', title: 'Piraten-Abenteuer', icon: '🏴‍☠️', status: 'neu', phase: 1 }
        ],
        recommendations: [
          { id: 'r5', title: 'Tor! Das große Spiel', icon: '⚽', reason: 'Weil du Fußball magst', phase: 1, kind: 'selbst' },
          { id: 'r6', title: 'Der schnelle Bagger', icon: '🚧', reason: 'Weil du Fahrzeuge magst', phase: 1, kind: 'selbst' },
          { id: 'r7', title: 'Dino sagt Gute Nacht', icon: '🦖', reason: 'Ruhig zum Vorlesen', phase: 1, kind: 'vorlesen' }
        ],
        friends: ['Tim']
      }
    ]);

    setActiveChild(1);
    // onboardingDone bleibt false: Seed ist Demo, kein echtes Onboarding
  }

  /* ---------- BARRIEREFREIHEIT (geteilt über alle Seiten) ----------
     Speichert Schalter in lk:a11y und spiegelt sie als body-Klassen.
     options: { dyslexia:bool, contrast:bool } */
  function getA11y() { return read('a11y', { dyslexia: false, contrast: false }); }
  function applyA11y() {
    var a = getA11y();
    var b = document.body;
    if (!b) return;
    b.classList.toggle('lk-dyslexia', !!a.dyslexia);
    b.classList.toggle('lk-contrast', !!a.contrast);
  }
  function toggleA11y(key) {
    var a = getA11y();
    a[key] = !a[key];
    write('a11y', a);
    applyA11y();
    return a[key];
  }

  window.Konto = {
    // Storage-Helfer
    read: read, write: write, remove: remove, todayStr: todayStr,
    // Barrierefreiheit
    getA11y: getA11y, applyA11y: applyA11y, toggleA11y: toggleA11y,
    // Eltern
    getParent: getParent, setParent: setParent,
    // Kinder
    getChildren: getChildren, setChildren: setChildren, getChild: getChild,
    updateChild: updateChild, addChild: addChild,
    // Aktives Kind
    getActiveChildId: getActiveChildId, setActiveChild: setActiveChild, getActiveChild: getActiveChild,
    // Onboarding
    isOnboarded: isOnboarded, setOnboarded: setOnboarded,
    // Lesehilfen
    deriveReadingHelp: deriveReadingHelp, blankReadingHelp: blankReadingHelp,
    // Lifecycle
    seedIfEmpty: seedIfEmpty, reset: reset
  };
})();
