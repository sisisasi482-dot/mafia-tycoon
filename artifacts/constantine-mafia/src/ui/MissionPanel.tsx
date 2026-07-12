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
  // ── TIER 1 — Easy (street-level, familiar turf) ────────────────────────────
  {
    id: 'mission_01',
    title: 'First Steps',          titleAr: 'الخطوات الأولى',      titleFr: 'Premiers Pas',
    objective: 'Collect a package from Ali Mendjeli and deliver it to the contact in Centre-Ville. Do not get stopped at checkpoints.',
    objectiveAr: 'اجمع طردًا من علي منجلي وأوصله إلى الشخص في وسط المدينة. لا تقف عند نقاط التفتيش.',
    objectiveFr: 'Récupère un colis à Ali Mendjeli et apporte-le au contact en Centre-Ville. Évite les checkpoints.',
    reward: 500, xp: 50, difficulty: 'Easy',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },
  {
    id: 'mission_02',
    title: 'Street Tax',           titleAr: 'ضريبة الشارع',        titleFr: 'La Taxe de Rue',
    objective: 'Intimidate three shopkeepers in Centre-Ville into paying protection money. Do not draw police attention.',
    objectiveAr: 'خوّف ثلاثة تجار في وسط المدينة. لا تجلب انتباه الشرطة.',
    objectiveFr: "Intimide trois commerçants du Centre-Ville pour qu'ils payent la protection sans alerte police.",
    reward: 1200, xp: 120, difficulty: 'Easy',
    district: 'Centre-Ville', districtAr: 'وسط المدينة', districtFr: 'Centre-Ville',
  },
  {
    id: 'mission_03_bread',
    title: 'The Bread Run',        titleAr: 'رحلة الخبز',           titleFr: 'La Tournée du Pain',
    objective: 'Deliver fresh bread from the Ali Mendjeli bakery to three families before sunrise. Drive carefully — the crates break easily.',
    objectiveAr: 'أوصل الخبز الطازج من المخبز إلى ثلاث عائلات قبل شروق الشمس.',
    objectiveFr: "Livre du pain chaud de la boulangerie d'Ali Mendjeli à trois familles avant l'aube.",
    reward: 600, xp: 60, difficulty: 'Easy',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },
  {
    id: 'mission_04_tag',
    title: 'Tag the City',         titleAr: 'انقش المدينة',         titleFr: 'Tagguer la Ville',
    objective: "Spray the gang's symbol on three walls across Centre-Ville — fast, before patrol cars make their rounds.",
    objectiveAr: "انقش شعار العصابة على ثلاثة جدران في وسط المدينة قبل أن تصل سيارات الدورية.",
    objectiveFr: "Tagge le symbole du gang sur trois murs du Centre-Ville avant les rondes de police.",
    reward: 800, xp: 80, difficulty: 'Easy',
    district: 'Centre-Ville', districtAr: 'وسط المدينة', districtFr: 'Centre-Ville',
  },
  {
    id: 'mission_05_watch',
    title: 'Night Watch',          titleAr: 'حراسة الليل',          titleFr: 'Veille Nocturne',
    objective: "Guard Karim's warehouse in Ali Mendjeli overnight. Report any suspicious vehicles to the contact.",
    objectiveAr: "احرس مستودع كريم في علي منجلي طوال الليل. أبلغ عن أي سيارة مشبوهة.",
    objectiveFr: "Monte la garde devant l'entrepôt de Karim à Ali Mendjeli. Signale tout véhicule suspect.",
    reward: 1000, xp: 100, difficulty: 'Easy',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },
  {
    id: 'mission_06_stolen',
    title: 'Stolen Wheels',        titleAr: 'عجلات مسروقة',         titleFr: 'Roues Volées',
    objective: "Retrieve the boss's Renault from the police impound near the City B arterial. Use the key hidden under the guard booth.",
    objectiveAr: "استعد سيارة الرينو المسروقة من الحجز عند الطريق السريع.",
    objectiveFr: "Récupère la Renault du boss au fourrière près de la City B. La clé est cachée sous le poste.",
    reward: 1500, xp: 140, difficulty: 'Easy',
    district: 'City B', districtAr: 'المدينة الجديدة', districtFr: 'City B',
  },
  {
    id: 'mission_07_errand',
    title: 'The Errand Boy',       titleAr: 'ولد المشاوير',         titleFr: 'Le Coursier',
    objective: 'Deliver letters to five gang contacts across the city. Each contact will hand you part of the week\'s earnings.',
    objectiveAr: 'أوصل رسائل لخمسة أشخاص عبر المدينة. كل منهم سيعطيك جزءًا من أرباح الأسبوع.',
    objectiveFr: 'Livre des lettres à cinq contacts dans la ville. Chacun te donnera une part des recettes.',
    reward: 1800, xp: 160, difficulty: 'Easy',
    district: 'City-wide', districtAr: 'المدينة كلها', districtFr: 'Toute la ville',
  },
  {
    id: 'mission_08_pharmacy',
    title: 'Pharmacy Raid',        titleAr: 'اقتحام الصيدلية',      titleFr: 'Raid de Pharmacie',
    objective: "Steal antibiotics and painkillers from the Centre-Ville pharmacy for the gang's medic. Leave no witnesses.",
    objectiveAr: "سرق المضادات الحيوية من صيدلية وسط المدينة. لا تترك شهود.",
    objectiveFr: "Vole des antibiotiques et des analgésiques de la pharmacie du Centre-Ville.",
    reward: 2000, xp: 180, difficulty: 'Easy',
    district: 'Centre-Ville', districtAr: 'وسط المدينة', districtFr: 'Centre-Ville',
  },
  {
    id: 'mission_09_info',
    title: 'The Informant',        titleAr: 'المخبر',               titleFr: 'L\'Informateur',
    objective: "Find and confront the police informant hiding in Ali Mendjeli. Make him understand loyalty — or deal with the consequences.",
    objectiveAr: "ابحث عن المخبر المختبئ في علي منجلي وأفهمه معنى الولاء.",
    objectiveFr: "Trouve et confronte l'informateur de la police caché à Ali Mendjeli.",
    reward: 2500, xp: 220, difficulty: 'Easy',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },
  {
    id: 'mission_10_hustle',
    title: 'Market Hustle',        titleAr: 'بازار السوق',          titleFr: 'Arnaque au Marché',
    objective: "Sell fake brand-name goods at the Ali Mendjeli market. Move quickly — the gendarmerie patrols every 10 minutes.",
    objectiveAr: "بع بضاعة مقلدة في سوق علي منجلي. تحرك بسرعة — الدرك يدور كل ١٠ دقائق.",
    objectiveFr: "Vends des contrefaçons au marché d'Ali Mendjeli. Fais vite — la gendarmerie passe toutes les 10 min.",
    reward: 1600, xp: 140, difficulty: 'Easy',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },

  // ── TIER 2 — Medium (citywide, escalating risk) ────────────────────────────
  {
    id: 'mission_11',
    title: 'The Gorge Run',        titleAr: 'سباق الوادي',          titleFr: 'La Course du Ravin',
    objective: "Drive across Sidi M'Cid bridge with BRI in pursuit. Reach the Old City alive.",
    objectiveAr: 'قد عبر جسر سيدي عمشيش وفرقة مكافحة الشغب تلاحقك. صل للمدينة القديمة.',
    objectiveFr: "Traverse le pont Sidi M'Cid avec la BRI aux trousses. Atteins la Vieille Ville vivant.",
    reward: 3000, xp: 300, difficulty: 'Medium',
    district: 'Old City', districtAr: 'المدينة القديمة', districtFr: 'Vieille Ville',
  },
  {
    id: 'mission_12',
    title: 'Ghost Cargo',          titleAr: 'البضاعة الوهمية',      titleFr: 'Cargaison Fantôme',
    objective: "Steal a truck from the Ain M'lila industrial zone without triggering alarms.",
    objectiveAr: 'سرق شاحنة من المنطقة الصناعية في عين مليلة دون تشغيل الإنذارات.',
    objectiveFr: "Vole un camion dans la zone industrielle d'Ain M'lila sans déclencher les alarmes.",
    reward: 5000, xp: 500, difficulty: 'Medium',
    district: "Ain M'lila", districtAr: 'عين مليلة', districtFr: "Ain M'lila",
  },
  {
    id: 'mission_13_collector',
    title: 'The Collector',        titleAr: 'المحصّل',              titleFr: 'Le Collecteur',
    objective: "Collect outstanding debts from five businessmen across Ali Mendjeli and City B. Some won't pay willingly.",
    objectiveAr: "اجمع الديون المتأخرة من خمسة أشخاص عبر المدينة. بعضهم لن يدفع باختياره.",
    objectiveFr: "Collecte des dettes impayées auprès de cinq commerçants à Ali Mendjeli et City B.",
    reward: 4500, xp: 420, difficulty: 'Medium',
    district: 'City-wide', districtAr: 'المدينة كلها', districtFr: 'Toute la ville',
  },
  {
    id: 'mission_14_carjack',
    title: 'The Carjack',          titleAr: 'سرقة السيارة',         titleFr: 'Le Carjack',
    objective: "Steal the police commander's personal BMW from his residence in City B. Deliver it to the chop shop in Ali Mendjeli.",
    objectiveAr: "سرق سيارة قائد الشرطة الشخصية وأوصلها إلى ورشة التقطيع في علي منجلي.",
    objectiveFr: "Vole la BMW personnelle du commandant de police en City B et livre-la à l'atelier d'Ali Mendjeli.",
    reward: 6000, xp: 550, difficulty: 'Medium',
    district: 'City B', districtAr: 'المدينة الجديدة', districtFr: 'City B',
  },
  {
    id: 'mission_15_setup',
    title: 'The Setup',            titleAr: 'المؤامرة',             titleFr: 'Le Coup Monté',
    objective: "Plant a stolen weapon in a rival gang member's car parked near the highway. Make it look like he was dealing arms.",
    objectiveAr: "ضع سلاحاً مسروقاً في سيارة أحد أفراد العصابة المنافسة بالقرب من الطريق السريع.",
    objectiveFr: "Planque une arme volée dans la voiture d'un rival garé près de l'autoroute.",
    reward: 5500, xp: 480, difficulty: 'Medium',
    district: 'Highway', districtAr: 'الطريق السريع', districtFr: 'Autoroute',
  },
  {
    id: 'mission_16_fuel',
    title: 'Fuel Robbery',         titleAr: 'سرقة الوقود',          titleFr: 'Vol de Carburant',
    objective: "Intercept a fuel tanker on the highway between the two cities. Block the road, siphon the cargo, disappear before backup arrives.",
    objectiveAr: "اعترض شاحنة الوقود على الطريق السريع. أوقفها وسرق الحمولة قبل وصول تعزيزات.",
    objectiveFr: "Intercepte un camion-citerne sur l'autoroute. Bloque la route, siphonne la cargaison avant les renforts.",
    reward: 7000, xp: 620, difficulty: 'Medium',
    district: 'Highway', districtAr: 'الطريق السريع', districtFr: 'Autoroute',
  },
  {
    id: 'mission_17_nightmarket',
    title: 'Night Market',         titleAr: 'السوق الليلية',        titleFr: 'Le Marché Nocturne',
    objective: "Protect a black-market arms deal in the Old City. Three rival crews are watching. Keep the seller alive until the deal closes.",
    objectiveAr: "احمِ صفقة أسلحة في السوق الليلي للمدينة القديمة. ثلاث عصابات تراقب. أبقِ البائع حياً حتى إغلاق الصفقة.",
    objectiveFr: "Protège un deal d'armes au marché noir de la Vieille Ville. Trois gangs rivaux observent.",
    reward: 8000, xp: 700, difficulty: 'Medium',
    district: 'Old City', districtAr: 'المدينة القديمة', districtFr: 'Vieille Ville',
  },
  {
    id: 'mission_18_desert',
    title: 'Desert Run',           titleAr: 'رحلة الصحراء',         titleFr: 'La Piste du Désert',
    objective: "Drive a cargo van to Ain M'lila avoiding all checkpoints. The route goes through back roads — no GPS signal.",
    objectiveAr: "قد شاحنة البضاعة إلى عين مليلة متجنباً نقاط التفتيش. الطريق عبر الطرق الفرعية.",
    objectiveFr: "Conduis une camionnette cargo vers Ain M'lila en évitant les checkpoints. Pas de signal GPS.",
    reward: 6500, xp: 580, difficulty: 'Medium',
    district: "Ain M'lila", districtAr: 'عين مليلة', districtFr: "Ain M'lila",
  },
  {
    id: 'mission_19_mole',
    title: 'The Mole',             titleAr: 'الجاسوس',              titleFr: 'La Taupe',
    objective: "One of the five gang contacts is a police mole. Figure out which one from their recent behaviour and deal with the threat quietly.",
    objectiveAr: "أحد الخمسة الاتصالات هو مخبر للشرطة. اكشف هويته من تصرفاته الأخيرة وتعامل معه بهدوء.",
    objectiveFr: "L'un des cinq contacts est une taupe de la police. Identifie-le depuis ses comportements récents.",
    reward: 9000, xp: 780, difficulty: 'Medium',
    district: 'City-wide', districtAr: 'المدينة كلها', districtFr: 'Toute la ville',
  },
  {
    id: 'mission_20_witness',
    title: 'Silence the Witness',  titleAr: 'إسكات الشاهد',         titleFr: 'Faire Taire le Témoin',
    objective: "A witness has agreed to testify against the boss. Intercept her before she reaches the courthouse — scare her off the stand.",
    objectiveAr: "شاهدة وافقت على الإدلاء بشهادتها ضد الزعيم. اعترض طريقها قبل وصولها للمحكمة.",
    objectiveFr: "Un témoin accepte de témoigner contre le boss. Intercepte-la avant qu'elle atteigne le tribunal.",
    reward: 10000, xp: 850, difficulty: 'Medium',
    district: 'Centre-Ville', districtAr: 'وسط المدينة', districtFr: 'Centre-Ville',
  },

  // ── TIER 3 — Hard (high stakes, full-map operations) ──────────────────────
  {
    id: 'mission_21',
    title: 'Airport Heist',        titleAr: 'سطو على المطار',       titleFr: "Braquage à l'Aéroport",
    objective: 'Intercept a government shipment at Constantine Airport before it clears customs. You have 8 minutes.',
    objectiveAr: 'اعترض شحنة حكومية في مطار قسنطينة قبل تخليصها جمركيًا. لديك ٨ دقائق.',
    objectiveFr: "Intercepte une livraison gouvernementale à l'aéroport de Constantine. Tu as 8 minutes.",
    reward: 12000, xp: 1000, difficulty: 'Hard',
    district: 'Airport', districtAr: 'المطار', districtFr: 'Aéroport',
  },
  {
    id: 'mission_22_bankjob',
    title: 'The Bank Job',         titleAr: 'عملية البنك',          titleFr: 'Le Braquage',
    objective: "Rob the City B bank vault. Cut the CCTV, blow the safe, escape before the SWAT team seals the perimeter.",
    objectiveAr: "اقتحم خزنة بنك المدينة الجديدة. اقطع الكاميرات، دمر الخزينة، اهرب قبل وصول قوات التدخل.",
    objectiveFr: "Braque le coffre de la banque de City B. Coupe les caméras, fais sauter le coffre, fuis avant le SWAT.",
    reward: 35000, xp: 2500, difficulty: 'Hard',
    district: 'City B', districtAr: 'المدينة الجديدة', districtFr: 'City B',
  },
  {
    id: 'mission_23_armsrun',
    title: 'The Arms Run',         titleAr: 'صفقة الأسلحة',         titleFr: 'La Livraison d\'Armes',
    objective: "Move a crate of AK-47s from the highway industrial corridor to the Old City gang boss. Four checkpoints between you and the drop.",
    objectiveAr: "انقل صندوق كلاشينكوف من الممر الصناعي إلى زعيم عصابة المدينة القديمة. أربعة حواجز في طريقك.",
    objectiveFr: "Transporte une caisse de AK-47 du couloir industriel vers le boss de la Vieille Ville. Quatre checkpoints.",
    reward: 20000, xp: 1600, difficulty: 'Hard',
    district: 'Highway', districtAr: 'الطريق السريع', districtFr: 'Autoroute',
  },
  {
    id: 'mission_24_rat',
    title: 'Hunt the Rat',         titleAr: 'اصطياد الخائن',        titleFr: 'Chasse au Traître',
    objective: "A senior gang member has turned state witness and fled to City B. Track him through three safehouses before he boards a flight.",
    objectiveAr: "أحد القادة خان وهرب إلى المدينة الجديدة. تتبعه عبر ثلاثة مخابئ قبل ركوبه الطائرة.",
    objectiveFr: "Un haut gradé du gang est passé aux aveux et a fui en City B. Traque-le dans trois planques.",
    reward: 25000, xp: 1900, difficulty: 'Hard',
    district: 'City B', districtAr: 'المدينة الجديدة', districtFr: 'City B',
  },
  {
    id: 'mission_25_luxury',
    title: 'Luxury Import',        titleAr: 'استيراد فاخر',         titleFr: 'Import de Luxe',
    objective: "Steal three luxury cars from a secured City B car lot and deliver them to the dock before dawn. Avoid the roaming BRI patrols.",
    objectiveAr: "سرق ثلاث سيارات فاخرة من موقف آمن في المدينة الجديدة وأوصلها للرصيف قبل الفجر.",
    objectiveFr: "Vole trois voitures de luxe d'un parc sécurisé de City B et livre-les au quai avant l'aube.",
    reward: 30000, xp: 2200, difficulty: 'Hard',
    district: 'City B', districtAr: 'المدينة الجديدة', districtFr: 'City B',
  },
  {
    id: 'mission_26_governor',
    title: 'The Governor',         titleAr: 'الوالي',               titleFr: 'Le Gouverneur',
    objective: "The governor of Constantine is blocking the gang's permits. Intercept his convoy on the highway and deliver a message he won't forget.",
    objectiveAr: "والي قسنطينة يعرقل تصاريح العصابة. اعترض موكبه على الطريق السريع وأوصل رسالة لن ينساها.",
    objectiveFr: "Le gouverneur bloque les permis du gang. Intercepte son convoi sur l'autoroute — fais-lui passer un message.",
    reward: 40000, xp: 2800, difficulty: 'Hard',
    district: 'Highway', districtAr: 'الطريق السريع', districtFr: 'Autoroute',
  },
  {
    id: 'mission_27_prison',
    title: 'Prison Break',         titleAr: 'الهروب من السجن',      titleFr: 'Évasion de Prison',
    objective: "Break Amar out of the police holding facility near Ali Mendjeli before he gets transferred to the capital. Three guards inside, one cruiser outside.",
    objectiveAr: "أخرج عمار من مرفق الاحتجاز قبل نقله للعاصمة. ثلاثة حراس في الداخل وسيارة شرطة في الخارج.",
    objectiveFr: "Fais évader Amar du centre de détention d'Ali Mendjeli avant son transfert. Trois gardes, un cruiser dehors.",
    reward: 45000, xp: 3000, difficulty: 'Hard',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },
  {
    id: 'mission_28_blackmarket',
    title: 'Black Market King',    titleAr: 'ملك السوق السوداء',    titleFr: 'Roi du Marché Noir',
    objective: "Corner the City A drug market by eliminating three rival distributors and taking over their distribution points. Do it in one night.",
    objectiveAr: "احتكر سوق المخدرات في المدينة أ بإزاحة ثلاثة موزعين منافسين والاستيلاء على نقاطهم. في ليلة واحدة.",
    objectiveFr: "Monopolise le marché noir de City A en éliminant trois distributeurs rivaux en une seule nuit.",
    reward: 60000, xp: 3800, difficulty: 'Hard',
    district: 'Ali Mendjeli', districtAr: 'علي منجلي', districtFr: 'Ali Mendjeli',
  },
  {
    id: 'mission_29_heist',
    title: 'The Final Heist',      titleAr: 'السطو الأخير',         titleFr: 'Le Braquage Final',
    objective: "Hit the Central Treasury in Centre-Ville. It's the most guarded building in Constantine. You need a crew, a plan, and a getaway route.",
    objectiveAr: "اقتحم الخزينة المركزية في وسط المدينة. أكثر مبنى محمي في قسنطينة. تحتاج فريقاً وخطةً وطريق هروب.",
    objectiveFr: "Braque la Trésorerie Centrale du Centre-Ville — le bâtiment le plus gardé de Constantine. Prépare un plan.",
    reward: 120000, xp: 6000, difficulty: 'Hard',
    district: 'Centre-Ville', districtAr: 'وسط المدينة', districtFr: 'Centre-Ville',
  },
  {
    id: 'mission_30_siege',
    title: 'City Under Siege',     titleAr: 'المدينة تحت الحصار',   titleFr: 'Ville Assiégée',
    objective: "The army has surrounded Constantine. Lead the gang's last stand — hold three districts against military checkpoints and show the generals who really owns this city.",
    objectiveAr: "الجيش يحاصر قسنطينة. قد آخر وقفة للعصابة — أمسك ثلاثة أحياء ضد الحواجز العسكرية وأثبت من يمتلك المدينة.",
    objectiveFr: "L'armée encercle Constantine. Mène le dernier combat du gang — tiens trois districts face aux barrages militaires.",
    reward: 250000, xp: 10000, difficulty: 'Hard',
    district: 'Constantine', districtAr: 'قسنطينة', districtFr: 'Constantine',
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
