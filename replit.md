# Constantine Mafia: City Under Siege

A multiplayer GTA-style 3D browser game set in Constantine, Algeria. Players explore an open-world city, drive vehicles, complete missions, and interact with NPCs and other players in real time.

## Run & Operate

Three services run in parallel:

| Service | Workflow | Notes |
|---|---|---|
| Game client | `artifacts/constantine-mafia: web` | Vite dev server, hot reload |
| API + Socket.io | `artifacts/api-server: API Server` | Express 5, esbuild bundle |
| Mockup sandbox | `artifacts/mockup-sandbox: Component Preview Server` | Dev only, UI prototyping |

- `pnpm install` — install all workspace dependencies
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

**Required env:**
- `DATABASE_URL` — Postgres connection string (provided by Replit's built-in PostgreSQL)
- `SESSION_SECRET` — secret for session signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 19, Three.js via `@react-three/fiber` + `@react-three/drei`, Vite, Tailwind CSS 4, Zustand, Framer Motion
- **Backend:** Express 5, Socket.io (real-time multiplayer)
- **DB:** PostgreSQL (Replit built-in) + Drizzle ORM
- **Validation:** Zod (`zod/v4`), `drizzle-zod`
- **Build:** esbuild (API server CJS bundle)

## Where things live

```
artifacts/constantine-mafia/   Game client (React + Three.js)
  src/game/                    Core engine: GameEngine, Player, City, Vehicles, NPCs
  src/ui/                      HUD, Minimap, Radio, Shop panels
artifacts/api-server/          REST API + Socket.io server
  src/index.ts                 Entry point — Express + Socket.io setup
  src/routes/game.ts           Player CRUD and game-state endpoints
lib/db/                        Shared DB package (Drizzle schema + connection)
  src/schema/                  Source of truth for DB schema
lib/api-zod/                   Zod schemas generated from OpenAPI spec
lib/api-client-react/          React Query hooks generated from OpenAPI spec
```

## Architecture decisions

- **Monorepo with pnpm workspaces** — game client, API server, and shared libs are separate packages; `lib/db` is imported directly as a workspace dep so schema types are shared end-to-end.
- **Socket.io for multiplayer** — real-time player position sync goes through Socket.io; REST routes handle persistent state (player records, scores).
- **esbuild for API bundle** — the API server is bundled to a single CJS file for fast startup; source maps are emitted for debugging.
- **Drizzle ORM** — schema-first, all migrations run via `drizzle-kit push` in dev; Replit's Publish flow handles production schema diffs.

## Product

Players join an open 3D city, choose a character, and roam freely — on foot or in vehicles. Missions, NPCs, a day/night cycle, and a shop system provide progression. Real-time multiplayer lets players see and interact with each other in the same city instance.

## Gotchas

- `DATABASE_URL` must be set before the API server starts — it is provided automatically by Replit's built-in PostgreSQL.
- After any DB schema change, run `pnpm --filter @workspace/db run push` before restarting the API server.
- The API server dev script is build + start (no watch). Restart the workflow manually after backend changes.
- Socket.io client path is `/api/socket.io` — this must match the server's `path` option and the Vite proxy config.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Setup status

- Dependencies installed via `pnpm install`, DB schema pushed via `pnpm --filter @workspace/db run push`, and all three workflows (client, API server, mockup sandbox) are running.
- `DATABASE_URL` is provided automatically by Replit's built-in PostgreSQL; `SESSION_SECRET` is set.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- DB schema source of truth: `lib/db/src/schema/index.ts`
- API contract source of truth: `lib/api-spec/` (OpenAPI spec)
