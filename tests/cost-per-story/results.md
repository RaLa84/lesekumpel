# Cost-per-Story — Autorengeschichte

> **Stand:** 2026-04-29
> **Stichprobe:** 10 erfolgreiche Executions (IDs 1493, 1494, 1495, 1498, 1499, 1500, 1501, 1503, 1504, 1506)
> **Quelle:** n8n-REST-API `includeData=true`, ausgewertet mit `n8n-config/scripts/cost-per-story.js`

## Preise

| Service | Input | Output |
|---|---|---|
| Gemini 2.5 Pro | $1.25/1M | $10/1M |
| OpenAI gpt-image-1 / Gemini Image | — | $0.04/Bild |

Wechselkurs: 1 USD ≈ 0.92 €

Annahme: Alle LLM-Knoten laufen auf Gemini 2.5 Pro (Workflow-Stand 2026-04-26 nach letztem Refactoring).

## Stories im Detail

| ID | Titel | Persona | Input Tokens | Output Tokens | Bilder | Kosten (USD) | Kosten (EUR) |
|---|---|---|---:|---:|---:|---:|---:|
| 1493 | Lina kauft ein Eis | Pip Punkt | 5.513 | 2.083 | 1 | $0.0677 | 0.0623 € |
| 1494 | Hedwig hat Urlaub | Peter Past | 7.350 | 2.872 | 2 | $0.1179 | 0.1085 € |
| 1495 | Hedwig hat Urlaub | Peter Past | 7.162 | 2.922 | 2 | $0.1182 | 0.1087 € |
| 1498 | Hedwig hat Urlaub | Peter Past | 7.729 | 3.212 | 2 | $0.1218 | 0.1120 € |
| 1499 | Bens mutiger Tag mit dem Hund | Peter Past | 8.158 | 3.241 | 2 | $0.1226 | 0.1128 € |
| 1500 | Wie ein Vulkan ausbricht | Samira Wissensfreund | 8.301 | 3.042 | 3 | $0.1608 | 0.1479 € |
| 1501 | Holzi und der kaputte Bildschirm | Holzi Pixelkopf | 8.506 | 3.838 | 3 | $0.1690 | 0.1555 € |
| 1503 | Abfall sortieren | Pip Punkt | 6.367 | 2.102 | 1 | $0.0690 | 0.0635 € |
| 1504 | Abfall sortieren | Pip Punkt | 6.389 | 1.955 | 1 | $0.0675 | 0.0621 € |
| 1506 | Auf dem Flohmarkt | Peter Past | 8.268 | 3.645 | 2 | $0.1268 | 0.1166 € |

## Aggregate

| Metrik | Mittelwert | Median | Min | Max | Stdabw. |
|---|---:|---:|---:|---:|---:|
| Input-Tokens | 7.374 | 7.540 | 5.513 | 8.506 | 958 |
| Output-Tokens | 2.891 | 2.982 | 1.955 | 3.838 | 622 |
| Bilder | 1.9 | 2 | 1 | 3 | 0.7 |
| **Cost (EUR)** | **0.1050 €** | 0.1104 € | 0.0621 € | 0.1555 € | 0.0317 € |

## Top-Knoten nach Kosten (über alle Stories)

| # | Knoten | Runs | Input | Output | Kosten (USD) |
|---|---|---:|---:|---:|---:|
| 1 | ⚙️ Gemini (Szenen) | 10 | 19.101 | 13.212 | $0.1560 |
| 2 | ⚙️ Gemini (Elemente) | 10 | 11.952 | 5.818 | $0.0731 |
| 3 | ⚙️ Gemini (Weiterdenken) | 10 | 4.972 | 2.993 | $0.0361 |
| 4 | ⚙️ Gemini (Linguistik) | 10 | 3.852 | 2.245 | $0.0273 |
| 5 | ⚙️ Gemini (Peter) | 5 | 7.063 | 1.303 | $0.0219 |
| 6 | ⚙️ Gemini (Quiz) | 10 | 3.063 | 1.462 | $0.0184 |
| 7 | ⚙️ Gemini (Schatz) | 10 | 6.682 | 890 | $0.0173 |
| 8 | ⚙️ Gemini (Emoji) | 10 | 9.153 | 339 | $0.0148 |

## Hochrechnung pro User pro Monat (basierend auf Mittelwert)

Bei **0.1050 € pro Story** im Mittel:

| User-Profil | Stories/Monat | Kosten/Monat |
|---|---:|---:|
| Casual | 5 | 0.52 € |
| Regular | 20 | 2.10 € |
| Power | 60 | 6.30 € |

## Beobachtungen

- Stichprobe enthält 10 von 10 Stories **mit** Bildern, 0 ohne (Bilder-Pipeline war im Stichproben-Zeitraum teilweise aktiv).
- Größter Kostenfaktor: **⚙️ Gemini (Szenen)** mit $0.1560 über alle 10 Stories.
- Bilder kosten in 10 der Stories durchschnittlich 0.0699 € pro Story (nur Stories mit Bildern).

## Schätzungen für die anderen 3 Modi

### Bild-Anzahl-Annahme

Lesestufen und Geschichte bauen: **immer 1 Bild pro Story** (vs. 1.9 im Mittel bei Autorengeschichte). Top 100 nutzt vorgenerierte Texte und Wimmelbilder — keine laufenden Kosten pro User.

Cost-Komponenten der gemessenen Autorengeschichte (Mittelwert):

| Komponente | USD | Anteil |
|---|---:|---:|
| LLM Input + Output | $0.0391 | 34 % |
| Bilder (1.9 × $0.040) | $0.0760 | 66 % |
| **Total** | **$0.1141** | **100 %** |

→ Mit nur **1 Bild** statt 1.9: $0.0391 + $0.040 = **$0.0791** (0.0728 €).

### Top 100 Basiswörter

**Modell:** Vorgenerierte Texte (z. B. ~50 Mini-Geschichten à ~80 Wörter) und Wimmelbilder werden **einmalig** erzeugt und liegen statisch im Repo. Plus optional dynamisch generierte Mix-Mini-Geschichten aus dem gelernten Wortschatz des Kindes.

**Einmal-Investition (CapEx) pro Erneuerungs-Zyklus:**
- 50 Mini-Texte à ~Pip-Punkt-Größe: 50 × 0.062 € ≈ **3.10 €**
- 20 Wimmelbilder à $0.040: 20 × 0.037 € ≈ **0.74 €**
- **Gesamt: ~3.85 €** pro Zyklus

**Erneuerungs-Annahme:** alle ~3 Monate wird der Content erweitert/erneuert (Curriculum, Variabilität für Kinder). Wiederkehrende CapEx ≈ **1.28 €/Monat**. Bei 100 zahlenden Usern: **0.013 €/User/Monat** (vernachlässigbar). Bei 10 Usern: 0.13 €/User/Monat.

**Laufend pro User:** ≈ 0 € für vorgenerierte Inhalte. Falls Mix-Mini-Geschichten implementiert werden: ~0.03 € pro Mix-Story.

### Lesestufen

**Modell:** Selber Workflow wie Autorengeschichte, aber Lese-Fokus-Constraint im Prompt + nur 1 Bild.

**Geschätzte Kosten:** ~Autorengeschichte LLM + 1 Bild = **0.073 € pro Story**

### Geschichte bauen

**Modell:** Mehrere LLM-Iterationen (Kind schreibt → KI macht weiter → Kind wieder dran). Annahme: **5 Iterationen** pro Story, jede mit wachsendem Kontext.

**Geschätzte Kosten:**
- LLM: ~110 % der Autorengeschichte-LLM-Kosten (mehr Round-Trips, kleinere Outputs)
  → 1.10 × $0.0391 = $0.043 → 0.040 €
- 1 Bild am Ende: $0.040 → 0.037 €
- **Gesamt: ~0.077 € pro Story**

(Annahme volatil: bei 3 Iterationen ~0.062 €, bei 10 Iterationen ~0.10 €.)

## Cost-Tabelle aller 4 Modi

| Modus | Kosten/Story | Anmerkung |
|---|---:|---|
| Autorengeschichte | **0.105 €** | gemessen (Stichprobe, Mittel) |
| Lesestufen | **0.073 €** | geschätzt (Autorengeschichte LLM + 1 Bild) |
| Geschichte bauen | **0.077 €** | geschätzt (5 Iterationen + 1 Bild) |
| Top 100 Basiswörter | **~0 €** | vorgeneriert (CapEx ≈ 3.85 € einmalig) |

## Hochrechnung mit Modi-Mix

Annahme: Top 100 und Lesestufen sind die meistgenutzten Modi, Autorengeschichte und Geschichte bauen weniger. Mix:

| Modus | Anteil | €/Story | Beitrag |
|---|---:|---:|---:|
| Autorengeschichte | 20 % | 0.105 € | 0.0210 € |
| Top 100 Basiswörter | 30 % | ~0 € | 0 € |
| Lesestufen | 35 % | 0.073 € | 0.0256 € |
| Geschichte bauen | 15 % | 0.077 € | 0.0116 € |
| **Gewichtet pro Story** | | | **0.0581 €** |

| User-Profil | Stories/Monat | Variable Kosten | + Top-100-CapEx (anteilig) | Total/Monat |
|---|---:|---:|---:|---:|
| Casual | 5 | 0.29 € | 0.013 € | **0.30 €** |
| Regular | 20 | 1.16 € | 0.013 € | **1.17 €** |
| Power | 60 | 3.49 € | 0.013 € | **3.50 €** |

(Top-100-CapEx-Anteil: 1.28 €/Monat ÷ 100 zahlende User. Bei 10 Usern wäre der Anteil 0.13 €/Monat.)

**Plus Fixkosten** wie n8n-Cloud (20 €/Monat?), Domain, GitHub Pages = 0 € — diese skalieren nicht mit Nutzung. Bei 100 Usern: 0.20 €/User/Monat extra.

## Nächste Schritte

1. **User-Profile verfeinern**: Sind 5/20/60 Stories/Monat realistisch? Mix 40/15/30/15 plausibel?
2. **Top-100-CapEx absichern**: Wie viele Mini-Texte und Wimmelbilder genau? Mix-Stories ja/nein?
3. **"Geschichte bauen" Iterationen**: 5 ist eine Annahme — Test-Run wäre sinnvoll, sobald implementiert.
4. **Optimierungs-Hebel**: Szenen-Extraktor (15 % der Autorengeschichte-Kosten) auf Flash → spart ~$0.012/Story = ~10 % Cost-Reduction.
