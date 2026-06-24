# Lese-Fokus-System (MVP: Graphem-Fokus für Pip Punkt)

> **Status:** Konzept-Entwurf · noch nicht implementiert · zur späteren Iteration abgelegt
> **Stand:** 2026-04-16

## Context

Lesekumpel positioniert sich aktuell als KI-Geschichten-App, hat aber gegenüber Eltern noch kein starkes "Damit lernt mein Kind lesen"-Argument. Klassische Fibeln (Cornelsen "Meine Fibel", Mildenberger Silbenfibel) und die deutsche Lesedidaktik kennen eine Familie strukturierter Übungs-Konstrukte: Graphem-Fokus, Anlaut-Übungen, Silben-Struktur, Reim-Cluster, Sichtwortschatz, Wort-Familien, Komposita-Splitting, wörtliche Rede, Satzzeichen-Pausen. Phonics-Methodik ist die einzige bei LRS statistisch gesicherte Förderung (Galuschka et al. 2014, d=0.32 — siehe [knowledge-base/themen/lrs-legasthenie.md](knowledge-base/themen/lrs-legasthenie.md)).

**Strategie:** Statt jedes dieser Konstrukte einzeln zu bauen, etablieren wir **ein generisches "Lese-Fokus-System"** — gemeinsame Webhook-Schnittstelle, gemeinsame CSS-Klassen-Familie, gemeinsamer Prompt-Sektions-Pattern. **Implementiert wird im MVP nur Graphem-Fokus für Pip Punkt** (sofortiger Eltern-Wert: Fibel-Begleitung). Alle weiteren Fokus-Typen folgen ohne Architektur-Refactor — nur neue Sektion + neue Modifier-Klasse + neue Preset-Liste.

**Design-Entscheidungen:**
- Markierung im MVP: **ganzes Wort** gelb hinterlegt (nicht nur das Graphem) — robust, passend für Pips Zielgruppe (5–7 Jahre, Frith logographisch-alphabetische Phase).
- MVP-Umfang: **nur Pip Punkt + nur Graphem-Typ**. Architektur ist generisch, weitere Personas/Typen folgen.
- UI: **Fibel-Lektions-Presets** in der n8n-Form ("Meine Fibel Lektion 12: sch") — das Eltern-Argument ("begleitet die Schul-Fibel deines Kindes").
- Fokus = **Betonung, keine Beschränkung** — Geschichten bleiben grammatikalisch frei.

---

## Generische Architektur

### Webhook-Schnittstelle

**Ein einziger** neuer Parameter, kompakter Format-String:

```
Lese_Fokus = "<typ>:<wert>"

Beispiele:
  "graphem:sch"
  "anlaut:M"
  "reim:aus"
  "sichtwort:ist"
  "wortfamilie:fahren"
  "dialog:"            (Wert leer = "alle Dialoge markieren")
```

Vorteile gegenüber zwei separaten Parametern: nur ein Form-Dropdown nötig, Label und Wert kommen aus derselben Option-Definition, keine abhängigen Felder.

Bei leerem/fehlendem `Lese_Fokus`: Persona ignoriert die Sektion komplett — Standardverhalten.

### CSS-Klassen-Familie (BEM)

Eine Basis-Klasse + Typ-Modifier am `<span class="word-interactive">`:

```html
<span class="word-interactive lese-fokus lese-fokus--graphem">Schatz</span>
```

```css
/* Basis — alle Lese-Fokus-Markierungen teilen sich diese */
.lese-fokus {
    border-radius: 4px;
    padding: 0 2px;
    transition: background 0.2s;
}

/* Typ-Modifier (im MVP nur graphem implementiert) */
.lese-fokus--graphem  { background-color: #fff59d; }   /* gelb */
.lese-fokus--anlaut   { background-color: #fff59d; }   /* später: zus. Anlaut-Buchstabe fett */
.lese-fokus--reim     { background-color: #ffccbc; }   /* später: rosa */
.lese-fokus--sichtwort{ text-decoration: underline dotted; } /* später: dezent */
.lese-fokus--dialog   { color: #1976d2; }              /* später: Sprecher-Farben */
/* … */

/* Aktiver Klick gewinnt immer (kollidiert nicht mit highlight-active) */
.word-interactive.highlight-active { background-color: #ffeb3b !important; }
```

### Prompt-Sektions-Pattern

Pro Persona-Systemprompt eine **modulare Sektion pro Typ**, die nur greift, wenn der entsprechende Typ im User-Prompt steht. Beispiel-Skelett:

```markdown
## OPTIONAL: LESE-FOKUS — GRAPHEM
Wenn User-Prompt enthält "Lese-Fokus: graphem:<X>":
- Verwende Wörter mit Graphem <X> 8–12× organisch
- Markiere jedes solche Wort mit `<span class="word-interactive lese-fokus lese-fokus--graphem">…</span>`
- Sinnhaftigkeit zuerst — natürliche Geschichte > Maximal-Trefferzahl

## OPTIONAL: LESE-FOKUS — ANLAUT     (später ergänzt)
## OPTIONAL: LESE-FOKUS — REIM       (später ergänzt)
…
```

Im MVP wird **nur die Graphem-Sektion** in Pips Prompt eingebaut. Weitere Sektionen kommen Persona-für-Persona dazu, ohne dass Schnittstelle/CSS angefasst werden müssen.

---

## Persona-Roadmap (welcher Fokus-Typ wann/wo)

| Persona | Fokus-Typen (Reihenfolge der Implementierung) | Pädagogischer Anker |
|---|---|---|
| **Pip Punkt** | **1. graphem ⭐ MVP** · 2. anlaut · 3. silben-struktur · 4. reim | Klasse 1, Phonics + phonologische Bewusstheit |
| **Mia Mitte** | 1. silben-struktur · 2. wortfamilie · 3. sichtwort · 4. komposita | Klasse 2, Wortebene wird komplexer |
| **Peter Past** | 1. wortfamilie · 2. komposita · 3. satzzeichen-pause | Klasse 2–3, Lesefluss + Morphologie |
| **Stella Stimmenreich** | 1. **dialog** ⭐ (passt zur Persona) · 2. satzzeichen-pause | ab Klasse 3, Prosodie + Vorlese-Flüssigkeit |
| **Finja Feder** | 1. seltene-grapheme · 2. komplexe-syntax | ab Klasse 4, Lese-Verfeinerung |

Diese Roadmap dient als Orientierung für künftige Releases — sie wird **nicht** im MVP implementiert. Reihenfolge ist nach pädagogischem Nutzen × Persona-Passung sortiert.

---

## MVP-Implementierung (Graphem-Fokus für Pip Punkt)

### 1. Systemprompt erweitern

**Datei:** [prompts/pip-punkt.md](prompts/pip-punkt.md)

Neue Sektion **vor** den Neurotyp-Sektionen (nach NO-GOs, vor Z. 46):

```markdown
---

## OPTIONAL: LESE-FOKUS — GRAPHEM

Wenn der User-Prompt eine Zeile "Lese-Fokus: graphem:<X>" enthält (z.B. "Lese-Fokus: graphem:sch"):

1. **Häufung:** Verwende Wörter mit Graphem <X> mindestens 8–12× über die Geschichte verteilt — nie alle in einen Satz pressen.
2. **Markierung:** Wickle jedes solche Wort im finalen HTML in:
   `<span class="word-interactive lese-fokus lese-fokus--graphem">Wort</span>`
3. **Sinnhaftigkeit zuerst:** Lieber 8 organische Treffer als 12 erzwungene. Geschichte muss natürlich klingen.
4. **Beispiel (Fokus "sch"):** Schatz, Schule, schlafen, schnell, Schaf, Tasche, waschen, schauen, schön, Wunsch.
5. **Neurotyp gilt zusätzlich:** Lese-Fokus überschreibt nicht den Neurotyp-Stil — kombiniere beides.

Wenn keine "Lese-Fokus"-Zeile im User-Prompt: Diese Sektion vollständig ignorieren.
```

### 2. n8n Prompt-Builder anpassen

**Datei:** [n8n-config/daten-vorbereiten-v4.js](n8n-config/daten-vorbereiten-v4.js)

- Bei den Webhook-Parameter-Extraktionen (Z. 7–10) ergänzen:
  ```js
  const leseFokus = (input['Lese_Fokus'] || '').trim();
  ```
- Im User-Prompt-Aufbau für Skill-Personas (Z. 115–117) ergänzen:
  ```js
  ${leseFokus ? `\n\nLese-Fokus: ${leseFokus}` : ''}
  ```
- Generisch — funktioniert ohne Änderung, sobald weitere Typen im Prompt unterstützt werden.

### 3. n8n-Form um Preset-Dropdown erweitern

**Externes n8n** — Workflow-ID `eHfC95UaMbJMcLTb`.

Neues Form-Feld **nach** Persona-Auswahl, **nur sichtbar wenn `Persona == "Pip Punkt"`**:

```
Label: "Lese-Fokus (passend zur Schul-Fibel) — optional"
Type:  Dropdown
Optionen (Label → Wert der an Webhook geht):
  "—" → ""  (kein Fokus)

  Meine Fibel (Cornelsen):
    "Lektion ~12: sch"  → "graphem:sch"
    "Lektion ~18: ch"   → "graphem:ch"
    "Lektion ~22: ck"   → "graphem:ck"

  Mildenberger Silbenfibel:
    "Lektion ~8: ck"    → "graphem:ck"

  Frei wählbar:
    "Graphem: sch"      → "graphem:sch"
    "Graphem: ch"       → "graphem:ch"
    "Graphem: ck"       → "graphem:ck"
    "Graphem: pf"       → "graphem:pf"
    "Graphem: qu"       → "graphem:qu"
    "Graphem: st / sp"  → "graphem:st"
    "Graphem: ei"       → "graphem:ei"
    "Graphem: ie"       → "graphem:ie"
    "Graphem: eu"       → "graphem:eu"
    "Graphem: au"       → "graphem:au"
    "Graphem: nk / ng"  → "graphem:nk"
    "Graphem: tz"       → "graphem:tz"
```

**ToDo bei Implementation:** Lektionsnummern sind Schätzungen — vor Live-Schaltung mit aktuellen Cornelsen-/Mildenberger-Ausgaben verifizieren (ggf. Eltern-Verifikation einholen).

### 4. CSS für Lese-Fokus-Familie (Basis + graphem-Modifier)

**Ort:** Story-HTML-Template — gleicher Style-Block, in dem `.highlight-active` definiert ist. Lebt im n8n-Knoten "Geschichte parsen".

```css
.lese-fokus {
    border-radius: 4px;
    padding: 0 2px;
    transition: background 0.2s;
}
.lese-fokus--graphem { background-color: #fff59d; }

.word-interactive.highlight-active { background-color: #ffeb3b !important; }
```

Weitere `.lese-fokus--*`-Modifier kommen mit ihren jeweiligen Features (Architektur ist offen).

---

## Kritische Dateien (MVP)

| Datei | Änderung |
|---|---|
| [prompts/pip-punkt.md](prompts/pip-punkt.md) | Neue Sektion "LESE-FOKUS — GRAPHEM" |
| [n8n-config/daten-vorbereiten-v4.js](n8n-config/daten-vorbereiten-v4.js) | Parameter `Lese_Fokus` extrahieren + an Skill-Persona-User-Prompts anhängen |
| n8n-Form (extern, Workflow `eHfC95UaMbJMcLTb`) | Neues bedingtes Dropdown-Feld (Sichtbarkeit `Persona == "Pip Punkt"`) |
| n8n-Knoten "Geschichte parsen" (Template-CSS) | `.lese-fokus` + `.lese-fokus--graphem` ergänzen |

---

## Verifikation

1. **Test in [prompt-vergleich/](prompt-vergleich/)** (Prompt-Tests nie in `demo-texte`):
   - 3 Pip-Stories mit `Lese_Fokus: "graphem:sch"` generieren (Standard, ADHS, LRS)
   - Manuell zählen: ≥8 Wörter mit "sch"? Korrekt mit `lese-fokus--graphem` markiert? Pip-Stil intakt (20–50 Wörter, Präsens, Hauptsätze)?
2. **Negativ-Test:** 1 Pip-Story **ohne** `Lese_Fokus` — sicherstellen, dass keine `lese-fokus`-Klassen im Output erscheinen.
3. **Visuelle Prüfung:** Story im Browser öffnen — gelb hinterlegte Wörter sichtbar, Wort-Klick-Interaktion funktioniert weiterhin, Layout intakt, keine Kollision mit `highlight-active`.
4. **Cross-Persona-Sanity:** 1 Story mit Stella oder Finja generieren mit fälschlich gesetztem `Lese_Fokus` — soll ignoriert werden (Sektion existiert nur in Pip-Prompt).
5. **Architektur-Sanity:** Lese-Fokus-Naming sollte konsistent sein — keine Restbestände von `Graphem_Fokus` oder `graphem-focus`-Klassen im Code.

**Workflow-Trigger:** NIEMALS ohne explizite User-Erlaubnis. Tests werden manuell durch User in der n8n-UI ausgelöst.

---

## Marketing-Notiz (für späteren Landing-Page-Text)

> "Pip Punkt begleitet die ersten Lese-Schritte deines Kindes — passend zur Schul-Fibel. Wähle die aktuelle Lektion und Pip schreibt eine Geschichte, in der die neuen Buchstaben besonders oft vorkommen und farbig hervorgehoben sind. So üben Kinder zu Hause genau das, was in der Schule gerade dran ist — verpackt in eine Geschichte, die sie selbst lesen können."

Diese Sprachregelung trägt auch die späteren Fokus-Typen (Anlaut, Silben, Reim, Sichtwort …): Es bleibt immer "Pip begleitet die Fibel" — nur die konkreten Übungselemente erweitern sich mit der Zeit.
