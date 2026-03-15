# Projekt: Lesekumpel Knowledge Base

## Vision

Eine evidenzbasierte Wissensdatenbank darüber, wie Kinder mit besonderen Bedürfnissen (Alter 5–10) lesen lernen können. Die KB dient als Grundlage für einen RAG-Chatbot, der Eltern und Fachpersonal individuell berät.

**Grundsatz: Kein Fakt ohne Quelle.**

## Zielgruppen des Chatbots

| Zielgruppe | Sprachniveau | Inhaltsfokus |
|-----------|-------------|-------------|
| **Eltern** | Einfach, alltagsnah | Tipps, Hacks, Ermutigung, Warnsignale |
| **Lehrkräfte** | Fachlich, evidenzbasiert | Methoden, Diagnostik, Differenzierung |
| **Therapeuten** | Fachlich-klinisch | Leitlinien, Interventionen, Komorbidität |

Der Chatbot erkennt anhand der Frage die Zielgruppe und passt Sprache und Detailtiefe an.

---

## Themenfelder

| # | Thema | Datei | Status |
|---|-------|-------|--------|
| 1 | LRS / Legasthenie / Dyslexie | `themen/lrs-legasthenie.md` | In Arbeit |
| 2 | ADHS & Lesen | `themen/adhs-lesen.md` | In Arbeit |
| 3 | Autismus & Lesen | `themen/autismus-lesen.md` | In Arbeit |
| 4 | Deutsch als Zweitsprache (DaZ) | `themen/daz-lesen.md` | In Arbeit |
| 5 | Hörbehinderung & Lesen | `themen/hoerbehinderung-lesen.md` | In Arbeit |
| 6 | Sehbehinderung & Lesen | `themen/sehbehinderung-lesen.md` | In Arbeit |

---

## Abgeschlossene Arbeitspakete

### Phase 1: Grundlagen (abgeschlossen 2026-03-15)
- [x] Verzeichnisstruktur `knowledge-base/` angelegt
- [x] Expertenliste mit 40+ Einträgen in 6 Themenfeldern (`quellen/experten.md`)
- [x] 25+ Influencer, Podcasts und Content Creators dokumentiert
- [x] RAG-Dokumentformat definiert (`meta/schema.md`)
- [x] README mit Projektübersicht

### Phase 2: Wissensinhalte (abgeschlossen 2026-03-15)
- [x] 6 Themen-Dokumente mit RAG-kompatiblen Chunks befüllen
  - [x] LRS / Legasthenie (14 Chunks, 25+ Quellen)
  - [x] ADHS & Lesen (12 Chunks, 26 Quellen)
  - [x] Autismus & Lesen (12 Chunks, 26 Quellen)
  - [x] DaZ & Lesen
  - [x] Hörbehinderung & Lesen
  - [x] Sehbehinderung & Lesen
- [x] Praxistipps für Eltern (`praxis/tipps-eltern.md`, 11 Abschnitte)
- [x] Praxistipps für Lehrkräfte (`praxis/tipps-lehrkraefte.md`, 10 Abschnitte)
- [x] Glossar der Fachbegriffe (`meta/glossar.md`, 40+ Einträge)
- [x] CLAUDE.md um KB-Dokumentation ergänzen

### Phase 2b: Knowledge Snacks (abgeschlossen 2026-03-15)
- [x] 256 Knowledge Snacks aus KB-Inhalten extrahiert
  - [x] LRS / Legasthenie: 31 Snacks
  - [x] ADHS & Lesen: 30 Snacks
  - [x] Autismus & Lesen: 34 Snacks
  - [x] DaZ & Lesen: 31 Snacks
  - [x] Hörbehinderung & Lesen: 33 Snacks
  - [x] Sehbehinderung & Lesen: 29 Snacks
  - [x] Praxistipps (themenübergreifend): 17 Snacks
  - [x] Glossar: 51 Snacks
- [x] Snack-Typen: 85 Tipps, 69 Fakten, 64 Glossar, 27 Zahlen, 11 Mythen
- [x] Drei Formate: Markdown (Quelle) + JSON (Export) + HTML (Übersichtsseite)
- [x] `snacks/snacks.json` — maschinenlesbarer Export aller 256 Snacks
- [x] `snacks/index.html` — filterbarer Kartenkatalog im Lesekumpel-Design
- [x] `snacks/schema.md` — Format-Dokumentation

### Phase 3: RAG-Pipeline (geplant)
- [ ] Markdown-Parser → JSON-Chunks mit Metadata
- [ ] Embedding-Modell wählen und Chunks einbetten
- [ ] Vektor-Datenbank aufsetzen
- [ ] Retrieval-Pipeline implementieren
- [ ] Chatbot-Interface bauen

---

## Recherche-Methodik

### Quellen-Hierarchie (Evidenzpyramide)

```
1. Meta-Analysen / Systematic Reviews
2. Randomisierte kontrollierte Studien (RCTs)
3. Kohortenstudien / Längsschnittstudien
4. Querschnittstudien
5. S3/S2k-Leitlinien (AWMF)
6. Fachbücher / Expertenmeinungen
7. Praxisberichte / Erfahrungswissen
```

### Suchstrategie

**Datenbanken:** Google Scholar, PubMed, pedocs.de, FIS Bildung, ERIC
**Suchsprachen:** Deutsch und Englisch
**Suchbegriffe pro Thema:**
```
("reading" OR "Lesen" OR "literacy" OR "Lesekompetenz")
AND ("children" OR "Kinder" OR "primary school" OR "Grundschule")
AND ("{Thema}" OR "{englische Übersetzung}")
AND ("intervention" OR "Förderung" OR "instruction" OR "Unterricht")
```

### Qualitätsprüfung

- Jede Quelle wird im Quellenregister mit DOI/ISBN/URL erfasst
- Evidenzgrad wird pro Fakt angegeben
- Peer-reviewed-Quellen werden bevorzugt
- Praxisberichte nur als Ergänzung, nicht als alleinige Grundlage

---

## RAG-Architektur

### Datenformat

```
Markdown-Dateien (knowledge-base/themen/*.md)
    ↓ Parser
JSON-Chunks mit Metadata
    ↓ Embedding
Vektoren in Vektor-DB
    ↓ Retrieval
Top-K relevante Chunks
    ↓ LLM (Claude API)
Antwort an Nutzer
```

### Chunking-Strategie

- **1 Markdown-Abschnitt (##) = 1 Chunk**
- Ideale Chunk-Größe: 100–500 Wörter
- Jeder Chunk ist in sich verständlich (kein "siehe oben")
- Metadata pro Chunk:
  - `thema` (aus YAML-Frontmatter)
  - `zielgruppe` (Eltern / Lehrkräfte / Therapeuten)
  - `evidenzgrad` (aus dem Chunk-Text extrahiert)
  - `quelle` (aus dem Chunk-Text extrahiert)

### Embedding-Optionen

| Option | Vorteile | Nachteile |
|--------|----------|-----------|
| **OpenAI text-embedding-3-large** | Beste Qualität, 3072 Dimensionen | Kostenpflichtig, US-Server |
| **Cohere embed-multilingual-v3** | Gute deutsche Unterstützung | Kostenpflichtig |
| **Jina embeddings-v3** | Multilingual, Open Source möglich | Weniger erprobt |
| **BGE-M3 (lokales Modell)** | Kostenlos, Datenschutz | Infrastruktur nötig |

**Empfehlung:** OpenAI text-embedding-3-large für den Start (beste Qualität für deutschsprachige Fachinhalte), später ggf. Migration auf lokales Modell.

### Vektor-Datenbank-Optionen

| Option | Vorteile | Nachteile |
|--------|----------|-----------|
| **Supabase pgvector** | Bereits in Lesekumpel-Architektur geplant | Limitierte Skalierung |
| **Pinecone** | Managed, einfach | Kostenpflichtig, US-Server |
| **Chroma** | Open Source, Python-nativ | Hosting nötig |
| **Qdrant** | Open Source, performant | Hosting nötig |

**Empfehlung:** Supabase pgvector — passt zur geplanten Lesekumpel-Architektur (siehe `leseapp_konzeption.md`).

### Retrieval-Strategie

- **Hybrid-Retrieval:** Semantic Search (Embedding-Ähnlichkeit) + Keyword-basiert (BM25)
- **Metadata-Filter:** Chatbot filtert Chunks nach Thema und Zielgruppe
- **Re-Ranking:** Optional: Cross-Encoder für Top-K Re-Ranking
- **Top-K:** 5–8 Chunks pro Anfrage an LLM übergeben

### Chatbot-Stack

| Komponente | Technologie |
|-----------|-------------|
| **LLM** | Claude API (Anthropic) |
| **Embedding** | OpenAI text-embedding-3-large |
| **Vektor-DB** | Supabase pgvector |
| **Backend** | Node.js / Next.js API Routes |
| **Frontend** | React (Lesekumpel Web-App) |
| **Hosting** | Vercel (Frontend) + Supabase (DB) |

---

## Dateistruktur (komplett)

```
knowledge-base/
├── PROJEKT.md                   # Diese Datei — Gesamtdokumentation
├── README.md                    # Kurzübersicht für Entwickler
├── quellen/
│   ├── experten.md              # 40+ Experten mit Profilen
│   └── quellenregister.md       # Alle Quellen mit DOI/ISBN/URL
├── themen/
│   ├── lrs-legasthenie.md       # RAG-Chunks: LRS
│   ├── adhs-lesen.md            # RAG-Chunks: ADHS
│   ├── autismus-lesen.md        # RAG-Chunks: Autismus
│   ├── daz-lesen.md             # RAG-Chunks: DaZ
│   ├── hoerbehinderung-lesen.md # RAG-Chunks: Hörbehinderung
│   └── sehbehinderung-lesen.md  # RAG-Chunks: Sehbehinderung
├── praxis/
│   ├── tipps-eltern.md          # Alltagstipps für Eltern
│   └── tipps-lehrkraefte.md     # Methoden für Fachpersonal
└── meta/
    ├── schema.md                # Dokumentformat-Spezifikation
    └── glossar.md               # Fachbegriffe erklärt
```

---

## Offene Fragen

- [ ] Datenschutz: Hosting in EU erforderlich? → Auswirkung auf Embedding/Vektor-DB-Wahl
- [ ] Soll der Chatbot auch auf die Geschichten in `texte/` und `comicgeschichten/` zugreifen?
- [ ] Wie wird der Chatbot in die Lesekumpel-Oberfläche integriert? (Eigene Seite vs. Overlay)
- [ ] Brauchen wir ein Feedback-System für den Chatbot (Daumen hoch/runter)?
- [ ] Soll die KB auch englischsprachige Quellen im Original enthalten oder alles übersetzen?

---

*Letzte Aktualisierung: 15. März 2026*
