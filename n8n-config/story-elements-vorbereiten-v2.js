const d = $input.item.json;
const elementsUserPrompt = `Analyze this German children's story and extract ALL visual elements needed to illustrate it consistently and physically plausibly.

Output ONLY a JSON object (no markdown, no explanation):
{
  "characters": [
    {
      "name": "Character name",
      "type": "human | animal | creature | object",
      "role": "main | supporting",
      "species": "Required for animal/creature only — concrete species, e.g., 'European eagle owl', 'tabby cat'",
      "ageYears": 8,
      "body":    { "heightCategory": "child | teen | adult", "build": "slim | average | sturdy" },
      "hair":    { "color": "light brown", "style": "pigtails", "length": "shoulder-length" },
      "eyes":    { "color": "blue" },
      "skin":    { "tone": "fair" },
      "outfit":  {
        "top":         "yellow t-shirt with small rocket print on the front",
        "bottom":      "blue denim shorts ending above the knee",
        "footwear":    "white sneakers with red laces",
        "accessories": "none"
      },
      "fur":     { "color": "tabby brown with darker stripes", "pattern": "mackerel tabby" },
      "distinguishingFeatures": []
    }
  ],
  "props": [
    {
      "name": "Item name",
      "color": "metallic gold and red",
      "material": "glossy cardstock",
      "size": "trading-card size",
      "shape": "rectangular",
      "count": 1,
      "heldBy": "Character name or null",
      "heldIn": "left hand | right hand | both hands | none"
    }
  ],
  "setting": {
    "location":       "sunny sandy beach by the sea",
    "timeOfDay":      "midday",
    "weather":        "clear blue sky, gentle breeze",
    "lightDirection": "sunlight from upper right (shadows fall to lower left)"
  },
  "sceneRules": [
    "Each rule is ONE English sentence stating a GLOBAL INVARIANT valid in EVERY scene of the story (not a specific moment or action)."
  ]
}

Slot rules (MANDATORY):

CHARACTERS — common fields:
- "type" is REQUIRED with EXACTLY one of: "human", "animal", "creature", "object".
- "role" is REQUIRED ("main" or "supporting").
- "distinguishingFeatures" is an array of short English strings — empty array if none.

CHARACTERS — type="human":
- "ageYears" (integer), "body.heightCategory" ("child"|"teen"|"adult"), "body.build" are REQUIRED.
- "hair" (color, style, length), "eyes.color", "skin.tone" are REQUIRED.
- "outfit" is REQUIRED with ALL FOUR sub-slots filled (top, bottom, footwear, accessories).
  Each outfit slot describes one specific garment with color, fabric/material, distinctive detail.
  Use "none" only for accessories. Top/bottom/footwear must always describe a real garment.
- "species" and "fur" MUST be null.
- If the story does not mention an outfit detail, INVENT ONE concrete outfit and keep it consistent.

CHARACTERS — type="animal":
- "species" is REQUIRED (concrete real-world species).
- "fur" (color, pattern) is REQUIRED. For feathered animals use "fur" anyway and describe plumage there.
- "eyes.color" is REQUIRED. "body.build" describes anatomy (e.g., "small slim cat body").
- "outfit", "hair", "skin", "ageYears", "body.heightCategory" MUST be null.
- The animal is a REAL animal, not anthropomorphic. NEVER describe clothing or accessories.
- Exception: only if the story text EXPLICITLY says the animal wears clothes, then fill "outfit".

CHARACTERS — type="creature":
- "species" is REQUIRED (e.g., "dragon", "unicorn").
- Fill the slots that make sense for the creature; set others to null.
- "outfit" only if the creature wears garments in the story; otherwise null.

CHARACTERS — type="object":
- "ageYears", "body", "hair", "eyes", "skin", "outfit", "species", "fur" MUST be null.
- "distinguishingFeatures" describes material, color, shape, function in 1–3 short strings.

PROPS:
- "count" (integer) and "heldIn" REQUIRED.
- "color", "material", "size", "shape" REQUIRED — describe so two illustrators would draw the same object.
- "heldBy" is the character NAME holding the prop, or null if it sits in the setting.

SETTING:
- All four sub-slots ("location", "timeOfDay", "weather", "lightDirection") REQUIRED.
- "lightDirection" describes WHERE light comes from so shadow direction stays consistent across scenes.

SCENE RULES:
- 2–4 GLOBAL INVARIANTS only. Do NOT include moment-specific actions or positions.
- MUST always include: "Only the characters named in the story appear; do not invent extra people or animals."
- MUST always include: "Each named character appears at most once per image."
- For paired / count-specific props add an invariant fixing counts and hand assignment.

CONSISTENCY:
- If the story does not mention a visual detail, INVENT a plausible value and keep it consistent.
- Once invented, treat it as fixed canon — do not vary it between fields.

Story:
${d.storyText}`;
return { json: { ...d, elementsUserPrompt } };
