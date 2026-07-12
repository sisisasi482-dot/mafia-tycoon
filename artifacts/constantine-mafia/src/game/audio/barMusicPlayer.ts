/**
 * Bar-only real-track music player.
 * Plays the actual MP3s in public/audio/ (shuffled, non-repeating until the
 * whole set has played, then reshuffled) in a continuous loop while the
 * player is inside the bar interior. Stops the instant they leave.
 *
 * Deliberately separate from AudioManager's synthesized SFX loops — this
 * is real recorded music via <audio>, not a WebAudio oscillator.
 */

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Real MP3 tracks that ship in public/audio/. */
const TRACKS = [
  'music.mp3',
  'music1.mp3',
  'music2.mp3',
  'music3.mp3',
  'music4.mp3',
].map((f) => `${basePath}/audio/${f}`);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class BarMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private queue: string[] = [];
  private running = false;

  private playNext = () => {
    if (!this.running) return;
    if (this.queue.length === 0) this.queue = shuffle(TRACKS);
    const next = this.queue.shift()!;
    if (!this.audio) return;
    this.audio.src = next;
    this.audio.play().catch(() => { /* autoplay blocked until first gesture — resumed by GameEngine's pointerdown/keydown unlock */ });
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.queue = shuffle(TRACKS);
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.volume = 0.45;
      this.audio.addEventListener('ended', this.playNext);
    }
    this.playNext();
  }

  stop() {
    if (!this.running && !this.audio) return;
    this.running = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
  }
}

/** Singleton — one bar music player for the whole game. */
export const barMusicPlayer = new BarMusicPlayer();
