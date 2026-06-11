# Prompt-Drift-Report: n8n-Knoten vs. prompts/*.md

Generiert am 2026-06-11 aus Workflow "Lesekumpel – Neuroinclusive Story Generator".

Die Persona-Systemprompts existieren doppelt: hartkodiert in den n8n-Knoten UND als Dateien in `prompts/`.
Dieser Report zeigt, wie weit beide auseinanderliegen. Die Knoten-Versionen liegen als Kopien in
`n8n-config/_tmp/node-prompts/` — Diff z. B. mit `git diff --no-index prompts/pip-punkt.md n8n-config/_tmp/node-prompts/pip-punkt.md`.

**Offene Entscheidung:** Welche Version ist die gewollte? Danach entweder (a) Prompts zur Laufzeit
per HTTP aus dem Repo laden oder (b) Sync-Skript Repo → n8n etablieren.

| Persona | Knoten (Zeichen) | Repo (Zeichen) | Identisch? | Abweichende Zeilen |
|---------|-----------------|----------------|------------|--------------------|
| pip-punkt | 2848 | 2848 | ja ✓ | 0 |
| mia-mitte | 3184 | 3184 | ja ✓ | 0 |
| peter-past | 3987 | 5159 | NEIN | 14 |
| stella-stimmenreich | 4053 | 4053 | ja ✓ | 0 |
| finja-feder | 4980 | 4980 | ja ✓ | 0 |
| samira-wissensfreund | 5159 | 7983 | NEIN | 45 |
| holzi-pixelkopf | 5929 | 8055 | NEIN | 21 |
| deniz-traumfaenger | 7450 | 8400 | NEIN | 25 |
| jonas-entdecker | 5071 | 6037 | NEIN | 14 |

## Befund (2026-06-11)

Stichprobe peter-past: Die Repo-Datei enthält eine komplette **REDEWIEDERGABE**-Sektion
(indirekte Rede im Präsens etc.), die im n8n-Knoten fehlt → **das Repo ist die neuere Version**,
die Verbesserungen wurden nie nach n8n synchronisiert.

Achtung bei Samira: Der Knoten-Prompt ist bewusst für den Agent-Knoten (v1.9, Wikipedia-Tool)
angepasst — NICHT blind aus dem Repo überschreiben.

Empfehlung: Sync-Skript Repo → n8n (Skill-Personas 1:1, Samira manuell prüfen).
