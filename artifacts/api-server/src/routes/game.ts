import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

// ── STATIC GAME DATA ──────────────────────────────────────────────────────────

const ASSETS = [
  // Vehicles
  { id: "v_dacia_duster", name: "Dacia Duster", nameAr: "داسيا داستر", nameFr: "Dacia Duster", category: "vehicle", subcategory: "suv", price: 8000, description: "Rugged SUV popular in Constantine", district: "ali_mendjeli", imageKey: "dacia_duster" },
  { id: "v_renault_clio", name: "Renault Clio", nameAr: "رينو كليو", nameFr: "Renault Clio", category: "vehicle", subcategory: "hatchback", price: 4500, description: "Fast city hatchback", district: "centre_ville", imageKey: "renault_clio" },
  { id: "v_vw_golf", name: "VW Golf", nameAr: "فولكس واجن غولف", nameFr: "VW Golf", category: "vehicle", subcategory: "hatchback", price: 9500, description: "Iconic street racer", district: "ain_mlila", imageKey: "vw_golf" },
  { id: "v_peugeot_206", name: "Peugeot 206", nameAr: "بيجو 206", nameFr: "Peugeot 206", category: "vehicle", subcategory: "hatchback", price: 3000, description: "Classic street ride", district: "centre_ville", imageKey: "peugeot_206" },
  { id: "v_bmw_e36", name: "BMW E36", nameAr: "بي إم دبليو E36", nameFr: "BMW E36", category: "vehicle", subcategory: "sedan", price: 15000, description: "Premium crime boss vehicle", district: "old_city", imageKey: "bmw_e36" },
  // Properties
  { id: "p_apt_mendjeli", name: "Ali Mendjeli Apartment", nameAr: "شقة علي منجلي", nameFr: "Appartement Ali Mendjeli", category: "property", subcategory: "apartment", price: 20000, description: "Base of operations in the action district", district: "ali_mendjeli", imageKey: "apt_mendjeli" },
  { id: "p_shop_centreville", name: "Centre-Ville Shop", nameAr: "محل وسط المدينة", nameFr: "Boutique Centre-Ville", category: "property", subcategory: "shop", price: 35000, description: "Earns steady income daily", district: "centre_ville", imageKey: "shop_centreville" },
  { id: "p_villa_oldcity", name: "Old City Villa", nameAr: "فيلا المدينة القديمة", nameFr: "Villa Vieille Ville", category: "property", subcategory: "villa", price: 80000, description: "Luxury safehouse near the gorges", district: "old_city", imageKey: "villa_oldcity" },
  // Weapons
  { id: "w_knife", name: "Knife", nameAr: "سكين", nameFr: "Couteau", category: "weapon", subcategory: "melee", price: 200, description: "Silent takedown", district: "ali_mendjeli", imageKey: "knife" },
  { id: "w_pistol", name: "Pistol", nameAr: "مسدس", nameFr: "Pistolet", category: "weapon", subcategory: "firearm", price: 1500, description: "Standard sidearm", district: "ali_mendjeli", imageKey: "pistol" },
  { id: "w_ak47", name: "AK-47", nameAr: "كلاشينكوف", nameFr: "AK-47", category: "weapon", subcategory: "firearm", price: 5000, description: "Heavy firepower", district: "old_city", imageKey: "ak47" },
];

const MISSIONS = [
  // Ali Mendjeli
  { id: "m_steal_car_01", title: "Boost a Ride", titleAr: "سرقة سيارة", titleFr: "Voler une voiture", description: "Steal a Dacia Duster from the parking lot", descriptionAr: "اسرق سيارة داسيا داستر من موقف السيارات", district: "ali_mendjeli", type: "theft", difficulty: "easy", reward: 800, xpReward: 120, requiredLevel: 1, isStoryMission: false },
  { id: "m_gang_trade_01", title: "The Exchange", titleAr: "التبادل", titleFr: "L'échange", description: "Deliver contraband to the Mendjeli crew", descriptionAr: "سلّم البضاعة لعصابة منجلي", district: "ali_mendjeli", type: "gang_trade", difficulty: "medium", reward: 2500, xpReward: 300, requiredLevel: 3, isStoryMission: false },
  { id: "m_story_01", title: "Welcome to Constantine", titleAr: "مرحباً بك في قسنطينة", titleFr: "Bienvenue à Constantine", description: "Prove yourself in the streets of Ali Mendjeli", descriptionAr: "أثبت نفسك في شوارع علي منجلي", district: "ali_mendjeli", type: "story", difficulty: "easy", reward: 1000, xpReward: 200, requiredLevel: 1, isStoryMission: true },
  // Centre-Ville
  { id: "m_bri_01", title: "BRI Stronghold", titleAr: "معقل فرقة BRI", titleFr: "Bastion BRI", description: "Plant a device inside the BRI headquarters — extreme risk", descriptionAr: "زرع جهاز داخل مقر وحدة BRI", district: "centre_ville", type: "police_operation", difficulty: "extreme", reward: 15000, xpReward: 1500, requiredLevel: 8, isStoryMission: false },
  { id: "m_shop_heist", title: "The Jewel Heist", titleAr: "سرقة المجوهرات", titleFr: "Le vol de bijoux", description: "Rob the jewellery shop near Emir Abdelkader square", descriptionAr: "سرق محل المجوهرات قرب ساحة الأمير عبد القادر", district: "centre_ville", type: "theft", difficulty: "hard", reward: 6000, xpReward: 700, requiredLevel: 5, isStoryMission: false },
  // Old City
  { id: "m_old_city_01", title: "Gorge Crossing", titleAr: "عبور الوادي", titleFr: "Traversée des gorges", description: "Escort a shipment across the Sidi M'Cid bridge at night", descriptionAr: "رافق شحنة عبر جسر سيدي مسيد ليلاً", district: "old_city", type: "gang_trade", difficulty: "hard", reward: 8000, xpReward: 900, requiredLevel: 6, isStoryMission: true },
  // Ain M'lila
  { id: "m_highway_01", title: "Highway Ambush", titleAr: "كمين على الطريق السريع", titleFr: "Embuscade sur l'autoroute", description: "Intercept a cash transport on the N3", descriptionAr: "اعترض شاحنة نقل أموال على الطريق الوطني 3", district: "ain_mlila", type: "theft", difficulty: "medium", reward: 4000, xpReward: 500, requiredLevel: 4, isStoryMission: false },
  // Job missions
  { id: "m_taxi_01", title: "Night Taxi", titleAr: "سيارة أجرة ليلية", titleFr: "Taxi de nuit", description: "Drive passengers across Constantine for honest pay", descriptionAr: "اقل ركاباً عبر قسنطينة مقابل دخل محترم", district: "ali_mendjeli", type: "job", difficulty: "easy", reward: 500, xpReward: 80, requiredLevel: 1, isStoryMission: false },
];

// ── PLAYER ENDPOINTS ──────────────────────────────────────────────────────────

router.post("/player", async (req, res) => {
  const { username } = req.body as { username: string };
  if (!username?.trim()) {
    res.status(400).json({ error: "Username required" });
    return;
  }
  const id = randomUUID();
  const [player] = await db.insert(playersTable).values({
    id,
    username: username.trim(),
    money: 500,
    level: 1,
    xp: 0,
    careerPath: "street_thug",
    district: "ali_mendjeli",
    ownedAssetIds: [],
    completedMissionIds: [],
  }).returning();
  res.status(201).json(serializePlayer(player));
});

router.get("/player/:playerId", async (req, res) => {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, req.params.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(serializePlayer(player));
});

router.put("/player/:playerId", async (req, res) => {
  const update = req.body as Partial<typeof playersTable.$inferInsert>;
  const [player] = await db.update(playersTable)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(playersTable.id, req.params.playerId))
    .returning();
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(serializePlayer(player));
});

// ── ASSETS ─────────────────────────────────────────────────────────────────

router.get("/assets", (req, res) => {
  const { category } = req.query as { category?: string };
  const result = category ? ASSETS.filter(a => a.category === category) : ASSETS;
  res.json(result);
});

router.post("/player/:playerId/assets", async (req, res) => {
  const { assetId } = req.body as { assetId: string };
  const asset = ASSETS.find(a => a.id === assetId);
  if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, req.params.playerId));
  if (!player) { res.status(404).json({ error: "Player not found" }); return; }
  if (player.money < asset.price) { res.status(400).json({ error: "Insufficient funds" }); return; }

  const owned = Array.isArray(player.ownedAssetIds) ? player.ownedAssetIds : [];
  if (owned.includes(assetId)) { res.status(400).json({ error: "Already owned" }); return; }

  const [updated] = await db.update(playersTable).set({
    money: player.money - asset.price,
    ownedAssetIds: [...owned, assetId],
    updatedAt: new Date(),
  }).where(eq(playersTable.id, req.params.playerId)).returning();
  res.json(serializePlayer(updated));
});

// ── MISSIONS ──────────────────────────────────────────────────────────────────

router.get("/missions", (req, res) => {
  const { district } = req.query as { district?: string };
  const result = district ? MISSIONS.filter(m => m.district === district) : MISSIONS;
  res.json(result);
});

router.post("/missions/:missionId/complete", async (req, res) => {
  const { playerId } = req.body as { playerId: string };
  const mission = MISSIONS.find(m => m.id === req.params.missionId);
  if (!mission) { res.status(404).json({ error: "Mission not found" }); return; }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, playerId));
  if (!player) { res.status(404).json({ error: "Player not found" }); return; }

  const newXp = player.xp + mission.xpReward;
  const newLevel = Math.floor(1 + Math.sqrt(newXp / 150));
  const leveledUp = newLevel > player.level;
  const completed = Array.isArray(player.completedMissionIds) ? player.completedMissionIds : [];

  const careerPath = leveledUp ? getCareerPath(newLevel) : player.careerPath;

  const [updated] = await db.update(playersTable).set({
    money: player.money + mission.reward,
    xp: newXp,
    level: newLevel,
    careerPath,
    completedMissionIds: [...completed, mission.id],
    updatedAt: new Date(),
  }).where(eq(playersTable.id, playerId)).returning();

  res.json({ success: true, moneyEarned: mission.reward, xpEarned: mission.xpReward, leveledUp, newLevel: leveledUp ? newLevel : null, player: serializePlayer(updated) });
});

// ── LEADERBOARD ───────────────────────────────────────────────────────────────

router.get("/leaderboard", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const players = await db.select().from(playersTable).limit(limit);
  const sorted = players.sort((a, b) => b.level - a.level || b.money - a.money);
  res.json(sorted.map((p, i) => ({ rank: i + 1, playerId: p.id, username: p.username, level: p.level, money: p.money, careerPath: p.careerPath })));
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

function serializePlayer(p: typeof playersTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function getCareerPath(level: number): string {
  if (level >= 15) return "business_tycoon";
  if (level >= 10) return "crime_boss";
  if (level >= 5) return "gangster";
  return "street_thug";
}

export default router;
