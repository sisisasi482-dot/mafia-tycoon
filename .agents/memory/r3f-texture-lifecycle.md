---
name: R3F texture lifecycle in JSX maps
description: How to safely create per-instance textures without leaking on re-render.
---

## Rule
Never call `tex.clone()` or construct `new THREE.CanvasTexture()` inside a `JSX.map()` callback. React may re-render at any time, creating new `THREE.Texture` objects with no disposal path.

**Why:** Three.js textures hold GPU memory. If you create them during render, each re-render allocates new GPU resources without freeing the old ones. This causes silent memory/VRAM leaks.

**How to apply:**
- Pre-create all textures (including per-item repeat settings) inside `useMemo`:
  ```ts
  const textures = useMemo(() =>
    ITEMS.map((item) => {
      const tex = makeTexture();
      tex.repeat.set(item.rx, item.ry);
      tex.needsUpdate = true;
      return tex;
    }), []);
  useEffect(() => () => textures.forEach(t => t.dispose()), [textures]);
  ```
- Pass the pre-created texture by index in JSX: `map={textures[i]}`
- This applies equally to `CanvasTexture`, cloned textures, and loaded textures.
