---
name: Clerk-linked cloud save pattern
description: How Google Sign-in (Clerk) was wired to an existing local-save game whose player table predates auth.
---

When adding Clerk auth to a game/app that already has a local (localStorage) save system and a player DB table with no user-id column:

- Don't restructure the existing player table's primary key. Add a nullable, unique `clerkUserId` column instead, and add a parallel set of `/resource/me` (GET/POST/PUT) routes protected by `requireAuth` (via `@clerk/express`'s `getAuth`) that look up/upsert by `clerkUserId`. Leave the original unauthenticated CRUD routes untouched for offline/local-only play.
- Keep cloud sync additive and partial: only sync the subset of fields that already exist as DB columns (profile-shaped: username, level, money, etc.). Fields that only ever lived in localStorage (inventory, ammo, per-instance world state) are not worth adding new DB columns for in a first pass — local save stays the source of truth for those, cloud save covers the profile.
- Client-side: a plain hook wrapping `useUser()` from `@clerk/react` + the generated non-hook API client functions (not the `useX` mutation hooks) can fire-and-forget sync from inside a `setInterval` autosave callback, since hooks can't be called there.
- Screens driven by a Zustand `screen` enum (not routes) don't fit Clerk's hosted-page model directly. Add `/sign-in` and `/sign-up` as real wouter routes (per clerk-auth skill's canonical `/*?` pattern) sitting alongside the single `"/"` route that renders the game shell; trigger navigation to `/sign-in` from a button inside the relevant in-game screen (e.g. character creation) rather than gating the home route.
