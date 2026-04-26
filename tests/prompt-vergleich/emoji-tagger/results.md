# Emoji-Tagger — Edge-Case-Tests (2026-04-26)

Test des aufgewerteten Emoji-Taggers im n8n-Workflow nach Modell-Upgrade auf Gemini 2.5 Pro und überarbeitetem Prompt (Commit `40109e3`).

## Setup

- **Modell:** `models/gemini-2.5-pro` (vorher `gemini-2.5-flash`)
- **Temperature:** 0.1
- **Prompt:** 3138 Zeichen, Few-Shot mit 5 Beispielen, neue Regeln für Negation, Polysemie, Flexion, Empty-Fallback
- **Methode:** Webhook-Trigger via `/webhook/lesekumpel-story` mit gezielten Edge-Case-Kurzbeschreibungen

## Test 1 — Negation, Polysemie, Flexion (Peter Past)

**Story:** [bens-mutiger-tag-mit-dem-hund-1dei.html](../../../demo-texte/bens-mutiger-tag-mit-dem-hund-1dei.html)
**Execution:** 1499

**Getaggt (alle korrekt):**

| Wort im Text | Emoji | Geprüfte Regel | Bewertung |
|---|---|---|---|
| `mochte` (seinen Onkel sehr) | 🥰 | Polysemie + Flexion | ✅ Person-Kontext richtig erkannt |
| `unsicher` | 😰 | Standard | ✅ |
| `fürchtete sich` | 😨 | Flexion (Präteritum) | ✅ Exakte Schreibweise übernommen |
| `freute sich` | 😊 | Flexion (Präteritum) | ✅ Exakte Schreibweise übernommen |
| `mutig` | 💪 | Standard | ✅ |
| `stolz` | 😏 | Standard (Gefühl, nicht Hochmut) | ✅ |

**Nicht getaggt (korrekt):**
- `Keine Angst` — **Negationsregel greift** ✅

## Test 2 — Sachtext / Empty-Array (Samira Wissensfreund)

**Story:** [wie-ein-vulkan-ausbricht-1g2d.html](../../../demo-texte/wie-ein-vulkan-ausbricht-1g2d.html)
**Execution:** 1500

**Ergebnis:** `rawStory === emojiStory`. Kein einziger Tag gesetzt.

Sachtext über Vulkane (Magma, Druck, Gase, Lava) — keine Figur, keine Emotion. Empty-Array-Fallback funktioniert. ✅

## Test 3 — Physische Zustände nicht taggen (Holzi Pixelkopf)

**Story:** [holzi-und-der-kaputte-bildschirm-19qg.html](../../../demo-texte/holzi-und-der-kaputte-bildschirm-19qg.html)
**Execution:** 1501

**Im Text vorhanden (alle korrekt NICHT getaggt):**

| Wort | Kategorie | Bewertung |
|---|---|---|
| `laut`, `leise` | Sinneseindruck | ✅ nicht getaggt |
| `kalt` | physischer Zustand | ✅ nicht getaggt |
| `kaputt` (mehrfach) | physischer Zustand | ✅ nicht getaggt |
| `müde` (metaphorisch über Stecker) | physischer Zustand | ✅ nicht getaggt |
| `hell`, `dunkel` | Sinneseindruck | ✅ nicht getaggt |
| `schnell` | Eigenschaft | ✅ nicht getaggt |

**Ergebnis:** `rawStory === emojiStory`. Kein Tag gesetzt — exakt wie erwartet, da der Text bewusst gefühlsneutral war. ✅

## Fazit

| Use Case | Status |
|---|---|
| Standard-Gefühle (Adjektive, Verben) | ✅ |
| Flexion / Vergangenheit (`fürchtete sich`, `freute sich`, `mochte`) | ✅ |
| Negation (`Keine Angst`) | ✅ |
| Polysemie (`mochte` bei Person) | ✅ |
| Mehrere Tags pro Story | ✅ |
| Empty-Array bei Sachtext | ✅ |
| Empty-Array bei action+physical-Text | ✅ |
| Physische Zustände nicht als Gefühl | ✅ |

Alle geprüften Use Cases bestehen. Der neue Prompt + Gemini 2.5 Pro liefert deutlich präzisere Ergebnisse als die Flash+Kurzprompt-Variante.

## Offene Punkte / nicht getestet

- **`mag Pizza` vs. `mag Person`** in derselben Story: Test 1 enthielt nur `mochte seinen Onkel`, nicht `mochte Pizza` als direkter Vergleich im Story-Text. Polysemie-Regel ist über Personen-Kontext bestätigt, aber Essen-Kontext nicht negativ verifiziert.
- **Dubletten**: nicht explizit geprüft (würde mehrfaches Vorkommen desselben Wortes brauchen).
- Bei Bedarf nachtesten mit gezielter Kurzbeschreibung.
