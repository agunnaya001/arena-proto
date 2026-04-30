# Arena Protocol - Quick Start Guide

## Installation

```bash
# 1. Install all dependencies
pnpm install

# 2. Environment is automatically configured via Vercel integration
# No .env file needed!
```

## Development

```bash
# Start the dev server (runs on http://localhost:3000)
pnpm dev

# The app will automatically reload on file changes
```

## Database Setup

```bash
# Initialize the database schema (run once)
pnpm db:setup

# This creates all tables:
# - players
# - fighters
# - battles
# - marketplace_listings
# - price_history
# - seasons
# - season_stats
# - wallet_balances
```

## Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Testing

```bash
# Type check
pnpm typecheck

# Lint code
cd app && pnpm lint
```

## File Structure

```
arena-proto/
├── app/                          # Next.js 15 application
│   ├── app/                      # App Router
│   │   ├── page.tsx              # Home
│   │   ├── dashboard/page.tsx    # Dashboard
│   │   ├── leaderboard/page.tsx  # Leaderboard
│   │   ├── marketplace/page.tsx  # Marketplace
│   │   ├── profile/page.tsx      # Profile
│   │   ├── api/                  # API routes
│   │   │   ├── health/
│   │   │   ├── players/
│   │   │   ├── leaderboard/
│   │   │   ├── marketplace/
│   │   │   └── battles/
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── navbar.tsx
│   │   ├── providers.tsx
│   │   └── ui/                   # UI components
│   ├── lib/                      # Utilities
│   │   └── supabase.ts           # Supabase client
│   ├── public/                   # Static files
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── scripts/                      # Utility scripts
│   ├── setup-database.sql        # Database schema
│   └── run-migration.js          # Migration runner
├── contracts/                    # Smart contracts
├── package.json                  # Root dependencies
└── pnpm-workspace.yaml           # Workspace config
```

## Available Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/dashboard` | Player dashboard |
| `/leaderboard` | Global rankings |
| `/marketplace` | NFT marketplace |
| `/profile` | User profile |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/players` | GET | List players |
| `/api/leaderboard` | GET | Rankings |
| `/api/marketplace` | GET | Listings |
| `/api/battles` | GET/POST | Battle data |

## Environment Variables

All automatically provided by Vercel Supabase integration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_URL`

## Debugging

### Enable Next.js Debug Mode
```bash
# Add to .env.local
DEBUG=next:*
```

### Check Build Output
```bash
# See detailed build info
pnpm build --debug
```

### View Console Logs
```bash
# In development
pnpm dev
# Check terminal for logs
```

## Common Issues

### Build Fails
```bash
# Clear Next.js cache
rm -rf app/.next

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

### Database Not Connected
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Run migration
pnpm db:setup

# Check Supabase dashboard
# https://app.supabase.com/projects
```

### Pages Not Loading
1. Check browser console for errors (F12)
2. Check terminal for server errors
3. Verify Next.js server is running (`pnpm dev`)
4. Clear browser cache (Ctrl+Shift+Delete)

## Deployment to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Production-ready Next.js app"
git push origin v0/boomchainlabs-35d5a486

# Create PR to main branch
# Vercel will automatically create a preview deployment

# Once approved, merge to main
# Vercel will automatically deploy to production
```

## Useful Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Database
pnpm db:setup              # Initialize database

# Code Quality
pnpm typecheck             # TypeScript check
cd app && pnpm lint        # ESLint check

# Workspace
pnpm install               # Install all dependencies
pnpm -r list              # List all packages
```

## Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com
- **Radix UI:** https://radix-ui.com
- **Lucide Icons:** https://lucide.dev

## Support

For detailed information, see:
- `README.md` - Project overview
- `PRODUCTION_MIGRATION.md` - Migration details
- `DEPLOYMENT_SUMMARY.md` - Deployment guide
- `app/README.md` - App-specific docs

---

**Happy coding! 🚀**
