# StackDesk

Full-stack merchant onboarding and payout reconciliation admin built with **TanStack Start**. Portfolio capstone demonstrating type-safe routes, server functions, Drizzle ORM, and fintech-style audit trails.

## Stack

- TanStack Start, TanStack Router, TanStack Query, React 19
- Drizzle ORM, SQLite (`better-sqlite3`)
- Zod, Tailwind CSS v4 (Olive Sage admin theme)
- Vitest, Playwright

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials

| Email                     | Password   | Role                                            |
| ------------------------- | ---------- | ----------------------------------------------- |
| `admin@stackdesk.demo`    | `demo1234` | admin — full access including audit log         |
| `reviewer@stackdesk.demo` | `demo1234` | reviewer — merchants + reconciliation, no audit |

## Docker (optional)

```bash
docker compose up --build
```

App runs at [http://localhost:3000](http://localhost:3000) with SQLite persisted in a Docker volume.

Optional Postgres for production exploration:

```bash
docker compose --profile postgres up --build
```

The app uses SQLite by default; switching to Postgres requires a Drizzle dialect change.

## Scripts

| Command                   | Description                     |
| ------------------------- | ------------------------------- |
| `pnpm dev`                | Start dev server (port 3000)    |
| `pnpm build`              | Production build                |
| `pnpm preview`            | Serve production build          |
| `pnpm generate-routes`    | Regenerate route tree           |
| `pnpm typecheck`          | TypeScript check                |
| `pnpm test`               | Vitest unit + integration tests |
| `pnpm test:e2e`           | Playwright e2e tests            |
| `pnpm playwright:install` | Install Chromium to local cache |
| `pnpm db:generate`        | Generate Drizzle migrations     |
| `pnpm db:migrate`         | Apply migrations                |
| `pnpm db:seed`            | Seed demo data                  |

## Architecture

```
Browser → TanStack Router (loaders) → Server functions (Zod) → Drizzle → SQLite
                ↓
         TanStack Query (mutations + invalidation)
```

**Server functions (14):** auth, dashboard stats, merchants (list/detail/approve/reject), onboarding (draft/save/submit), reconciliation (list/detail/resolve), audit log.

**Roles:** `admin` sees audit log; `reviewer` handles merchants and reconciliation only.

## Routes

| Route                      | Access | Description                          |
| -------------------------- | ------ | ------------------------------------ |
| `/login`                   | Public | Session sign-in                      |
| `/dashboard`               | Auth   | KPI cards                            |
| `/merchants`               | Auth   | Paginated list with `?status=&page=` |
| `/merchants/$merchantId`   | Auth   | Detail, documents, approve/reject    |
| `/onboarding`              | Auth   | 4-step merchant wizard               |
| `/reconciliation`          | Auth   | Batch list with status filters       |
| `/reconciliation/$batchId` | Auth   | Transactions vs batch total, resolve |
| `/audit`                   | Admin  | Paginated system audit trail         |

## Testing

```bash
pnpm test          # 32 unit/integration tests
CI=true pnpm test:e2e   # 6 Playwright flows
```

CI runs typecheck, unit tests, build, and e2e on every push (see `.github/workflows/ci.yml`).

## License

MIT
