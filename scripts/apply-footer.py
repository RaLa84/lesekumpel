#!/usr/bin/env python3
"""Propagiert den kanonischen Footer aus partials/footer.html in alle Zielseiten.

Quelle: partials/footer.html (Single Source of Truth) mit drei Bloecken:
  - LK-FOOTER:CSS     gemeinsame Footer-CSS
  - LK-FOOTER:PUBLIC  Footer-Markup fuer Root-Seiten (demo.html, …)
  - LK-FOOTER:READING Footer-Markup fuer Story-Leseseiten (Unterordner, ../)

Ziele (vorerst, bewusst klein gehalten):
  - public : demo.html, neue-autorengeschichte.html
  - reading: (noch keine — Block ist vorbereitet, siehe collect_targets)

Einfuegen (idempotent):
  - CSS   : zwischen den CSS-Markern ersetzen; falls nicht vorhanden, vor
            dem TAFEL-Marker bzw. vor </style>.
  - Markup: zwischen den FOOTER-Markern ersetzen; falls nicht vorhanden,
            das bestehende <footer> ... </footer> (erstes Vorkommen) ersetzen.

JS bleibt seitenseitig.

Aufruf:
  python scripts/apply-footer.py --dry     # nur anzeigen
  python scripts/apply-footer.py            # anwenden
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "partials" / "footer.html"

FOOTER_START = "<!-- === LK-FOOTER:FOOTER START === -->"
FOOTER_END = "<!-- === LK-FOOTER:FOOTER END === -->"


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
    public = _between(src, "<!-- === LK-FOOTER:PUBLIC START === -->", "<!-- === LK-FOOTER:PUBLIC END === -->")
    reading = _between(src, "<!-- === LK-FOOTER:READING START === -->", "<!-- === LK-FOOTER:READING END === -->")
    return css, public, reading


TAFEL_MARKER = "/* === TAFEL-ANSICHT v2:"


def apply_css(text: str, css_block: str):
    """Ersetzt/fuegt den CSS-Block (inkl. eigener Marker) ein.

    Erstplatzierung VOR dem TAFEL-Marker (falls vorhanden), sonst vor </style>.
    Wichtig: apply-tafel.py --force loescht alles vom TAFEL-Marker bis </style> —
    der Footer-CSS muss daher davor liegen, damit er nicht ueberschrieben wird.
    """
    pat = re.compile(r"/\* === LK-FOOTER:CSS START === \*/.*?/\* === LK-FOOTER:CSS END === \*/", re.DOTALL)
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


def apply_footer(text: str, footer_markup: str):
    """Ersetzt/fuegt das Footer-Markup zwischen den FOOTER-Markern ein."""
    wrapped = FOOTER_START + "\n  " + footer_markup.strip() + "\n  " + FOOTER_END
    marker_pat = re.compile(re.escape(FOOTER_START) + r".*?" + re.escape(FOOTER_END), re.DOTALL)
    if marker_pat.search(text):
        return marker_pat.sub(lambda m: wrapped, text, count=1), "footer:ersetzt (Marker)"
    footer_pat = re.compile(r"<footer\b.*?</footer>", re.DOTALL)
    if footer_pat.search(text):
        return footer_pat.sub(lambda m: wrapped, text, count=1), "footer:ersetzt (1. <footer>)"
    return text, "footer:KEIN <footer>"


def collect_targets():
    css, public, reading = load_source()
    targets = []  # (path, variant, footer_markup)

    for name in ("demo.html", "neue-autorengeschichte.html"):
        p = REPO / name
        if p.exists():
            targets.append((p, "public", public))

    # Spaeter aktivierbar: Lese-Seiten (Unterordner, ../) bekommen die READING-Variante.
    # for d in ("demo-texte", "texte"):
    #     for p in sorted((REPO / d).glob("*.html")):
    #         targets.append((p, "reading", reading))

    return css, targets


def main() -> int:
    dry = "--dry" in sys.argv
    css, targets = collect_targets()
    print(f"Quelle: {SOURCE.relative_to(REPO)}  (CSS {len(css)} Zeichen)")
    print(f"Modus: {'DRY-RUN' if dry else 'ANWENDEN'}   Ziele: {len(targets)}\n")

    changed = 0
    for path, variant, footer in targets:
        text = path.read_text(encoding="utf-8")
        new, css_msg = apply_css(text, css)
        new, footer_msg = apply_footer(new, footer)
        rel = path.relative_to(REPO)
        if new != text:
            changed += 1
            if not dry:
                path.write_text(new, encoding="utf-8")
            print(f"  [{variant:7}] {rel}  -> {css_msg}, {footer_msg}")
        else:
            print(f"  [{variant:7}] {rel}  (unveraendert)")

    print(f"\n{changed} Datei(en) {'wuerden geaendert' if dry else 'geaendert'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
