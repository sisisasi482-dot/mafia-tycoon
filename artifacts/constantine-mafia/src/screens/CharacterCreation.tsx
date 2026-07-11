import React, { useState } from 'react';
import { Show, useClerk, useUser } from '@clerk/react';
import { useLocation } from 'wouter';
import { useGameStore } from '../game/useGameStore';
import { t } from '../game/constants';
import { motion } from 'framer-motion';
import { useLinkMyPlayer } from '@workspace/api-client-react';

export function CharacterCreation() {
  const store = useGameStore();
  const lang = store.language;
  const [username, setUsername] = useState('');
  const [height, setHeight] = useState(175);
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const linkMyPlayer = useLinkMyPlayer();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    // When signed in with Google, link/save this profile to the cloud so
    // progress persists across devices. Local save (useSaveSystem) always
    // continues to work as the primary, offline-first store.
    let clerkUserId: string | null = null;
    if (user) {
      try {
        await linkMyPlayer.mutateAsync({ data: { username: username.trim(), height } });
        clerkUserId = user.id;
      } catch (err) {
        console.error('Cloud save link failed, continuing with local save only', err);
      }
    }

    store.setPlayerState({
      username: username.trim(),
      height,
      clerkUserId,
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
                <label
                  htmlFor="height-input"
                  className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2"
                >
                  {t('height', lang)}
                </label>
                <input
                  id="height-input"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(120, Math.min(220, Number(e.target.value) || 0)))}
                  className="w-full bg-black/50 border-2 border-white/10 rounded-lg p-4 text-white text-xl focus:border-primary focus:outline-none transition-colors"
                  min={120}
                  max={220}
                />
              </div>

              {/* ── Google Sign-in — links progress to a cloud save via useSaveSystem ── */}
              <div className="pt-2 border-t border-white/10">
                <Show when="signed-in">
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <span className="text-sm text-gray-300 truncate">
                      {t('signed_in_as', lang)} <span className="text-white font-bold">{user?.primaryEmailAddress?.emailAddress ?? user?.fullName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => signOut({ redirectUrl: `${basePath || ''}/` })}
                      className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors shrink-0 ml-3"
                    >
                      {t('sign_out', lang)}
                    </button>
                  </div>
                </Show>
                <Show when="signed-out">
                  <button
                    type="button"
                    onClick={() => setLocation('/sign-in')}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold text-sm sm:text-base p-3.5 rounded-lg uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
                      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
                    </svg>
                    {t('sign_in_google', lang)}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">{t('cloud_save_hint', lang)}</p>
                </Show>
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
              disabled={!username.trim() || linkMyPlayer.isPending}
              className="w-full bg-primary text-black font-black text-lg sm:text-xl p-4 sm:p-5 rounded-lg uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('confirm', lang)}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
