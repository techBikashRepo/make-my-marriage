# Make My Marriage — Project Status

This document tracks what has been delivered in the repository. It is an implementation
record, not a source of product requirements or architecture decisions. The PRD,
System Design, Database Design, and API Design remain authoritative in the order
listed in `AGENTS.md`.

Update this document when a major feature or milestone is completed. Keep the current
state accurate, add a concise completed-milestone entry, and distinguish working
product behavior from static previews or planned features. Record meaningful
verification and known limitations. Do not mark a feature complete solely because
the public homepage depicts it.

## Current state

As of 2026-09-28, the scaffold, public homepage, authentication/password recovery,
and protected dashboard landing page are complete. The homepage remains a static
presentation of planned wedding features. Wedding setup and data-driven dashboard
cards are still pending.

| Area | Status | What exists now |
| --- | --- | --- |
| Application foundation | Complete | Next.js App Router shell, TypeScript, Tailwind, project tooling, validated server configuration, shared HTTP/logging primitives, and cached Mongoose connection utility. |
| Public homepage | Complete | Responsive landing page with the approved content sections, Stitch-aligned branding, local fonts, and static dashboard/feature previews. |
| Account access and recovery | Implemented; live integration pending | Signup, login, logout, current account, forgot/reset password, secure sessions, rate limits, and auth pages. |
| Protected dashboard landing | Complete | Successful signup/login leads to `/dashboard`; the page resolves the server-side session and shows the current membership or the Create/Join paths. `/account` redirects there. |
| Wedding setup and dashboard data | Not started | Wedding creation, joining, member management, and live dashboard cards remain to be built. |
| Later product phases | Not started | Events, tasks, guests/RSVP, expenses/vendors, wedding website, gallery, and provider integrations remain to be built. |

## Completed milestones

### 1. Application scaffold and foundation

- **Commit:** `09726b5` — `Set up application foundation scaffold`
- **Delivered:** App Router shell; Tailwind/PostCSS; strict TypeScript; ESLint,
  Prettier, and Vitest; Zod-validated server configuration; MongoDB connection
  caching; API response/error and request-context primitives; structured logging;
  `.env.example` placeholders; foundation unit tests.
- **Verification:** The foundation baseline passed formatting, type checking,
  linting, unit tests, and a production build. Its four unit-test files contained
  16 passing tests. The MongoDB utility was tested with mocks, not a live Atlas
  connection.

### 2. Public homepage

- **Commits:** `fe87bbb` — `Add public wedding planning landing page`;
  `ee6eeb7` — `Match homepage to Stitch design`
- **Delivered:** Navigation and hero; static product dashboard preview; planning
  problem and shared-workspace comparison; core feature cards; family
  collaboration; wedding website and gallery previews; how-it-works and privacy
  sections; final call to action and footer. The final visual revision added the
  approved Stitch logo, locally hosted fonts, and corrected header, hero, and
  dashboard composition.
- **Verification:** Formatting, type checking, linting, all 16 foundation unit
  tests, and the production build passed. The built page was visually checked at
  desktop and mobile widths without browser console errors.
- **Limitations:** Dashboard figures and feature examples are static presentation
  data. The homepage now links its account actions to signup/login, but its product
  previews do not persist wedding data.

### 3. Account access and password recovery

- **Delivered:** Zod-validated signup, login, logout, current-account, forgot-password,
  and reset-password REST routes; bcrypt password hashes; MongoDB-backed opaque sessions
  and one-time reset tokens; same-origin checks; rate limiting; Resend reset delivery;
  signup/login/recovery pages and a signed-in account page. Homepage account actions
  now lead to the corresponding pages.
- **Security:** Raw session/reset tokens are never stored in MongoDB; reset consumes its
  token and revokes sessions in a transaction. Production auth indexes are created by
  `pnpm run db:ensure-auth-indexes`, with automatic production indexing disabled.
- **Verification:** `format:check`, `typecheck`, `lint`, `test:unit` (31 passing),
  `test:coverage` (31 passing), and `build` passed. Production-mode HTTP checks
  returned 200 for public auth pages, 307 from `/account` when signed out, 401
  from `/auth/me`, 400 for invalid signup input, 403 for a cross-origin mutation,
  and 204 with a cleared cookie for repeated logout. A separate read-only Mongoose
  connection and `ping` to the local configuration's Atlas database `mmm-db` succeeded.
- **Limitations:** The live signup/session/reset flows and Resend delivery have not
  been integration-tested. Wedding creation and joining remain the next separate
  feature.

### 4. Protected dashboard landing

- **Delivered:** Signup and login navigate to `/dashboard`. The protected page
  resolves the session on the server and redirects signed-out visitors to login.
  Accounts without a Wedding see the documented Create or Join paths; existing
  members see their workspace role. The former `/account` URL redirects to the
  dashboard.
- **Verification:** Formatting, type checking, linting, all 31 unit tests, and the
  production build passed. Production-mode HTTP checks returned 307 from
  `/account` to `/dashboard`, 307 from `/dashboard` to `/login` when signed out,
  and 200 for `/login`.
- **Limitations:** The Create/Join flows and data-driven dashboard cards belong to
  later feature slices. No sample figures are presented as live Wedding data.

## Next milestone

The PRD's Phase 1 next calls for Wedding creation, Wedding Members,
and an authenticated dashboard shell. Those are future, separate feature slices;
this status document does not authorize starting any of them. Follow the current
user request and the four authoritative design documents before implementing a
slice.
