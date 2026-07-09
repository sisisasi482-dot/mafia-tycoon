import React, { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../game/useGameStore';

/** Extract YouTube video ID from many URL formats */
function extractYtId(url: string): string | null {
  if (!url) return null;
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return short[1];
  // watch?v=ID
  const long = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (long) return long[1];
  // embed/ID
  const embed = url.match(/embed\/([A-Za-z0-9_-]{11})/);
  if (embed) return embed[1];
  return null;
}

export function RadioWidget() {
  const store   = useGameStore();
  const [input, setInput] = useState(store.radioUrl);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const videoId = extractYtId(store.radioUrl);

  const handlePlay = useCallback(() => {
    const id = extractYtId(input);
    if (!id) return;
    store.setPlayerState({ radioUrl: input });
    setPlaying(true);
  }, [input, store]);

  const handleStop = useCallback(() => {
    setPlaying(false);
    store.setPlayerState({ radioUrl: '' });
    setInput('');
  }, [store]);

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1`
    : null;

  if (!store.showRadio) return null;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                 bg-black/95 border border-white/20 rounded-2xl shadow-2xl p-5
                 w-80 max-w-[92vw] backdrop-blur-xl"
      style={{ pointerEvents: 'all' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📻</span>
          <span className="font-black text-white text-sm uppercase tracking-widest">Radio</span>
          {playing && (
            <span className="flex items-center gap-1 text-green-400 text-xs animate-pulse font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> LIVE
            </span>
          )}
        </div>
        <button
          onClick={() => store.setPlayerState({ showRadio: false })}
          className="text-gray-500 hover:text-white text-lg leading-none transition-colors"
        >✕</button>
      </div>

      {/* URL Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste YouTube URL…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2
                     text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary"
        />
        {playing ? (
          <button
            onClick={handleStop}
            className="px-3 py-2 bg-red-500/80 text-white font-bold rounded-lg text-xs hover:bg-red-500 transition-all"
          >■ Stop</button>
        ) : (
          <button
            onClick={handlePlay}
            disabled={!extractYtId(input)}
            className="px-3 py-2 bg-primary text-black font-bold rounded-lg text-xs
                       disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
          >▶ Play</button>
        )}
      </div>

      {/* YouTube iframe — hidden but audio plays */}
      {playing && embedUrl && (
        <div className="rounded-xl overflow-hidden mb-3 aspect-video">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full border-0"
            title="Radio"
          />
        </div>
      )}

      {/* Volume */}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">🔈</span>
        <input
          type="range"
          min={0}
          max={100}
          value={store.radioVolume}
          onChange={(e) => store.setPlayerState({ radioVolume: Number(e.target.value) })}
          className="flex-1 accent-primary h-1.5"
        />
        <span className="text-gray-400 text-xs w-8 text-right">{store.radioVolume}%</span>
        <span className="text-gray-400 text-sm">🔊</span>
      </div>

      {!playing && (
        <p className="text-gray-600 text-xs text-center mt-3">
          Paste a YouTube link and press Play to stream audio.
        </p>
      )}
    </div>
  );
}
