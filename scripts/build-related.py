"""Füllt die "Mehr Bücher"-Empfehlungen (related-grid) der Neue-Shell-Story-Seiten.

Pool = die Neue-Shell-Seiten (Marker: nav-center). Für jede Zielseite werden 4 Empfehlungen
gewählt: die nach Lesestufen-Nähe (untere Wortzahl-Grenze) nächsten anderen Pool-Seiten
(sich selbst ausschließen, Tiebreak: Slug). Karten werden in <div class="related-grid">…</div>
eingesetzt (Donor-Format). Idempotent (ersetzt vorhandenen Inhalt). Defekte Thumbs blenden
sich per onerror selbst aus.

Aufruf:
  python scripts/build-related.py                # alle Neue-Shell-Seiten füllen
  python scripts/build-related.py demo-texte/x.html [...]   # nur diese Ziele
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEMO = REPO / "demo-texte"
NEW_SHELL_MARKER = 'class="nav-center"'
N_RECS = 4

RELGRID_RE = re.compile(r'(<div class="related-grid">)(.*?)(</div>)', re.S)


def _meta(html, prop_attr):
    m = re.search(prop_attr, html)
    return m.group(1).strip() if m else ""


def page_info(path: Path):
    html = path.read_text(encoding="utf-8")
    title = _meta(html, r'<meta property="og:title" content="([^"]*)"') or \
            _meta(html, r'<h1 id="main-title">([^<]*)</h1>')
    rl = _meta(html, r'<meta name="reading-level" content="([^"]*)"')  # z.B. "100–200 Wörter, Autor"
    band = rl.split(",")[0]
    nums = re.findall(r"\d+", band)
    level = int(nums[0]) if nums else 999
    return {"slug": path.stem, "title": title, "level": level}


def card(p):
    return (f'                <a class="related-card" href="{p["slug"]}.html">\n'
            f'                    <img class="related-thumb" src="../bilder/{p["slug"]}-1.png" alt="" '
            f'loading="lazy" onerror="this.style.display=\'none\'">\n'
            f'                    <span class="related-title">{p["title"]}</span>\n'
            f'                </a>\n')


def main() -> int:
    # Pool: alle Neue-Shell-Seiten
    pool = []
    for p in sorted(DEMO.glob("*.html")):
        if NEW_SHELL_MARKER in p.read_text(encoding="utf-8"):
            pool.append(page_info(p))
    if not pool:
        print("Kein Pool (keine Neue-Shell-Seiten gefunden).")
        return 1
    print(f"Pool: {len(pool)} Neue-Shell-Seiten")

    # Ziele
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    targets = [Path(a) if Path(a).is_absolute() else REPO / a for a in args] or \
              [DEMO / f"{p['slug']}.html" for p in pool]

    for path in targets:
        if not path.exists():
            print(f"  [missing] {path.name}"); continue
        html = path.read_text(encoding="utf-8")
        if NEW_SHELL_MARKER not in html:
            print(f"  [skip] {path.name}: keine neue Shell"); continue
        me = page_info(path)
        others = [p for p in pool if p["slug"] != me["slug"]]
        others.sort(key=lambda p: (abs(p["level"] - me["level"]), p["slug"]))
        # nach Titel deduplizieren (es gibt Story-Dubletten, z.B. zwei Flohmarkt-/Holzi-Versionen)
        recs, seen_titles = [], {me["title"]}
        for p in others:
            if p["title"] in seen_titles:
                continue
            seen_titles.add(p["title"])
            recs.append(p)
            if len(recs) >= N_RECS:
                break
        cards = "".join(card(p) for p in recs)
        new, n = RELGRID_RE.subn(lambda m: m.group(1) + "\n" + cards + "            " + m.group(3), html, count=1)
        if n != 1:
            print(f"  [skip] {path.name}: related-grid nicht gefunden ({n})"); continue
        path.write_text(new, encoding="utf-8")
        print(f"  [ok] {path.name}: {', '.join(r['slug'] for r in recs)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
