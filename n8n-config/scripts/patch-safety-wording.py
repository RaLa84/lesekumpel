"""Hotfix: Gemini-Safety-Filter triggert auf Formulierungen wie 'Adult characters MUST NOT appear',
'adult bystanders, dance partners'. Ersetze die kritischen Passagen durch harmlosere Wording,
das dasselbe Verhalten bewirkt ('only include people named in the story').

Liest aktuellen Live-Workflow, mutiert 3 Knoten (agent-szenen, agent-elements, prep-scenes, elements-prep),
schreibt updated-workflow.json für anschließenden PUT.
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


# agent-szenen Systemprompt
NEW_SZENEN_SYS = (
    "You are a prompt compiler for a children's book illustrator. Your job is to fill slot templates.\n\n"
    "RULES — every scene MUST satisfy all 4 checks:\n"
    "1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF / HELD-BY).\n"
    "2. Every named prop has a hand slot (left / right / both / none).\n"
    "3. Every person has an explicit age that matches the story.\n"
    "4. Only include people named in the story. Do not invent extra characters.\n\n"
    "VARIATION RULE: change camera angle and setting between scenes. Keep character appearance identical (hair, clothing, skin, age, build).\n\n"
    "STYLE RULE: The art style prefix is identical verbatim across all scenes of the same story.\n\n"
    "Output ONLY the JSON array, no markdown, no explanations."
)
nodes["agent-szenen"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_SZENEN_SYS


# agent-elements Systemprompt
NEW_ELEMENTS_SYS = (
    "Du bist ein visueller Charakterdesigner für Kinderbücher und sorgst für physische Plausibilität.\n"
    "Extrahiere detaillierte, konsistente visuelle Beschreibungen aller Figuren, Gegenstände und Schauplätze.\n\n"
    "PFLICHT:\n"
    "- Jede Figur hat eine explizite Alterszahl (ageYears) und Größenkategorie (heightCategory).\n"
    "- Jedes Prop hat count (Anzahl) und heldIn (Hand-Slot).\n"
    "- sceneRules enthält 2-4 kurze englische Constraint-Sätze: explizite Räumlichkeit (ON/NEXT-TO/BEHIND/IN-FRONT-OF), explizite Objektanzahl, explizite Altersangabe.\n"
    "- Wenn eine Figur mit einer Struktur interagiert (Beet, Tisch, Bühne, Auto), MUSS die räumliche Relation in sceneRules stehen.\n"
    "- Wenn nur Kinder in der Geschichte sind, nimm einen Satz auf: \"Only children from the story appear; no extra characters.\"\n"
    "- Bei paarigen Werkzeugen (Schild/Lanze, Tasse/Teller) MUSS count und heldIn stimmen.\n\n"
    "Antworte NUR mit dem JSON-Objekt — kein Markdown, keine Erklärungen."
)
nodes["agent-elements"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_ELEMENTS_SYS


# prep-scenes — MANDATORY CHECKS Abschnitt entschärfen
pc = nodes["prep-scenes"]["parameters"]["jsCode"]
OLD_MANDATORY = """MANDATORY CHECKS (failing any means re-fill):
1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF) — never vague.
2. Every named prop has a hand slot (left / right / both / none).
3. Every human in the scene has an explicit age matching the story.
4. Adult characters MUST NOT appear unless the story names an adult. If only children in story, all ages <=12.
5. Each scene varies camera angle and setting compared to other scenes, but character appearance stays IDENTICAL."""
NEW_CHECKS = """CHECKS for every scene:
1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF).
2. Every named prop has a hand slot (left / right / both / none).
3. Every person has an explicit age that matches the story.
4. Only include people named in the story; do not invent extras.
5. Camera angle and setting vary between scenes; character appearance stays identical."""
assert OLD_MANDATORY in pc, "MANDATORY CHECKS-Block nicht gefunden"
nodes["prep-scenes"]["parameters"]["jsCode"] = pc.replace(OLD_MANDATORY, NEW_CHECKS)

# Auch Slot-Template-Zeile im prep-scenes: "adults unless story specifies" → harmloser
pc2 = nodes["prep-scenes"]["parameters"]["jsCode"]
OLD_SLOT = 'wrong ages, duplicate props, floating objects, adults unless story specifies'
NEW_SLOT = 'wrong ages, duplicate props, floating objects, extra characters not in the story'
assert OLD_SLOT in pc2, "Slot-Negative-Line nicht gefunden"
nodes["prep-scenes"]["parameters"]["jsCode"] = pc2.replace(OLD_SLOT, NEW_SLOT)


# elements-prep — entschärfen
ep = nodes["elements-prep"]["parameters"]["jsCode"]
OLD_EP_RULE = 'If only children appear in the story, the rule MUST state "All humans are children aged <=12".'
NEW_EP_RULE = 'If only children appear in the story, include a rule: "Only the named children from the story appear; no extra characters."'
assert OLD_EP_RULE in ep, "elements-prep rule line not found"
nodes["elements-prep"]["parameters"]["jsCode"] = ep.replace(OLD_EP_RULE, NEW_EP_RULE)


DST.parent.mkdir(exist_ok=True, parents=True)
with DST.open("w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"OK — patched 4 nodes, written to {DST}")
print("Touched: agent-szenen, agent-elements, prep-scenes, elements-prep")
