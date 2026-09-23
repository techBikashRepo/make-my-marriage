<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Make My Marriage - Codex Project Guide

## Purpose of this file

This is the durable project handoff for coding agents working in this repository.
Read it completely before planning or changing code. It describes the approved
architecture, the implemented foundation, repository rules, verification commands,
and the boundary between completed work and future features.

This file is guidance, not a substitute for the authoritative design documents.
When implementation behavior is unclear, consult the documents in the source-of-truth
order below. Do not silently resolve a product or architecture conflict in code.

Keep the Next.js-managed block at the top of this file intact. Project-owned guidance
belongs outside its `BEGIN` and `END` markers.

## Project summary

Make My Marriage is a wedding-planning web application. V1 is designed as a
TypeScript modular monolith: one Next.js application contains the React user
interface, Node.js REST Route Handlers, application services, domain modules,
persistence adapters, and external integration adapters.

The eventual V1 platform is designed around:

- Next.js App Router on the Node.js runtime.
- TypeScript with strict compiler checks.
- MongoDB Atlas with Mongoose.
- Zod at every external HTTP input boundary.
- Versioned REST endpoints under `/api/v1`.
- A Wedding as the tenant and data-isolation boundary.
- Custom email/password authentication with opaque server-side sessions.
- Vercel deployment.
- Cloudflare R2, Resend, Google Places, and YouTube only in their approved later phases.

This is deliberately a modular monolith. Do not introduce microservices, Redis,
dedicated queues, realtime infrastructure, or additional deployment units unless an
approved architecture change requires them.

## Authoritative documents and precedence

The authoritative documents are:

1. `docs/product/PRD.md` - product behavior, scope, roles, workflows, and release phases.
2. `docs/architecture/SYSTEM_DESIGN.md` - architecture, security, runtime, module,
   integration, scaling, testing, and deployment decisions.
3. `docs/database/DATABASE_DESIGN.md` - MongoDB/Mongoose shapes, indexes, constraints,
   transaction boundaries, retention, and persistence invariants.
4. `docs/api/API_DESIGN.md` - REST routes, request/response contracts, error codes,
   authorization expectations, and HTTP behavior.

This ordering is authoritative when documents conflict. A product behavior change
must update the PRD first, then the downstream design documents. Do not modify these
documents, reinterpret their requirements, or create a competing design document
unless the user explicitly approves that work.

Before implementing a feature, read the relevant sections from all four documents.
Do not rely only on a summary in this file for detailed contracts or data models.

## Current delivery state

The approved application scaffold and foundation corrections are complete. The clean
baseline was committed on branch `dev` as commit `09726b5` with message
`Set up application foundation scaffold` and pushed to `origin/dev`.

Implemented now:

- Public landing page and application layout under `src/app`.
- Tailwind CSS and PostCSS configuration.
- Strict TypeScript configuration and the `@/*` alias to `src/*`.
- ESLint, Prettier, EditorConfig, Vitest, and V8 coverage configuration.
- Validated server configuration with Zod.
- A warm-runtime cached Mongoose connection utility with bounded pooling, concurrent
  connection sharing, failed-attempt reset, and stale-connection recovery.
- Common API error and response-envelope primitives.
- Safe request-ID/request-context generation.
- Structured JSON logging primitives.
- Unit tests for configuration, request IDs, response envelopes, unexpected-error
  sanitization, and Mongoose connection-cache behavior.
- A safe `.env.example` containing placeholders only.

Not implemented:

- Authentication or session management.
- User, Wedding, or Wedding Member models.
- Wedding creation or joining.
- Dashboard product behavior.
- Events, Tasks, Guests, Invitations, RSVP, Vendors, Expenses, Website, or Gallery.
- Email, Cloudflare R2, Google Places, or other provider integrations.
- Product API Route Handlers under `/api/v1`.
- Vercel deployment configuration beyond the application-compatible foundation.

The next product milestone is Phase 1 / Feature 1, but it must not be started merely
because this file mentions it. Implement only the feature and slice explicitly approved
in the current user request. Do not pre-build later-phase modules or install speculative
dependencies.

## Toolchain and package manager

Required local toolchain:

- Node.js `24.21.0`, pinned in `.nvmrc`.
- pnpm `12.5.1`, pinned by `packageManager` in `package.json`.
- Use pnpm only. Do not create npm, Yarn, or Bun lockfiles.

On Windows, confirm the active runtime before any install or verification:

```powershell
node --version
pnpm --version
```

Expected values are `v24.21.0` and `12.5.1`. Some machines may still resolve a
system-wide Node 22 first. Activate Node 24 using the configured version manager or
correct the terminal `PATH` before running project commands. Do not weaken the engine
constraint to accommodate an incorrectly configured terminal.

Install from the committed lockfile with:

```powershell
pnpm install --frozen-lockfile
```

Do not upgrade dependencies or edit `pnpm-lock.yaml` unless the current task explicitly
requires a dependency change. Add only dependencies required by the approved slice.

## Current direct dependencies

Runtime:

- `next`
- `react`
- `react-dom`
- `mongoose`
- `zod`
- `server-only`

Development:

- TypeScript and Node/React type definitions.
- ESLint with `eslint-config-next`.
- Prettier with `prettier-plugin-tailwindcss`.
- Tailwind CSS with `@tailwindcss/postcss`.
- Vitest with V8 coverage.

Treat `package.json` and `pnpm-lock.yaml` as the exact version record. The package list
above describes purpose and intentionally does not duplicate every pinned patch version.

## Environment configuration

Copy `.env.example` to `.env.local` for local runtime configuration. Never commit
`.env`, `.env.local`, provider credentials, session secrets, database credentials, or
other real secret values.

Current variables:

- `APP_BASE_URL` - public application origin used for absolute URLs.
- `MONGODB_URI` - server-only MongoDB connection URI.
- `MONGODB_MAX_POOL_SIZE` - positive integer, default `10`, maximum `50`.

Rules:

- Keep secret variables server-only and never prefix them with `NEXT_PUBLIC_`.
- Add every new required variable to the Zod environment schema and `.env.example` in
  the same change.
- Keep placeholder values in `.env.example`; never add usable credentials.
- Runtime configuration is validated lazily when server infrastructure uses it, so the
  static shell and production build do not require live MongoDB credentials.

## Repository structure

Current foundation:

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  integrations/
    mongodb/
      connection.ts
      connection.test.ts
  shared/
    config/
      env.ts
      env.schema.ts
      env.schema.test.ts
    errors/
      api-error.ts
    http/
      request-context.ts
      request-context.test.ts
      response.ts
      response.test.ts
    logging/
      logger.ts
```

Approved growth direction from the System Design:

```text
src/
  app/              # pages, layouts, and thin REST Route Handlers
  modules/          # auth and business-domain modules
  integrations/     # MongoDB and external provider adapters
  shared/           # cross-cutting infrastructure with no domain ownership
```

Within a domain module, prefer explicit schemas, models, repositories, services, and
types where justified. Do not create generic base repositories or abstraction layers
before more than one concrete use case proves they are needed.

## Layering and dependency rules

Preferred dependency flow:

```text
UI / Route Handler
  -> Application or Domain Service
    -> Repository or Integration Adapter
      -> MongoDB or external provider
```

- Pages and components render UI and collect input; they do not contain persistence
  logic.
- Route Handlers parse HTTP, create request context, validate with Zod, authenticate,
  authorize, call a service, and map the response. Keep them thin.
- Services own orchestration, product rules, and domain invariants. They must not depend
  on HTTP-specific request or response objects.
- Repositories own Mongoose queries and persistence mechanics. They must not make
  product-policy decisions.
- Integration adapters isolate external provider SDKs and provider-specific behavior.
- Shared infrastructure must not acquire domain-specific business rules.
- Modules communicate through exported service contracts. Avoid importing another
  module's Mongoose model and writing directly to its collection.
- Server Components may call application services directly for server-rendered reads.
  Do not make loopback HTTP calls from the server to this application's own REST API.

## Next.js rules

- This repository uses the App Router and `src/` layout.
- Before writing Next.js-specific code, read the relevant installed documentation under
  `node_modules/next/dist/docs/`; the installed Next 16 behavior takes precedence over
  remembered APIs from older versions.
- Use the Node.js runtime for Mongoose and server SDK Route Handlers. Do not move them to
  Edge runtime unless the exact integration is explicitly validated.
- Keep server-only modules protected with `server-only` when they hold configuration,
  database access, credentials, or privileged behavior.
- `next-env.d.ts` is generated by Next.js and intentionally ignored by Git.
- Preserve the Next.js-managed section at the top of this file.

## TypeScript and import rules

- Keep `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, and `noFallthroughCasesInSwitch` enabled.
- Do not use `any` to bypass a design or typing problem. Narrow `unknown` explicitly.
- Use `@/*` for imports rooted at `src/*` when it improves clarity.
- Prefer immutable inputs and `Readonly` shapes at boundaries where practical.
- Keep client DTOs separate from Mongoose documents.
- Do not expose internal persistence objects directly in HTTP responses.

## HTTP and API conventions

- Public application APIs are versioned under `/api/v1`.
- Zod is the authoritative path, query, and body validation boundary.
- Never pass raw client JSON into MongoDB queries or update operators.
- Allow-list accepted fields and construct query/update objects server-side.
- Every response must include a request ID in `meta.requestId`.
- A safe incoming request ID may be propagated; otherwise generate one with the shared
  request-context primitive.
- Use the shared success and error envelope helpers rather than inventing per-route
  response shapes.

Success envelope:

```json
{
  "data": {},
  "meta": { "requestId": "req_..." }
}
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  },
  "meta": { "requestId": "req_..." }
}
```

- Machine-readable codes use stable uppercase snake case.
- Unknown exceptions must become sanitized `INTERNAL_ERROR` responses. Never return a
  raw stack trace, database error, provider response, secret, or credential detail.
- Follow the status-code and endpoint contracts in `docs/api/API_DESIGN.md`.
- Mutating handlers should follow: request context -> parsing -> Zod validation ->
  authentication -> tenant/role authorization -> service -> persistence -> response.

## Database and tenant-safety rules

- MongoDB Atlas is the operational database and Mongoose is the ODM.
- Reuse the shared cached connection across warm runtime invocations.
- Keep connection pool sizes bounded; serverless instances scale horizontally.
- Use Mongoose validation as a persistence safety net, not as the only input boundary.
- Define indexes intentionally. Do not rely on uncontrolled production auto-indexing.
- Use UTC timestamps and Mongoose `timestamps: true` where the database design calls
  for normal mutable records.
- Use `.lean()` for read-only queries when full Mongoose documents are unnecessary.
- Critical authorization or business rules must not exist only in Mongoose middleware.

The Wedding is the tenant boundary:

- Every Wedding-owned record and authenticated domain operation must be scoped by
  `weddingId` as specified by the database design.
- A resource ID by itself is never sufficient authorization.
- Derive tenant context from the authenticated user's Wedding membership; never trust a
  client-supplied `weddingId` as authority.
- V1 permits exactly one Wedding membership per authenticated user, enforced by the
  documented unique database constraint as well as application behavior.
- Cross-Wedding reads, writes, identifier probing, and error leakage are security bugs.

## Authentication boundary for future work

Authentication is not implemented yet. When it is explicitly approved:

- Follow the custom email/password and MongoDB-backed opaque-session design. Do not add
  Clerk, Auth0, Better Auth, or another auth framework without an approved design change.
- Store password hashes, never plaintext or reversible passwords.
- Store only hashes of opaque session tokens in MongoDB; raw session tokens belong only
  in appropriately secured cookies.
- Use generic credential failures that do not disclose whether an email exists.
- Keep authentication, session resolution, tenant resolution, and role authorization as
  distinct concerns.
- Read the complete authentication sections in all authoritative documents before
  selecting hashing packages, cookie settings, TTLs, indexes, or transaction behavior.

Do not install an authentication dependency merely because authentication is next.
Select and install it only as part of an explicitly approved Feature 1 plan.

## Logging and security

- Use the structured JSON logger instead of ad-hoc server logging.
- Include useful safe context such as request ID, route, action, status, duration,
  authenticated user ID, and Wedding ID when available.
- Never log passwords, cookies, raw session or capability tokens, password-reset tokens,
  signed URLs, provider secrets, authorization headers, or full sensitive payloads.
- Do not expose whether a protected resource exists outside the authorized tenant.
- Treat names, emails, phone numbers, addresses, RSVP state, Wedding dates, and vendor
  contacts as sensitive personal data.
- Fail closed when authentication, authorization, token validation, or a critical
  dependency cannot be established.

## Tests and verification

Tests are colocated with the foundation modules and run in Vitest's Node environment.
Use mocked infrastructure for unit tests; do not require real Atlas or provider
credentials for the unit suite.

Current baseline after foundation corrections:

- 4 test files.
- 16 passing tests.
- 100% statements, lines, and functions for the measured foundation modules.
- 95.45% branch coverage.

Coverage numbers are historical context, not a license to weaken future assertions or
exclude meaningful code. Test behavior and security boundaries, not just lines.

Required checks before handing off an implementation change:

```powershell
pnpm run format:check
pnpm run typecheck
pnpm run lint
pnpm run test:unit
pnpm run build
```

Run `pnpm run test:coverage` when shared infrastructure or security-sensitive behavior
changes. For a significant UI or Route Handler change, also run the built application
and perform an appropriate HTTP/browser smoke test.

Do not claim success if a required check was skipped. Report the command, outcome,
warnings, and reason for any omission.

## Working practices for Codex

For every new task:

1. Read this file and inspect the current Git status before changing files.
2. Read the relevant authoritative document sections.
3. For Next.js work, read the relevant installed Next.js documentation.
4. Restate scope and identify files/dependencies when the user asks for a plan or when
   the change is broad.
5. Preserve unrelated user changes and authoritative documents.
6. Implement the smallest complete vertical slice that satisfies the approved request.
7. Add or update tests with the implementation.
8. Run verification proportional to the risk, including all required checks for a
   completed feature or foundation change.
9. Report files changed, dependencies changed, validation results, warnings, and any
   deviation from the approved plan.
10. Stop at the requested boundary; do not begin the next feature automatically.

Do not:

- Treat a discussion, roadmap mention, or document section as authorization to build it.
- Modify authoritative documents as a side effect of implementation.
- Add speculative packages, abstractions, routes, models, or integrations.
- Delete, reset, overwrite, or reformat unrelated user work.
- Commit or push unless the user explicitly asks.
- weaken lint, TypeScript, validation, or tests merely to make a check pass.

## Git workflow and repository state

- `main` is the original repository baseline.
- Active development is on `dev`, tracking `origin/dev`.
- The scaffold baseline commit is `09726b5`.
- Use focused commits with imperative messages after checks pass.
- Before committing, inspect the staged file list and scan for secrets.
- Never commit `.env*` runtime files; `.env.example` is intentionally tracked.
- Do not force-push, rewrite shared history, or merge branches unless explicitly asked.

Git may warn that `C:\Users\BIKASH\.config\git\ignore` is inaccessible in restricted
automation environments. This warning did not affect the scaffold commit or push. Do
not modify files outside the repository merely to suppress it unless the user requests
that machine-level configuration change.

## Known operational facts

- The public `/` landing page builds and returns HTTP 200 in production mode.
- The landing page deliberately does not connect to MongoDB.
- The MongoDB utility is unit-tested with mocks but has not yet been integration-tested
  against a real Atlas deployment.
- Ports 3000 or 3100 may occasionally be occupied locally. Inspect the listener before
  terminating anything, and use an unused port for a smoke test when appropriate.
- `CLAUDE.md` contains `@AGENTS.md`, so compatible Claude tooling receives this guide
  without maintaining a second divergent copy.

## Maintaining this guide

Update the project-owned sections of this file when a durable fact changes, including:

- completion of a feature or phase;
- new architectural or security decisions;
- new required environment variables;
- changes to verification commands or toolchain versions;
- new integrations or repository-level conventions.

Do not turn this file into a chronological work log. Keep durable constraints and the
current implementation state here; use Git history for detailed change history. Preserve
the Next.js-managed block verbatim and keep `CLAUDE.md` as the single reference to this
file unless there is a compelling tool-compatibility reason to do otherwise.
