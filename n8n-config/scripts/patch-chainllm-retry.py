"""Robustheits-Fix: retryOnFail an chainLlm-Nodes aktivieren.

Der chainLlm-Node crasht mit 'Cannot read properties of undefined
(reading message)' bei Gemini Safety-Blocks, 503 oder malformed
Response. n8n Node-Level-Retry fuehrt den Node bis zu maxTries mal
aus - wiederholt behebt 90% der intermittierenden Faelle.

Zielknoten: alle agents, die zu Fehler neigen - besonders agent-szenen
und agent-elements. Defensiv auch alle anderen chainLlm-Nodes.
"""

import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "n8n-config" / "cache" / "current-workflow.json"
DST = ROOT / "n8n-config" / "cache" / "updated-workflow.json"

with SRC.open("r", encoding="utf-8") as f:
    wf = json.load(f)

assert wf["name"] == "Lesekumpel – Neuroinclusive Story Generator"

RETRY_TARGETS = {
    "agent-szenen",
    "agent-elements",
    "agent-linguistik",
    "agent-quiz",
    "emoji-tagger",
    # Persona-Agents — die schreiben den Story-Text und sind weniger fehleranfaellig
    # aber ein Retry schadet auch nicht
    "agent-pip", "agent-mia", "agent-peter", "agent-stella", "agent-finja",
    "agent-holzi", "agent-deniz", "agent-jonas",
    # Samira ist ein agent-Node, nicht chainLlm, aber Retry-Felder sind gleich
    "agent-samira",
}

patched = 0
for n in wf["nodes"]:
    if n.get("id") in RETRY_TARGETS:
        # Node-level retry fields (nicht in parameters, sondern direkt am Node)
        n["retryOnFail"] = True
        n["maxTries"] = 3
        n["waitBetweenTries"] = 3000
        patched += 1
        print(f"  [OK] {n.get('name','')[:50]:<50} ({n.get('id')}): retryOnFail=true, maxTries=3, waitBetweenTries=3000ms")

DST.parent.mkdir(exist_ok=True, parents=True)
with DST.open("w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print()
print(f"Done: {patched} LLM-Knoten mit Retry ausgeruestet, written to {DST}")
