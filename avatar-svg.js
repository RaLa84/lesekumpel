/* ============================================================
   Lesekumpel · avatar-svg.js
   Avatar-Baukasten: Katalog (Enum-Ids + Labels + Farben) und
   SVG-Renderer für den Kind-Avatar (Mensch oder Fantasiefigur).
   Einzige Frontend-Quelle der Enum-Ids — die n8n-Pipeline mappt
   dieselben Ids auf englische Bild-Deskriptoren (Node "Daten
   vorbereiten"). Exponiert window.AvatarSVG.
   Schema von child.avatar.v2: siehe konto-state.js.
   ============================================================ */
(function () {
  'use strict';

  var NAVY = '#2B3140';
  var GOLD = '#FFD54F';

  /* ---------- KATALOG ----------
     id-Format immer /^[a-z0-9-]+$/ (Guardrail-Kontrakt).
     hex/shade nur bei Farb-Enums; shade = vorberechnete dunklere
     Akzentfarbe (kein Farb-Rechnen zur Laufzeit). */
  var CATALOG = {
    mensch: {
      hautton: [
        { id: 'hell',        label: 'Hell',        hex: '#FFE3CF' },
        { id: 'mittel',      label: 'Mittel',      hex: '#F6C9A0' },
        { id: 'tan',         label: 'Tan',         hex: '#D9A066' },
        { id: 'dunkel',      label: 'Dunkel',      hex: '#A26A42' },
        { id: 'sehr-dunkel', label: 'Sehr dunkel', hex: '#6E4527' }
      ],
      frisur: [
        { id: 'kurz',       label: 'Kurz' },
        { id: 'glatt-lang', label: 'Lang & glatt' },
        { id: 'bob',        label: 'Bob' },
        { id: 'locken',     label: 'Locken' },
        { id: 'zoepfe',     label: 'Zöpfe' },
        { id: 'afro',       label: 'Afro' }
      ],
      haarfarbe: [
        { id: 'blond',       label: 'Blond',       hex: '#E8C468' },
        { id: 'hellbraun',   label: 'Hellbraun',   hex: '#A97C50' },
        { id: 'dunkelbraun', label: 'Dunkelbraun', hex: '#5D4630' },
        { id: 'schwarz',     label: 'Schwarz',     hex: '#2E2A2B' },
        { id: 'rot',         label: 'Rot',         hex: '#C4622D' }
      ],
      brille: [
        { id: 'keine', label: 'Keine' },
        { id: 'rund',  label: 'Rund' },
        { id: 'eckig', label: 'Eckig' }
      ],
      hoergeraet: [
        { id: 'keins', label: 'Kein Hörgerät' },
        { id: 'ja',    label: 'Mit Hörgerät' }
      ],
      oberteil: [
        { id: 'rot',    label: 'Rot',    hex: '#E05B5B', shade: '#B04545' },
        { id: 'blau',   label: 'Blau',   hex: '#5B9BD5', shade: '#43759F' },
        { id: 'gruen',  label: 'Grün',   hex: '#4CAF50', shade: '#37793A' },
        { id: 'gelb',   label: 'Gelb',   hex: '#F2C14E', shade: '#C79A32' },
        { id: 'lila',   label: 'Lila',   hex: '#9575CD', shade: '#6F55A3' },
        { id: 'orange', label: 'Orange', hex: '#F28C4E', shade: '#C56A35' }
      ],
      accessoire: [
        { id: 'keins',      label: 'Nichts' },
        { id: 'muetze',     label: 'Mütze' },
        { id: 'cap',        label: 'Cap' },
        { id: 'schleife',   label: 'Schleife' },
        { id: 'kopfhoerer', label: 'Kopfhörer' }
      ]
    },
    tier: {
      tier: [
        { id: 'hund',  label: 'Hund' },
        { id: 'katze', label: 'Katze' },
        { id: 'hase',  label: 'Hase' },
        { id: 'eule',  label: 'Eule' },
        { id: 'pferd', label: 'Pony' }
      ],
      fellfarbe: [
        { id: 'braun',   label: 'Braun',   hex: '#A97C50', shade: '#7F5B38' },
        { id: 'schwarz', label: 'Schwarz', hex: '#4A4A4A', shade: '#2E2E2E' },
        { id: 'weiss',   label: 'Weiß',    hex: '#F2EDE3', shade: '#CFC6B5' },
        { id: 'grau',    label: 'Grau',    hex: '#9AA0A6', shade: '#6F757B' },
        { id: 'orange',  label: 'Orange',  hex: '#E8954A', shade: '#BA7135' },
        { id: 'golden',  label: 'Golden',  hex: '#E3BC5F', shade: '#B7913C' }
      ],
      muster: [
        { id: 'einfarbig',     label: 'Einfarbig' },
        { id: 'flecken',       label: 'Flecken' },
        { id: 'streifen',      label: 'Streifen' },
        { id: 'weisse-pfoten', label: 'Weiße Pfoten' }
      ]
    },
    fantasie: {
      wesen: [
        { id: 'drache',  label: 'Drache' },
        { id: 'roboter', label: 'Roboter' },
        { id: 'fuchs',   label: 'Fuchs' },
        { id: 'fee',     label: 'Fee' },
        { id: 'einhorn', label: 'Einhorn' }
      ],
      farbe: [
        { id: 'rot',     label: 'Rot',     hex: '#E05B5B', shade: '#B04545' },
        { id: 'blau',    label: 'Blau',    hex: '#5B9BD5', shade: '#43759F' },
        { id: 'gruen',   label: 'Grün',    hex: '#4CAF50', shade: '#37793A' },
        { id: 'lila',    label: 'Lila',    hex: '#9575CD', shade: '#6F55A3' },
        { id: 'tuerkis', label: 'Türkis',  hex: '#3FB9CF', shade: '#2E8DA0' },
        { id: 'rosa',    label: 'Rosa',    hex: '#F48FB1', shade: '#C96A8C' },
        { id: 'orange',  label: 'Orange',  hex: '#F28C4E', shade: '#C56A35' }
      ],
      merkmal: [
        { id: 'fluegel', label: 'Flügel' },
        { id: 'antenne', label: 'Antenne' },
        { id: 'krone',   label: 'Krone' },
        { id: 'sterne',  label: 'Sterne' }
      ]
    }
  };

  var DEFAULTS = {
    mensch:   { hautton: 'hell', frisur: 'kurz', haarfarbe: 'dunkelbraun', brille: 'keine', hoergeraet: 'keins', oberteil: 'blau', accessoire: 'keins' },
    tier:     { tier: 'hund', fellfarbe: 'braun', muster: 'einfarbig' },
    fantasie: { wesen: 'drache', farbe: 'gruen', merkmal: 'fluegel' }
  };

  function normTyp(typ) {
    return (typ === 'fantasie' || typ === 'tier') ? typ : 'mensch';
  }

  /* Enum-Eintrag nachschlagen; unbekannte Ids fallen auf den Default zurück. */
  function opt(typ, attr, id) {
    var list = (CATALOG[typ] && CATALOG[typ][attr]) || [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    for (var j = 0; j < list.length; j++) { if (list[j].id === DEFAULTS[typ][attr]) return list[j]; }
    return list[0] || { id: '', label: '' };
  }

  function defaults(typ, childName) {
    typ = normTyp(typ);
    function copy(src) {
      var o = {}, k;
      for (k in src) { if (src.hasOwnProperty(k)) o[k] = src[k]; }
      return o;
    }
    return {
      typ: typ,
      name: (typ === 'mensch' && childName) ? String(childName) : '',
      mensch: copy(DEFAULTS.mensch),
      tier: copy(DEFAULTS.tier),
      fantasie: copy(DEFAULTS.fantasie),
      updatedAt: ''
    };
  }

  /* ---------- RENDER: MENSCH ---------- */

  function renderMensch(a) {
    var skin  = opt('mensch', 'hautton', a.hautton).hex;
    var hair  = opt('mensch', 'haarfarbe', a.haarfarbe).hex;
    var top   = opt('mensch', 'oberteil', a.oberteil);
    var parts = [];

    // Haare hinten (unter Kopf)
    if (a.frisur === 'glatt-lang') {
      parts.push('<path d="M35 40 C35 20 47 14 60 14 C73 14 85 20 85 40 L85 76 Q85 84 77 84 L43 84 Q35 84 35 76 Z" fill="' + hair + '"/>');
    } else if (a.frisur === 'afro') {
      parts.push('<circle cx="60" cy="34" r="27" fill="' + hair + '"/>');
      parts.push('<circle cx="37" cy="44" r="11" fill="' + hair + '"/>');
      parts.push('<circle cx="83" cy="44" r="11" fill="' + hair + '"/>');
    } else if (a.frisur === 'zoepfe') {
      parts.push('<circle cx="29" cy="58" r="6.5" fill="' + hair + '"/><circle cx="28" cy="69" r="5.5" fill="' + hair + '"/>');
      parts.push('<circle cx="91" cy="58" r="6.5" fill="' + hair + '"/><circle cx="92" cy="69" r="5.5" fill="' + hair + '"/>');
      parts.push('<circle cx="30" cy="51" r="2.6" fill="' + GOLD + '"/><circle cx="90" cy="51" r="2.6" fill="' + GOLD + '"/>');
    }

    // Oberkörper + Kragen + Hals
    parts.push('<path d="M60 84 C43 84 33 95 31 112 L31 122 L89 122 L89 112 C87 95 77 84 60 84 Z" fill="' + top.hex + '"/>');
    parts.push('<rect x="54" y="66" width="12" height="22" rx="5" fill="' + skin + '"/>');
    parts.push('<ellipse cx="60" cy="87" rx="10" ry="4" fill="' + top.shade + '"/>');

    // Ohren + Kopf
    parts.push('<circle cx="34" cy="52" r="5.5" fill="' + skin + '"/><circle cx="86" cy="52" r="5.5" fill="' + skin + '"/>');
    parts.push('<circle cx="60" cy="50" r="26" fill="' + skin + '"/>');

    // Gesicht (fix)
    parts.push('<circle cx="50" cy="50" r="2.8" fill="' + NAVY + '"/><circle cx="70" cy="50" r="2.8" fill="' + NAVY + '"/>');
    parts.push('<path d="M52 60 Q60 67 68 60" stroke="' + NAVY + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
    parts.push('<circle cx="43" cy="57" r="3.5" fill="#F2A196" opacity="0.5"/><circle cx="77" cy="57" r="3.5" fill="#F2A196" opacity="0.5"/>');

    // Haare vorn (Pony/Deckhaar)
    if (a.frisur === 'kurz' || a.frisur === 'zoepfe') {
      parts.push('<path d="M35 47 C34 29 45 21 60 21 C75 21 86 29 85 47 C82 36 73 31 60 31 C47 31 38 36 35 47 Z" fill="' + hair + '"/>');
    } else if (a.frisur === 'glatt-lang') {
      parts.push('<path d="M36 48 C36 28 46 22 60 22 C74 22 84 28 84 48 C80 37 72 32 60 32 C48 32 40 37 36 48 Z" fill="' + hair + '"/>');
    } else if (a.frisur === 'bob') {
      parts.push('<path d="M34 52 C33 28 45 20 60 20 C75 20 87 28 86 52 C86 61 82 66 77 64 L78 44 C72 36 48 36 42 44 L43 64 C38 66 34 61 34 52 Z" fill="' + hair + '"/>');
    } else if (a.frisur === 'locken') {
      parts.push('<circle cx="42" cy="33" r="9" fill="' + hair + '"/><circle cx="53" cy="26" r="10" fill="' + hair + '"/><circle cx="67" cy="26" r="10" fill="' + hair + '"/><circle cx="78" cy="33" r="9" fill="' + hair + '"/><circle cx="36" cy="44" r="7" fill="' + hair + '"/><circle cx="84" cy="44" r="7" fill="' + hair + '"/>');
    }
    // afro: kein Front-Layer (Gesicht bleibt frei)

    // Brille
    if (a.brille === 'rund') {
      parts.push('<g stroke="' + NAVY + '" stroke-width="2.5" fill="none"><circle cx="50" cy="50" r="7.5"/><circle cx="70" cy="50" r="7.5"/><path d="M57.5 50 L62.5 50"/><path d="M42.5 49 L35 47"/><path d="M77.5 49 L85 47"/></g>');
    } else if (a.brille === 'eckig') {
      parts.push('<g stroke="' + NAVY + '" stroke-width="2.5" fill="none"><rect x="43" y="44" width="14" height="12" rx="3"/><rect x="63" y="44" width="14" height="12" rx="3"/><path d="M57 50 L63 50"/><path d="M43 48 L35 46"/><path d="M77 48 L85 46"/></g>');
    }

    // Hörgerät (hinter dem linken Ohr, bewusst gut sichtbar)
    if (a.hoergeraet === 'ja') {
      parts.push('<g><path d="M31 43 C24 44 22 53 28 57" stroke="#5B9BD5" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="29" cy="58" r="2.8" fill="#5B9BD5"/></g>');
    }

    // Accessoire (zuletzt, darf Haare überdecken)
    if (a.accessoire === 'muetze') {
      parts.push('<path d="M34 42 C34 24 46 16 60 16 C74 16 86 24 86 42 L86 46 L34 46 Z" fill="#E05B5B"/>');
      parts.push('<rect x="33" y="42" width="54" height="8" rx="4" fill="#B04545"/>');
      parts.push('<circle cx="60" cy="15" r="5" fill="#FFF9E5"/>');
    } else if (a.accessoire === 'cap') {
      parts.push('<path d="M36 40 C36 25 46 18 60 18 C74 18 84 25 84 40 L84 43 L36 43 Z" fill="#5B9BD5"/>');
      parts.push('<path d="M34 42 L86 42 Q88 50 60 50 Q32 50 34 42 Z" fill="#43759F"/>');
      parts.push('<circle cx="60" cy="19" r="2.5" fill="#43759F"/>');
    } else if (a.accessoire === 'schleife') {
      parts.push('<g fill="#F48FB1"><path d="M76 26 L64 19 L67 31 Z"/><path d="M76 26 L88 19 L85 31 Z"/><circle cx="76" cy="26" r="3.5" fill="#D67171"/></g>');
    } else if (a.accessoire === 'kopfhoerer') {
      parts.push('<path d="M35 47 C35 24 85 24 85 47" stroke="#E8950A" stroke-width="5" fill="none" stroke-linecap="round"/>');
      parts.push('<rect x="27" y="44" width="11" height="17" rx="5.5" fill="' + GOLD + '" stroke="#E8950A" stroke-width="2"/>');
      parts.push('<rect x="82" y="44" width="11" height="17" rx="5.5" fill="' + GOLD + '" stroke="#E8950A" stroke-width="2"/>');
    }

    return parts.join('');
  }

  /* ---------- RENDER: TIER ----------
     Echte Tiere (Pipeline-Schema type:'animal' — nicht vermenschlicht,
     keine Kleidung). Gleicher Chibi-Körper wie Fantasie, Art-spezifische
     Ohren/Schwanz/Gesicht + Muster-Overlays. */

  function renderTier(a) {
    var fell = opt('tier', 'fellfarbe', a.fellfarbe);
    var c = fell.hex, cs = fell.shade;
    var art = a.tier;
    var parts = [];

    // Rück-Layer: Ohren + Schwanz je Art
    if (art === 'hund') {
      parts.push('<ellipse cx="31" cy="44" rx="9" ry="17" transform="rotate(16 31 44)" fill="' + cs + '"/>');
      parts.push('<ellipse cx="89" cy="44" rx="9" ry="17" transform="rotate(-16 89 44)" fill="' + cs + '"/>');
      parts.push('<path d="M90 92 Q106 88 103 70 Q101 82 89 82 Z" fill="' + cs + '"/>');
    } else if (art === 'katze') {
      parts.push('<path d="M36 34 L29 10 L54 25 Z" fill="' + c + '"/><path d="M84 34 L91 10 L66 25 Z" fill="' + c + '"/>');
      parts.push('<path d="M40 30 L36 16 L51 26 Z" fill="#F2A6B8"/><path d="M80 30 L84 16 L69 26 Z" fill="#F2A6B8"/>');
      parts.push('<path d="M90 96 Q108 92 104 70" stroke="' + cs + '" stroke-width="8" fill="none" stroke-linecap="round"/>');
    } else if (art === 'hase') {
      parts.push('<ellipse cx="46" cy="15" rx="8.5" ry="20" fill="' + c + '"/><ellipse cx="74" cy="15" rx="8.5" ry="20" fill="' + c + '"/>');
      parts.push('<ellipse cx="46" cy="16" rx="4" ry="13" fill="#F2A6B8"/><ellipse cx="74" cy="16" rx="4" ry="13" fill="#F2A6B8"/>');
    } else if (art === 'eule') {
      parts.push('<path d="M40 30 L34 14 L52 24 Z" fill="' + cs + '"/><path d="M80 30 L86 14 L68 24 Z" fill="' + cs + '"/>');
      parts.push('<ellipse cx="29" cy="72" rx="10" ry="21" transform="rotate(12 29 72)" fill="' + cs + '"/>');
      parts.push('<ellipse cx="91" cy="72" rx="10" ry="21" transform="rotate(-12 91 72)" fill="' + cs + '"/>');
    } else if (art === 'pferd') {
      parts.push('<path d="M42 32 L38 12 L54 24 Z" fill="' + c + '"/><path d="M78 32 L82 12 L66 24 Z" fill="' + c + '"/>');
      parts.push('<circle cx="46" cy="26" r="8" fill="' + cs + '"/><circle cx="58" cy="21" r="9" fill="' + cs + '"/><circle cx="70" cy="24" r="8" fill="' + cs + '"/>');
      parts.push('<path d="M88 96 Q106 94 103 72 Q100 86 88 85 Z" fill="' + cs + '"/>');
    }

    // Körper + Bauch + Füße
    parts.push('<ellipse cx="60" cy="68" rx="33" ry="40" fill="' + c + '"/>');
    parts.push('<ellipse cx="60" cy="84" rx="18" ry="20" fill="#FFFFFF" opacity="0.35"/>');
    parts.push('<ellipse cx="46" cy="106" rx="9" ry="6" fill="' + cs + '"/><ellipse cx="74" cy="106" rx="9" ry="6" fill="' + cs + '"/>');

    // Muster-Overlays
    if (a.muster === 'flecken') {
      parts.push('<g fill="' + cs + '" opacity="0.85"><circle cx="42" cy="76" r="6"/><circle cx="76" cy="62" r="5"/><circle cx="66" cy="94" r="6.5"/></g>');
    } else if (a.muster === 'streifen') {
      parts.push('<g fill="' + cs + '" opacity="0.85"><rect x="29" y="56" width="14" height="5" rx="2.5"/><rect x="77" y="56" width="14" height="5" rx="2.5"/><rect x="31" y="68" width="12" height="5" rx="2.5"/><rect x="77" y="68" width="12" height="5" rx="2.5"/><rect x="52" y="30" width="16" height="5" rx="2.5"/></g>');
    } else if (a.muster === 'weisse-pfoten') {
      parts.push('<ellipse cx="46" cy="106" rx="9" ry="6" fill="#F7F3EA"/><ellipse cx="74" cy="106" rx="9" ry="6" fill="#F7F3EA"/>');
      parts.push('<ellipse cx="60" cy="76" rx="13" ry="14" fill="#F7F3EA" opacity="0.9"/>');
    }

    // Gesicht je Art
    if (art === 'eule') {
      parts.push('<circle cx="48" cy="54" r="9.5" fill="#FFF9E5"/><circle cx="72" cy="54" r="9.5" fill="#FFF9E5"/>');
      parts.push('<circle cx="48" cy="54" r="3.6" fill="' + NAVY + '"/><circle cx="72" cy="54" r="3.6" fill="' + NAVY + '"/>');
      parts.push('<path d="M56 60 L64 60 L60 68 Z" fill="#E8950A"/>');
    } else {
      parts.push('<circle cx="48" cy="54" r="3.2" fill="' + NAVY + '"/><circle cx="72" cy="54" r="3.2" fill="' + NAVY + '"/>');
      if (art === 'hund') {
        parts.push('<ellipse cx="60" cy="68" rx="13" ry="10" fill="#FFF9E5" opacity="0.55"/>');
        parts.push('<circle cx="60" cy="63" r="3" fill="' + NAVY + '"/>');
        parts.push('<path d="M52 70 Q60 77 68 70" stroke="' + NAVY + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
      } else if (art === 'katze') {
        parts.push('<path d="M57 62 L63 62 L60 66 Z" fill="#F2A6B8"/>');
        parts.push('<path d="M52 69 Q60 75 68 69" stroke="' + NAVY + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
        parts.push('<g stroke="' + NAVY + '" stroke-width="1.5" stroke-linecap="round"><path d="M29 60 L43 62"/><path d="M29 68 L43 65"/><path d="M91 60 L77 62"/><path d="M91 68 L77 65"/></g>');
      } else if (art === 'hase') {
        parts.push('<path d="M57 62 L63 62 L60 66 Z" fill="#F2A6B8"/>');
        parts.push('<path d="M52 69 Q60 75 68 69" stroke="' + NAVY + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
        parts.push('<rect x="55.2" y="70" width="4.4" height="6" rx="1.5" fill="#FFFFFF"/><rect x="60.4" y="70" width="4.4" height="6" rx="1.5" fill="#FFFFFF"/>');
      } else if (art === 'pferd') {
        parts.push('<ellipse cx="60" cy="71" rx="14" ry="11" fill="#FFF9E5" opacity="0.5"/>');
        parts.push('<circle cx="54" cy="72" r="1.9" fill="' + NAVY + '"/><circle cx="66" cy="72" r="1.9" fill="' + NAVY + '"/>');
        parts.push('<path d="M53 78 Q60 83 67 78" stroke="' + NAVY + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
      }
    }

    return parts.join('');
  }

  /* ---------- RENDER: FANTASIE ---------- */

  function star(cx, cy, r, fill, o) {
    return '<path d="M' + cx + ' ' + (cy - r) + ' L' + (cx + r * 0.35) + ' ' + (cy - r * 0.35) +
      ' L' + (cx + r) + ' ' + cy + ' L' + (cx + r * 0.35) + ' ' + (cy + r * 0.35) +
      ' L' + cx + ' ' + (cy + r) + ' L' + (cx - r * 0.35) + ' ' + (cy + r * 0.35) +
      ' L' + (cx - r) + ' ' + cy + ' L' + (cx - r * 0.35) + ' ' + (cy - r * 0.35) +
      ' Z" fill="' + fill + '" opacity="' + (o || 1) + '"/>';
  }

  function renderFantasie(a) {
    var farbe = opt('fantasie', 'farbe', a.farbe);
    var c = farbe.hex, cs = farbe.shade;
    var wesen = a.wesen;
    var parts = [];

    // Flügel liegen hinter dem Körper
    if (a.merkmal === 'fluegel') {
      parts.push('<ellipse cx="24" cy="60" rx="12" ry="21" transform="rotate(18 24 60)" fill="#FFFFFF" opacity="0.8"/>');
      parts.push('<ellipse cx="96" cy="60" rx="12" ry="21" transform="rotate(-18 96 60)" fill="#FFFFFF" opacity="0.8"/>');
    }

    // Wesen-spezifische Rück-Layer (Ohren, Hörner, Schweif)
    if (wesen === 'drache') {
      parts.push('<path d="M42 30 L36 10 L52 24 Z" fill="' + cs + '"/><path d="M78 30 L84 10 L68 24 Z" fill="' + cs + '"/>');
      parts.push('<path d="M90 92 Q108 94 103 76 Q100 87 90 85 Z" fill="' + cs + '"/>');
    } else if (wesen === 'fuchs') {
      parts.push('<path d="M40 32 L30 8 L56 24 Z" fill="' + c + '"/><path d="M80 32 L90 8 L64 24 Z" fill="' + c + '"/>');
      parts.push('<path d="M44 28 L38 14 L52 24 Z" fill="#FFF9E5"/><path d="M76 28 L82 14 L68 24 Z" fill="#FFF9E5"/>');
      parts.push('<path d="M88 96 Q112 96 106 72 Q104 88 88 86 Z" fill="' + cs + '"/><path d="M104 76 Q108 82 101 87 L106 74 Z" fill="#FFF9E5"/>');
    } else if (wesen === 'fee') {
      parts.push('<path d="M34 44 L24 34 L38 34 Z" fill="' + c + '"/><path d="M86 44 L96 34 L82 34 Z" fill="' + c + '"/>');
    } else if (wesen === 'einhorn') {
      parts.push('<path d="M60 4 L54 26 L66 26 Z" fill="' + GOLD + '"/>');
      parts.push('<path d="M40 30 L34 12 L52 24 Z" fill="' + c + '"/><path d="M80 30 L86 12 L68 24 Z" fill="' + c + '"/>');
      parts.push('<circle cx="42" cy="28" r="8" fill="#FFF9E5" opacity="0.9"/><circle cx="34" cy="40" r="7" fill="#FFF9E5" opacity="0.9"/><circle cx="30" cy="53" r="6" fill="#FFF9E5" opacity="0.9"/>');
    }

    // Körper
    if (wesen === 'roboter') {
      parts.push('<rect x="26" y="52" width="8" height="14" rx="4" fill="' + cs + '"/><rect x="86" y="52" width="8" height="14" rx="4" fill="' + cs + '"/>');
      parts.push('<rect x="30" y="24" width="60" height="86" rx="18" fill="' + c + '"/>');
      parts.push('<rect x="46" y="84" width="28" height="14" rx="4" fill="' + cs + '"/>');
      parts.push('<circle cx="53" cy="91" r="2.5" fill="' + GOLD + '"/><circle cx="63" cy="91" r="2.5" fill="#FFF9E5"/>');
    } else {
      parts.push('<ellipse cx="60" cy="66" rx="34" ry="42" fill="' + c + '"/>');
      parts.push('<ellipse cx="60" cy="82" rx="19" ry="22" fill="#FFFFFF" opacity="0.35"/>');
      parts.push('<ellipse cx="46" cy="107" rx="9" ry="6" fill="' + cs + '"/><ellipse cx="74" cy="107" rx="9" ry="6" fill="' + cs + '"/>');
    }

    // Gesicht (fix, wie beim Mensch-Avatar)
    parts.push('<circle cx="48" cy="54" r="3.2" fill="' + NAVY + '"/><circle cx="72" cy="54" r="3.2" fill="' + NAVY + '"/>');
    parts.push('<path d="M50 66 Q60 73 70 66" stroke="' + NAVY + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');

    if (wesen === 'fuchs') {
      parts.push('<ellipse cx="60" cy="68" rx="13" ry="9" fill="#FFF9E5" opacity="0.55"/><circle cx="60" cy="63" r="2.6" fill="' + NAVY + '"/>');
    }
    if (wesen === 'drache') {
      parts.push('<path d="M52 22 L56 12 L60 22 Z" fill="' + cs + '"/><path d="M62 22 L66 12 L70 22 Z" fill="' + cs + '"/>');
    }
    if (wesen === 'fee') {
      parts.push('<g><circle cx="60" cy="18" r="4" fill="#D67171"/><circle cx="53" cy="15" r="3.2" fill="' + GOLD + '"/><circle cx="67" cy="15" r="3.2" fill="' + GOLD + '"/><circle cx="56" cy="23" r="3.2" fill="' + GOLD + '"/><circle cx="64" cy="23" r="3.2" fill="' + GOLD + '"/></g>');
      parts.push(star(30, 84, 4, GOLD, 0.9) + star(92, 78, 3.5, GOLD, 0.9));
    }

    // Merkmal-Overlays (außer Flügel, die liegen hinten)
    if (a.merkmal === 'antenne') {
      var antTop = (wesen === 'roboter') ? 24 : 26;
      parts.push('<path d="M60 ' + antTop + ' L60 8" stroke="' + cs + '" stroke-width="3" stroke-linecap="round"/>');
      parts.push('<circle cx="60" cy="7" r="6.5" fill="' + GOLD + '" opacity="0.4"/><circle cx="60" cy="7" r="4" fill="' + GOLD + '"/>');
    } else if (a.merkmal === 'krone') {
      parts.push('<path d="M46 22 L46 8 L54 16 L60 5 L66 16 L74 8 L74 22 Z" fill="' + GOLD + '"/><rect x="45" y="20" width="30" height="5" rx="2.5" fill="#E8950A"/>');
    } else if (a.merkmal === 'sterne') {
      parts.push(star(40, 78, 5, '#FFFFFF', 0.85) + star(78, 88, 4, '#FFFFFF', 0.85) + star(60, 100, 3.5, '#FFFFFF', 0.85));
    }

    return parts.join('');
  }

  /* ---------- RENDER ---------- */
  function render(v2) {
    v2 = v2 || {};
    var typ = normTyp(v2.typ);
    var attrs = v2[typ] || {};
    var inner = (typ === 'fantasie') ? renderFantasie(attrs)
      : (typ === 'tier') ? renderTier(attrs)
      : renderMensch(attrs);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false" style="display:block;width:100%;height:100%;">' + inner + '</svg>';
  }

  window.AvatarSVG = {
    CATALOG: CATALOG,
    DEFAULTS: DEFAULTS,
    defaults: defaults,
    render: render,
    opt: opt
  };
})();
