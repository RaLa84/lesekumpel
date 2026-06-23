#!/usr/bin/env python3
"""Stellt Schriften von Google-Fonts-CDN auf das lokale fonts/fonts.css um (DSGVO).

Pro Live-HTML-Datei:
  - Entfernt jede <link>-Zeile zu fonts.googleapis.com / fonts.gstatic.com
    (Stylesheet UND preconnect). Beispiel-Text in <span>/<code> bleibt unberuehrt,
    da nur <link>-Zeilen matchen.
  - Stellt sicher, dass <link rel="stylesheet" href="<prefix>fonts/fonts.css">
    vorhanden ist (Pfad-Praefix je Verzeichnistiefe), sonst vor </head> einfuegen.

Ausgeschlossen: v2/, n8n-config/_tmp, Konzept_Rebranding, Pitch, tests, node_modules.
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
EXCLUDE = ("v2", "_tmp", "Konzept_Rebranding", "Pitch", "tests", "node_modules", ".git")

# <link ...googleapis/gstatic...> (egal ob rel vorne/hinten, stylesheet/preconnect)
CDN_LINK = re.compile(
    r"^[ \t]*<link\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>[ \t]*\n",
    re.IGNORECASE | re.MULTILINE,
)

dry = "--dry" in sys.argv


def prefix_for(p: Path) -> str:
    depth = len(p.relative_to(REPO).parts) - 1  # Dateiname zaehlt nicht
    return "../" * depth


def iter_html():
    for p in REPO.rglob("*.html"):
        rel = p.relative_to(REPO)
        if any(part in EXCLUDE for part in rel.parts):
            continue
        yield p


changed = 0
for p in iter_html():
    t = p.read_text(encoding="utf-8")
    if "fonts.googleapis.com" not in t and "fonts.gstatic.com" not in t:
        continue
    orig = t
    n = len(CDN_LINK.findall(t))
    t = CDN_LINK.sub("", t)
    # noch CDN-<link> uebrig? (z. B. exotische Schreibweise) -> melden
    leftover = bool(re.search(r"<link\b[^>]*fonts\.(?:googleapis|gstatic)\.com", t, re.IGNORECASE))

    prefix = prefix_for(p)
    local = prefix + "fonts/fonts.css"
    added = False
    if "fonts/fonts.css" not in t:
        head = t.rfind("</head>")
        if head != -1:
            t = t[:head].rstrip() + '\n    <link rel="stylesheet" href="' + local + '">\n' + t[head:]
            added = True

    if t != orig:
        changed += 1
        if not dry:
            p.write_text(t, encoding="utf-8")
        flag = "  (!) CDN-<link> bleibt" if leftover else ""
        print(f"  {p.relative_to(REPO)}: -{n} CDN-Link(s){', +fonts.css' if added else ''}{flag}")

print(f"\n{changed} Datei(en) {'wuerden geaendert' if dry else 'geaendert'}.")
