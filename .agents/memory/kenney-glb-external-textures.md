---
name: Kenney GLB external texture sync
description: Kenney-style low-poly GLB kits reference an external "Textures/colormap.png" inside the glTF JSON instead of embedding the texture. If that subfolder isn't copied alongside the .glb files into the served public/ directory, three.js logs "GLTFLoader: Couldn't load texture" and models render untextured.
---

Each Kenney kit (buildings, vehicles, characters, etc.) usually ships its own distinct `colormap.png` (same filename, different palette, often same resolution e.g. 512x512) — they are not interchangeable between kits even though they share a name.

**Why:** the game's asset pipeline mirrors a root-level `assest/<set>/` folder into `artifacts/<web-app>/public/<set>/` for Vite to serve at `${BASE_URL}<set>/<model>.glb`. Copying only the `.glb` files (not the sibling `Textures/colormap.png`) silently breaks materials — the model still loads and renders, just without color.

**How to apply:** when adding/updating a Kenney glb set, always check whether its `.glb` files reference `images: [{ uri: "Textures/colormap.png" }]` (search the raw glTF JSON bytes for `colormap.png`), and if so copy/sync that exact texture file into `public/<set>/Textures/colormap.png`. Verify by hash — don't assume a texture from a different kit is a safe substitute unless the original is genuinely missing from the project's uploaded assets.
