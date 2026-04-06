# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lesekumpel** (Reading Buddy) is a German-language children's story library web app targeting ages 5-10. It serves AI-generated stories and comic stories as a static site hosted on GitHub Pages at `https://rala84.github.io/lesekumpel/`.

Die vollständige Projektvision, Zielgruppe, geplante Features (Spracherkennung, Wort-Tracking, Motivationssystem, PWA) und technische Architektur-Planung sind in `leseapp_konzeption.md` dokumentiert.

## Architecture

This is a **static site with no build step** — pure vanilla HTML, CSS, and JavaScript. There is no framework, no bundler, and no package.json.

### Content Pipeline

- Stories are generated via **N8N workflows** (`rala84.app.n8n.cloud`) which create HTML files and commit them directly to this repo
- Webhook-Endpoint: `/webhook/lesekumpel-story` — akzeptiert `Persona`, `Neurotyp`, `Titel`, `Genre`, `Kurzbeschreibung`, `Bildstil`
- Silbentrennung wird **per Code** nachträglich hinzugefügt (nicht vom LLM) — im Knoten "Geschichte parsen"
- **Bilderpipeline temporär ausgebaut** (Knoten verwaist, nicht gelöscht) — Stories werden ohne Bilder committed
- The GitHub API is used at runtime to dynamically discover story files

### Key Files & Directories

- `index.html` — Main catalog/library page. Fetches story lists via GitHub API, extracts metadata from each story's `<meta>` tags, and renders a filterable/searchable catalog
- `texte/` — Text-based stories (HTML files)
- `demo-texte/` — Test-Geschichten (HTML, öffentlich sichtbar)
- `comicgeschichten/` — Comic/picture stories (HTML files)
- `comics/` — Comic panel images (PNG)
- `bilder/` — Story illustration images (PNG)
- `prompts/` — Systemprompts der Personas (je 1 Markdown-Datei)
- `avatars/` — Avatar-Bilder der Personas (WEBP)
- `n8n-config/` — Workflow-JSON, Daten-vorbereiten-Code, API-Config
- `n8n-config/daten-vorbereiten-v4.js` — Aktuelle Version der Prompt-Builder-Node
- `tests/` — Textqualitäts-Tests: Prompts, Ergebnisse pro Modell, Vergleichsanalysen
- `leseapp_konzeption.md` — Full project vision document (German)

### Data Flow

1. `index.html` calls GitHub API (`/repos/RaLa84/lesekumpel/contents/texte` and `.../comicgeschichten`) to list stories
2. Each story HTML is fetched to extract `<meta name="author">` and `<meta name="date">` tags
3. Client-side JavaScript handles filtering (by type, author) and search
4. Stories are served as standalone HTML pages with inline styles

### Story Metadata Convention

Each story HTML file must include these meta tags for the catalog to work:
```html
<meta name="author" content="Author Name">
<meta name="date" content="YYYY-MM-DD">
```

### Personas & Neurotypen

Neun Personas in zwei Kategorien. Systemprompts in `prompts/`. Avatare in `avatars/`.

**5 Skill-Personas** — definieren das Leseniveau. Jede hat 4 Neurotyp-Varianten (Standard, ADHS, Autismus-Spektrum, LRS) im Systemprompt:

| Persona | Leseniveau | Wörter | Tempus | Prompt-Datei |
|---------|-----------|--------|--------|-------------|
| **Pip Punkt** | Einfach lesen | 20–50 | Präsens | `prompts/pip-punkt.md` |
| **Mia Mitte** | Flüssig lesen | 50–100 | Präsens | `prompts/mia-mitte.md` |
| **Peter Past** | Erzählzeit | 100–150 | Präteritum | `prompts/peter-past.md` |
| **Stella Stimmenreich** | Dialoge & Komplexität | 150–250 | Frei | `prompts/stella-stimmenreich.md` |
| **Finja Feder** | Anspruchsvoll | 250–400 | Frei | `prompts/finja-feder.md` |

**4 Bonus-Personas** — fixer Stil, kein Neurotyp-Parameter, freischaltbar als Belohnung:

- **Samira Wissensfreund** — Edutainment/Sachtexte, Wikipedia-Tool (agent v1.9, nicht chainLlm!)
- **Holzi Pixelkopf** — Gaming/Humor, Denglisch, ADHS-optimiert
- **Deniz Traumfänger** — Immersive Traumreisen, Du-Perspektive, immer Präsens
- **Jonas Entdecker** — Alltags-Abenteuer, Ich-Perspektive

**Neurotyp-Parameter** (nur Skill-Personas): Wird als Webhook-Feld `Neurotyp` übergeben (Standard | ADHS | Autismus | LRS). Der User-Prompt sagt `Schreib im Modus: [Neurotyp]` und das Modell folgt der passenden Sektion im Systemprompt.

**Alte Personas (archiviert):** Lea Lesestark, Timo Taktschritt, Zara Zapp, Leo Klartext — deren Neurotyp-Regeln sind jetzt Sektionen in den Skill-Persona-Systemprompts. Mia Brücke (DaZ) wurde entfernt.

## Deployment

- Hosted on **GitHub Pages** (automatic from `main` branch)
- No build or deploy commands — just push to `main`
- All content is static files; no server-side processing

## Design System

Das vollständige Design System ist in `design-system.md` dokumentiert.

Kurzübersicht:
- Primary coral: `#D67171`, Secondary yellow: `#FFD54F`, Background: `#FFF9E5`
- Fonts: Fredoka (headings), Quicksand (body) via Google Fonts
- Responsive breakpoint at 768px, mobile-first
- Accessibility: dyslexia-friendly font mode, high contrast option, font resizing

## Knowledge Base (RAG-Chatbot)

Das Verzeichnis `knowledge-base/` enthält eine evidenzbasierte Wissensdatenbank über Lesenlernen bei Kindern (5–10 Jahre) mit besonderen Bedürfnissen. Ziel ist ein RAG-basierter Chatbot, der Eltern und Fachpersonal berät.

**Grundsatz: Kein Fakt ohne Quelle.**

### Verzeichnisstruktur

```
knowledge-base/
├── PROJEKT.md              # Gesamtdokumentation, RAG-Architektur, Fortschritt
├── README.md               # Kurzübersicht
├── quellen/
│   ├── experten.md          # 40+ Experten mit Profilen und Publikationen
│   └── quellenregister.md   # Alle Quellen mit DOI/ISBN/URL
├── themen/                  # RAG-kompatible Fakten-Chunks pro Thema
│   ├── lrs-legasthenie.md
│   ├── adhs-lesen.md
│   ├── autismus-lesen.md
│   ├── daz-lesen.md
│   ├── hoerbehinderung-lesen.md
│   └── sehbehinderung-lesen.md
├── praxis/
│   ├── tipps-eltern.md      # Alltagstipps für Eltern
│   └── tipps-lehrkraefte.md # Methoden für Fachpersonal
└── meta/
    ├── schema.md            # Dokumentformat-Spezifikation
    └── glossar.md           # Fachbegriffe erklärt
```

### Dokumentformat

- YAML-Frontmatter (thema, zielgruppe, altersgruppe, letzte_aktualisierung)
- Jeder `##`-Abschnitt = 1 RAG-Chunk (100–500 Wörter, in sich verständlich)
- Jeder Chunk endet mit `**Quelle:**` und `**Evidenzgrad:**`
- Details: `knowledge-base/meta/schema.md`

### Geplanter RAG-Stack

- **LLM:** Claude API
- **Embedding:** OpenAI text-embedding-3-large
- **Vektor-DB:** Supabase pgvector
- **Backend:** Next.js API Routes
- **Retrieval:** Hybrid (Semantic + BM25)
