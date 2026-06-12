# Prompt-Drift-Report: n8n-Knoten vs. prompts/*.md

Generiert am 2026-06-12 aus Workflow "Lesekumpel – Neuroinclusive Story Generator".

Die Persona-Systemprompts existieren doppelt: hartkodiert in den n8n-Knoten UND als Dateien in `prompts/`.
Dieser Report zeigt, wie weit beide auseinanderliegen. Die Knoten-Versionen liegen als Kopien in
`n8n-config/_tmp/node-prompts/` — Diff z. B. mit `git diff --no-index prompts/pip-punkt.md n8n-config/_tmp/node-prompts/pip-punkt.md`.

**Single Source of Truth ist das Repo (`prompts/*.md`).** Nach Prompt-Änderungen syncen mit:
`node n8n-config/scripts/sync-prompts-repo-to-n8n.mjs` (erst `--dry-run`).

| Persona | Knoten (Zeichen) | Repo (Zeichen) | Identisch? | Abweichende Zeilen |
|---------|-----------------|----------------|------------|--------------------|
| pip-punkt | 2848 | 2848 | ja ✓ | 0 |
| mia-mitte | 3184 | 3184 | ja ✓ | 0 |
| peter-past | 5159 | 5159 | ja ✓ | 0 |
| stella-stimmenreich | 4053 | 4053 | ja ✓ | 0 |
| finja-feder | 4980 | 4980 | ja ✓ | 0 |
| samira-wissensfreund | 7983 | 7983 | ja ✓ | 0 |
| holzi-pixelkopf | 8055 | 8055 | ja ✓ | 0 |
| deniz-traumfaenger | 8400 | 8400 | ja ✓ | 0 |
| jonas-entdecker | 6037 | 6037 | ja ✓ | 0 |

## Historie

**2026-06-11:** Drift entdeckt — 5 von 9 Knoten-Prompts waren älter als die Repo-Dateien
(z. B. fehlte bei peter-past die komplette REDEWIEDERGABE-Sektion).
**2026-06-12:** Repo → n8n gesynct via `sync-prompts-repo-to-n8n.mjs`, alle 9 identisch.
Samira (agent v1.9) nutzt `options.systemMessage` — die Repo-Datei enthält die Wikipedia-Tool-Zeilen bereits.
