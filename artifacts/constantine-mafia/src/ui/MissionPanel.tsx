import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { t } from '../game/constants';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Mission {
  id: string;
  title: string; titleAr: string; titleFr: string;
  objective: string; objectiveAr: string; objectiveFr: string;
  reward: number;
  xp: number;
  difficulty: Difficulty;
  district: string; districtAr: string; districtFr: string;
}

const MISSIONS: Mission[] = [
  {
    id: 'mission_01',
    title: 'First Steps',          titleAr: 'الخطوات الأولى',      titleFr: 'Premiers Pas',
    objective: 'Collect a package from Ali Mendjeli and deliver it to the contact.',
    objectiveAr: 'اجمع طردًا من علي منجلي وأوصله إلى الشخص المحدد.',
    objectiveFr: 'Récupère un colis à Ali Mendjeli et apporte-le au contact.',
    reward: 500, xp: 50, difficulty: 'Easy',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },
  {
    id: 'mission_02',
    title: 'Street Tax',           titleAr: 'ضريبة الشارع',        titleFr: 'La Taxe de Rue',
    objective: 'Intimidate three shopkeepers in Centre-Ville into paying protection money.',
    objectiveAr: 'خوّف ثلاثة تجار في وسط المدينة ليدفعوا رسوم الحماية.',
    objectiveFr: "Intimide trois commerçants du Centre-Ville pour qu'ils payent la protection.",
    reward: 1200, xp: 120, difficulty: 'Easy',
    district: 'Centre-Ville', districtAr: 'وسط المدينة', districtFr: 'Centre-Ville',
  },
  {
    id: 'mission_03',
    title: 'The Gorge Run',        titleAr: 'سباق الوادي',          titleFr: 'La Course du Ravin',
    objective: "Drive across Sidi M'Cid bridge with BRI in pursuit. Reach the Old City alive.",
    objectiveAr: 'قد عبر جسر سيدي عمشيش وفرقة مكافحة الشغب تلاحقك. صل للمدينة القديمة.',
    objectiveFr: "Traverse le pont Sidi M'Cid avec la BRI aux trousses. Atteins la Vieille Ville vivant.",
    reward: 3000, xp: 300, difficulty: 'Medium',
    district: 'Old City', districtAr: 'المدينة القديمة', districtFr: 'Vieille Ville',
  },
  {
    id: 'mission_04',
    title: "Ghost Cargo",          titleAr: 'البضاعة الوهمية',      titleFr: 'Cargaison Fantôme',
    objective: "Steal a truck from the Ain M'lila industrial zone without triggering alarms.",
    objectiveAr: 'سرق شاحنة من المنطقة الصناعية في عين مليلة دون تشغيل الإنذارات.',
    objectiveFr: "Vole un camion dans la zone industrielle d'Ain M'lila sans déclencher les alarmes.",
    reward: 5000, xp: 500, difficulty: 'Medium',
    district: "Ain M'lila", districtAr: 'عين مليلة', districtFr: "Ain M'lila",
  },
  {
    id: 'mission_05',
    title: 'Airport Heist',        titleAr: 'سطو على المطار',       titleFr: "Braquage à l'Aéroport",
    objective: 'Intercept a government shipment at Constantine Airport before it clears customs.',
    objectiveAr: 'اعترض شحنة حكومية في مطار قسنطينة قبل تخليصها جمركيًا.',
    objectiveFr: "Intercepte une livraison gouvernementale à l'aéroport de Constantine avant la douane.",
    reward: 12000, xp: 1000, difficulty: 'Hard',
    district: 'Airport', districtAr: 'المطار', districtFr: 'Aéroport',
  },
];

const DIFF_COLOR: Record<Difficulty, string> = {
  Easy:   'text-green-400 border-green-400/40 bg-green-400/10',
  Medium: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  Hard:   'text-red-400 border-red-400/40 bg-red-400/10',
};

function getLocal(m: Mission, lang: string) {
  if (lang === 'ar') return { title: m.titleAr, obj: m.objectiveAr, dist: m.districtAr };
  if (lang === 'fr') return { title: m.titleFr, obj: m.objectiveFr, dist: m.districtFr };
  return { title: m.title, obj: m.objective, dist: m.district };
}

export function MissionPanel() {
  const store = useGameStore();
  const lang = store.language;
  const [selected, setSelected] = useState<string | null>(store.currentMissionId);

  /** Accept a mission — blocked if one is already in progress */
  const handleAccept = (m: Mission) => {
    if (store.currentMissionId) return; // guard: one mission at a time
    store.setPlayerState({ currentMissionId: m.id });
    setSelected(m.id);
    store.togglePause(); // close pause and let player go complete it
  };

  /** Complete the active mission: award money + XP, mark done, clear active */
  const handleComplete = (m: Mission) => {
    store.addMoney(m.reward);
    store.addXp(m.xp);
    store.setPlayerState({
      currentMissionId: null,
      completedMissionIds: [...store.completedMissionIds, m.id],
    });
    setSelected(null);
  };

  const activeMission = MISSIONS.find((m) => m.id === store.currentMissionId);

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
        <h3 className="text-xl font-bold text-white">{t('missions', lang)}</h3>
        {activeMission && (
          <span className="text-xs text-yellow-400 font-bold animate-pulse">
            ● {getLocal(activeMission, lang).title}
          </span>
        )}
      </div>

      {/* Active mission banner */}
      {activeMission && (
        <div className="shrink-0 flex items-center justify-between gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3">
          <div>
            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-0.5">Active Mission</div>
            <div className="text-sm text-white font-semibold">{getLocal(activeMission, lang).title}</div>
          </div>
          <button
            onClick={() => handleComplete(activeMission)}
            className="shrink-0 px-4 py-2 rounded-lg bg-yellow-400 text-black font-black text-xs uppercase tracking-wider hover:bg-yellow-300 transition-all"
          >
            ✓ Complete
          </button>
        </div>
      )}

      {/* Mission list + detail — stack on mobile, side-by-side on md+ */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">

        {/* List */}
        <div className="md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 pb-1 md:pb-0">
          {MISSIONS.map((m) => {
            const done   = store.completedMissionIds.includes(m.id);
            const active = store.currentMissionId === m.id;
            const { title } = getLocal(m, lang);
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`shrink-0 text-left px-3 py-2 rounded-lg border transition-all ${
                  selected === m.id
                    ? 'border-primary/60 bg-primary/10 text-white'
                    : done
                    ? 'border-white/5 bg-white/3 text-gray-500'
                    : active
                    ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-300'
                    : 'border-white/5 bg-white/3 text-gray-300 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-xs leading-tight whitespace-nowrap md:whitespace-normal">{title}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${DIFF_COLOR[m.difficulty]}`}>
                    {m.difficulty[0]}
                  </span>
                  {done   && <span className="text-xs text-green-400">✓</span>}
                  {active && !done && <span className="text-xs text-yellow-400 animate-pulse">●</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {selected ? (() => {
            const m    = MISSIONS.find((x) => x.id === selected)!;
            const done   = store.completedMissionIds.includes(m.id);
            const active = store.currentMissionId === m.id;
            const { title, obj, dist } = getLocal(m, lang);
            const hasOtherActive = !!store.currentMissionId && !active;
            return (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">{title}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded border font-bold ${DIFF_COLOR[m.difficulty]}`}>
                      {m.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">📍 {dist}</span>
                  </div>
                </div>

                <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Objective</div>
                  <p className="text-gray-200 text-sm leading-relaxed">{obj}</p>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{t('reward', lang)}</div>
                    <div className="text-lg font-black text-primary font-mono">{m.reward.toLocaleString()} DA</div>
                  </div>
                  <div className="flex-1 bg-blue-400/10 border border-blue-400/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">XP</div>
                    <div className="text-lg font-black text-blue-400 font-mono">+{m.xp}</div>
                  </div>
                </div>

                {/* Action button */}
                {done ? (
                  <div className="py-3 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 font-bold text-center text-sm uppercase tracking-widest">
                    ✓ Completed
                  </div>
                ) : active ? (
                  <button
                    onClick={() => handleComplete(m)}
                    className="py-3 rounded-lg bg-yellow-400 text-black font-black text-sm uppercase tracking-widest hover:bg-yellow-300 transition-all"
                  >
                    ✓ {lang === 'ar' ? 'أكمل المهمة' : lang === 'fr' ? 'Terminer la mission' : 'Complete Mission'}
                  </button>
                ) : hasOtherActive ? (
                  <div className="py-3 rounded-lg border border-white/10 text-gray-500 font-bold text-center text-xs uppercase tracking-widest">
                    {lang === 'ar' ? 'أكمل مهمتك الحالية أولاً' : lang === 'fr' ? 'Terminez votre mission en cours d\'abord' : 'Finish your current mission first'}
                  </div>
                ) : (
                  <button
                    onClick={() => handleAccept(m)}
                    className="py-3 rounded-lg bg-primary text-black font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all"
                  >
                    {t('accept', lang)}
                  </button>
                )}
              </div>
            );
          })() : (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
              Select a mission to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
