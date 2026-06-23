#!/usr/bin/env python3
"""Entfernt die view-tafel-spezifischen Header-Vergroesserungen, damit der
Header im Lese-/Tafel-Modus exakt dem kanonischen Header (partials/header.html)
entspricht — auf allen Seiten gleich.

Entfernt jede Zeile der Form:
    body.view-tafel .nav-logo      { ... }
    body.view-tafel .nav-logo-box  { ... }
    body.view-tafel .brand-name    { ... }
    body.view-tafel .main-navbar   { ... }

Ziel: doenerella-Master (Quelle von apply-tafel.py, damit es nicht
zurueckkommt) + alle Story-Dateien + n8n-config/demo-template.html.
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PAT = re.compile(r"^[ \t]*body\.view-tafel \.(?:nav-logo|nav-logo-box|brand-name|main-navbar)\b[^\n]*\n", re.MULTILINE)

dry = "--dry" in sys.argv

targets = []
for d in ("demo-texte", "texte", "comicgeschichten"):
    targets += sorted((REPO / d).glob("*.html"))
targets.append(REPO / "n8n-config" / "demo-template.html")

changed = 0
total = 0
for p in targets:
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    n = len(PAT.findall(t))
    if n:
        total += n
        changed += 1
        if not dry:
            p.write_text(PAT.sub("", t), encoding="utf-8")
        print(f"  {p.relative_to(REPO)}: {n} Regel(n) entfernt")

print(f"\n{changed} Datei(en), {total} Regeln {'wuerden entfernt' if dry else 'entfernt'}.")
