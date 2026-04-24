"""
Backfill: Hero-Cover (Blur + Titel-Overlay) auf bestehende Stories anwenden.

Betrifft Gen-A/B-Stories in texte/ und demo-texte/. Gen-C (alt, anderes Template)
wird uebersprungen. Idempotent: Dateien mit .story-hero-cover werden geskippt.

Usage:
    python n8n-config/scripts/backfill-hero-cover.py --dry-run
    python n8n-config/scripts/backfill-hero-cover.py --apply
    python n8n-config/scripts/backfill-hero-cover.py --apply --file demo-texte/die-gluehwuermchenwiese-1mzm.html
"""
import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

CSS_BLOCK = """        /* --- HERO COVER (Blur + Titel-Overlay) --- */
        .story-hero-cover {
            position: relative; width: 100%; aspect-ratio: 16 / 9;
            border-radius: 15px; overflow: hidden; margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.12); background: #f0ebd8;
        }
        .story-hero-cover .hero-bg {
            position: absolute; inset: 0; width: 100%; height: 100%;
            object-fit: cover; object-position: center center;
            filter: blur(14px) saturate(1.1) brightness(0.92);
            transform: scale(1.12); transform-origin: center;
        }
        .story-hero-cover .hero-overlay {
            position: absolute; inset: 0;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%);
        }
        .story-hero-cover .hero-title-box {
            position: absolute; inset: 0; display: flex;
            align-items: center; justify-content: center;
            padding: 24px 28px; text-align: center;
        }
        .story-hero-cover .hero-title-box #main-title {
            margin: 0; color: #fff; font-size: 2.6rem;
            text-shadow: 0 2px 8px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.4);
        }
        @media (max-width: 767px) {
            .story-hero-cover { aspect-ratio: 4 / 3; }
            .story-hero-cover .hero-title-box #main-title { font-size: 1.7rem; letter-spacing: 0.5px; }
            .story-hero-cover .hero-bg { filter: blur(10px) saturate(1.1) brightness(0.92); }
        }
        body.haeppchen-active .story-hero-cover { display: none; }

"""

NEW_COLLECT_IMAGES = """        // Bilder einsammeln: Alle .hero-image werden zu Inline-Bildern. Der Hero-Cover
        // oben (.story-hero-cover) ist eigenstaendig und bleibt unangetastet.
        (function collectImages() {
            document.querySelectorAll('.hero-image').forEach(img => {
                inlineImages.push(img.src);
                img.remove();
            });
        })();"""

# --- Regexes ---------------------------------------------------------------

# CSS-Einfuegestelle: direkt nach der .story-inline-img-Zeile
CSS_ANCHOR = re.compile(
    r"(        \.story-inline-img \{ width: 100%; border-radius: 15px; margin: 20px 0 10px 0; box-shadow: 0 5px 15px rgba\(0,0,0,0\.1\); \}\n)"
)

# HTML-Block: <div class="main-card"> + h1 + author-line + neurotype-hint + erstes <img class="hero-image">
HTML_BLOCK = re.compile(
    r'(    <div class="main-card">\n)'
    r'(        <h1 id="main-title">)(.*?)(</h1>\n)'
    r'(        <div class="author-line">\n'
    r'            <img src="[^"]+" alt="[^"]*" class="author-avatar">\n'
    r'            <span class="author-credit">geschrieben von [^<]+</span>\n'
    r'        </div>\n'
    r'        <div class="neurotype-hint">[^<]+</div>\n)'
    r'(        <img src="([^"]+)" alt="[^"]*" class="hero-image"[^>]*>\n)',
    re.DOTALL,
)

# JS collectImages — flexibel fuer alle bekannten Varianten.
# Anchor: optionaler fuehrender Kommentar + (function collectImages(){ ... allHeroImgs[i].remove(); } })();
# Lazy matched Mitte erfasst sowohl Variante A (mit if-block + push des ersten Bildes)
# als auch Variante B (ohne push des ersten Bildes, mit/ohne Mittel-Kommentaren).
COLLECT_ANY = re.compile(
    r'(?:        //[^\n]*Bilder einsammeln[^\n]*\n)?'
    r'        \(function collectImages\(\) \{\n'
    r'            const allHeroImgs = document\.querySelectorAll\(\'\.hero-image\'\);\n'
    r'(?:[^\n]*\n){1,12}?'
    r'            for \(let i = allHeroImgs\.length - 1; i >= 1; i--\) \{\n'
    r'                allHeroImgs\[i\]\.remove\(\);\n'
    r'            \}\n'
    r'        \}\)\(\);'
)


def rewrite(html: str) -> tuple[str, list[str]]:
    """Return (new_html, changes). changes lists applied transformations."""
    changes = []

    if ".story-hero-cover" in html:
        return html, ["SKIP: already has .story-hero-cover"]

    # Text-only Stories (kein Bild generiert) haben das Duplikat-Problem nicht — skippen.
    if 'class="hero-image"' not in html:
        return html, ["SKIP: text-only story (no hero-image)"]

    # 1) CSS einfuegen
    new_html, n_css = CSS_ANCHOR.subn(r"\1\n" + CSS_BLOCK, html, count=1)
    if n_css == 0:
        return html, ["SKIP: CSS anchor .story-inline-img not found (very old template)"]
    changes.append("css")

    # 2) HTML-Block ersetzen — author-line + neurotype-hint bleiben mit echten Werten erhalten
    m = HTML_BLOCK.search(new_html)
    if not m:
        return html, ["SKIP: HTML main-card block not found"]

    card_open = m.group(1)
    title = m.group(3)
    author_and_neuro = m.group(5)  # Original mit echten Werten
    img_line = m.group(6)
    img_url = m.group(7)

    replacement = (
        f'{card_open}'
        f'        <div class="story-hero-cover">\n'
        f'            <img class="hero-bg" src="{img_url}" alt="" aria-hidden="true" onerror="this.style.display=\'none\'">\n'
        f'            <div class="hero-overlay"></div>\n'
        f'            <div class="hero-title-box">\n'
        f'                <h1 id="main-title">{title}</h1>\n'
        f'            </div>\n'
        f'        </div>\n'
        f'{author_and_neuro}'
        f'{img_line}'
    )
    new_html = new_html[: m.start()] + replacement + new_html[m.end() :]
    changes.append("html")

    # 3) JS collectImages ersetzen
    new_html_js, n_js = COLLECT_ANY.subn(NEW_COLLECT_IMAGES, new_html, count=1)
    if n_js == 0:
        return html, ["SKIP: collectImages IIFE pattern not found"]
    new_html = new_html_js
    changes.append("js")

    return new_html, changes


def find_targets(file_filter: str | None = None) -> list[Path]:
    if file_filter:
        p = REPO_ROOT / file_filter
        return [p] if p.is_file() else []
    targets = []
    for sub in ("texte", "demo-texte"):
        targets.extend(sorted((REPO_ROOT / sub).glob("*.html")))
    return targets


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="show what would change, do not write")
    ap.add_argument("--apply", action="store_true", help="write changes to disk")
    ap.add_argument("--file", type=str, default=None, help="limit to a single file (relative path)")
    args = ap.parse_args()

    if not (args.dry_run or args.apply):
        ap.error("pass --dry-run or --apply")

    targets = find_targets(args.file)
    if not targets:
        print("no targets found")
        return 1

    stats = {"applied": 0, "skipped": 0, "errors": 0}
    for p in targets:
        try:
            original = p.read_text(encoding="utf-8")
        except Exception as e:
            print(f"ERR  read  {p.relative_to(REPO_ROOT)}: {e}")
            stats["errors"] += 1
            continue

        new, changes = rewrite(original)

        if new == original:
            print(f"skip  {p.relative_to(REPO_ROOT)}: {changes[0] if changes else 'no change'}")
            stats["skipped"] += 1
            continue

        if args.apply:
            p.write_text(new, encoding="utf-8")
            print(f"OK    {p.relative_to(REPO_ROOT)}: {'+'.join(changes)}")
        else:
            print(f"DRY   {p.relative_to(REPO_ROOT)}: {'+'.join(changes)}")
        stats["applied"] += 1

    print()
    print(f"done. applied={stats['applied']} skipped={stats['skipped']} errors={stats['errors']}")
    return 0 if stats["errors"] == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
