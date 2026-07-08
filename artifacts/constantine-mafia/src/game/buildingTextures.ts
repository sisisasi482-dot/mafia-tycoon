import * as THREE from 'three';

/** Deterministic pseudo-random from a float seed */
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = Math.sin(s) * 43758.5453123;
    return s - Math.floor(s);
  };
}

interface DistrictStyle {
  wallColors: string[];
  windowLit: string;
  windowDim: string;
  windowDark: string;
  litChance: number;
  /** extra surface details: 'concrete' | 'stone' | 'plaster' */
  surface: 'concrete' | 'stone' | 'plaster';
}

const STYLES: Record<string, DistrictStyle> = {
  ali_mendjeli: {
    wallColors: ['#3a3a4a', '#2e2e3e', '#404050', '#35354a'],
    windowLit:  '#ffd080',
    windowDim:  '#443322',
    windowDark: '#09090f',
    litChance:  0.48,
    surface:    'concrete',
  },
  centre_ville: {
    wallColors: ['#c4a44f', '#b8973d', '#d4b460', '#a89040'],
    windowLit:  '#fffae0',
    windowDim:  '#3a3010',
    windowDark: '#120e00',
    litChance:  0.58,
    surface:    'plaster',
  },
  old_city: {
    wallColors: ['#8b7355', '#7a6345', '#9e8465', '#6b5535'],
    windowLit:  '#ffaa66',
    windowDim:  '#331a0a',
    windowDark: '#0e0805',
    litChance:  0.38,
    surface:    'stone',
  },
  ain_mlila: {
    wallColors: ['#4a4040', '#383232', '#524848', '#403a3a'],
    windowLit:  '#ff7744',
    windowDim:  '#2a1008',
    windowDark: '#100404',
    litChance:  0.25,
    surface:    'concrete',
  },
};

/**
 * Paint subtle surface noise (concrete graininess / stone cracking / plaster mottling)
 */
function paintSurface(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  surface: DistrictStyle['surface'],
  rng: () => number,
) {
  if (surface === 'concrete') {
    // Random dark speckles
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.03 + rng() * 0.05})`;
      ctx.fillRect(rng() * W, rng() * H, 1 + rng() * 2, 1 + rng() * 2);
    }
    // Horizontal band lines (floor divisions)
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    const floors = Math.floor(4 + rng() * 4);
    for (let f = 1; f < floors; f++) {
      const y = Math.floor((H / floors) * f);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else if (surface === 'stone') {
    // Irregular masonry blocks
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    const blockH = 16 + rng() * 8;
    for (let y = 0; y < H; y += blockH) {
      const offset = Math.floor(rng() * 20);
      const bW = 24 + rng() * 16;
      for (let x = -offset; x < W; x += bW) {
        ctx.strokeRect(x, y, bW - 1, blockH - 1);
      }
    }
    // Slight colour variation patches
    for (let i = 0; i < 60; i++) {
      const alpha = 0.04 + rng() * 0.06;
      ctx.fillStyle = rng() > 0.5
        ? `rgba(255,220,160,${alpha})`
        : `rgba(0,0,0,${alpha})`;
      ctx.fillRect(rng() * W, rng() * H, 8 + rng() * 20, 8 + rng() * 20);
    }
  } else {
    // Plaster — smooth with faint vertical staining
    for (let i = 0; i < 12; i++) {
      const x = rng() * W;
      const grad = ctx.createLinearGradient(x, 0, x + 2, H);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.4 + rng() * 0.3, `rgba(0,0,0,${0.04 + rng() * 0.05})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 3 + rng() * 4, H);
    }
    // Light speckling
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.02 + rng() * 0.03})`;
      ctx.fillRect(rng() * W, rng() * H, 2, 2);
    }
  }
}

/**
 * Draw a grid of windows on the canvas context.
 */
function paintWindows(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  style: DistrictStyle,
  rng: () => number,
) {
  const cols    = 4;
  const rows    = 8;
  const winW    = 13;
  const winH    = 17;
  const padX    = (W - cols * winW) / (cols + 1);
  const padY    = (H - rows * winH) / (rows + 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.round(padX + c * (winW + padX));
      const y = Math.round(padY + r * (winH + padY));
      const v = rng();
      let fill: string;

      if (v < style.litChance) {
        fill = style.windowLit;
        // Soft glow halo behind lit windows
        const gx = x + winW / 2;
        const gy = y + winH / 2;
        const glow = ctx.createRadialGradient(gx, gy, 1, gx, gy, winW * 1.4);
        glow.addColorStop(0, style.windowLit + '55');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 6, y - 6, winW + 12, winH + 12);
      } else if (v < style.litChance + 0.15) {
        fill = style.windowDim;
      } else {
        fill = style.windowDark;
      }

      // Pane
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, winW, winH);

      // Cross divider
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + Math.round(winW / 2), y + 1);
      ctx.lineTo(x + Math.round(winW / 2), y + winH - 1);
      ctx.moveTo(x + 1, y + Math.round(winH / 2));
      ctx.lineTo(x + winW - 1, y + Math.round(winH / 2));
      ctx.stroke();

      // Window ledge shadow at bottom
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x, y + winH, winW, 2);
    }
  }
}

/** Generate one CanvasTexture for a given wall colour + district style. */
function makeTexture(wallColor: string, style: DistrictStyle, seed: number): THREE.CanvasTexture {
  const W = 128, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const rng = seededRand(seed);

  // Base wall colour
  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, W, H);

  // Surface detail layer
  paintSurface(ctx, W, H, style.surface, rng);

  // Windows
  paintWindows(ctx, W, H, style, rng);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // Each face gets one tile of the texture
  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Pre-generate a small pool of facade textures for every district.
 * Call this once inside a useMemo — textures are reused across all buildings.
 *
 * Returns: districtKey → array of 4 CanvasTexture variants
 */
export function generateBuildingTextures(): Record<string, THREE.CanvasTexture[]> {
  const out: Record<string, THREE.CanvasTexture[]> = {};
  for (const [key, style] of Object.entries(STYLES)) {
    out[key] = style.wallColors.map((color, i) =>
      makeTexture(color, style, (i + 1) * 17.3 + key.length * 5.1),
    );
  }
  return out;
}

/** Dispose all textures (call on unmount if needed). */
export function disposeBuildingTextures(pool: Record<string, THREE.CanvasTexture[]>) {
  for (const variants of Object.values(pool)) {
    for (const tex of variants) tex.dispose();
  }
}
