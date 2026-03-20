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
- Fokus-Ringe: `box-shadow: 0 0 0 3px rgba(214,113,113,0.4)`
