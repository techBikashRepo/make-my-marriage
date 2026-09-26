# Make My Marriage

**Plan your wedding. Together.**

Make My Marriage is a modern collaborative wedding-planning platform
designed primarily for Indian weddings.

It provides couples and their families with one shared workspace for
managing wedding planning from start to finish.

## Core Features

- Wedding setup
- Multiple wedding events
- Tasks and planning
- Wedding Members / organizers
- Guest management
- Digital invitations
- RSVP tracking
- Expense tracking
- Vendor management
- Vendor discovery
- Wedding website
- Private photo gallery
- Guest photo uploads
- Wedding QR code
- YouTube livestream
- Email reminders

## Technology Stack

- Next.js
- TypeScript
- Node.js
- Next.js Route Handlers
- REST APIs
- MongoDB Atlas
- Mongoose
- Zod
- Cloudflare R2
- Resend
- Google Places API
- Vercel

## Architecture

Make My Marriage uses a modular monolith architecture.

The Wedding is the application's tenant boundary.

See:

- `docs/product/PRD.md`
- `docs/architecture/SYSTEM_DESIGN.md`
- `docs/database/DATABASE_DESIGN.md`
- `docs/api/API_DESIGN.md`

## Development

Use Node.js `24.21.0` and pnpm `12.5.1`:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm dev
```

Set a working MongoDB Atlas URI in `.env.local` for account features. Configure a
verified Resend sender and API key to deliver password-reset email. The public
homepage can run without those services. Before production authentication traffic,
create the documented unique and TTL indexes with
`pnpm run db:ensure-auth-indexes` in an environment where `MONGODB_URI` is set.

Run `pnpm run format:check`, `pnpm run typecheck`, `pnpm run lint`,
`pnpm run test:unit`, and `pnpm run build` before handing off changes.

## Status

🚧 V1 currently under development.
