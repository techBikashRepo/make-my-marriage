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

As of 2026-09-26, the application scaffold and public homepage are complete. The
homepage is a responsive, static presentation of the planned product. The first
authenticated product feature has not been implemented.

| Area | Status | What exists now |
| --- | --- | --- |
| Application foundation | Complete | Next.js App Router shell, TypeScript, Tailwind, project tooling, validated server configuration, shared HTTP/logging primitives, and cached Mongoose connection utility. |
| Public homepage | Complete | Responsive landing page with the approved content sections, Stitch-aligned branding, local fonts, and static dashboard/feature previews. |
| Phase 1 product behavior | Not started | Authentication, Wedding creation, Wedding Members, and the authenticated dashboard remain to be built. |
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
  data. The homepage does not create accounts, persist wedding data, or call a
  product API. Its planning actions currently lead to on-page previews because
  authentication routes are not implemented.

## Next milestone

The PRD's Phase 1 calls for authentication, Wedding creation, Wedding Members,
and an authenticated dashboard shell. Those are future, separate feature slices;
this status document does not authorize starting any of them. Follow the current
user request and the four authoritative design documents before implementing a
slice.
