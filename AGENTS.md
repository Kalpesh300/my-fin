# Personal Finance App

This repository contains a personal finance application split into two main workspaces:

- `fe/` contains the frontend application.
- `be/` contains the backend application.

When working in either area, follow the more specific `AGENTS.md` file inside that directory.

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Run command | Notes |
|---------|------|-------------|-------|
| PostgreSQL | 5432 | `sudo docker compose up -d postgres` (from repo root) | Must be running before backend starts |
| Backend | 3000 | `cd be && npm run dev` | Uses tsx watch; requires `be/.env` (copy from `.env.example`) |
| Frontend | 5173 | `cd fe && npm run dev` | Vite HMR; no env config needed for local dev |

### Node.js version

The project requires Node.js 25 (see `.nvmrc`). The `/exec-daemon/node` binary in the VM is v22 and takes PATH priority over nvm. After sourcing nvm and running `nvm use 25`, explicitly prepend the nvm bin path:

```sh
export PATH="$HOME/.nvm/versions/node/v25.9.0/bin:$PATH"
```

This is already configured in `~/.bashrc` for new shells.

### Docker (PostgreSQL)

Docker is needed only to run PostgreSQL via `docker-compose.yml`. Start the daemon with `sudo dockerd` if it isn't already running, then `sudo docker compose up -d postgres` from the repo root. The backend `DATABASE_URL` defaults to `postgresql://postgres:postgres@localhost:5432/my_fin?schema=public`.

### Prisma

After installing backend dependencies, generate the Prisma client with `npx prisma generate` in the `be/` directory. The schema is at `be/prisma/schema.prisma`. There are currently no models/migrations, so `prisma migrate dev` is not needed until models are added.

### Lint & Build

- Backend: `npm run lint` (ESLint), `npm run build` (tsc)
- Frontend: `npm run lint` (ESLint), `npm run build` (tsc -b + vite build)

### Pre-commit / Pre-push hooks (Husky)

- Pre-commit runs `lint-staged` in both workspaces (eslint --fix + prettier --write).
- Pre-push runs `npm run build` (tsc) in both workspaces.
