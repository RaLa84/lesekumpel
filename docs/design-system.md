# Lesekumpel Design System

Zentrale Design-Referenz für alle Seiten des Lesekumpel-Projekts. Alle UI-Komponenten sollten sich an diesen Vorgaben orientieren.

---

## Farbpalette

| Token | Hex | Verwendung |
|---|---|---|
| `--accent-coral` | `#D67171` | Primäre Aktionsfarbe (Buttons, Links, Highlights) |
| `--accent-coral-light` | `#FDEAEA` | Helle Variante (Icon-Hintergründe, Hover-States) |
| `--accent-coral-dark` | `#B85555` | Dunkle Variante (Hover auf Coral-Buttons) |
| `--primary-yellow` | `#FFD54F` | Sekundärakzent (Badges, Borders, Step-Circles) |
| `--bg-body` | `#FFF9E5` | Seitenhintergrund (warmes Pastellgelb) |
| `--bg-warm-light` | `#FFF3D0` | Abschnittswechsel-Hintergrund |
| `--bg-card` | `#ffffff` | Karten-Hintergrund |
| `--text-dark` | `#2D3436` | Primäre Textfarbe |
| `--text-muted` | `#5a6368` | Sekundäre/gedämpfte Textfarbe |
| `--border-card` | `#F5E6A3` | Subtile Kartenborder (warmes Gold) |

### Hinweise
- Coral (`#D67171`) nur für große Texte (≥18px) verwenden — Kontrastverhältnis ~3.5:1 auf Weiß reicht nur für Large Text (WCAG AA)
- Für Fließtext immer `--text-dark` (#2D3436) verwenden — Kontrast ~14:1 auf hellem Hintergrund

---

## Typografie

| Rolle | Font | Gewicht | Import |
|---|---|---|---|
| Überschriften | **Fredoka** | 600–700 | Google Fonts |
| Fließtext | **Quicksand** | 500–600 | Google Fonts |

### Google Fonts Import
```
https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Quicksand:wght@400;500;600;700&display=swap
```

### CSS-Variablen
```css
--font-heading: 'Fredoka', sans-serif;
--font-body: 'Quicksand', sans-serif;
```

---

## Geometrie & Abstände

| Element | Border-Radius | Padding |
|---|---|---|
| Karten | `24px` | `36px 32px` |
| Buttons (Pill) | `28px` | `20px 52px` (Primary), `18px 48px` (Secondary) |
| Icon-Boxen | `16px` | `14px` |
| Inputs | `20px` | `16px 20px` |
| Badges | `40px` (vollrund) | `8px 18px` |

### Abstände (Spacing)
- Sections: `100px 24px` (Mobile), `140px 48px` (Desktop)
- Card-Grid-Gap: `28–32px`
- Allgemein "luftig" — lieber mehr Whitespace als zu kompakt

---

## Schatten

```css
--shadow-card: 0 2px 16px rgba(0,0,0,0.04);
--shadow-card-hover: 0 8px 24px rgba(0,0,0,0.07);
```

Schatten sind bewusst subtil gehalten. Karten nutzen primär **farbige Borders** (`2px solid #F5E6A3`) statt starker Schatten.

---

## Komponenten

### Karten (Card-in-Card-Pattern)
```css
background: #ffffff;
border: 2px solid #F5E6A3;
border-radius: 24px;
box-shadow: 0 2px 16px rgba(0,0,0,0.04);
padding: 36px 32px;
```

### Buttons — Primary (Coral)
```css
background: #D67171;
color: #ffffff;
border-radius: 28px;
padding: 20px 52px;
font-weight: 600;
box-shadow: 0 4px 14px rgba(214,113,113,0.3);
transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Buttons — Secondary (Outline)
```css
color: #D67171;
border: 2px solid #D67171;
border-radius: 28px;
background: transparent;
```

### Navbar
```css
background: #ffffff;
border-bottom: 4px solid #FFD54F;
position: sticky;
top: 0;
z-index: 1000;
```

### Icon-Boxen
```css
background: #FDEAEA;
border: 2px solid rgba(214,113,113,0.15);
border-radius: 16px;
width: 56px;
height: 56px;
```

---

## Hover & Transitions

| Element | Hover-Effekt |
|---|---|
| Buttons | `transform: translateY(-3px) scale(1.02)` + Schatten verstärken |
| Karten | `transform: translateY(-4px)` + `box-shadow: var(--shadow-card-hover)` |
| Links | Farbe → `--accent-coral` |

### Transition-Timing
- **Karten:** `transition: transform 0.3s ease, box-shadow 0.3s ease;`
- **Buttons:** `transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);` (Bounce-Overshoot)

---

## Responsive Design

- **Mobile-First** Ansatz
- **Breakpoint:** `768px` (min-width)
- Desktop: Layouts wechseln von Column zu Row, Padding/Gap erhöhen sich
- Touch-Targets: Mindestens `44px` Höhe für Buttons und Links

---

## Barrierefreiheit (Accessibility)

- Legasthenie-freundlicher Schriftmodus (Lexend als Alternative)
- Hoher Kontrast-Modus verfügbar
- Schriftgrößen-Anpassung
- Coral-Farbe nur für dekorative/große Elemente, nie für kleinen Fließtext
- Fokus-Ringe: `box-shadow: 0 0 0 3px rgba(214,113,113,0.4)` (Marketing) bzw. `outline: 3px solid var(--lila)` (App-Seiten)

---

## App-Palette (Redesign – kanonisch für App-Seiten)

> **Zwei Kontexte:** Die obige Coral/Quicksand-Palette stammt aus den **Marketing-Seiten**. Die **App-Seiten** (`demo.html`, `anmelden.html`, `profilauswahl.html`, `neue-autorengeschichte.html`) nutzen die folgende, neuere Token-Palette — inkl. **Lexend** als Fließtext-Font. Neue App-Seiten verwenden diese Tokens.

```css
:root {
  --mint: #2FB8A6;        /* Primärakzent App (aktive Zustände, Header-Linie) */
  --navy: #2B3140;        /* Marken-/Textdunkel, Footer-Hintergrund */
  --cream: #FFF6EF;       /* Seitenhintergrund (html) */
  --cream-light: #FEFBF6; /* Icon-Box-/Badge-Hintergrund */
  --coral: #F97352;       /* dekorativer Zweitakzent */
  --lila: #7D6AE6;        /* Fokus-Ring, Deko */
  --yellow: #FFD95A;      /* Akzent, Deko-Sterne */
  --border: #D9D4CC;      /* Karten-/Input-Border */
  --text-muted: #555B6A;
  --font-heading: 'Fredoka', system-ui, sans-serif;
  --font-body: 'Lexend', system-ui, sans-serif;
  --shadow-card: 0 2px 12px rgba(43,49,64,0.05);
  --shadow-card-hover: 0 8px 24px rgba(43,49,64,0.08);
  --radius-card: 20px; --radius-inner: 16px; --radius-input: 14px; --radius-pill: 999px;
}
```

Aktiv-Zustand (Auswahl-Karten/Toggles): Border `var(--mint)` + Hintergrund `rgba(47,184,166,0.08)`, Icon-Box-Tint `rgba(47,184,166,0.18)`.

---

## Kanonischer Header & Footer

Wiederverwendbare Komponente, einheitlich auf allen App-Seiten. Im Markup mit Kommentar-Markern abgegrenzt: `=== LK-HEADER:NAV START/END ===` und `=== LK-FOOTER:FOOTER START/END ===` — beim Anlegen neuer Seiten **diesen Block 1:1 aus einer App-Seite (z. B. `demo.html`) übernehmen**, nicht neu bauen.

> **Legacy-Hinweis:** `impressum.html`, `datenschutz.html` und `eltern-lesemodi.html` nutzen noch den älteren Marketing-Header (`flex`, Coral-Brand, einfacher Text-Footer). Diese sollten bei Gelegenheit auf die kanonische Komponente migriert werden.

### Header (`.main-navbar`)
3-Spalten-Grid (links Burger/Mobile-Menü · Mitte Logo + Wortmarke · rechts A11y- + Login-Icon-Button):
```css
.main-navbar {
  background: rgba(255,255,255,0.92); backdrop-filter: blur(14px);
  padding: 12px 24px; border-bottom: 3px solid var(--mint);
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  position: sticky; top: 0; z-index: 1000;
}
```
- `nav-left`: `.burger-icon` (≥1024px ausgeblendet) + `#mobile-menu`
- `nav-center`: `.nav-logo-box` (Logo) + `.brand-name`
- `nav-right`: `.nav-icon-btn` für Barrierefreiheit/Einstellungen + Anmelden

### Footer (`.modern-footer`)
Dunkler Navy-Footer mit Spalten-Grid:
```css
.modern-footer { background: var(--navy); color: var(--cream); padding: 56px 24px 28px; margin-top: 80px; }
.modern-footer .footer-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 40px; }
@media (min-width: 768px) { .modern-footer .footer-grid { grid-template-columns: 1.6fr 1fr 1fr; gap: 56px; } }
```
Aufbau: `footer-brand-block` (Logo + Tagline + `.footer-social`) · Link-Spalten (Entdecken / Rechtliches …) · `.footer-bottom` (Copyright).

---

## Hintergrundgestaltung

Warmer Pastell-Hintergrund mit weichen Farb-Blobs und dezent schwebenden Deko-Elementen. Alle Deko ist rein dekorativ (`aria-hidden="true"`, `pointer-events:none`, negativer `z-index`).

```css
html { background: var(--cream); }
body { background: transparent; overflow-x: hidden; }

/* Weiche Eck-Blobs */
body::before, body::after { content:''; position: fixed; z-index:-2; border-radius:50%; filter: blur(70px); opacity:.55; pointer-events:none; }
body::before { width:460px; height:460px; background:#FFE9B3; top:-150px; left:-160px; }
body::after  { width:420px; height:420px; background:#C5EBE4; bottom:-160px; right:-150px; }

/* Zusätzliche Farb-Blobs (lila/mint) */
.bg-blob { position:fixed; z-index:-2; border-radius:50%; filter: blur(80px); opacity:.5; pointer-events:none; }

/* Bühne für schwebende Sterne/Sparkles */
.page-deco { position: fixed; inset:0; z-index:-1; pointer-events:none; overflow:hidden; }
.deco-star    { animation: float 7s ease-in-out infinite; }
.deco-sparkle { animation: sparkle-blink 4s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-18px) rotate(6deg)} }
@keyframes sparkle-blink { 0%,100%{opacity:.3;transform:scale(.85)} 50%{opacity:1;transform:scale(1.15)} }
```
- Deko-SVGs (Stern/Sparkle/Kreis) per Inline-Style positioniert; auf Mobil via `.deco-hide-mobile` ausblenden.
- `@media (prefers-reduced-motion: reduce)` → Float/Blink-Animationen abschalten.

---

## Lucide-Icons (Inline-SVG)

Icons werden **als Inline-SVG mit Lucide-Pfaddaten** eingesetzt — **keine** Lucide-JS-Library, kein `data-lucide`. So bleiben Icons ohne Build-Step/JS sofort sichtbar und per CSS färb-/skalierbar.

**Standard-Attribute** (Lucide-Outline-Stil):
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- Lucide-Pfade -->
</svg>
```
- **Farbe** über `currentColor` (erbt von `color`) — für Kontrast/A11y i. d. R. `var(--text-dark)`/`var(--navy)`, nicht gedämpfte Akzentfarben.
- **Größe** per CSS am SVG (`.xxx svg { width:21px; height:21px }`), nicht über `width`/`height`-Attribute (außer bei Social-Icons).
- In Icon-Boxen (`var(--cream-light)`-Hintergrund, `border-radius:12px`, 40×40px) zentriert.
- Bei dynamisch generierten Icons (JS) Helfer nutzen: `const svg = (paths) => \`<svg …>${paths}</svg>\`` und Icons in einer Map halten.
