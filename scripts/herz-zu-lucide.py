#!/usr/bin/env python3
"""Stellt das Merk-/Like-Herz auf den Leseseiten vom Emoji (🤍/❤️) auf ein
flaches Lucide-Herz-SVG um — konsistent zur demo.html.

Drei Ersetzungen pro Datei:
  A) Markup/JS-Inject: ...aria-hidden="true">🤍</span>  ->  ...<svg lucide></svg>...
     (deckt beide Markup-Varianten + den injizierten .tafel-bookmark ab)
  B) render(): `h.textContent = liked ? '❤️' : '🤍'`  ->  entfernt
     (Fuellung kommt jetzt aus der .is-liked-Klasse via CSS)
  C) CSS: SVG-Groesse + Stroke + Fuellung im is-liked-Zustand ergaenzen
"""
import pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent

SVG = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
       'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
       '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5'
       'c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>')

HEART = "\U0001F90D"            # 🤍
HEART_RED = "❤️"      # ❤️

SPAN_OLD = 'aria-hidden="true">' + HEART + '</span>'
SPAN_NEW = 'aria-hidden="true">' + SVG + '</span>'

RENDER_OLD = "if (h) h.textContent = liked ? '" + HEART_RED + "' : '" + HEART + "';"
RENDER_NEW = "/* Fuellung kommt aus .is-liked (CSS) */"

CSS_OLD = ".hero-like-heart { font-size: 1.6rem; line-height: 1; display: inline-block; transition: transform 0.3s ease; }"
CSS_NEW = (CSS_OLD
           + "\n        .hero-like-heart svg, .like-heart svg { width: 26px; height: 26px; fill: none; stroke: #2B3140; stroke-width: 2; }"
           + "\n        .tafel-bookmark .like-heart svg { width: 30px; height: 30px; }"
           + "\n        .is-liked .hero-like-heart svg, .is-liked .like-heart svg { fill: #F97352; stroke: #F97352; }")

targets = []
for d in ("demo-texte", "comicgeschichten", "texte"):
    targets += sorted((REPO / d).glob("*.html"))
targets.append(REPO / "n8n-config" / "demo-template.html")

changed = 0
for p in targets:
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    if "like-heart" not in t:
        continue
    a = t.count(SPAN_OLD); t = t.replace(SPAN_OLD, SPAN_NEW)
    b = t.count(RENDER_OLD); t = t.replace(RENDER_OLD, RENDER_NEW)
    c = t.count(CSS_OLD); t = t.replace(CSS_OLD, CSS_NEW)
    # Aeltere Render-Variante: Init- und Klick-Setter neutralisieren
    # (laengste Form zuerst, damit `if (heart) ...` sauber ersetzt wird)
    d = 0
    for old in ("if (heart) heart.textContent = '" + HEART_RED + "';",
                "heart.textContent = '" + HEART_RED + "';",
                "heart.textContent = '" + HEART + "';"):
        d += t.count(old); t = t.replace(old, RENDER_NEW)
    remaining = t.count(HEART)
    rel = p.relative_to(REPO)
    if a or b or c or d:
        p.write_text(t, encoding="utf-8")
        changed += 1
        flag = "  (!) REST-EMOJI" if remaining else ""
        print(f"{rel}: span={a} render={b} css={c} txt={d} rest_emoji={remaining}{flag}")
    elif remaining:
        print(f"{rel}: KEINE Ersetzung, aber rest_emoji={remaining} -> PRUEFEN")

print(f"\n{changed} Dateien geaendert.")
