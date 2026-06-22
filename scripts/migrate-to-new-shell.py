"""Migriert alte self-contained Story-Seiten auf die neue "Kinder-Lese-Modus"-Shell.

Vorgehen: Die neue Shell (Donor = Flohmarkt-Seite) wird kopiert; aus der Zielseite
werden die story-spezifischen Inhalts-Slots extrahiert und in die Donor-Kopie eingesetzt.
Inhalt und Shell haben in beiden Generationen identisches Format, nur die Shell
(Navbar, Overlays, CSS, JS, reading-action-bar ...) unterscheidet sich.

Slots (jeweils genau 1x in Donor und Ziel):
  - SEO-Block:   <title> ... letztes </script> der ld+json-Bloecke (vor <style>)
  - hero-bg:     <img class="hero-bg" ...>
  - main-title:  <h1 id="main-title"> ... </h1>
  - hero-image:  Lauf aufeinanderfolgender <img class="hero-image" ...>
  - data:        let rawStory = ... window.imagePositions = imagePositions; <kommentar>
  - related:     <div class="related-grid"> ... </div>

Aufruf:
  python scripts/migrate-to-new-shell.py demo-texte/<datei>.html [weitere ...]
  python scripts/migrate-to-new-shell.py --dry-run demo-texte/<datei>.html
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DONOR = REPO / "demo-texte" / "mein-erster-tag-auf-dem-flohmarkt-12e9.html"
NEW_SHELL_MARKER = 'class="nav-center"'  # Kennzeichen der neuen Shell (Idempotenz)

SLOTS = {
    "seo":      re.compile(r"<title>.*?</script>(?=\s*<style)", re.S),
    "herobg":   re.compile(r'<img class="hero-bg"[^>]*>'),
    "title":    re.compile(r'<h1 id="main-title">.*?</h1>', re.S),
    "heroimgs": re.compile(r'(?:[ \t]*<img[^>]*class="hero-image"[^>]*>\s*)+'),
    "data":     re.compile(r"let rawStory = .*?window\.imagePositions = imagePositions;[^\n]*", re.S),
    "relgrid":  re.compile(r'<div class="related-grid">.*?</div>', re.S),
}


def migrate(path: Path, donor_html: str, dry: bool = False):
    target = path.read_text(encoding="utf-8")
    if NEW_SHELL_MARKER in target:
        return False, "schon neue Shell — übersprungen"
    # Slots aus der Zielseite extrahieren
    vals = {}
    for name, rx in SLOTS.items():
        m = rx.search(target)
        if not m:
            return False, f"Slot fehlt in Zielseite: {name}"
        vals[name] = m.group(0)
    # In Donor-Kopie einsetzen (Funktions-Replacement -> keine Backreference-Probleme)
    out = donor_html
    for name, rx in SLOTS.items():
        out, n = rx.subn(lambda mm, v=vals[name]: v, out, count=1)
        if n != 1:
            return False, f"Donor-Slot '{name}': {n} Treffer (erwartet genau 1)"
    if dry:
        return True, f"OK (dry-run, {len(out)} Zeichen)"
    path.write_text(out, encoding="utf-8")
    return True, "migriert"


def main() -> int:
    dry = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print("Keine Zieldateien angegeben.")
        return 1
    donor_html = DONOR.read_text(encoding="utf-8")
    print(f"Donor: {DONOR.name}  ({len(donor_html)} Zeichen)")
    print(f"Mode: {'DRY-RUN' if dry else 'SCHREIBEN'}\n")
    for a in args:
        p = Path(a)
        if not p.is_absolute():
            p = REPO / a
        if not p.exists():
            print(f"  [missing] {a}")
            continue
        if p.resolve() == DONOR.resolve():
            print(f"  [skip] {p.name}: ist die Donor-Seite")
            continue
        ok, msg = migrate(p, donor_html, dry)
        print(f"  [{'ok' if ok else 'skip'}] {p.name}: {msg}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
