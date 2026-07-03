"""Baut das N8N-Generator-Template (n8n-config/demo-template.html) aus der neuen Shell.

Hintergrund: Der Story-Generator-Workflow holt das Template zur Laufzeit von
  https://raw.githubusercontent.com/RaLa84/lesekumpel/main/n8n-config/demo-template.html
und befüllt die {{PLATZHALTER}} im Knoten "HTML assemblieren" (assemble-html-v2.js).
Damit neue Geschichten wie z.B. magie-in-unserer-strasse aussehen, muss das Template die
NEUE "Kinder-Lese-Modus"-Shell sein (inkl. Lucide-Herz, Tafel-Layout) statt der alten Shell.

Vorgehen: Donor = mein-erster-tag-auf-dem-flohmarkt-12e9 (neue Shell, echte Inhalte). Aus dem
ALTEN Template werden die Platzhalter-Slots (SEO, hero-bg, main-title, Daten-Block) extrahiert
und in die Donor-Kopie eingesetzt; die hero-image-Liste wird durch {{STORY_IMAGES_HTML}} ersetzt;
die related-grid wird durch 4 statische Demo-Empfehlungen ersetzt; die im JS hartkodierten
Story-Slug-Keys werden durch {{SLUG}} parametrisiert.

Die Slots sind in beiden Generationen formatgleich (vgl. migrate-to-new-shell.py) — bewiesen
dadurch, dass migrierte Seiten (z.B. magie) mit genau diesen Slots korrekt rendern.

Aufruf:  python scripts/build-generator-template.py [--check]
  --check : nur prüfen/diffen, nichts schreiben

WICHTIG: Nach jeder Regeneration von demo-template.html auch das Sachtext-Template
neu bauen:  python scripts/build-generator-template-sachtext.py
(Der Sachtext-Workflow lädt demo-template-sachtext.html — es ist ein Patch auf
demo-template.html und driftet sonst.)
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DONOR = REPO / "demo-texte" / "mein-erster-tag-auf-dem-flohmarkt-12e9.html"
OLD_TPL = REPO / "n8n-config" / "demo-template.html"
OUT = OLD_TPL
DONOR_SLUG = "mein-erster-tag-auf-dem-flohmarkt-12e9"

# Slots, die als Platzhalter-Version aus dem ALTEN Template übernommen werden
COPY_SLOTS = {
    "seo":    re.compile(r"<title>.*?</script>(?=\s*<style)", re.S),
    "herobg": re.compile(r'<img class="hero-bg"[^>]*>'),
    "title":  re.compile(r'<h1 id="main-title">.*?</h1>', re.S),
    "data":   re.compile(r"let rawStory = .*?window\.imagePositions = imagePositions;[^\n]*", re.S),
}
HEROIMGS_RX = re.compile(r'(?:[ \t]*<img[^>]*class="hero-image"[^>]*>\s*)+')
RELGRID_RX = re.compile(r'<div class="related-grid">.*?</div>', re.S)

# Statische Demo-Empfehlungen ("Mehr Bücher") — 4 vorhandene Neue-Shell-Geschichten.
# Später durch einen smarten Empfehlungs-Cache ersetzen.
DEMO_RECS = [
    ("magie-in-unserer-strasse-vgfx", "Magie in unserer Straße"),
    ("das-geheimnis-der-alten-buche-lkij", "Das Geheimnis der alten Buche"),
    ("die-reise-zum-singenden-mond-1xvu", "Die Reise zum singenden Mond"),
    ("der-junge-mit-dem-gelben-regenmantel-1lvp", "Der Junge mit dem gelben Regenmantel"),
]


def static_relgrid():
    cards = "".join(
        f'                <a class="related-card" href="{slug}.html">\n'
        f'                    <img class="related-thumb" src="../bilder/{slug}-1.png" alt="" '
        f'loading="lazy" onerror="this.style.display=\'none\'">\n'
        f'                    <span class="related-title">{title}</span>\n'
        f'                </a>\n'
        for slug, title in DEMO_RECS
    )
    return '<div class="related-grid">\n' + cards + "            </div>"


def build():
    donor = DONOR.read_text(encoding="utf-8")
    old = OLD_TPL.read_text(encoding="utf-8")

    # Platzhalter-Slots aus dem alten Template ziehen
    ph = {}
    for name, rx in COPY_SLOTS.items():
        m = rx.search(old)
        if not m:
            raise SystemExit(f"ABBRUCH: Slot '{name}' nicht im alten Template gefunden.")
        ph[name] = m.group(0)

    out = donor
    for name, rx in COPY_SLOTS.items():
        out, n = rx.subn(lambda mm, v=ph[name]: v, out, count=1)
        if n != 1:
            raise SystemExit(f"ABBRUCH: Donor-Slot '{name}': {n} Treffer (erwartet 1).")

    out, n = HEROIMGS_RX.subn(lambda mm: "{{STORY_IMAGES_HTML}}", out, count=1)
    if n != 1:
        raise SystemExit(f"ABBRUCH: hero-image-Slot: {n} Treffer (erwartet 1).")

    out, n = RELGRID_RX.subn(lambda mm: static_relgrid(), out, count=1)
    if n != 1:
        raise SystemExit(f"ABBRUCH: related-grid-Slot: {n} Treffer (erwartet 1).")

    # Story-Slug in JS-Storage-Keys parametrisieren
    cnt = out.count(DONOR_SLUG)
    out = out.replace(DONOR_SLUG, "{{SLUG}}")
    print(f"  Slug-Keys -> {{{{SLUG}}}}: {cnt} Ersetzungen")

    return out


def main() -> int:
    check = "--check" in sys.argv
    out = build()

    # Sanity-Checks
    # Sentinel doppelt-quotiert: faengt den Donor-Autor in Meta-/JSON-LD-Slots,
    # ohne die einfach-quotierten Persona-Konstanten in der Shell-JS (PERSONA_HOME_LEVEL) zu treffen.
    leaks = [t for t in ("flohmarkt", "12e9", '"Jonas Entdecker"') if t in out]
    placeholders = sorted(set(re.findall(r"\{\{[A-Z_]+\}\}", out)))
    new_shell = 'class="nav-center"' in out
    lucide_heart = "M2 9.5a5.5 5.5 0 0 1 9.591-3.676" in out
    print(f"  neue Shell (nav-center): {new_shell}")
    print(f"  Lucide-Herz vorhanden:   {lucide_heart}")
    print(f"  Platzhalter: {', '.join(placeholders)}")
    print(f"  related-cards: {out.count('class=\"related-card\"')}")
    print(f"  Leaks (flohmarkt/12e9/Jonas): {leaks or 'keine'}")

    if leaks or not new_shell or not lucide_heart:
        raise SystemExit("ABBRUCH: Sanity-Check fehlgeschlagen.")

    if check:
        print("--check: nichts geschrieben.")
        return 0
    OUT.write_text(out, encoding="utf-8")
    print(f"  geschrieben: {OUT.relative_to(REPO)}  ({len(out)} Zeichen)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
