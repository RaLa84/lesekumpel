#!/usr/bin/env python3
"""
Build and deploy the Lesekumpel Publish-Only workflow to n8n.

This workflow accepts a pre-written story via webhook and only does:
  image generation -> HTML assembly -> GitHub commit
"""

import json
import os
import sys
import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_PATH = os.path.join(SCRIPT_DIR, "workflow-source.json")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "workflow-publish.json")
ENV_PATH = os.path.join(SCRIPT_DIR, ".env")


def load_source():
    with open(SOURCE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_node(nodes, node_id):
    for n in nodes:
        if n["id"] == node_id:
            return n
    raise KeyError(f"Node '{node_id}' not found in source workflow")


def build_workflow(source):
    src_nodes = source["nodes"]

    # --- Extract source nodes we need ---
    src_image_loop = get_node(src_nodes, "image-loop")
    src_gen_image = get_node(src_nodes, "generate-image")
    src_extract_image = get_node(src_nodes, "extract-image")
    src_upload_image = get_node(src_nodes, "upload-image")
    src_limit = get_node(src_nodes, "limit-one")
    src_fetch_template = get_node(src_nodes, "fetch-template")
    src_assemble_html = get_node(src_nodes, "assemble-html")
    src_commit_html = get_node(src_nodes, "commit-html")

    # Extract persona/stufe/bildstil data from prepare-data
    src_prepare = get_node(src_nodes, "prepare-data")

    # ============================================================
    # Node 1: pub-webhook
    # ============================================================
    pub_webhook = {
        "parameters": {
            "path": "lesekumpel-publish",
            "responseMode": "lastNode",
            "httpMethod": "POST",
            "options": {}
        },
        "id": "pub-webhook",
        "name": "Webhook: Publish Story",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 2,
        "position": [260, 500],
        "webhookId": "pub-lesekumpel-publish-001"
    }

    # ============================================================
    # Node 2: pub-prepare  (Daten validieren)
    # ============================================================
    validate_code = r'''
const raw = $input.first().json;
const input = raw.body || raw;

// --- Required fields ---
const requiredFields = ['titel', 'slug', 'persona', 'geschichte', 'szenen'];
const missing = requiredFields.filter(f => !input[f]);
if (missing.length > 0) {
  throw new Error(`Fehlende Pflichtfelder: ${missing.join(', ')}`);
}

const titel = (input.titel || '').trim();
const slug = (input.slug || '').trim();
const persona = (input.persona || 'lea').trim().toLowerCase();
const personaName = (input.personaName || '').trim();
const neurotype = (input.neurotype || '').trim();
const stufe = (input.stufe || '3.4').trim();
const stufeLabel = (input.stufeLabel || '').trim();
const genre = (input.genre || 'Abenteuer').trim();
const bildstil = (input.bildstil || 'Aquarell').trim();
const geschichte = (input.geschichte || '').trim();
const zusammenfassung = (input.zusammenfassung || '').trim();
const quiz = input.quiz || [];
const wortschatz = input.wortschatz || [];
const tags = input.tags || [];
const szenen = input.szenen || [];
const charaktere = input.charaktere || [];

// --- Persona metadata ---
const personaMeta = {
  lea:    { name: 'Lea Lesestark',        neurotype: 'Neurotypisch',             imgUrl: 'https://rala84.github.io/lesekumpel/avatars/lea-lesestark.webp',          bio: 'Lea liebt Geschichten so sehr, dass sie am liebsten selbst in jedes Abenteuer hineinspringen würde!' },
  timo:   { name: 'Timo Taktschritt',     neurotype: 'LRS/Legasthenie',          imgUrl: 'https://rala84.github.io/lesekumpel/avatars/timo-taktschritt.webp',       bio: 'Timo liebt Musik und Geschichten — am liebsten beides zusammen! Seine Sätze haben einen Rhythmus, den du fast mitklatschen kannst.' },
  zara:   { name: 'Zara Zapp',            neurotype: 'ADHS',                     imgUrl: 'https://rala84.github.io/lesekumpel/avatars/zara-zapp.webp',              bio: 'Zara kann einfach nicht stillsitzen — und ihre Geschichten auch nicht! Bei ihr geht es sofort los: Action, Überraschungen und immer eine Wendung.' },
  leo:    { name: 'Leo Klartext',          neurotype: 'Autismus-Spektrum',        imgUrl: 'https://rala84.github.io/lesekumpel/avatars/leo-klartext.webp',           bio: 'Leo sagt immer genau das, was er meint. In seinen Geschichten weißt du immer, was passiert und warum.' },
  mia:    { name: 'Mia Brücke',           neurotype: 'Deutsch als Zweitsprache', imgUrl: 'https://rala84.github.io/lesekumpel/avatars/mia-bruecke.webp',            bio: 'Mia nimmt dich an die Hand und zeigt dir die Welt, als wäre alles ganz neu und aufregend.' },
  samira: { name: 'Samira Wissensfreund', neurotype: 'Autismus-Spektrum',        imgUrl: 'https://rala84.github.io/lesekumpel/avatars/samira-wissensfreund.webp',   bio: 'Samira liebt es, spannende Fakten zu entdecken und sie so zu erzählen, dass du staunst!' },
  holzi:  { name: 'Holzi Pixelkopf',      neurotype: 'ADHS',                     imgUrl: 'https://rala84.github.io/lesekumpel/avatars/holzi-pixelkopf.webp',        bio: 'Holzi ist der sympathische Chaot, der Gaming-Geschichten erzählt mit maximaler Action und minimaler Planung.' },
  deniz:  { name: 'Deniz Traumfänger',    neurotype: 'Neurotypisch',             imgUrl: 'https://rala84.github.io/lesekumpel/avatars/deniz-traumfaenger.webp',     bio: 'Deniz nimmt dich mit in magische Welten voller Atmosphäre und Gefühle.' },
  jonas:  { name: 'Jonas Entdecker',       neurotype: 'DaZ',                      imgUrl: 'https://rala84.github.io/lesekumpel/avatars/jonas-entdecker.webp',        bio: 'Jonas erzählt Alltagsabenteuer aus der Ich-Perspektive — ehrlich, lustig und immer zum Mitfühlen.' }
};

const p = personaMeta[persona] || personaMeta.lea;

// --- Map bildstil ---
const bildstilMap = {
  'Aquarell':   "children's book watercolor illustration, soft pastel colors, warm and friendly, white background, no text in image",
  'Cartoon':    "colorful cartoon illustration for children, bold outlines, bright vivid colors, fun and playful, digital art, no text in image",
  'Buntstift':  "colored pencil drawing, hand-drawn children's illustration, crayon texture, sketch-like, warm paper background, no text in image",
  'Pixel-Art':  "pixel art illustration for kids, retro gaming style, colorful blocky pixels, 16-bit aesthetic, cheerful, no text in image",
  'Anime':      "anime-style children's illustration, bright vibrant colors, cute big eyes, cel-shading, Nintendo/Pokémon inspired, cheerful, no text in image",
  'Traumwelt':  "dreamlike magical painting, glowing light effects, ethereal atmosphere, inspired by Ori and the Blind Forest, soft luminous colors, no text in image",
  'Knete':      "claymation stop-motion style, 3D clay figures, plasticine texture, handmade look, warm lighting, Aardman-inspired, no text in image",
  'Voxel':      "voxel art illustration, 3D blocky style, Minecraft-inspired, colorful cubes, isometric view, cheerful, no text in image"
};
const imageStyle = bildstilMap[bildstil] || bildstilMap['Aquarell'];

// --- Build characterReference ---
let charRef = '';
if (charaktere && charaktere.length > 0) {
  charRef = charaktere.map(c =>
    `${c.name}: ${c.beschreibung || c.description || ''}`
  ).join('. ');
}

// --- Calculate wordCount ---
const plainText = geschichte.replace(/-/g, ' ');
const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

const date = new Date().toISOString().split('T')[0];

return {
  json: {
    title: titel,
    slug,
    persona,
    personaName: personaName || p.name,
    neurotype: neurotype || p.neurotype,
    personaImg: p.imgUrl,
    personaBio: p.bio,
    stufe,
    stufeLabel,
    genre,
    imageStyle,
    imageCount: szenen.length,
    storyText: geschichte,
    summaryText: zusammenfassung,
    quizData: quiz,
    wortschatz,
    tags,
    szenen,
    charRef,
    wordCount,
    date
  }
};
'''

    pub_prepare = {
        "parameters": {
            "jsCode": validate_code.strip()
        },
        "id": "pub-prepare",
        "name": "Daten validieren",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [500, 500]
    }

    # ============================================================
    # Node 3: pub-scenes  (Szenen zu Items)
    # ============================================================
    scenes_code = r'''
const data = $('Daten validieren').first().json;
const szenen = data.szenen || [];
const charRef = data.charRef || '';
const imageStyle = data.imageStyle || '';

return szenen.map((scene, idx) => {
  const sceneIndex = scene.scene || (idx + 1);
  let finalPrompt = imageStyle + '. ';
  if (charRef) {
    finalPrompt += charRef + '. Scene: ';
  }
  finalPrompt += (scene.prompt || scene.bildprompt || '');

  return {
    json: {
      ...data,
      sceneIndex,
      imagePrompt: finalPrompt,
      imageFilename: data.slug + '-' + sceneIndex + '.png',
      imageGithubPath: 'bilder/' + data.slug + '-' + sceneIndex + '.png'
    }
  };
});
'''

    pub_scenes = {
        "parameters": {
            "jsCode": scenes_code.strip()
        },
        "id": "pub-scenes",
        "name": "Szenen zu Items",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [740, 500]
    }

    # ============================================================
    # Node 4: pub-img-loop  (Bild-Loop) — copy from source
    # ============================================================
    pub_img_loop = {
        "parameters": dict(src_image_loop["parameters"]),
        "id": "pub-img-loop",
        "name": "Bild-Loop",
        "type": src_image_loop["type"],
        "typeVersion": src_image_loop["typeVersion"],
        "position": [980, 500]
    }

    # ============================================================
    # Node 5: pub-gen-image  (Gemini: Bild generieren) — copy from source
    # ============================================================
    pub_gen_image = {
        "parameters": dict(src_gen_image["parameters"]),
        "id": "pub-gen-image",
        "name": "Gemini: Bild generieren",
        "type": src_gen_image["type"],
        "typeVersion": src_gen_image["typeVersion"],
        "position": [1220, 380],
        "retryOnFail": True,
        "credentials": dict(src_gen_image["credentials"])
    }

    # ============================================================
    # Node 6: pub-extract-img  (Bild-Daten extrahieren) — copy from source
    # ============================================================
    pub_extract_img = {
        "parameters": dict(src_extract_image["parameters"]),
        "id": "pub-extract-img",
        "name": "Bild-Daten extrahieren",
        "type": src_extract_image["type"],
        "typeVersion": src_extract_image["typeVersion"],
        "position": [1460, 380]
    }

    # ============================================================
    # Node 7: pub-upload-img  (GitHub: Bild hochladen) — copy from source
    # Updated expression references: 'Szenen parsen' -> 'Szenen zu Items'
    # 'Bild-Loop' stays the same (same name)
    # ============================================================
    upload_params = json.loads(json.dumps(src_upload_image["parameters"]))
    # Fix references
    for key in ["filePath", "commitMessage"]:
        if key in upload_params:
            upload_params[key] = upload_params[key].replace("Szenen parsen", "Szenen zu Items")

    pub_upload_img = {
        "parameters": upload_params,
        "id": "pub-upload-img",
        "name": "GitHub: Bild hochladen",
        "type": src_upload_image["type"],
        "typeVersion": src_upload_image["typeVersion"],
        "position": [1700, 380],
        "credentials": dict(src_upload_image["credentials"])
    }

    # ============================================================
    # Node 8: pub-limit  (Nur 1 Item) — copy from source
    # ============================================================
    pub_limit = {
        "parameters": dict(src_limit["parameters"]),
        "id": "pub-limit",
        "name": "Nur 1 Item",
        "type": src_limit["type"],
        "typeVersion": src_limit["typeVersion"],
        "position": [1220, 640]
    }

    # ============================================================
    # Node 9: pub-template  (GitHub: Template laden) — copy from source
    # ============================================================
    pub_template = {
        "parameters": json.loads(json.dumps(src_fetch_template["parameters"])),
        "id": "pub-template",
        "name": "GitHub: Template laden",
        "type": src_fetch_template["type"],
        "typeVersion": src_fetch_template["typeVersion"],
        "position": [1460, 640]
    }

    # ============================================================
    # Node 10: pub-assemble  (HTML assemblieren) — copy from source
    # Change data source from "$('Quiz parsen')" to "$('Daten validieren')"
    # ============================================================
    assemble_js = src_assemble_html["parameters"]["jsCode"]
    assemble_js = assemble_js.replace("$('Quiz parsen')", "$('Daten validieren')")

    pub_assemble = {
        "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": assemble_js
        },
        "id": "pub-assemble",
        "name": "HTML assemblieren",
        "type": src_assemble_html["type"],
        "typeVersion": src_assemble_html["typeVersion"],
        "position": [1700, 640]
    }

    # ============================================================
    # Node 11: pub-commit  (GitHub: HTML committen) — copy from source
    # ============================================================
    pub_commit = {
        "parameters": json.loads(json.dumps(src_commit_html["parameters"])),
        "id": "pub-commit",
        "name": "GitHub: HTML committen",
        "type": src_commit_html["type"],
        "typeVersion": src_commit_html["typeVersion"],
        "position": [1940, 640],
        "credentials": dict(src_commit_html["credentials"])
    }

    # ============================================================
    # Node 12: pub-result  (Ergebnis aufbauen)
    # ============================================================
    result_code = r'''
const data = $('HTML assemblieren').first().json;
return {
  json: {
    status: 'success',
    storyTitle: data.title,
    personaName: data.personaName,
    stufe: data.stufe,
    storyUrl: data.storyUrl,
    imageCount: data.imageCount
  }
};
'''

    pub_result = {
        "parameters": {
            "jsCode": result_code.strip()
        },
        "id": "pub-result",
        "name": "Ergebnis aufbauen",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [2180, 640]
    }

    # ============================================================
    # Build connections
    # ============================================================
    connections = {
        "Webhook: Publish Story": {
            "main": [[{"node": "Daten validieren", "type": "main", "index": 0}]]
        },
        "Daten validieren": {
            "main": [[{"node": "Szenen zu Items", "type": "main", "index": 0}]]
        },
        "Szenen zu Items": {
            "main": [[{"node": "Bild-Loop", "type": "main", "index": 0}]]
        },
        "Bild-Loop": {
            "main": [
                [{"node": "Nur 1 Item", "type": "main", "index": 0}],
                [{"node": "Gemini: Bild generieren", "type": "main", "index": 0}]
            ]
        },
        "Gemini: Bild generieren": {
            "main": [[{"node": "Bild-Daten extrahieren", "type": "main", "index": 0}]]
        },
        "Bild-Daten extrahieren": {
            "main": [[{"node": "GitHub: Bild hochladen", "type": "main", "index": 0}]]
        },
        "GitHub: Bild hochladen": {
            "main": [[{"node": "Bild-Loop", "type": "main", "index": 0}]]
        },
        "Nur 1 Item": {
            "main": [[{"node": "GitHub: Template laden", "type": "main", "index": 0}]]
        },
        "GitHub: Template laden": {
            "main": [[{"node": "HTML assemblieren", "type": "main", "index": 0}]]
        },
        "HTML assemblieren": {
            "main": [[{"node": "GitHub: HTML committen", "type": "main", "index": 0}]]
        },
        "GitHub: HTML committen": {
            "main": [[{"node": "Ergebnis aufbauen", "type": "main", "index": 0}]]
        }
    }

    # ============================================================
    # Assemble final workflow
    # ============================================================
    nodes = [
        pub_webhook, pub_prepare, pub_scenes, pub_img_loop,
        pub_gen_image, pub_extract_img, pub_upload_img,
        pub_limit, pub_template, pub_assemble, pub_commit, pub_result
    ]

    workflow = {
        "name": "Lesekumpel \u2013 Publish (Claude Pipeline)",
        "nodes": nodes,
        "connections": connections,
        "settings": {
            "executionOrder": "v1"
        }
    }

    return workflow


def load_api_key():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("N8N_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("N8N_API_KEY not found in .env")


def deploy_workflow(workflow_json, api_key):
    base_url = "https://rala84.app.n8n.cloud/api/v1"
    headers = {
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    # Create workflow
    print("Creating workflow...")
    resp = requests.post(
        f"{base_url}/workflows",
        headers=headers,
        json=workflow_json,
        timeout=30
    )
    if resp.status_code not in (200, 201):
        print(f"ERROR creating workflow: {resp.status_code}")
        print(resp.text)
        sys.exit(1)

    created = resp.json()
    wf_id = created["id"]
    print(f"Workflow created: ID = {wf_id}")

    # Activate workflow (POST /workflows/{id}/activate)
    print("Activating workflow...")
    resp2 = requests.post(
        f"{base_url}/workflows/{wf_id}/activate",
        headers=headers,
        timeout=15
    )
    if resp2.status_code not in (200, 201):
        print(f"ERROR activating: {resp2.status_code}")
        print(resp2.text)
        sys.exit(1)

    print(f"Workflow activated!")
    print(f"Workflow ID: {wf_id}")
    print(f"Webhook URL: https://rala84.app.n8n.cloud/webhook/lesekumpel-publish")

    return wf_id


def verify_workflow(wf_id, api_key):
    base_url = "https://rala84.app.n8n.cloud/api/v1"
    headers = {"X-N8N-API-KEY": api_key}

    print("\nVerifying workflow...")
    resp = requests.get(
        f"{base_url}/workflows/{wf_id}",
        headers=headers,
        timeout=15
    )
    if resp.status_code != 200:
        print(f"ERROR verifying: {resp.status_code}")
        print(resp.text)
        return

    data = resp.json()
    node_count = len(data.get("nodes", []))
    print(f"Workflow name: {data.get('name')}")
    print(f"Node count: {node_count} (expected: 12)")
    print(f"Active: {data.get('active')}")
    print(f"Webhook URL: https://rala84.app.n8n.cloud/webhook/lesekumpel-publish")

    if node_count != 12:
        print(f"WARNING: Expected 12 nodes but found {node_count}!")
    else:
        print("OK: Node count matches.")


def main():
    print("=== Lesekumpel Publish Workflow Builder ===\n")

    # Step 1: Load source
    print("Loading source workflow...")
    source = load_source()
    print(f"Source has {len(source['nodes'])} nodes")

    # Step 2: Build workflow
    print("\nBuilding publish workflow...")
    workflow = build_workflow(source)
    print(f"Built workflow with {len(workflow['nodes'])} nodes")

    # Save to file
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(workflow, f, ensure_ascii=False, indent=2)
    print(f"Saved to: {OUTPUT_PATH}")

    # Step 3: Deploy
    api_key = load_api_key()
    wf_id = deploy_workflow(workflow, api_key)

    # Step 4: Verify
    verify_workflow(wf_id, api_key)


if __name__ == "__main__":
    main()
