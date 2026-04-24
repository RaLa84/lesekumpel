"""Phase 1.3 — Weißer Rahmen um Bilder eliminieren.

Gemini 2.5 Flash Image ignoriert "edge-to-edge" und "no borders" teilweise.
Ersetze durch Print-Design-Terminologie ("full bleed", "no inner matte",
"no paper border"). Fix in drei Nodes:
1. prepare-data bildstilMap: Positive + Negative neu formuliert
2. agent-szenen Systemprompt: ASPECT RULE verschärft
3. prep-scenes sceneUserPrompt: compositionCheck-Slot hinzugefuegt
"""

import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "n8n-config" / "cache" / "current-workflow.json"
DST = ROOT / "n8n-config" / "cache" / "updated-workflow.json"

with SRC.open("r", encoding="utf-8") as f:
    wf = json.load(f)

assert wf["name"] == "Lesekumpel – Neuroinclusive Story Generator"
nodes = {n["id"]: n for n in wf["nodes"]}


# ─────────────────────────────────────────────────────────────
# 1. prepare-data bildstilMap — Full-Bleed Reformulierung
# ─────────────────────────────────────────────────────────────

NEW_BILDSTIL_BLOCK = '''const bildstilMap = {
  'Aquarell': {
    positive: "traditional children's book watercolor illustration, hand-painted with warm cream paper texture filling the entire image, soft pastel palette, gentle wet-on-wet washes with visible bleeding edges, loose expressive brush strokes, soft painterly rendering, inspired by Beatrix Potter and Quentin Blake, consistent palette and brush handling across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no hard black outlines, no digital vector look, no CGI, no 3D shading, no photorealism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Cartoon': {
    positive: "modern children's cartoon illustration inspired by Bluey and Peppa Pig, bold black outlines of uniform stroke width, bright saturated flat colors with one soft tonal shadow per shape, simple rounded geometric shapes, playful expressions, consistent outline weight and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no gritty textures, no realistic shading, no photorealism"
  },
  'Buntstift': {
    positive: "colored pencil drawing with warm cream paper texture filling the entire image, visible pencil grain and diagonal hatching strokes, soft muted earthy palette, slightly sketchy outlines, hand-drawn children's illustration feel, consistent stroke density and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no crayon texture, no digital smooth gradients, no vector look, no photorealism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Pixel-Art': {
    positive: "modern 32-bit style pixel art in the aesthetic of Game Boy Advance JRPGs such as Advance Wars and Fire Emblem, detailed character sprites with clearly defined dark outlines, rich but limited 32-color palette with subtle dithering for shading, uniform pixel density across the entire image, consistent sprite resolution and palette across all panels of this story, same character sprite silhouette and facial features in every panel, 3/4 front view or side view composition, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no mixed pixel resolutions between regions, no smooth gradients, no anti-aliasing, no blurry edges, no 3D shading, no photorealism, no high-res rendering, no extra limbs, no duplicate props, no floating objects, no style drift"
  },
  'Anime': {
    positive: "anime-style children's illustration inspired by Studio Ghibli and modern Pokémon anime, cel-shaded with one soft shadow layer, bright vibrant saturated colors, clean uniform line art with tapered ends, expressive large eyes with highlights, soft blushed cheeks, consistent line weight and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift, no gritty shading, no sketchy outlines, no photorealism"
  },
  'Traumwelt': {
    positive: "dreamlike magical digital painting, soft glowing volumetric light, ethereal misty atmosphere, luminous pastel palette with high contrast highlights, rim lighting on characters, inspired by Ori and the Blind Forest and Studio Ghibli night scenes, consistent luminosity and palette across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no harsh black outlines, no flat cartoon shading, no photorealism, no gritty realism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Knete': {
    positive: "claymation stop-motion photograph style inspired by Aardman Animations (Wallace and Gromit, Shaun the Sheep), 3D plasticine figures with visible fingerprints and clay thumbprint texture, slightly uneven handmade surfaces, warm three-point studio lighting casting soft shadows, consistent clay palette and lighting across all panels of this story, same character proportions and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no 2D flat shading, no painted illustration look, no CGI plastic sheen, no photorealism, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  },
  'Voxel': {
    positive: "low-poly voxel art illustration in the aesthetic of Crossy Road and Minecraft, 3D cube-based geometry with uniform voxel size, limited 16-color-per-character palette, consistent isometric 3/4 camera angle, soft ambient shading with a single directional light, consistent voxel size and palette across all panels of this story, same character voxel silhouette and facial features in every panel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    negative: "no text, no watermarks, no letterboxing, no black bars, no white margin, no cream margin, no paper border, no inner matte, no mat board, no illustration frame, no vignette, no aspect-ratio padding, no smooth curved surfaces, no anti-aliasing, no photorealism, no detailed textures on voxels, no extra limbs, no duplicate props, no floating objects, no mixed art styles, no style drift"
  }
};'''

pd_code = nodes["prepare-data"]["parameters"]["jsCode"]
OLD_MAP_START = "const bildstilMap = {"
s = pd_code.find(OLD_MAP_START)
assert s != -1, "bildstilMap start not found"
e = pd_code.find("};", s)
assert e != -1, "bildstilMap end not found"
new_pd_code = pd_code[:s] + NEW_BILDSTIL_BLOCK + pd_code[e + 2:]
nodes["prepare-data"]["parameters"]["jsCode"] = new_pd_code


# ─────────────────────────────────────────────────────────────
# 2. agent-szenen Systemprompt — ASPECT RULE verschärfen
# ─────────────────────────────────────────────────────────────

NEW_AGENT_SZENEN_SYS = (
    "You are a prompt compiler for a children's book illustrator. Your job is to fill slot templates.\n\n"
    "RULES — every scene MUST satisfy all 5 checks:\n"
    "1. Spatial relation is explicit (ON / NEXT-TO / BEHIND / IN-FRONT-OF / HELD-BY).\n"
    "2. Every named prop has a hand slot (left / right / both / none).\n"
    "3. Every person has an explicit age that matches the story.\n"
    "4. Only include people named in the story. Do not invent extra characters.\n"
    "5. Every named character who appears in the scene MUST wear the exact clothing colors and items specified in CHARACTER REFERENCE. Repeat the clothing description verbatim in the scene prompt.\n\n"
    "VARIATION RULE: change camera angle and setting between scenes. Keep character appearance identical (hair, clothing, skin, age, build) across all scenes of the same story.\n\n"
    "STYLE RULE: The art style prefix is identical verbatim across all scenes of the same story.\n\n"
    "ASPECT RULE: Every scene is a square 1:1 full-bleed composition — the artwork extends all the way to every image edge. Never describe white margins, paper borders, inner mattes, illustration frames, or vignettes. The subject and background must reach all four corners of the image.\n\n"
    "Output ONLY the JSON array, no markdown, no explanations."
)
nodes["agent-szenen"]["parameters"]["messages"]["messageValues"][0]["message"] = NEW_AGENT_SZENEN_SYS


# ─────────────────────────────────────────────────────────────
# 3. prep-scenes — compositionCheck-Slot zum Slot-Template
# ─────────────────────────────────────────────────────────────

pc = nodes["prep-scenes"]["parameters"]["jsCode"]
OLD_PHYSCHECK_LINE = '"physicalCheck": "<one English sentence asserting this scene satisfies every PHYSICAL RULE listed above>"\n}'
NEW_PHYSCHECK_LINE = '"physicalCheck": "<one English sentence asserting this scene satisfies every PHYSICAL RULE listed above>",\n  "compositionCheck": "<one English sentence asserting this scene is a full-bleed square 1:1 image with artwork reaching all four corners, no white margin, no inner matte>"\n}'
assert OLD_PHYSCHECK_LINE in pc, "physicalCheck line not found"
nodes["prep-scenes"]["parameters"]["jsCode"] = pc.replace(OLD_PHYSCHECK_LINE, NEW_PHYSCHECK_LINE)


DST.parent.mkdir(exist_ok=True, parents=True)
with DST.open("w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"OK — patched 3 nodes (prepare-data, agent-szenen, prep-scenes), written to {DST}")
