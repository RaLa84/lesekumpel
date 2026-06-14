"""Bild-Pipeline-Fix: Pro-Szene Welt/Medium (Holzi) + Prop-Zeitachse (Jonas).

Setzt die jsCode der vier Bild-Nodes aus den Repo-Spiegeln und ergänzt die
System-Prompts von agent-elements / agent-szenen (idempotent).

  python patch-scene-world-and-prop-timeline.py          # nur bauen (updated-workflow.json + put-body.json)
  python patch-scene-world-and-prop-timeline.py --deploy  # zusätzlich per PUT deployen

GET des aktuellen Workflows muss vorher in cache/current-workflow.json liegen.
"""
import json, sys, os, urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[2]
CFG = ROOT / "n8n-config"
SRC = CFG / "cache" / "current-workflow.json"
DST = CFG / "cache" / "updated-workflow.json"
PUT_BODY = CFG / "cache" / "put-body.json"
WF_ID = "eHfC95UaMbJMcLTb"
EXPECTED_NAME = "Lesekumpel – Neuroinclusive Story Generator"

NODE_FILES = {
    "elements-prep": "story-elements-vorbereiten-v2.js",
    "parse-elements": "elemente-parsen-v2.js",
    "prep-scenes": "bildszenen-vorbereiten-v2.js",
    "parse-scenes": "szenen-parsen-v2.js",
}

# Idempotente System-Prompt-Ergänzungen (Marker = erste Zeile)
ELEMENTS_APPEND = (
    "\n- Jedes Prop bekommt zusätzlich appearsFromParagraph (0-basierter Index des ersten "
    "Absatzes, in dem es vorkommt oder entsteht; 0 = von Anfang an)."
)
ELEMENTS_MARKER = "appearsFromParagraph"

SZENEN_APPEND = (
    "\n\nWORLD/MEDIUM: A scene may take place inside a video game, on a screen, in a dream, "
    "in imagination, or in a remembered past — set the scene's \"medium\" field accordingly and "
    "never render an in-game or imagined action as a literal real-world event.\n"
    "PROP TIMELINE: Only show props that already exist at the scene's point in the story "
    "(respect any \"FIRST APPEARS\" note); never show an object the character obtains later. "
    "Always include the moment's focal object."
)
SZENEN_MARKER = "WORLD/MEDIUM:"


def load_env():
    env = {}
    for line in (CFG / ".env").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


wf = json.loads(SRC.read_text(encoding="utf-8"))
assert wf["name"] == EXPECTED_NAME, f"Unerwarteter Workflow-Name: {wf['name']!r}"
nodes = {n["id"]: n for n in wf["nodes"]}

# 1. jsCode der vier Code-Nodes setzen
for nid, fn in NODE_FILES.items():
    assert nid in nodes, f"Node fehlt: {nid}"
    nodes[nid]["parameters"]["jsCode"] = (CFG / fn).read_text(encoding="utf-8")
    print(f"  jsCode gesetzt: {nid} <- {fn}")

# 2. System-Prompts ergänzen (idempotent)
def append_message(nid, append, marker):
    mv = nodes[nid]["parameters"]["messages"]["messageValues"][0]
    if marker in mv["message"]:
        print(f"  System-Prompt {nid}: Marker schon vorhanden — übersprungen")
    else:
        mv["message"] += append
        print(f"  System-Prompt {nid}: ergänzt")

append_message("agent-elements", ELEMENTS_APPEND, ELEMENTS_MARKER)
append_message("agent-szenen", SZENEN_APPEND, SZENEN_MARKER)

DST.write_text(json.dumps(wf, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK — updated-workflow.json geschrieben ({DST})")

# PUT-Body: nur erlaubte Felder für die n8n Public API
put_body = {k: wf[k] for k in ("name", "nodes", "connections", "settings") if k in wf}
if wf.get("staticData") is not None:
    put_body["staticData"] = wf["staticData"]
PUT_BODY.write_text(json.dumps(put_body, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"OK — put-body.json geschrieben ({PUT_BODY})")

if "--deploy" in sys.argv:
    env = load_env()
    url = f"{env['N8N_URL']}/api/v1/workflows/{WF_ID}"
    data = json.dumps(put_body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="PUT", headers={
        "X-N8N-API-KEY": env["N8N_API_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
    (CFG / "cache" / "put-response.json").write_text(body, encoding="utf-8")
    obj = json.loads(body)
    print(f"DEPLOYED — HTTP {resp.status}, Workflow '{obj.get('name')}' aktualisiert (updatedAt={obj.get('updatedAt')})")
else:
    print("DRY RUN — nicht deployt. Mit --deploy ausführen, um per PUT zu deployen.")
