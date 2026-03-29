# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lesekumpel** (Reading Buddy) is a German-language children's story library web app targeting ages 5-10. It serves AI-generated stories and comic stories as a static site hosted on GitHub Pages at `https://rala84.github.io/lesekumpel/`.

Die vollständige Projektvision, Zielgruppe, geplante Features (Spracherkennung, Wort-Tracking, Motivationssystem, PWA) und technische Architektur-Planung sind in `leseapp_konzeption.md` dokumentiert.

## Architecture

This is a **static site with no build step** — pure vanilla HTML, CSS, and JavaScript. There is no framework, no bundler, and no package.json.

### Content Pipeline

- Stories are generated via **N8N workflows** (`rala84.app.n8n.cloud`) which create HTML files and commit them directly to this repo
- Comic images are generated via Nano Banana (AI image generation) integrated with N8N
- The GitHub API is used at runtime to dynamically discover story files

### Key Files & Directories

- `index.html` — Main catalog/library page. Fetches story lists via GitHub API, extracts metadata from each story's `<meta>` tags, and renders a filterable/searchable catalog
- `texte/` — Text-based stories (HTML files)
- `comicgeschichten/` — Comic/picture stories (HTML files)
- `comics/` — Comic panel images (PNG)
- `bilder/` — Story illustration images (PNG)
- `prompts/` — Systemprompts der 9 Autor-Personas (je 1 Markdown-Datei)
- `avatars/` — Avatar-Bilder der Personas (WEBP)
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

### Authors/Personas

Acht fiktionale AI-Autoren-Personas mit individuellen Systemprompts in `prompts/`. Avatare in `avatars/`. Profil: **Neuroinklusion**.

**Basis-Stimme:**
- **Lea Lesestark** — Basis-Referenz, ausgewogen und altersgerecht (5–10 J.)

**Genre-Personas (Stil-Differenzierung):**
- **Samira Wissensfreund** — Edutainment/Sachtexte (Checker-Tobi-Stil)
- **Holzi Pixelkopf** — Tech/Digital-Geschichten (ab Stufe 4)
- **Deniz Traumfänger** — Fantasy/Emotion (8–12 J., ab Stufe 4)
- **Jonas Entdecker** — Abenteuer/Alltag, authentisch (8–12 J.)

**Neuroinclusive Personas (Barrierefreiheit-Fokus):**
- **Zara Zapp** — ADHS/Konzentration: Action, Tempo, max 2 Sätze/Absatz, Mini-Cliffhanger
- **Leo Klartext** — Autismus-Spektrum: keine Metaphern, explizite Gefühle, absolute Eindeutigkeit
- **Timo Taktschritt** — LRS/Dyslexie: Rhythmus, kurze Silben, keine Komposita, Lesefluss

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
