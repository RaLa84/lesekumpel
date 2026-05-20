#!/usr/bin/env node
// Generiert 8 charakterfreie Stilreferenzen via gpt-image-1
// und speichert sie als PNG in bilder/bildstil-vorschau/neutral/.
//
// Aufruf:
//   OPENAI_API_KEY=sk-... node n8n-config/scripts/generate-neutral-style-refs.js
//
// Idempotent: vorhandene Dateien werden uebersprungen (Force via --force).

const fs = require('node:fs');
const path = require('node:path');

const FORCE = process.argv.includes('--force');
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('OPENAI_API_KEY ist nicht gesetzt.');
  console.error('Aufruf: OPENAI_API_KEY=sk-... node n8n-config/scripts/generate-neutral-style-refs.js');
  process.exit(1);
}

const OUT_DIR = path.resolve(__dirname, '..', '..', 'bilder', 'bildstil-vorschau', 'neutral');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Stil-Anker (identisch zu n8n-config/daten-vorbereiten-v4.js Z.84-117) plus charakterfreie Subject-Klausel.
const NO_CHARACTERS_NEG = 'no people, no humans, no children, no faces, no animals, no creatures, no characters, no figures, no silhouettes of beings';

const STYLES = [
  {
    key: 'aquarell',
    filename: 'aquarell.png',
    positive: "traditional children's book watercolor illustration, hand-painted with warm cream paper texture filling the entire image, soft pastel palette, gentle wet-on-wet washes with visible bleeding edges, loose expressive brush strokes, soft painterly rendering, inspired by Beatrix Potter and Quentin Blake, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a sunlit summer meadow with wildflowers and clover, soft cloudy sky, gentle warm light, no people, no animals, no characters, no faces, pure landscape still life.",
    negative: "no text, no watermarks, no labels, no captions, no speech bubbles, no margin, no inner matte, no frame, no vignette, no extra limbs, no floating objects, no mixed art styles, no style drift, no photorealism"
  },
  {
    key: 'cartoon',
    filename: 'cartoon.png',
    positive: "modern children's cartoon illustration inspired by Bluey and Peppa Pig, bold black outlines of uniform stroke width, bright saturated flat colors with one soft tonal shadow per shape, simple rounded geometric shapes, playful composition, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: an open colorful toy chest with wooden blocks, balls, a wooden train and a kite, on a wooden floor, no plush animals, no characters with faces, pure object still life.",
    negative: "no text, no watermarks, no labels, no captions, no speech bubbles, no margin, no frame, no vignette, no extra limbs, no floating objects, no mixed art styles, no style drift, no gritty textures, no realistic shading, no photorealism"
  },
  {
    key: 'buntstift',
    filename: 'buntstift.png',
    positive: "colored pencil drawing with warm cream paper texture filling the entire image, visible pencil grain and diagonal hatching strokes, soft muted earthy palette, slightly sketchy outlines, hand-drawn children's illustration feel, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a single red apple with a green leaf resting on a wooden tabletop, a few colored pencils beside it, no people, no animals, no characters, pure still life.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no crayon texture, no digital smooth gradients, no vector look, no photorealism, no extra limbs, no floating objects, no mixed art styles, no style drift"
  },
  {
    key: 'pixel-art',
    filename: 'pixel-art.png',
    positive: "modern 32-bit style pixel art in the aesthetic of Game Boy Advance JRPGs such as Advance Wars and Fire Emblem, clearly defined dark outlines, rich but limited 32-color palette with subtle dithering for shading, uniform pixel density across the entire image, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: an isometric pixel-art meadow diorama with two trees, a few mushrooms, tall grass and a small winding stream, no characters, no creatures, no sprites of people or animals, pure landscape diorama.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no mixed pixel resolutions between regions, no smooth gradients, no anti-aliasing, no blurry edges, no 3D shading, no photorealism, no extra limbs, no floating objects, no style drift"
  },
  {
    key: 'anime',
    filename: 'anime.png',
    positive: "anime-style children's illustration inspired by Studio Ghibli, cel-shaded with one soft shadow layer, bright vibrant saturated colors, clean uniform line art with tapered ends, soft atmospheric perspective, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a cloud-filled sky over distant rolling mountains with a green meadow in the foreground, a single old tree on a hill, Studio Ghibli mood, no people, no animals, no characters.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no extra limbs, no floating objects, no mixed art styles, no style drift, no gritty shading, no sketchy outlines, no photorealism"
  },
  {
    key: 'traumwelt',
    filename: 'traumwelt.png',
    positive: "dreamlike magical digital painting, soft glowing volumetric light, ethereal misty atmosphere, luminous pastel palette with high contrast highlights, rim lighting on foliage, inspired by Ori and the Blind Forest and Studio Ghibli night scenes, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a misty forest clearing at night with a full moon between the trees and softly glowing floating light points drifting in the air, dewy grass, no people, no animals, no creatures, pure atmospheric landscape.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no harsh black outlines, no flat cartoon shading, no photorealism, no gritty realism, no extra limbs, no floating objects, no mixed art styles, no style drift"
  },
  {
    key: 'knete',
    filename: 'knete.png',
    positive: "claymation stop-motion photograph style inspired by Aardman Animations (Wallace and Gromit, Shaun the Sheep), 3D plasticine objects with visible fingerprints and clay thumbprint texture, slightly uneven handmade surfaces, warm three-point studio lighting casting soft shadows, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: a claymation red apple and a claymation green pear sitting on a claymation wooden tabletop, simple soft cloth in the background, warm studio light, no characters, no animals, pure still-life arrangement.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no 2D flat shading, no painted illustration look, no CGI plastic sheen, no photorealism, no extra limbs, no floating objects, no mixed art styles, no style drift"
  },
  {
    key: 'voxel',
    filename: 'voxel.png',
    positive: "low-poly voxel art illustration in the aesthetic of Crossy Road and Minecraft, 3D cube-based geometry with uniform voxel size, limited 16-color palette per material, consistent isometric 3/4 camera angle, soft ambient shading with a single directional light, full bleed composition extending to all four image edges, no inner framing, subjects and background reach every corner of the image, square 1:1 aspect ratio",
    subject: "Subject: an isometric voxel island diorama with a few trees, scattered rocks, a small blue lake and a winding sand path, no characters, no animals, no people, pure landscape voxel scene.",
    negative: "no text, no watermarks, no labels, no captions, no margin, no frame, no vignette, no smooth curved surfaces, no anti-aliasing, no photorealism, no detailed textures on voxels, no extra limbs, no floating objects, no mixed art styles, no style drift"
  }
];

function buildPrompt(style) {
  const negative = `${style.negative}, ${NO_CHARACTERS_NEG}`;
  return `${style.positive} . ${style.subject} | NEGATIVE: ${negative}`;
}

async function generateOne(style) {
  const filePath = path.join(OUT_DIR, style.filename);
  if (fs.existsSync(filePath) && !FORCE) {
    console.log(`[skip]  ${style.filename} existiert bereits (mit --force ueberschreiben)`);
    return { key: style.key, skipped: true };
  }

  const prompt = buildPrompt(style);
  console.log(`[gen ]  ${style.filename} ... (${prompt.length} chars)`);

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'low',
      moderation: 'low',
      n: 1
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API ${res.status} fuer ${style.key}: ${errText.slice(0, 500)}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`Keine b64_json-Daten fuer ${style.key}. Response: ${JSON.stringify(json).slice(0, 300)}`);
  }

  fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
  const size = fs.statSync(filePath).size;
  console.log(`[done]  ${style.filename} (${(size / 1024).toFixed(1)} kB)`);
  return { key: style.key, skipped: false, bytes: size, usage: json?.usage };
}

(async () => {
  console.log(`Output dir: ${OUT_DIR}`);
  console.log(`Force mode: ${FORCE ? 'ja' : 'nein'}`);
  console.log('');

  const results = [];
  for (const style of STYLES) {
    try {
      const r = await generateOne(style);
      results.push(r);
    } catch (err) {
      console.error(`[FAIL]  ${style.key}: ${err.message}`);
      results.push({ key: style.key, error: err.message });
    }
  }

  console.log('');
  console.log('Zusammenfassung:');
  for (const r of results) {
    if (r.error) console.log(`  ${r.key}: FEHLER (${r.error.slice(0, 100)})`);
    else if (r.skipped) console.log(`  ${r.key}: uebersprungen`);
    else console.log(`  ${r.key}: ok (${(r.bytes / 1024).toFixed(1)} kB)`);
  }

  const failed = results.filter(r => r.error).length;
  process.exit(failed > 0 ? 1 : 0);
})();
