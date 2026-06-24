# Seitenübersicht — URL-Pfade & Seitentypen

> **Stand:** 2026-06-24
> Übersicht aller URL-Pfade des statischen Lesekumpel-Sites (gehostet auf GitHub Pages unter `https://rala84.github.io/lesekumpel/`).
> Die Story-Listen in `index.html`/`demo.html` werden **dynamisch zur Laufzeit per GitHub-API** geladen — die einzelnen Story-HTML-Dateien sind also Inhalte, keine eigenständig gepflegten App-Seiten.
> Spalte „Sitemap" = in [`sitemap.xml`](../sitemap.xml) als SEO-relevant deklariert.

## 1. Marketing- & Info-Seiten (öffentlich, im Sitemap)

| Pfad | Titel / Zweck | Sitemap |
|------|---------------|:---:|
| [`/` (index.html)](../index.html) | „Meine Bibliothek" — Hauptkatalog, lädt Stories per GitHub-API | ✅ Prio 1.0 |
| [landingpage.html](../landingpage.html) | Marketing-Landingpage „Lernen ohne Tränen" | ✅ 0.9 |
| [demo.html](../demo.html) | Öffentliche Demo-Bibliothek | ✅ 0.8 |
| [preise.html](../preise.html) | Tarife & Funktionen | ✅ 0.7 |
| [ueber-uns.html](../ueber-uns.html) | Über uns / Team | ✅ 0.6 |
| [blog-warum-lesekumpel.html](../blog-warum-lesekumpel.html) | Blog/SEO-Artikel „Warum Lesekumpel?" | ✅ 0.6 |
| [eltern-lesemodi.html](../eltern-lesemodi.html) | Info-Seite „Lesemodi erklärt" für Eltern & Fachkräfte | ✅ 0.6 |
| [impressum.html](../impressum.html) | Rechtliches | ✅ 0.3 |
| [datenschutz.html](../datenschutz.html) | Rechtliches | ✅ 0.3 |

## 2. Konto- & Onboarding-Seiten (App, nicht im Sitemap)

| Pfad | Zweck |
|------|-------|
| [anmelden.html](../anmelden.html) | Anmelden |
| [abmelden.html](../abmelden.html) | Abmelden / Warteliste austragen |
| [mein-konto.html](../mein-konto.html) | Kontoverwaltung |
| [profilauswahl.html](../profilauswahl.html) | „Wer liest heute?" — Profilauswahl |
| [onboarding.html](../onboarding.html) | Profil einrichten |
| [kind.html](../kind.html) | „Mein Lesekumpel" — Kind-Ansicht / Dashboard |

## 3. Story-Erstellung / Generatoren (App)

| Pfad | Zweck |
|------|-------|
| [neue-geschichte.html](../neue-geschichte.html) | Neue Geschichte (im Sitemap, Prio 0.5 ✅) |
| [neue-geschichte-generator.html](../neue-geschichte-generator.html) | Geschichten-Generator |
| [neue-autorengeschichte.html](../neue-autorengeschichte.html) | Autorengeschichte erstellen |
| [neue-comicgeschichte.html](../neue-comicgeschichte.html) | Comic erstellen |
| [neue-sachtext.html](../neue-sachtext.html) | Sachtext mit Samira |
| [neue-social-story.html](../neue-social-story.html) | Social Story erstellen |
| [neue-lesestufen.html](../neue-lesestufen.html) | Lesestufen |
| [neue-top100.html](../neue-top100.html) | Top-100-Wörter |

## 4. Story-Inhalte (dynamisch gelistet, je 1 HTML pro Geschichte)

| Verzeichnis | Typ | Anzahl | Sitemap |
|-------------|-----|:---:|:---:|
| [texte/](../texte/) | Textgeschichten | 34 | ✅ 0.8 |
| [comicgeschichten/](../comicgeschichten/) | Comicgeschichten | 37 | ✅ 0.8 |
| [demo-texte/](../demo-texte/) | Demo-/Test-Textgeschichten | 160 | ✅ 0.7 |

## 5. Sonstige Root-Seiten

| Pfad | Status |
|------|--------|
| [starter.html](../starter.html) | Starter-Seite (im Sitemap, 0.5 ✅) |
| [starterv2.html](../starterv2.html) | Starter-Variante (nicht live) |
| [design-system.html](../design-system.html) | Interne Design-System-Doku |

## 6. Nicht live (Entwürfe / Archiv / Tooling)

- [v2/](../v2/) — alte Shell-Templates (**nicht live**): `index`, `preise`, `mein-konto`, `story-template`, `comic-template` u.a.
- [tests/](../tests/) — Prompt-Vergleiche, Story-Viewer
- [Pitch/](../Pitch/), [Konzept_Rebranding/](../Konzept_Rebranding/) — Präsentationen / Konzepte
- [n8n-config/](../n8n-config/) (`_tmp/`), [knowledge-base/](../knowledge-base/) (`snacks/`) — Tooling / RAG

---

## Kurzfazit

~24 funktionale Root-Seiten (Marketing, Konto, 8 Generatoren) + 3 dynamische Story-Verzeichnisse (231 Story-Seiten gesamt).
Im Sitemap als SEO-relevant: 11 statische Seiten + alle `texte/`, `comicgeschichten/`, `demo-texte/`.
