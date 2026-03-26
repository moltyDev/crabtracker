# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── devfee-tracker/     # PumpFun Dev Fee Tracker React app (served at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## App: PumpFun Dev Fee Tracker

A dark cyberpunk-themed dashboard that monitors a Solana dev wallet and alerts you when:
1. The dev claims PumpFun creator fees (shown as FEE_CLAIM)
2. The dev buys DexScreener boosts (shown as DEX_BOOST)

### Features
- Enter any Solana wallet address to track
- Live feed of fee claims, DexScreener boosts, and transfers
- Stats: total fees claimed, boost count, boost spend
- Filter by event type
- Toast alerts for new events (polls every 10s)
- Dark yellow/black cyberpunk theme with crab logo

### Database Schema
- `tracked_wallets` - stores the active wallet being tracked
- `wallet_events` - stores all classified events (fee_claim, dex_boost, transfer)

### API Endpoints
- `GET /api/tracker/wallet` - get current tracked wallet
- `POST /api/tracker/wallet` - set wallet to track
- `GET /api/tracker/events?limit=50&type=all` - get events
- `GET /api/tracker/stats` - get stats summary

### Solana Integration
- Polls Solana mainnet via public RPC every 15 seconds
- Classifies transactions as: fee_claim (PumpFun address involved + SOL received), dex_boost (SOL sent to known DexScreener boost addresses), transfer (other SOL movements)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.
