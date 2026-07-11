import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { t, CAREER_PATHS } from '../game/constants';
import { motion } from 'framer-motion';

export function CharacterCreation() {
  const store = useGameStore();
  const lang = store.language;
  const [username, setUsername] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    store.setPlayerState({
      username,
      screen: 'playing',
      money: 500,
      level: 1,
      xp: 0,
      health: 100,
      careerPath: 'street_thug',
      district: 'ali_mendjeli',
      playerPosition: [310, 1, 0], // City B (Modern Downtown) — see worldConstants.SPAWN_XZ
      mapLoadProgress: 0,
      mapReady: false,
    });
  };

  return (
    /*
     * h-full fills the parent's h-[100dvh] constraint from App.tsx.
     * overflow-y-auto makes THIS element the scroll viewport, bypassing
     * the parent's overflow-hidden.
     */
    <div className="h-full overflow-y-auto bg-[#050810] relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background decoration — absolute so it scrolls with content, always covers viewport */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-[150px]" />
      </div>

      {/*
       * min-h-full + flex items-center centres the card on large screens.
       * On small screens the card grows naturally and the outer div scrolls.
       */}
      <div className="min-h-full flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative z-10 flex flex-col"
        >
          {/* ── Scrollable body ── */}
          <div className="p-6 sm:p-10 pb-4 sm:pb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 uppercase tracking-tighter">
              {t('create_character', lang)}
            </h1>
            <p className="text-gray-400 mb-8 font-medium">
              {lang === 'ar'
                ? 'مرحباً بك في قسنطينة. اصنع اسمك.'
                : lang === 'fr'
                ? 'Bienvenue à Constantine. Faites-vous un nom.'
                : 'Welcome to Constantine. Make a name for yourself.'}
            </p>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="username-input"
                  className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2"
                >
                  {t('username', lang)}
                </label>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border-2 border-white/10 rounded-lg p-4 text-white text-xl focus:border-primary focus:outline-none transition-colors"
                  placeholder={lang === 'ar' ? 'مثال: ريدا_25' : 'e.g. Reda_25'}
                  maxLength={16}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {t('career_path', lang)}
                </label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-primary/20 border-2 border-primary rounded-xl p-4 cursor-pointer">
                    <div className="text-primary font-bold mb-1">{t('street_thug', lang)}</div>
                    <div className="text-xs text-primary/70">
                      {lang === 'ar' ? 'المستوى 1-4' : lang === 'fr' ? 'Niveau 1-4' : 'Level 1-4'}
                    </div>
                  </div>
                  <div className="bg-white/5 border-2 border-white/5 rounded-xl p-4 opacity-50 cursor-not-allowed">
                    <div className="text-white font-bold mb-1">{t('gangster', lang)}</div>
                    <div className="text-xs text-gray-500">
                      {lang === 'ar' ? 'يفتح في المستوى 5' : lang === 'fr' ? 'Débloque au niveau 5' : 'Unlocks at Level 5'}
                    </div>
                  </div>
                  <div className="bg-white/5 border-2 border-white/5 rounded-xl p-4 opacity-50 cursor-not-allowed">
                    <div className="text-white font-bold mb-1">{t('crime_boss', lang)}</div>
                    <div className="text-xs text-gray-500">
                      {lang === 'ar' ? 'يفتح في المستوى 10' : lang === 'fr' ? 'Débloque au niveau 10' : 'Unlocks at Level 10'}
                    </div>
                  </div>
                  <div className="bg-white/5 border-2 border-white/5 rounded-xl p-4 opacity-50 cursor-not-allowed">
                    <div className="text-white font-bold mb-1">{t('business_tycoon', lang)}</div>
                    <div className="text-xs text-gray-500">
                      {lang === 'ar' ? 'يفتح في المستوى 15' : lang === 'fr' ? 'Débloque au niveau 15' : 'Unlocks at Level 15'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/*
           * ── Confirm button — lives OUTSIDE the scrollable content, at the
           * bottom of the card. Because the card is flex-col, this section
           * always appears below the form content and is never hidden behind
           * a scroll boundary. A top border visually separates it.
           */}
          <form onSubmit={handleStart} className="px-6 sm:px-10 pb-6 sm:pb-10 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full bg-primary text-black font-black text-lg sm:text-xl p-4 sm:p-5 rounded-lg uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('start_game', lang)}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
