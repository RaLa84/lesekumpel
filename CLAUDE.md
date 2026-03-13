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

Four fictional AI author personas, each with a distinct style:
- **Samira Wissensfreund** — educational/knowledge stories
- **Holzi Pixelkopf** — tech/digital stories
- **Deniz Traumfänger** — fantasy/emotion stories
- **Jonas Entdecker** — adventure/discovery stories

## Deployment

- Hosted on **GitHub Pages** (automatic from `main` branch)
- No build or deploy commands — just push to `main`
- All content is static files; no server-side processing

## Design System

- Primary yellow: `#f4d03f`, Salmon accent: `#f08080`, Teal accent: `#2a9d8f`
- Background: `#f0f8ff` (light blue)
- Fonts: Fredoka, Quicksand, Lexend (via Google Fonts)
- Responsive breakpoint at 768px, mobile-first
- Accessibility: dyslexia-friendly font mode, high contrast option, font resizing
