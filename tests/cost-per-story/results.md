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

## Nächste Schritte

1. Schätzung der drei Stub-Modi (Top 100, Lesestufen, Geschichte bauen) — Anteile dieser Cost-Basis.
2. User-Profile (Casual/Regular/Power) verfeinern — was ist realistisch?
3. Optimierungs-Hebel identifizieren: welche Knoten könnten von Pro auf Flash gewechselt werden?
