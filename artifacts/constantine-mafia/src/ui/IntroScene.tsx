/**
 * IntroScene — short, funny cutscene shown once after character creation,
 * before the loading overlay disappears. Plays automatically, skippable
 * at any time. Zero Three.js — pure DOM / CSS animation.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    emoji: '🌆',
    title: 'CONSTANTINE, ALGERIA',
    body: "A city carved into ancient rock, 300 metres above the gorge.\nBeautiful. Lawless. Absolutely mad.",
  },
  {
    emoji: '🚌',
    title: 'TODAY — 06:42, BUS STATION',
    body: "You arrived with 500 DA, one bag, and zero plan.\nThe bag contained three socks and a phone charger. No phone.",
  },
  {
    emoji: '🪪',
    title: 'A STRANGER IN A SUIT',
    body: 'At the exit, a man in a grey djellaba pressed an ID card into your hand.\n"Welcome to Constantine," he said. "Don\'t ask who made this."',
  },
  {
    emoji: '😐',
    title: 'YOU DIDN\'T ASK.',
    body: "Smart.",
  },
  {
    emoji: '🏙️',
    title: 'THE CITY IS YOURS',
    body: "More or less. Mostly less.\nThe gangs, the police, the property market — they all have opinions about that.",
  },
  {
    emoji: '🎯',
    title: 'YOUR STORY BEGINS NOW',
    body: "Try not to get arrested before lunch.",
  },
];

const SLIDE_DURATION_MS = 3800;

interface IntroSceneProps {
  onDone: () => void;
}

export function IntroScene({ onDone }: IntroSceneProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = () => {
    setSlideIndex((i) => {
      if (i + 1 >= SLIDES.length) {
        onDone();
        return i;
      }
      return i + 1;
    });
  };

  // Auto-advance timer
  useEffect(() => {
    timerRef.current = setTimeout(advance, SLIDE_DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [slideIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const slide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;

  return (
    <div
      className="absolute inset-0 z-[70] bg-black flex flex-col items-center justify-center px-8"
      onClick={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (isLast) { onDone(); } else { advance(); }
      }}
    >
      {/* Subtle scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }}
      />

      {/* Progress pips */}
      <div className="absolute top-8 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 rounded-full transition-all duration-500 ${
              i <= slideIndex ? 'bg-yellow-400 w-6' : 'bg-white/20 w-3'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slideIndex}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center text-center max-w-lg gap-5"
        >
          <span className="text-6xl select-none">{slide.emoji}</span>

          <h2 className="text-xs font-black uppercase tracking-[0.35em] text-yellow-400">
            {slide.title}
          </h2>

          <p
            className="text-base text-gray-300 leading-relaxed whitespace-pre-line font-light"
            style={{ fontFamily: '"Exo 2", sans-serif' }}
          >
            {slide.body}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Tap / click hint */}
      <div className="absolute bottom-10 flex flex-col items-center gap-3">
        {isLast ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDone(); }}
            className="px-8 py-3 bg-yellow-400 text-black font-black text-xs uppercase tracking-[0.25em] rounded hover:bg-yellow-300 transition-all"
          >
            Let's Go
          </button>
        ) : (
          <span className="text-[10px] text-gray-600 uppercase tracking-widest select-none">
            Tap anywhere to skip
          </span>
        )}
      </div>
    </div>
  );
}
