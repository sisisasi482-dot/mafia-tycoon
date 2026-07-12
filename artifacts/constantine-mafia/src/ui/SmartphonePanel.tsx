/**
 * SmartphonePanel — overlay shown when the player opens their smartphone.
 * Tabs: Contacts · Dating · Missions · Journal
 *
 * The player must have 'smartphone' in their inventory to open this panel.
 * Opened via keyboard shortcut N (see GameEngine.tsx key handler) or the
 * HUD phone icon.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/useGameStore';

type PhoneTab = 'contacts' | 'dating' | 'missions' | 'journal';

// ── Static contacts ────────────────────────────────────────────────────────────

interface Contact {
  id:     string;
  name:   string;
  role:   string;
  icon:   string;
  lastMsg:string;
  unread: boolean;
}

const STATIC_CONTACTS: Contact[] = [
  { id: 'c-boss',     name: 'The Boss',       role: 'Gang leader',         icon: '🤵', lastMsg: 'Don\'t call me on this number.',          unread: false },
  { id: 'c-lawyer',  name: 'Maître Khelil',  role: 'Criminal lawyer',     icon: '⚖️', lastMsg: 'Call me if you get arrested. Reasonable rates.', unread: false },
  { id: 'c-dealer',  name: 'The Chemist',    role: 'Street supplier',     icon: '🧪', lastMsg: 'New stock arrived. Come by tonight.',    unread: true  },
  { id: 'c-fixer',   name: 'Nadir',          role: 'Fixer / intel',       icon: '🕵️', lastMsg: 'I have information that could interest you.', unread: true  },
  { id: 'c-mechanic',name: 'Mourad Garage',  role: 'Vehicle repairs',     icon: '🔧', lastMsg: 'Your car is ready.',                     unread: false },
  { id: 'c-dispatch', name: 'Bus Dispatch',  role: 'Job — Bus Driver',    icon: '🚌', lastMsg: 'Route 7 is available. 1,500 DA/hr.',     unread: false },
  { id: 'c-taxi',    name: 'Taxi Company',   role: 'Job — Taxi Driver',   icon: '🚕', lastMsg: 'New shift starts at 08:00.',             unread: false },
  { id: 'c-farm',    name: 'Farm Manager',   role: 'Job — Farmer',       icon: '🌾', lastMsg: 'Harvest week — double pay.',             unread: false },
];

// ── Dating profiles ────────────────────────────────────────────────────────────

interface DatingProfile {
  id:      string;
  name:    string;
  age:     number;
  job:     string;
  bio:     string;
  emoji:   string;
  replies: { prompt: string; response: string }[];
}

const DATING_PROFILES: DatingProfile[] = [
  {
    id:    'rania',
    name:  'Rania',
    age:   24,
    job:   'Pharmacist',
    emoji: '👩‍⚕️',
    bio:   'Constantine native. I love the gorge views and traditional coffee. Looking for someone real, not just ambitious.',
    replies: [
      { prompt: 'I love your city', response: 'It has its problems, but there is nowhere like it. The bridges, the light at dusk…' },
      { prompt: 'What do you do for fun?', response: 'Walk along the gorge, read, visit the Museum of Cirta. Simple things.' },
      { prompt: 'Want to meet?', response: 'Maybe. Café Cirta, Thursday evening. Don\'t be late.' },
    ],
  },
  {
    id:    'yasmine',
    name:  'Yasmine',
    age:   27,
    job:   'University lecturer — Literature',
    emoji: '👩‍🏫',
    bio:   'I teach Camus and Kateb Yacine. Interested in men who actually read books. Not holding my breath.',
    replies: [
      { prompt: 'Do you like Camus?', response: 'Of course. "In the midst of winter, I found there was an invincible summer." Do you understand that line?' },
      { prompt: 'You seem interesting', response: 'I am. The question is whether you are.' },
      { prompt: 'Can we talk more?', response: 'Text me something intelligent first. Surprise me.' },
    ],
  },
  {
    id:    'salima',
    name:  'Salima',
    age:   22,
    job:   'Fashion student',
    emoji: '👩‍🎨',
    bio:   'Ali Mendjeli born, Constantine soul. Fashion design student. I sketch what I see — the streets, the rooftops, the people.',
    replies: [
      { prompt: 'I like your style', response: 'Ha — most people here dress like it\'s still 2005. Thank you.' },
      { prompt: 'Show me your sketches?', response: 'Maybe someday. They\'re personal. But… come find me at the café.' },
      { prompt: 'What inspires you?', response: 'Constantine itself. The way the light breaks through the gorge in the morning. It\'s cinematic.' },
    ],
  },
];

// ── Journal entries ────────────────────────────────────────────────────────────

const JOURNAL_ENTRIES = [
  { date: 'Day 1',  text: 'Arrived in Constantine with nothing but 500 DA and a name. Everyone here owes someone something.' },
  { date: 'Day 3',  text: 'Made first contact with the gang. They gave me a small job — deliver a package, ask no questions. I asked no questions.' },
  { date: 'Day 7',  text: 'Ran my first checkpoint. The police aren\'t stupid — they know what the city looks like. But they also know whose pocket they\'re in.' },
  { date: 'Day 12', text: 'Took a drive across the highway at night. The industrial corridor smells like diesel and money. The kind of money that doesn\'t wash off.' },
  { date: 'Day 18', text: 'Someone\'s been asking about me. A fixer named Nadir. Whether that\'s good news or bad — I\'ll know soon.' },
];

// ── Chat view ──────────────────────────────────────────────────────────────────

function ChatView({ profile, onBack }: { profile: DatingProfile; onBack: () => void }) {
  const store   = useGameStore();
  const rel     = store.relationships?.[profile.id];
  const relLevel = rel?.level ?? 0;
  const relStatus = rel?.status ?? 'none';
  const [messages, setMessages] = useState<{ mine: boolean; text: string }[]>([
    { mine: false, text: profile.bio },
  ]);
  const [proposeResult, setProposeResult] = useState<string | null>(null);

  const sendMessage = (prompt: string, response: string) => {
    store.progressRelationship(profile.id, 12);
    setMessages((prev) => [
      ...prev,
      { mine: true,  text: prompt   },
      { mine: false, text: response },
    ]);
  };

  const handlePropose = () => {
    const accepted = store.proposeMarriage(profile.id);
    if (accepted) {
      setProposeResult(`💍 ${profile.name} said yes! You are now married.`);
      setMessages((prev) => [...prev, { mine: false, text: `${profile.name}: Yes… yes! I can't believe it. Of course I'll marry you.` }]);
    } else {
      const reason = !store.ownedAssetIds.some((id) => id.startsWith('house_') || id === 'safehouse_cv')
        ? 'Get a home first — I am not living in the streets.'
        : relLevel < 80
        ? 'We barely know each other! Ask me again when we are closer.'
        : 'I am already taken.';
      setProposeResult(null);
      setMessages((prev) => [...prev, { mine: false, text: `${profile.name}: ${reason}` }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/10">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-xl">←</button>
        <span className="text-2xl">{profile.emoji}</span>
        <div>
          <div className="font-bold text-white">{profile.name}</div>
          <div className="text-[10px] text-gray-500">{profile.job} · {profile.age}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
            m.mine
              ? 'self-end bg-primary text-black font-medium'
              : 'self-start bg-white/10 text-gray-200'
          }`}>{m.text}</div>
        ))}
      </div>

      {/* Relationship status bar */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between text-[9px] text-gray-500 mb-1">
          <span>Relationship</span>
          <span className="text-primary font-bold capitalize">{relStatus} · {relLevel}/100</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${relLevel}%` }} />
        </div>
      </div>

      {/* Propose marriage button */}
      {relLevel >= 80 && relStatus !== 'married' && !store.spouseId && (
        <button
          onClick={handlePropose}
          className="w-full py-2 text-xs font-bold rounded-lg border border-yellow-400/60 text-yellow-400 hover:bg-yellow-400/10 transition-all mb-2 shrink-0"
        >
          💍 Propose Marriage
        </button>
      )}
      {relStatus === 'married' && (
        <div className="text-center text-xs text-yellow-400 font-bold mb-2 shrink-0">💍 Married</div>
      )}
      {proposeResult && (
        <div className="text-center text-xs text-green-400 mb-2 shrink-0">{proposeResult}</div>
      )}

      {/* Quick-reply prompts */}
      <div className="flex flex-col gap-1.5 shrink-0">
        {profile.replies.map((r, i) => (
          <button
            key={i}
            onClick={() => sendMessage(r.prompt, r.response)}
            className="text-left text-xs px-3 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all"
          >
            "{r.prompt}"
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SmartphonePanel() {
  const store       = useGameStore();
  const [tab, setTab] = useState<PhoneTab>('contacts');
  const [chatWith, setChatWith] = useState<DatingProfile | null>(null);

  const hasPhone = (store.inventory['smartphone'] ?? 0) > 0;

  if (!store.showSmartphone || !hasPhone) return null;

  const TABS: { id: PhoneTab; label: string; icon: string }[] = [
    { id: 'contacts', label: 'Contacts',  icon: '📋' },
    { id: 'dating',   label: 'Dating',    icon: '💘' },
    { id: 'missions', label: 'Missions',  icon: '🎯' },
    { id: 'journal',  label: 'Journal',   icon: '📓' },
  ];

  const activeM = store.currentMissionId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.22 }}
        className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-all"
          onClick={() => store.setPlayerState({ showSmartphone: false })}
        />

        {/* Phone shell */}
        <div
          className="relative pointer-events-all w-[320px] h-[580px] rounded-[2.5rem] overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(180deg, #0a0c14 0%, #060810 100%)',
            border: '2px solid rgba(255,255,255,0.12)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
            <span className="text-[10px] text-gray-400 font-mono">09:41</span>
            <div className="w-16 h-4 bg-black rounded-full border border-white/10" /> {/* notch */}
            <div className="flex gap-1 items-center">
              <span className="text-[10px] text-gray-400">●●●</span>
              <span className="text-[9px] text-primary">📶</span>
            </div>
          </div>

          {/* Wallpaper title bar + close button */}
          <div className="flex items-center justify-between px-5 pb-3 shrink-0">
            <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold">Constantine Mafia</p>
            <button
              onClick={() => store.setPlayerState({ showSmartphone: false, isPaused: false })}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-gray-400 hover:text-white transition-all text-sm leading-none"
              aria-label="Close phone"
            >
              ✕
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-white/8 shrink-0 mx-3 mb-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setChatWith(null); }}
                className={`flex-1 py-2 text-center transition-all ${
                  tab === t.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                <div className="text-base">{t.icon}</div>
                <div className="text-[8px] font-bold tracking-wide">{t.label}</div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">

            {/* ── Contacts ── */}
            {tab === 'contacts' && (
              <div className="flex flex-col gap-1.5">
                {STATIC_CONTACTS.map((c) => {
                  // Bind each contact to the relevant useGameStore action.
                  const handleContactTap = () => {
                    if (c.id === 'c-boss') {
                      // The Boss → open the Missions panel
                      store.setPlayerState({ showSmartphone: false, isPaused: true, activePanel: 'missions' });
                    } else if (c.id === 'c-dealer') {
                      // The Chemist → open Shop at consumables tab
                      store.setPlayerState({ showSmartphone: false, isPaused: true, activePanel: 'shop', shopNpcTab: 'consumables' });
                    } else if (c.id === 'c-mechanic') {
                      // Mourad Garage → spawn equipped vehicle if owned, or open shop vehicles tab
                      const owned = store.ownedVehicleInstances;
                      if (owned.length > 0) {
                        store.setPlayerState({ showSmartphone: false, isPaused: false });
                        store.setInteractionHint('🔧 Mourad: Your car is ready — use your car key to spawn it.');
                        setTimeout(() => store.setInteractionHint(null), 3000);
                      } else {
                        store.setPlayerState({ showSmartphone: false, isPaused: true, activePanel: 'shop', shopNpcTab: 'vehicles' });
                      }
                    } else if (c.id === 'c-dispatch') {
                      // Bus Dispatch → start bus driver job
                      store.setPlayerState({ showSmartphone: false, isPaused: false });
                      store.startJob('bus_driver', 1500);
                      store.setInteractionHint('🚌 Bus Dispatch: Route 7 shift started — drive safely!');
                      setTimeout(() => store.setInteractionHint(null), 3000);
                    } else if (c.id === 'c-taxi') {
                      // Taxi Company → start taxi driver job
                      store.setPlayerState({ showSmartphone: false, isPaused: false });
                      store.startJob('taxi_driver', 1200);
                      store.setInteractionHint('🚕 Taxi Company: Shift started — pick up fares!');
                      setTimeout(() => store.setInteractionHint(null), 3000);
                    } else if (c.id === 'c-farm') {
                      // Farm Manager → start farmer job
                      store.setPlayerState({ showSmartphone: false, isPaused: false });
                      store.startJob('farmer', 900);
                      store.setInteractionHint('🌾 Farm Manager: Harvest shift started — good luck!');
                      setTimeout(() => store.setInteractionHint(null), 3000);
                    } else if (c.id === 'c-lawyer') {
                      // Lawyer → show arrest-defense hint
                      store.setPlayerState({ showSmartphone: false, isPaused: false });
                      store.setInteractionHint('⚖️ Maître Khelil: "Lower your wanted level and the charges disappear."');
                      setTimeout(() => store.setInteractionHint(null), 4000);
                    } else if (c.id === 'c-fixer') {
                      // Nadir the Fixer → switch to Dating tab for intel
                      setTab('missions');
                    } else {
                      store.setPlayerState({ showSmartphone: false, isPaused: false });
                    }
                  };

                  return (
                    <div
                      key={c.id}
                      onClick={handleContactTap}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer"
                    >
                      <span className="text-xl shrink-0">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{c.name}</span>
                          {c.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">{c.lastMsg}</p>
                      </div>
                      <span className="text-gray-600 text-xs shrink-0">›</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Dating ── */}
            {tab === 'dating' && !chatWith && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-gray-600 text-center">Meet people in bars and on the streets to add them here.</p>
                {DATING_PROFILES.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/8 cursor-pointer hover:border-primary/40 hover:bg-white/8 transition-all"
                    onClick={() => setChatWith(p)}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-2xl">{p.emoji}</span>
                      <div>
                        <span className="font-bold text-white text-sm">{p.name}</span>
                        <span className="text-gray-500 text-[10px] ml-2">{p.age}</span>
                        <div className="text-[10px] text-gray-500">{p.job}</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{p.bio}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === 'dating' && chatWith && (
              <ChatView profile={chatWith} onBack={() => setChatWith(null)} />
            )}

            {/* ── Missions ── */}
            {tab === 'missions' && (
              <div className="flex flex-col gap-2">
                {activeM ? (
                  <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                    <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-0.5">Active</div>
                    <div className="text-sm font-bold text-white">{activeM.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Open Missions tab in pause menu for full details.</div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600 text-xs py-4">No active mission. Check the Missions tab.</div>
                )}
                <div className="text-[10px] text-gray-600 text-center mt-2">
                  Completed: {store.completedMissionIds.length} missions
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {store.completedMissionIds.slice(-5).map((id) => (
                    <div key={id} className="text-[10px] text-green-400/70 text-center">✓ {id.replace(/_/g, ' ')}</div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Journal ── */}
            {tab === 'journal' && (
              <div className="flex flex-col gap-3">
                {JOURNAL_ENTRIES.map((e, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/8">
                    <div className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-1">{e.date}</div>
                    <p className="text-[11px] text-gray-300 leading-relaxed italic">"{e.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center py-2.5 shrink-0">
            <div className="w-20 h-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
