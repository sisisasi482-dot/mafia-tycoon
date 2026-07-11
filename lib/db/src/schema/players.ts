import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  // Clerk user id — set once a player links Google Sign-in for cloud saves.
  clerkUserId: text("clerk_user_id").unique(),
  // Player height in centimeters, captured during character creation.
  height: integer("height").notNull().default(175),
  money: integer("money").notNull().default(500),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  careerPath: text("career_path").notNull().default("street_thug"),
  currentMissionId: text("current_mission_id"),
  district: text("district").notNull().default("ali_mendjeli"),
  ownedAssetIds: jsonb("owned_asset_ids").$type<string[]>().notNull().default([]),
  completedMissionIds: jsonb("completed_mission_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ createdAt: true, updatedAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
