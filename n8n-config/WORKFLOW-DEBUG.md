# N8N Workflow Debug – Lesekumpel Story Generator

## Ziel
Den Workflow `lesekumpel-story-generator.json` in N8N importieren und öffnen, ohne die Fehlermeldung "Could not find property option" zu erhalten. Danach Credentials verbinden und Workflow testen.

## Status: GEFIXT ✓ (2026-03-19)

Workflow kann in der N8N-UI geöffnet werden. Fix via n8n REST API angewendet.

**Nächster Schritt:** Credentials verbinden und Workflow testen.

## N8N Instanz
- URL: `https://rala84.app.n8n.cloud`
- API Key + MCP URL: in `n8n-config/.env`
- Workflow ID in N8N (importiert, aber nicht öffenbar): `h8BqMw8sHtFSLwlV`

## Fehlermeldung
```
Could not find workflow / Could not find property option
```
Erscheint wenn der Workflow in der N8N-UI geöffnet wird.

## Workflow-Datei
`n8n-config/workflows/lesekumpel-story-generator.json`

Neuroinclusive Kindergeschichten-Generator mit:
- 5 Persona-Agenten (Lea, Timo, Zara, Leo, Mia) via `@n8n/n8n-nodes-langchain.chainLlm`
- Google Gemini als LLM (`@n8n/n8n-nodes-langchain.lmChatGoogleGemini`)
- Bild-Generierung via Gemini Image API
- GitHub Commit der fertigen HTML-Dateien
- Form-Trigger als Einstieg

## Bereits angewendete Fixes

| # | Problem | Fix |
|---|---------|-----|
| 1 | `lmChatGoogleGemini` Parameter | `{}` → `{"options":{}}` (alle 8 Nodes) |
| 2 | `formTrigger` typeVersion | `2.2` → `2.3` |
| 3 | `respondToWebhook` | `respondWith: "html"` → `"text"` |
| 4 | HTTP Request Body Format | `specifyBody:"json"` + `jsonBody` → `contentType:"json"` + `body` Objekt (alle HTTP-Nodes) |
| 5 | Gemini Image API Body | `parse-scenes` Node: `geminiRequestBody` Objekt korrekt befüllt |
| 6 | GitHub Commit/Upload Nodes | Body-Format auf `contentType:"json"` + `body` Objekte umgestellt |

| 7 | `chainLlm` typeVersion + `options` | v1.4 → v1.7, `options` (maxTokens/temperature) entfernt, `batching: {}` hinzugefügt (alle 8 Nodes) |
| 8 | `switch` typeVersion | v3 → v3.4 |

**Fix 7 war die Lösung**: Die `options`-Property (`maxTokens`, `temperature`) in `chainLlm` v1.4 existiert in der aktuellen n8n-Version (v1.7) nicht mehr → "Could not find property option".

## Referenz: Funktionierender Workflow
Workflow-ID `DkZIex6xVGB3bw9P` in N8N öffnet sich fehlerfrei → als Vergleich nutzen.

## Credentials (nach Fix zu verbinden)
- `Google-Gemini` → in allen `lmChatGoogleGemini` Sub-Nodes
- `GitHub-Lesekumpel` → in den GitHub HTTP-Nodes

## Dateien
| Datei | Beschreibung |
|-------|-------------|
| `n8n-config/workflows/lesekumpel-story-generator.json` | Haupt-Workflow (lokal) |
| `n8n-config/workflows/agent-lea-lesestark.json` | Sub-Workflow Persona Lea |
| `n8n-config/.env` | N8N URL, API Key, MCP URL (gitignored) |
| `.mcp.json` | Claude Code MCP-Konfiguration (gitignored) |
