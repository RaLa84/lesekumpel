#!/usr/bin/env python3
"""Propagiert den kanonischen Header aus partials/header.html in alle Zielseiten.

Quelle: partials/header.html (Single Source of Truth) mit drei Bloecken:
  - LK-HEADER:CSS     gemeinsame Navbar-CSS
  - LK-HEADER:PUBLIC  Navbar-Markup fuer Root-Seiten (demo.html)
  - LK-HEADER:READING Navbar-Markup fuer Story-Leseseiten (Unterordner, ../)

Ziele:
  - public : demo.html
  - reading: *.html in demo-texte/ + texte/ mit Reading-Signatur
             (class="nav-center" UND nav-avatar-btn) + n8n-config/demo-template.html

Einfuegen (idempotent):
  - CSS  : zwischen den CSS-Markern ersetzen; falls nicht vorhanden, vor </style>.
  - Markup: zwischen den NAV-Markern ersetzen; falls nicht vorhanden,
            das bestehende <nav class="main-navbar"> ... </nav> ersetzen.

JS bleibt seitenseitig (toggleMenu / openSettings / Avatar-Befuellung).

Aufruf:
  python scripts/apply-header.py --dry     # nur anzeigen
  python scripts/apply-header.py            # anwenden
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "partials" / "header.html"

NAV_START = "<!-- === LK-HEADER:NAV START === -->"
NAV_END = "<!-- === LK-HEADER:NAV END === -->"

READING_SIGNATURE = ('class="nav-center"', "nav-avatar-btn")

# Root-Seiten mit PUBLIC-Navbar (gleiche Variante wie demo.html)
PUBLIC_PAGES = ("demo.html", "neue-autorengeschichte.html", "neue-geschichte.html", "anmelden.html", "profilauswahl.html")


def _between(text: str, start: str, end: str) -> str:
    i = text.find(start)
    j = text.find(end, i + len(start)) if i != -1 else -1
    if i == -1 or j == -1:
        raise RuntimeError(f"Marker nicht gefunden: {start!r}..{end!r}")
    return text[i + len(start):j].strip()


def load_source():
    src = SOURCE.read_text(encoding="utf-8")
    # CSS-Block INKL. Marker (damit er im Ziel idempotent ersetzbar ist)
    css = _between(src, "<style>", "</style>").strip()
    public = _between(src, "<!-- === LK-HEADER:PUBLIC START === -->", "<!-- === LK-HEADER:PUBLIC END === -->")
    reading = _between(src, "<!-- === LK-HEADER:READING START === -->", "<!-- === LK-HEADER:READING END === -->")
    return css, public, reading


TAFEL_MARKER = "/* === TAFEL-ANSICHT v2:"


def apply_css(text: str, css_block: str):
    """Ersetzt/fuegt den CSS-Block (inkl. eigener Marker) ein.

    Erstplatzierung VOR dem TAFEL-Marker (falls vorhanden), sonst vor </style>.
    Wichtig: apply-tafel.py --force loescht alles vom TAFEL-Marker bis </style> —
    der Header-CSS muss daher davor liegen, damit er nicht ueberschrieben wird.
    """
    pat = re.compile(r"/\* === LK-HEADER:CSS START === \*/.*?/\* === LK-HEADER:CSS END === \*/", re.DOTALL)
    if pat.search(text):
        return pat.sub(lambda m: css_block, text, count=1), "css:ersetzt"
    anchor = text.find(TAFEL_MARKER)
    if anchor != -1:
        new = text[:anchor].rstrip() + "\n\n        " + css_block + "\n\n        " + text[anchor:]
        return new, "css:eingefuegt (vor TAFEL-Marker)"
    pos = text.rfind("</style>")
    if pos == -1:
        return text, "css:KEIN </style>"
    new = text[:pos].rstrip() + "\n\n        " + css_block + "\n    " + text[pos:]
    return new, "css:eingefuegt (vor </style>)"


def apply_nav(text: str, nav_markup: str):
    """Ersetzt/fuegt das Navbar-Markup zwischen den NAV-Markern ein."""
    wrapped = NAV_START + "\n  " + nav_markup.strip() + "\n  " + NAV_END
    marker_pat = re.compile(re.escape(NAV_START) + r".*?" + re.escape(NAV_END), re.DOTALL)
    if marker_pat.search(text):
        return marker_pat.sub(lambda m: wrapped, text, count=1), "nav:ersetzt (Marker)"
    nav_pat = re.compile(r'<nav class="main-navbar".*?</nav>', re.DOTALL)
    if nav_pat.search(text):
        return nav_pat.sub(lambda m: wrapped, text, count=1), "nav:ersetzt (1. <nav>)"
    return text, "nav:KEINE main-navbar"


def collect_targets():
    css, public, reading = load_source()
    targets = []  # (path, variant, nav_markup)

    for name in PUBLIC_PAGES:
        p = REPO / name
        if p.exists():
            targets.append((p, "public", public))

    for d in ("demo-texte", "texte"):
        for p in sorted((REPO / d).glob("*.html")):
            t = p.read_text(encoding="utf-8")
            if all(sig in t for sig in READING_SIGNATURE):
                targets.append((p, "reading", reading))

    tpl = REPO / "n8n-config" / "demo-template.html"
    if tpl.exists():
        targets.append((tpl, "reading", reading))

    return css, targets


def main() -> int:
    dry = "--dry" in sys.argv
    css, targets = collect_targets()
    print(f"Quelle: {SOURCE.relative_to(REPO)}  (CSS {len(css)} Zeichen)")
    print(f"Modus: {'DRY-RUN' if dry else 'ANWENDEN'}   Ziele: {len(targets)}\n")

    changed = 0
    for path, variant, nav in targets:
        text = path.read_text(encoding="utf-8")
        new, css_msg = apply_css(text, css)
        new, nav_msg = apply_nav(new, nav)
        rel = path.relative_to(REPO)
        if new != text:
            changed += 1
            if not dry:
                path.write_text(new, encoding="utf-8")
            print(f"  [{variant:7}] {rel}  -> {css_msg}, {nav_msg}")
        else:
            print(f"  [{variant:7}] {rel}  (unveraendert)")

    print(f"\n{changed} Datei(en) {'wuerden geaendert' if dry else 'geaendert'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
