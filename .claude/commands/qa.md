# /qa — QA-Lauf: A11y + UX + Code-Bugs (Mobil / Desktop / Tafel)

Du bist QA-Engineer für die Lesekumpel-App (statische Vanilla-HTML/CSS/JS-Site, kein Build).
Du testest die redesignten Seiten in **drei Dimensionen** — **A11y (WCAG 2.1 AA)**, **UX**
(Design-System + Kinder-Tauglichkeit) und **Code-/Funktions-Bugs** — auf **Mobil, Desktop und
Tafel** und erzeugst einen **priorisierten Fehlerreport zum Fixen**.

Getrieben über die **Playwright-MCP-Tools** (`browser_navigate`, `browser_resize`,
`browser_evaluate`, `browser_press_key`, `browser_snapshot`, `browser_take_screenshot`,
`browser_console_messages`, `browser_network_requests`). Kein npm/Node, kein echter Playwright-Install.

## Parameter (`$ARGUMENTS`)
- *(leer)* — Standard-Set: `demo.html`, `anmelden.html`, `neue-geschichte.html`,
  `neue-autorengeschichte.html` + Story-Stichprobe. Alle 3 Dimensionen. **Report-only.**
- `all` — zusätzlich **alle** `demo-texte/*.html`.
- `<pfad>` — nur diese eine Seite (z.B. `/qa demo.html` oder `/qa demo-texte/der-ausritt-qxk2.html`).
- `fix` — **Fix-Modus**: behebt die Funde des **jüngsten** Reports in der jeweiligen Single
  Source, propagiert, re-scannt. (Siehe „Fix-Modus".)

## Harte Regeln
1. **Kein** n8n-Workflow-Trigger. **Kein** `git push` / Deploy. (`/qa fix` darf lokal committen.)
2. Fixes **immer in der Single Source**, dann propagieren — nie in eine propagierte Kopie
   (sonst überschreibt das nächste `apply-*.py` den Fix). Siehe Mapping-Tabelle unten.
3. Fremde, nicht zur Aufgabe gehörende Working-Tree-Änderungen **nicht** mit committen.
4. Am Ende den lokalen Server stoppen.

---

## Ablauf (Report-Modus)

### 1. Setup
- Server starten (Hintergrund): `python -m http.server 8099` (Working Dir = Repo-Root).
  Basis-URL `http://localhost:8099/`. Kurz `Invoke-WebRequest .../demo.html` o.ä. prüfen.
- Report-Zeitstempel holen: Bash `date +%Y-%m-%d-%H%M` (Skripte kennen die Zeit nicht selbst).
- `qa-reports/` und `qa-reports/shots/` anlegen, falls nicht vorhanden.

### 2. Seiten-/View-/Viewport-Matrix
Viewports per `browser_resize`: **Mobil 390×844**, **Desktop 1280×800**.

| Seite | Mobil | Desktop | Tafel | Funktions-Flows (Smoke) |
|---|---|---|---|---|
| `demo.html` | ✓ | ✓ | – | Filter filtert + Ergebniszähler ändert sich; Suche; „Mehr laden"; Settings-Modal; Favoriten-Toggle; Mobile-Menü |
| `anmelden.html` | ✓ | ✓ | – | Formular/Validierung; Mobile-Menü |
| `neue-geschichte.html` | ✓ | ✓ | – | Format-Karten verlinken; Mobile-Menü |
| `neue-autorengeschichte.html` | ✓ | ✓ | – | Persona→Neurotyp→Seite 2→Stil; Weiter-Button-Enable; Settings-Modal |
| `demo-texte/*` (Stichprobe) | ✓ | ✓ | ✓ | View-Toggle Tafel↔Scroll; Quiz beantworten; TTS; Silben/Emojis; Tools/Settings |

**Tafel** nur auf Story-Seiten (`body.view-tafel` / `view-tafel-cover`). Default-View je nach
Neurotyp; zusätzlich per vorhandener Toggle-Funktion in die Scroll-View wechseln und erneut scannen.

**Story-Stichprobe** (Default): Donor-Master `demo-texte/mein-erster-tag-auf-dem-flohmarkt-12e9.html`
+ je 1 Vertreter mit `body`-Klasse `nt-adhs` / `nt-autismus` / `nt-lrs` (per Meta/Body erkennbar)
+ 1 kurze Story. Bei `all`: über alle `demo-texte/*.html` iterieren (nur Default-Viewport-Set pro
Seite, um Laufzeit zu begrenzen — Mobil+Desktop+Tafel, ohne jede Modalvariante).

### 3. Pro Zelle: scannen
1. `browser_navigate` zur Seite, `browser_resize` auf den Viewport.
2. **Konsole/Netzwerk vor Interaktion** leeren/merken (`browser_console_messages`,
   `browser_network_requests`) — für Code-Bugs / 404-Assets.
3. **Interaktive Zustände** herstellen, wo relevant (Modal/Dropdown öffnen, Wizard Seite 2),
   dann scannen — damit auch dynamisches Markup geprüft wird.
4. **Scan-Snippet** (unten) per `browser_evaluate` ausführen → liefert `{a11y, ux, bugs}`.
5. **Funktions-Smoke-Tests** der Seite ausführen (s. Matrix) → Pass/Fail festhalten.
6. **Screenshot** `browser_take_screenshot` → `qa-reports/shots/<seite>-<viewport>[-<view>].png`.
7. **Fokus/Tastatur** (mind. einmal je Seite): Tab-Reihenfolge stichprobenartig; bei Modals
   Focus-Trap testen (Tab vom letzten Element wrappt zum ersten; Escape schließt + Fokus zurück
   zum Auslöser) via `browser_press_key`.

### 4. Scan-Snippet (in `browser_evaluate` einfügen — `function:` Feld)
```js
async () => {
  // axe-core nachladen, falls nötig
  if (!window.axe) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
      s.onload = res; s.onerror = () => rej(new Error('axe-core load failed (offline?)'));
      document.head.appendChild(s);
    });
  }
  const path = (el) => {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + el.id;
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && parts.length < 4) {
      let s = n.tagName.toLowerCase();
      if (n.className && typeof n.className === 'string') s += '.' + n.className.trim().split(/\s+/).slice(0,2).join('.');
      const p = n.parentElement;
      if (p) { const i = [...p.children].indexOf(n) + 1; s += `:nth-child(${i})`; }
      parts.unshift(s); n = n.parentElement;
    }
    return parts.join(' > ');
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const out = { url: location.pathname, vw: innerWidth, bodyClass: document.body.className, a11y: [], ux: [], bugs: [] };

  // ---- A11y (axe) ----
  try {
    const r = await axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] }
    });
    out.a11y = r.violations.map(v => ({
      id: v.id, impact: v.impact, help: v.help,
      wcag: (v.tags||[]).filter(t => /^wcag\d/.test(t)),
      n: v.nodes.length,
      targets: v.nodes.slice(0,5).map(n => (n.target||[]).join(' ')),
      summary: ((v.nodes[0]||{}).failureSummary||'').replace(/\s+/g,' ').slice(0,200)
    }));
  } catch (e) { out.a11y = [{ id:'axe-error', impact:'critical', summary:String(e) }]; }

  // ---- UX ----
  const interactive = [...document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="option"],[tabindex]:not([tabindex="-1"])')].filter(visible);
  const small = [];
  interactive.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) small.push({ sel: path(el), w: Math.round(r.width), h: Math.round(r.height), label: (el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,30) });
  });
  if (small.length) out.ux.push({ rule:'touch-target <44px', impact:'moderate', n: small.length, items: small.slice(0,15) });

  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 2) {
    const over = [...document.querySelectorAll('body *')].filter(visible).filter(e => e.getBoundingClientRect().right > innerWidth + 2);
    const deco = (e) => { const cs = getComputedStyle(e); return cs.pointerEvents === 'none' || cs.position === 'fixed'; };
    const real = over.filter(e => !deco(e));
    // Nur dekorative/fixed Overflows (z.B. bg-blobs) => minor; echter Content-Overflow => serious
    out.ux.push({ rule:'horizontaler Overflow', impact: real.length ? 'serious' : 'minor',
      detail:`scrollWidth ${de.scrollWidth} > viewport ${innerWidth}${real.length ? '' : ' (nur dekorative Elemente)'}`,
      offenders: (real.length ? real : over).slice(0,8).map(path) });
  }

  const tiny = [];
  [...document.querySelectorAll('p, li, .story-text, .tile-author, .format-text, label, .section-sub')].filter(visible).forEach(el => {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs && fs < 13 && (el.textContent||'').trim().length > 12) tiny.push({ sel: path(el), px: Math.round(fs*10)/10 });
  });
  if (tiny.length) out.ux.push({ rule:'Body-Text <13px', impact:'minor', n: tiny.length, items: tiny.slice(0,10) });

  // Brand-Fonts grob prüfen (Body soll Quicksand/Lexend/Atkinson sein)
  const bodyFont = getComputedStyle(document.body).fontFamily.toLowerCase();
  if (!/quicksand|lexend|atkinson|fredoka/.test(bodyFont)) out.ux.push({ rule:'unerwartete Body-Schrift', impact:'minor', detail: bodyFont });

  // ---- Code-/DOM-Bugs ----
  const ids = {}; document.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id]||0)+1);
  const dup = Object.keys(ids).filter(k => ids[k] > 1).map(k => `${k} ×${ids[k]}`);
  if (dup.length) out.bugs.push({ type:'doppelte id', impact:'serious', items: dup.slice(0,20) });

  const badHref = [...document.querySelectorAll('a[href]')].filter(a => { const h=a.getAttribute('href'); return h==='' || h==='#' || /^javascript:\s*(void\(0\))?;?$/.test(h); }).map(path);
  if (badHref.length) out.bugs.push({ type:'leerer/toter href', impact:'minor', n: badHref.length, items: badHref.slice(0,10) });

  // sichtbar kaputte Bilder (geladen, aber 0 Pixel ODER naturalWidth 0 trotz src)
  const brokenImg = [...document.querySelectorAll('img')].filter(img => img.getAttribute('src') && img.complete && img.naturalWidth === 0 && getComputedStyle(img).display !== 'none').map(img => img.getAttribute('src'));
  if (brokenImg.length) out.bugs.push({ type:'kaputtes Bild', impact:'moderate', n: brokenImg.length, items: brokenImg.slice(0,10) });

  return out;
}
```

### 5. Funktions-Smoke-Tests (Beispiele — Aktion ausführen, DOM-Resultat prüfen)
Führe pro Seite die passenden Flows aus (je `browser_evaluate`), erwartetes Ergebnis = **Pass**:
- **demo.html:** ersten Filter-Wert ≠ „alle" wählen → `.filter-dd-trigger.active` vorhanden **und**
  `#resultCount` Text ändert sich. Suche „xyz" → Trefferzahl sinkt. Favorit-Klick → `aria-pressed`
  flippt. Settings öffnen → Overlay sichtbar, Escape schließt + Fokus zurück auf `#nav-settings`.
- **neue-autorengeschichte.html:** Persona klicken → `aria-pressed=true`; Neurotyp klicken →
  Weiter-Button `disabled=false`; `goPage(2)` → Stil-Karte klicken → `aria-pressed=true`,
  Submit aktiv. Pre-Check-/Loading-Modal: Fokus rein + Escape/Trap.
- **demo-texte/*:** View-Toggle wechselt `body.view-tafel` ↔ Scroll und Text bleibt sichtbar;
  Quiz: korrekte Option klicken → `.correct` + `#quiz-status` Live-Text; falsche → `.try-again`;
  Silben/Emojis-Toggle ändert Text-Markup; Settings/Tools-Overlay öffnet/schließt.
- **alle Seiten:** Mobile-Menü (Burger) öffnet/schließt, `aria-expanded` flippt, Escape schließt.

### 6. Konsole & Netzwerk auswerten
- `browser_console_messages`: echte JS-Errors = **Bug** (z.B. „is not a function", Uncaught).
  Reine 404-Asset-Meldungen separat als „fehlende Assets" listen (nicht als JS-Bug werten).
- `browser_network_requests`: 4xx/5xx auf Seiten-Ressourcen + tote interne Links sammeln.

### 7. Report schreiben
Schreibe `qa-reports/qa-report-<stamp>.md` **und** `qa-reports/qa-report-<stamp>.json`
(maschinenlesbar für `/qa fix`). Aufbau der `.md`:

1. **Kopf:** Datum, getestete Seiten, Viewports/Views, axe-Version, Gesamt-Score
   (Σ Funde je Kategorie/Impact).
2. **Summary-Matrix:** Tabelle Seite × Viewport × View → Funde je Kategorie (A11y/UX/Bug) × Impact.
3. **Befunde** — gruppiert nach **Kategorie**, dann **Severity** (critical→serious→moderate→minor).
   Pro Fund: *Seite · View · Viewport · Selector/Beleg · Kriterium (WCAG-ID / UX-Regel / Bug-Typ) ·
   Kurzbeschreibung · **Quelldatei zum Fixen** · Fix-Vorschlag (1 Satz)*.
4. **Funktions-/Tastatur-Checks:** Pass/Fail-Liste (Flows, Focus-Trap, reduced-motion).
5. **Konsole/Netzwerk:** echte Fehler vs. fehlende Assets vs. tote Links.
6. **Priorisierte Fix-Liste** (Top-Funde zuerst, mit Quelldatei).
7. **Legende — Single Source of Truth** (Mapping-Tabelle, s.u.).

Am Ende: Server stoppen. Dem User Speicherort + Kurz-Summary nennen (keine Fixes ohne Auftrag).

---

## Single-Source-Mapping (Befund → Fix-Datei → Propagation)
| Betrifft | Fix in | Propagieren mit |
|---|---|---|
| A11y-Modal / Schrift-/Kontrast-Toggle / `body.high-contrast`/`dyslexia-mode` | `partials/a11y.html` | `python scripts/apply-a11y.py` |
| Footer | `partials/footer.html` | `python scripts/apply-footer.py` |
| Header / Navigation / Mobile-Menü | `partials/header.html` | `python scripts/apply-header.py` |
| Story-Leseseiten / Tafel / Quiz / TTS / Silben | Donor `demo-texte/mein-erster-tag-auf-dem-flohmarkt-12e9.html` | `python scripts/build-generator-template.py` |
| Seiten-spezifisch (Katalog/Wizard/Login) | jeweilige `*.html` direkt | – |

> Hinweis: `apply-*.py` zielen aktuell nur auf `demo.html`, `neue-autorengeschichte.html`,
> `neue-geschichte.html` (anmelden.html ist eigenständig). Story-Fixes erst im Donor testen
> (= `mein-erster-tag-auf-dem-flohmarkt-12e9.html`), dann Template bauen. Die ~134 Legacy-
> `demo-texte` werden separat via `scripts/migrate-to-new-shell.py` aktualisiert — im Report
> nur melden, nicht einzeln patchen.

---

## Fix-Modus (`/qa fix`)
1. Jüngsten `qa-reports/qa-report-*.json` lesen.
2. Funde nach Quelldatei (Mapping) gruppieren; pro Datei die Fixes anwenden
   (A11y/UX/Bug). Kontrastwerte vor dem Setzen im Browser nachrechnen (≥4.5:1 Text /
   ≥3:1 Großtext+UI), nicht schätzen.
3. Propagieren mit dem passenden `apply-*.py` bzw. `build-generator-template.py --check` dann ohne.
4. Betroffene Seiten **re-scannen** (Schritte 3–4 oben) → Ziel: 0 neue Funde.
5. **Pro logischer Einheit committen** (Quelle + propagierte Dateien zusammen). Kein Push.
6. Kurzbericht: was gefixt, was bewusst offen (z.B. Legacy-Migration), Re-Scan-Ergebnis.

## Verifikation der Skill
- `/qa demo.html` muss einen Report mit allen 3 Kategorien + Screenshots erzeugen und der
  aktuelle Stand (0 axe-Violations) muss als „0 Befunde" erscheinen.
- Server am Ende gestoppt; kein Push, kein n8n-Trigger.

## Kontext
$ARGUMENTS
