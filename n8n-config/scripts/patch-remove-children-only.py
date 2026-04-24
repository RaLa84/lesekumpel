"""Hotfix: Die Regel 'Only children from the story appear' filterte auch legitime
Erwachsene (Papa, Lehrerin) aus der Story. Entferne die Kinder-spezifische
Klausel, behalte nur die neutrale 'nur benannte Charaktere' Regel.

Betroffen:
- agent-elements Systemprompt
- elements-prep jsCode
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
nodes = {n["id"]: n for n in wf["nodes"]}


# agent-elements Systemprompt — remove children-specific clause
NEW_ELEMENTS_SYS = (
    "Du bist ein visueller Charakterdesigner für Kinderbücher und sorgst für physische Plausibilität.\n"
    "Extrahiere detaillierte, konsistente visuelle Beschreibungen aller Figuren, Gegenstände und Schauplätze.\n\n"
    "PFLICHT:\n"
    "- Jede Figur hat eine explizite Alterszahl (ageYears) und Größenkategorie (heightCategory).\n"
    "- Jedes Prop hat count (Anzahl) und heldIn (Hand-Slot).\n"
    "- sceneRules enthält 2-4 kurze englische Constraint-Sätze: explizite Räumlichkeit (ON/NEXT-TO/BEHIND/IN-FRONT-OF), explizite Objektanzahl, explizite Handzuordnung.\n"
    "- Wenn eine Figur mit einer Struktur interagiert (Beet, Tisch, Bühne, Auto), MUSS die räumliche Relation in sceneRules stehen.\n"
    "- sceneRules enthält immer den Satz: \"Only the characters named in the story appear; do not invent extra people.\"\n"
    "- Bei paarigen Werkzeugen (Schild/Lanze, Tasse/Teller) MUSS count und heldIn stimmen.\n\n"
    "Antworte NUR mit dem JSON-Objekt — kein Markdown, keine Erklärungen."
)
nodes["agent-elements"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_ELEMENTS_SYS


# elements-prep jsCode — replace the children-only rule line
ep = nodes["elements-prep"]["parameters"]["jsCode"]
OLD_EP_RULE = 'If only children appear in the story, include a rule: "Only the named children from the story appear; no extra characters."'
NEW_EP_RULE = 'Always include a rule: "Only the characters named in the story appear; do not invent extra people."'
assert OLD_EP_RULE in ep, "elements-prep rule line not found"
nodes["elements-prep"]["parameters"]["jsCode"] = ep.replace(OLD_EP_RULE, NEW_EP_RULE)


DST.parent.mkdir(exist_ok=True, parents=True)
with DST.open("w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"OK — patched 2 nodes (agent-elements, elements-prep), written to {DST}")
