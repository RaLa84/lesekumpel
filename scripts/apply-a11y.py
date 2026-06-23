#!/usr/bin/env python3
"""Propagiert das A11y-Modal aus partials/a11y.html in die PUBLIC-Seiten.

Quelle: partials/a11y.html mit drei Bloecken:
  - /* === LK-A11Y:CSS START/END === */   Modal-Chrome + body.dyslexia/contrast
  - <!-- === LK-A11Y:MODAL START/END === --> Dialog-Markup (vor </body>)
  - // === LK-A11Y:JS START/END ===        Funktionen + Init (im <script>)

Ziele: demo.html, neue-autorengeschichte.html (PUBLIC-Header-Seiten).
Die Story-Leseseiten haben bereits ein identisches Modal samt eigener JS
(aus dem Generator-Template) und sind NICHT Ziel.

Einfuegen (idempotent):
  - CSS  : zwischen CSS-Markern ersetzen; sonst vor TAFEL-Marker, sonst vor </style>.
  - MODAL: zwischen MODAL-Markern ersetzen; sonst vor </body>.
  - JS   : zwischen JS-Markern ersetzen; sonst vor </body>.

Aufruf:
  python scripts/apply-a11y.py --dry
  python scripts/apply-a11y.py
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "partials" / "a11y.html"
PUBLIC_PAGES = ("demo.html", "neue-autorengeschichte.html", "neue-geschichte.html", "anmelden.html")
TAFEL_MARKER = "/* === TAFEL-ANSICHT v2:"

CSS_START, CSS_END = "/* === LK-A11Y:CSS START === */", "/* === LK-A11Y:CSS END === */"
MODAL_START, MODAL_END = "<!-- === LK-A11Y:MODAL START === -->", "<!-- === LK-A11Y:MODAL END === -->"
JS_START, JS_END = "// === LK-A11Y:JS START ===", "// === LK-A11Y:JS END ==="


def _between(text, start, end, inclusive=True):
    i = text.find(start)
    j = text.find(end, i + len(start)) if i != -1 else -1
    if i == -1 or j == -1:
        raise RuntimeError(f"Marker nicht gefunden: {start!r}")
    return text[i:j + len(end)] if inclusive else text[i + len(start):j]


def load_source():
    src = SOURCE.read_text(encoding="utf-8")
    css = _between(src, CSS_START, CSS_END)
    modal = _between(src, MODAL_START, MODAL_END)
    # JS-Block MIT Markern, aber OHNE <script>-Tags: Beim Ersetzen liegen die
    # Marker bereits in einem <script> -> Tags hier wuerden doppelt verschachteln.
    js = _between(src, JS_START, JS_END)
    return css, modal, js


def apply_css(text, css):
    pat = re.compile(re.escape(CSS_START) + r".*?" + re.escape(CSS_END), re.DOTALL)
    if pat.search(text):
        return pat.sub(lambda m: css, text, count=1), "css:ersetzt"
    anchor = text.find(TAFEL_MARKER)
    if anchor != -1:
        return text[:anchor].rstrip() + "\n\n        " + css + "\n\n        " + text[anchor:], "css:vor TAFEL"
    pos = text.rfind("</style>")
    if pos == -1:
        return text, "css:KEIN </style>"
    return text[:pos].rstrip() + "\n\n        " + css + "\n    " + text[pos:], "css:vor </style>"


def apply_block(text, start, end, block, label):
    pat = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    if pat.search(text):
        return pat.sub(lambda m: block, text, count=1), label + ":ersetzt"
    pos = text.rfind("</body>")
    if pos == -1:
        return text, label + ":KEIN </body>"
    return text[:pos].rstrip() + "\n\n  " + block + "\n\n" + text[pos:], label + ":vor </body>"


def apply_js(text, js):
    """JS-Block ersetzen (Marker liegen bereits in einem <script>) bzw. beim
    Erstinsert in ein frisches <script> packen. Idempotent: kein Doppel-Tag."""
    pat = re.compile(re.escape(JS_START) + r".*?" + re.escape(JS_END), re.DOTALL)
    if pat.search(text):
        return pat.sub(lambda m: js, text, count=1), "js:ersetzt"
    pos = text.rfind("</body>")
    if pos == -1:
        return text, "js:KEIN </body>"
    block = "<script>\n" + js + "\n</script>"
    return text[:pos].rstrip() + "\n\n  " + block + "\n\n" + text[pos:], "js:vor </body>"


def main():
    dry = "--dry" in sys.argv
    css, modal, js = load_source()
    print(f"Quelle: {SOURCE.relative_to(REPO)}  (CSS {len(css)}, Modal {len(modal)}, JS {len(js)})")
    print(f"Modus: {'DRY-RUN' if dry else 'ANWENDEN'}\n")
    changed = 0
    for name in PUBLIC_PAGES:
        p = REPO / name
        if not p.exists():
            print(f"  [fehlt]   {name}")
            continue
        text = p.read_text(encoding="utf-8")
        new, m1 = apply_css(text, css)
        new, m2 = apply_block(new, MODAL_START, MODAL_END, modal, "modal")
        new, m3 = apply_js(new, js)
        if new != text:
            changed += 1
            if not dry:
                p.write_text(new, encoding="utf-8")
            print(f"  [ok]      {name}  -> {m1}, {m2}, {m3}")
        else:
            print(f"  [=]       {name}  (unveraendert)")
    print(f"\n{changed} Datei(en) {'wuerden geaendert' if dry else 'geaendert'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
