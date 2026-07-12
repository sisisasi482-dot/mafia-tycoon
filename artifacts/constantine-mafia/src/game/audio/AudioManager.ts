/**
 * Spatial 3D Audio Manager — procedural, pooled, zero external assets.
 *
 * Design mirrors the existing "Staged Loading" convention used by
 * `proximityStream.ts` / `buildingPool.ts`: expensive nodes are created once
 * and then only toggled/repositioned, never destroyed and recreated every
 * frame. Two node types exist:
 *
 *  - One-shots (gunfire, melee swings, recruit/dismiss chirps, footsteps):
 *    a small fixed-size POOL of PannerNode→GainNode chains per category is
 *    pre-created once. Playing a sound just grabs the next chain in the
 *    ring buffer and attaches a fresh (cheap) BufferSourceNode to it — the
 *    expensive Panner/Gain graph nodes are reused, exactly like the
 *    "pooled collider" / "mount once, toggle" pattern elsewhere in the
 *    engine.
 *  - Loops (vehicle engine, police siren): a single persistent
 *    Oscillator→Gain→Panner chain per loop id, created once and then only
 *    had its frequency/gain/position updated — never stopped and restarted
 *    every frame.
 *
 * All waveforms are synthesized at runtime (noise bursts / tone bursts) so
 * the audio system needs no media files and cannot break asset loading.
 */
import * as THREE from 'three';

export type AudioCategory = 'engine' | 'combat' | 'npc' | 'siren';

const POOL_SIZES: Record<AudioCategory, number> = {
  engine: 4,
  combat: 8,
  npc:    6,
  siren:  3,
};

interface VoiceChain {
  panner: PannerNode;
  gain:   GainNode;
}

interface LoopVoice {
  osc:     OscillatorNode;
  gain:    GainNode;
  panner:  PannerNode;
}

function setPannerPosition(panner: PannerNode, pos: readonly [number, number, number]) {
  const [x, y, z] = pos;
  if (panner.positionX) {
    panner.positionX.value = x;
    panner.positionY.value = y;
    panner.positionZ.value = z;
  } else if (typeof (panner as any).setPosition === 'function') {
    (panner as any).setPosition(x, y, z);
  }
}

/** Short decaying filtered-noise burst — used for gunfire, melee, footsteps. */
function noiseBurst(ctx: AudioContext, duration: number, brightness: number, amp: number): AudioBuffer {
  const sr  = ctx.sampleRate;
  const len = Math.max(1, Math.floor(sr * duration));
  const buffer = ctx.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);
  const alpha = THREE.MathUtils.clamp(brightness / sr, 0.02, 0.9);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t   = i / len;
    const env = Math.pow(1 - t, 3);
    const white = Math.random() * 2 - 1;
    prev = prev + alpha * (white - prev);
    data[i] = prev * env * amp;
  }
  return buffer;
}

/** Short decaying sine tone — used for UI-ish confirmation chirps (recruit/dismiss). */
function toneBurst(ctx: AudioContext, freq: number, duration: number, amp: number): AudioBuffer {
  const sr  = ctx.sampleRate;
  const len = Math.max(1, Math.floor(sr * duration));
  const buffer = ctx.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t   = i / sr;
    const env = Math.pow(1 - i / len, 2);
    data[i] = Math.sin(2 * Math.PI * freq * t) * env * amp;
  }
  return buffer;
}

const BUFFER_RECIPES: Record<string, () => [duration: number, brightness: number, amp: number] | null> = {};

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private pools: Record<AudioCategory, VoiceChain[]> = { engine: [], combat: [], npc: [], siren: [] };
  private ringIdx: Record<AudioCategory, number> = { engine: 0, combat: 0, npc: 0, siren: 0 };
  private buffers = new Map<string, AudioBuffer>();
  private loops = new Map<string, LoopVoice>();

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        this.ctx = THREE.AudioContext.getContext() as unknown as AudioContext;
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  private ensurePool(cat: AudioCategory, ctx: AudioContext) {
    const pool = this.pools[cat];
    while (pool.length < POOL_SIZES[cat]) {
      const panner = ctx.createPanner();
      panner.panningModel  = 'equalpower';
      panner.distanceModel = 'inverse';
      panner.refDistance   = 6;
      panner.maxDistance    = 140;
      panner.rolloffFactor = 1.1;
      const gain = ctx.createGain();
      gain.gain.value = 1;
      panner.connect(gain);
      gain.connect(ctx.destination);
      pool.push({ panner, gain });
    }
  }

  private getBuffer(ctx: AudioContext, key: string): AudioBuffer {
    const cached = this.buffers.get(key);
    if (cached) return cached;
    let buf: AudioBuffer;
    switch (key) {
      case 'gunshot_pistol':  buf = noiseBurst(ctx, 0.12, 5200, 0.75); break;
      case 'gunshot_shotgun': buf = noiseBurst(ctx, 0.24, 2600, 1.0);  break;
      case 'gunshot_smg':     buf = noiseBurst(ctx, 0.08, 6200, 0.55); break;
      case 'gunshot_rifle':   buf = noiseBurst(ctx, 0.16, 4200, 0.85); break;
      case 'melee_swing':     buf = noiseBurst(ctx, 0.18, 900,  0.4);  break;
      case 'footstep':        buf = noiseBurst(ctx, 0.06, 500,  0.22); break;
      case 'alarm':           buf = toneBurst(ctx, 920, 0.22, 0.5);    break;
      case 'recruit':         buf = toneBurst(ctx, 660, 0.14, 0.5);    break;
      case 'dismiss':         buf = toneBurst(ctx, 300, 0.16, 0.5);    break;
      case 'arrest':          buf = toneBurst(ctx, 180, 0.35, 0.55);   break;
      default:                buf = toneBurst(ctx, 440, 0.1, 0.4);
    }
    this.buffers.set(key, buf);
    return buf;
  }

  /** Fire-and-forget spatial sound. Reuses a pooled Panner/Gain chain — no per-call node graph churn. */
  playOneShot(category: AudioCategory, bufferKey: string, position: readonly [number, number, number], volume = 1) {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.ensurePool(category, ctx);
    const pool = this.pools[category];
    if (pool.length === 0) return;
    const idx = this.ringIdx[category];
    this.ringIdx[category] = (idx + 1) % pool.length;
    const chain = pool[idx];
    setPannerPosition(chain.panner, position);
    chain.gain.gain.value = volume;
    try {
      const src = ctx.createBufferSource();
      src.buffer = this.getBuffer(ctx, bufferKey);
      src.connect(chain.panner);
      src.start();
      // BufferSourceNode is cheap and single-use by spec — it's the Panner/Gain
      // pair (the expensive part) that's pooled and never rebuilt.
      src.onended = () => src.disconnect();
    } catch {
      /* audio context not ready yet — safe to ignore, next call will retry */
    }
  }

  /** Starts a persistent loop voice (engine/siren). No-op if already running. */
  startLoop(id: string, waveform: OscillatorType, baseFreq: number) {
    const ctx = this.getCtx();
    if (!ctx || this.loops.has(id)) return;
    const osc = ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = baseFreq;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const panner = ctx.createPanner();
    panner.panningModel  = 'equalpower';
    panner.distanceModel = 'inverse';
    panner.refDistance   = 8;
    panner.maxDistance    = 160;
    panner.rolloffFactor = 1;
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);
    try { osc.start(); } catch { /* already started */ }
    this.loops.set(id, { osc, gain, panner });
  }

  /** Updates an already-running loop's position/volume/pitch in place — never recreated. */
  updateLoop(id: string, position: readonly [number, number, number], gain: number, frequency: number) {
    const loop = this.loops.get(id);
    const ctx  = this.getCtx();
    if (!loop || !ctx) return;
    setPannerPosition(loop.panner, position);
    loop.gain.gain.setTargetAtTime(gain, ctx.currentTime, 0.12);
    loop.osc.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.15);
  }

  stopLoop(id: string) {
    const loop = this.loops.get(id);
    if (!loop) return;
    try {
      loop.gain.gain.setTargetAtTime(0, this.getCtx()?.currentTime ?? 0, 0.08);
      setTimeout(() => {
        try { loop.osc.stop(); } catch { /* already stopped */ }
        loop.osc.disconnect();
        loop.gain.disconnect();
        loop.panner.disconnect();
      }, 200);
    } finally {
      this.loops.delete(id);
    }
  }

  // ── Bar ambience — synthesized café jazz atmosphere ────────────────────────
  private barNodes: Array<OscillatorNode | GainNode> = [];
  private barRunning = false;

  /**
   * Starts a looping synthesized bar ambience: a soft Dm7 chord pad
   * (root + minor-third + fifth + minor-seventh) with slow vibrato.
   * Completely asset-free — uses the same AudioContext the rest of the
   * engine shares.
   */
  startBarAmbience() {
    if (this.barRunning) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    this.barRunning = true;

    const master = ctx.createGain();
    master.gain.value = 0.06; // very soft background level
    master.connect(ctx.destination);
    this.barNodes.push(master as unknown as OscillatorNode); // store for cleanup

    // Dm7 chord: D3(147 Hz), F3(175 Hz), A3(220 Hz), C4(262 Hz)
    const chord = [147, 175, 220, 262, 294, 349]; // extend with D4, F4
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Slow random vibrato per voice
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3 + i * 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.004;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const vGain = ctx.createGain();
      vGain.gain.value = 0.15 + (i < 2 ? 0.05 : 0);
      osc.connect(vGain);
      vGain.connect(master);

      try { osc.start(); lfo.start(); } catch { /* already started */ }
      this.barNodes.push(osc, lfo, vGain as unknown as OscillatorNode);
    });

    // Add subtle rhythmic pulse (soft kick-like thud every ~0.5 s)
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0;
    pulseGain.connect(master);
    const pulseOsc = ctx.createOscillator();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.value = 60;
    pulseOsc.connect(pulseGain);
    try { pulseOsc.start(); } catch { /**/ }

    let beat = 0;
    const schedulePulse = () => {
      if (!this.barRunning) return;
      const now = ctx.currentTime;
      pulseGain.gain.setValueAtTime(0.8, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      beat++;
      setTimeout(schedulePulse, beat % 4 === 0 ? 550 : 500);
    };
    schedulePulse();

    this.barNodes.push(pulseOsc, pulseGain as unknown as OscillatorNode);
  }

  stopBarAmbience() {
    if (!this.barRunning) return;
    this.barRunning = false;
    this.barNodes.forEach((n) => {
      try { (n as OscillatorNode).stop?.(); } catch { /* already stopped */ }
      try { n.disconnect(); } catch { /**/ }
    });
    this.barNodes = [];
  }

  /** Syncs the shared AudioListener to the active camera every frame. */
  updateListener(camera: THREE.Camera) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const listener = ctx.listener;
    const pos = camera.position;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const up  = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    if (listener.positionX) {
      listener.positionX.value = pos.x;
      listener.positionY.value = pos.y;
      listener.positionZ.value = pos.z;
      listener.forwardX.value = fwd.x;
      listener.forwardY.value = fwd.y;
      listener.forwardZ.value = fwd.z;
      listener.upX.value = up.x;
      listener.upY.value = up.y;
      listener.upZ.value = up.z;
    } else if (typeof (listener as any).setPosition === 'function') {
      (listener as any).setPosition(pos.x, pos.y, pos.z);
      (listener as any).setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
    }
  }
}

/** Singleton — shared across the whole game (Player, Vehicles, Police, GangFollowers, Bank). */
export const audioManager = new AudioManagerImpl();
