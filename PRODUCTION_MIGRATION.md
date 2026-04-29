# Production Migration to Next.js 15 + Supabase

## Overview

This document outlines the migration from a Vite + Express monorepo to a production-ready Next.js 15 application with Supabase PostgreSQL backend.

## What Changed

### New Structure
- **Production App**: `/app` directory with Next.js 15 App Router
- **Database**: Supabase PostgreSQL (replaces in-memory mock data)
- **API Routes**: Next.js API routes (replaces Express)
- **Deployment**: Vercel (replaces Replit)

### What's Preserved
- **Smart Contracts**: `/contracts` - unchanged, on Base blockchain
- **Hardhat Configuration**: unchanged
- **Original artifacts**: Kept for reference, marked as legacy

## Getting Started

### Prerequisites
```bash
Node.js 18+
pnpm package manager
Supabase project (connected via Vercel integration)
```

### Installation

```bash
# Install all dependencies
pnpm install

# Run database migrations
pnpm db:setup

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm db:setup` | Initialize database schema |
| `pnpm typecheck` | Run TypeScript type checking |

## Database

### Schema Setup
Run once to initialize all tables:
```bash
pnpm db:setup
```

This creates:
- `players` - User profiles
- `fighters` - NFT metadata
- `battles` - Battle history
- `marketplace_listings` - NFT listings
- `price_history` - Price tracking
- `seasons` - Tournament seasons
- `season_stats` - Seasonal leaderboards
- `wallet_balances` - Token balances

All tables have Row Level Security (RLS) policies and optimized indexes.

## API Endpoints

All endpoints are server-side rendered or use Next.js API routes:

```
GET  /api/health              - Server health check
GET  /api/leaderboard         - Top players
GET  /api/players             - Player list/search
GET  /api/marketplace         - NFT listings
GET  /api/battles             - Battle history
```

## Environment Variables

The Vercel integration automatically provides:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_URL`

No manual configuration needed for local development when using Vercel.

## Deployment to Production

### Via Vercel

1. Create a PR with these changes
2. Vercel automatically creates a preview deployment
3. Merge to main to deploy to production
4. Database migrations run automatically

### Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

## Legacy Code

The following directories are marked as legacy and can be removed in a future cleanup:
- `/artifacts/arena-protocol` (Vite app - replaced by Next.js)
- `/artifacts/api-server` (Express - replaced by Next.js API routes)
- `/backend/mock-server.js` (Mock data - uses real Supabase now)

## Next Steps

1. ✅ Database schema created
2. ✅ Next.js app scaffolded
3. ✅ API routes implemented
4. ✅ Environment variables configured
5. 🔄 Create PR to trigger preview
6. 🔄 Review preview deployment
7. 🔄 Merge to main for production
8. 🔄 Monitor production metrics

## Files Changed

### New Files
- `/app/` - Complete Next.js 15 application
- `/scripts/setup-database.sql` - Database migration
- `/scripts/run-migration.js` - Migration runner
- `/PRODUCTION_MIGRATION.md` - This file

### Modified Files
- `/package.json` - Added dev/build/start scripts
- `/pnpm-workspace.yaml` - Added app package

### Unchanged
- `/contracts/` - Smart contracts
- `/hardhat-scripts/` - Deployment scripts
- `/lib/` - Shared utilities

## Support

For questions or issues:
1. Check `/app/README.md` for app-specific documentation
2. Review Supabase docs: https://supabase.com/docs
3. Check Next.js docs: https://nextjs.org/docs

## Deployment Checklist

- [ ] Database migrations run successfully
- [ ] All API endpoints respond with test data
- [ ] Pages render without errors
- [ ] Environment variables are set in Vercel
- [ ] Preview deployment succeeds
- [ ] Production deployment succeeds
- [ ] Monitor dashboards show healthy metrics
