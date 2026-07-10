import React from 'react';
import { useGameStore } from '../game/useGameStore';
import loadingImage from '../assets/loading-screen.jpeg';

/**
 * Full-screen loading overlay shown on top of the (already-mounting)
 * GameEngine. The progress bar is wired to `mapLoadProgress`, which is
 * driven entirely by real engine milestones (see LoadingMilestones in
 * GameEngine.tsx) — never a fake timer.
 *
 * Because GameEngine mounts underneath this overlay the instant the player
 * confirms their name, the 3D scene is already live and rendering by the
 * time progress hits 100%; this component simply unmounts (App.tsx stops
 * rendering it once `mapReady` flips true), instantly revealing the map
 * that was already there — no black frame, no re-mount, no flash.
 */
export function LoadingScreen() {
  const progress = useGameStore((s) => s.mapLoadProgress);

  return (
    <div className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-end pb-20 overflow-hidden">
      <img
        src={loadingImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

      <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center gap-3">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em]">
          Loading City…
        </span>
        <progress
          value={progress}
          max={100}
          className="w-full h-2 [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-primary rounded-full overflow-hidden"
        />
        <span className="text-[11px] font-bold text-primary tabular-nums">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
