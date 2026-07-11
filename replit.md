# Constantine Mafia: City Under Siege

A multiplayer browser-based mafia game set in Constantine, Algeria. Players choose a career path, complete missions, earn money, and compete on a leaderboard — all in real-time.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS v4, Wouter |
| Backend | Express 5, Socket.IO, Pino logging |
| Database | PostgreSQL via Drizzle ORM |
| Shared libs | `lib/db` (schema + client), `lib/api-zod` (Zod schemas) |
| Monorepo | pnpm workspaces |

## Project structure

```
artifacts/
  constantine-mafia/   # React/Vite frontend (preview path: /)
  api-server/          # Express + Socket.IO backend (preview path: /api)
  mockup-sandbox/      # Design/canvas preview server
lib/
  db/                  # Drizzle schema + PostgreSQL client
  api-zod/             # Shared Zod API schemas
config/
  platforms/           # Platform-specific config (PC, iOS, Android)
```

## Running locally on Replit

Both services start automatically via configured workflows:

- **Frontend** (`artifacts/constantine-mafia: web`): `pnpm --filter @workspace/constantine-mafia run dev`
- **API Server** (`artifacts/api-server: API Server`): `pnpm --filter @workspace/api-server run dev`

The API server builds with esbuild then starts the compiled output.

## Environment variables

- `DATABASE_URL` — auto-provided by Replit's managed PostgreSQL (runtime-managed, do not set manually)
- `SESSION_SECRET` — stored as a Replit Secret
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Replit-managed Clerk (do not set manually)

## Database

Schema is managed by Drizzle ORM. To push schema changes to the development database:

```bash
cd lib/db && npx drizzle-kit push
```

Production schema migrations are handled automatically by Replit's Publish flow.

## Languages

The game supports EN, AR (Arabic), and FR (French).

## User preferences

_None recorded yet._
