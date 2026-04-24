"""
Patcht beide aktiven Lesekumpel-Workflows: entfernt das .split('T')[0] vom
Datums-Generator, sodass <meta name="date"> einen vollen ISO-Timestamp erhaelt
(inkl. Uhrzeit und ms). Damit ist Sortierung im Katalog stabil.

Workflows:
- eHfC95UaMbJMcLTb (Lesekumpel - Neuroinclusive Story Generator)
- iPIBwCMmR6DdNXtD (Lesekumpel - Publish Claude Pipeline)

Strategie:
1. GET workflow
2. Verifiziere Name
3. Ersetze ".toISOString().split('T')[0]" -> ".toISOString()" in allen jsCodes
4. PUT update

PUT only - kein Trigger. Activierung bleibt unveraendert.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = REPO_ROOT / "n8n-config" / ".env"

WORKFLOWS = [
    ("eHfC95UaMbJMcLTb", "Lesekumpel"),
    ("iPIBwCMmR6DdNXtD", "Lesekumpel"),
]

OLD = ".toISOString().split('T')[0]"
NEW = ".toISOString()"


def load_env():
    env = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def api_request(env, method, path, body=None):
    url = f"{env['N8N_URL']}/api/v1{path}"
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("X-N8N-API-KEY", env["N8N_API_KEY"])
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} on {method} {path}: {body_txt[:500]}", file=sys.stderr)
        raise


def patch_workflow(env, wf_id: str, name_must_contain: str):
    print(f"\n=== {wf_id} ===")
    wf = api_request(env, "GET", f"/workflows/{wf_id}")
    name = wf.get("name", "")
    print(f"Name: {name}")
    if name_must_contain not in name:
        print(f"  SKIP: Name enthaelt '{name_must_contain}' nicht.", file=sys.stderr)
        return False

    changes = 0
    for node in wf.get("nodes", []):
        params = node.get("parameters", {})
        code = params.get("jsCode")
        if not code or OLD not in code:
            continue
        new_code = code.replace(OLD, NEW)
        params["jsCode"] = new_code
        changes += 1
        print(f"  [PATCH] node '{node['name']}' (id={node['id']})")

    if changes == 0:
        print("  Keine Aenderung noetig (Pattern bereits weg).")
        return False

    # n8n PUT akzeptiert nur Subset der settings-Keys
    allowed_settings = {
        "saveExecutionProgress", "saveManualExecutions", "saveDataErrorExecution",
        "saveDataSuccessExecution", "executionTimeout", "timezone",
        "executionOrder", "errorWorkflow",
    }
    settings = {k: v for k, v in (wf.get("settings") or {}).items() if k in allowed_settings}

    payload = {
        "name": wf["name"],
        "nodes": wf["nodes"],
        "connections": wf["connections"],
        "settings": settings,
    }
    if "staticData" in wf and wf["staticData"] is not None:
        payload["staticData"] = wf["staticData"]

    api_request(env, "PUT", f"/workflows/{wf_id}", payload)
    print(f"  -> PUT erfolgreich, {changes} Nodes gepatcht.")
    return True


def main():
    env = load_env()
    if not env.get("N8N_URL") or not env.get("N8N_API_KEY"):
        print("FEHLER: N8N_URL/N8N_API_KEY fehlen in .env", file=sys.stderr)
        return 1

    any_changed = False
    for wf_id, name_substr in WORKFLOWS:
        try:
            if patch_workflow(env, wf_id, name_substr):
                any_changed = True
        except Exception as e:
            print(f"FEHLER bei {wf_id}: {e}", file=sys.stderr)
            return 2

    print("\nFertig." + (" Workflows wurden veraendert." if any_changed else " Keine Aenderungen."))
    return 0


if __name__ == "__main__":
    sys.exit(main())
