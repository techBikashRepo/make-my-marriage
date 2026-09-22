# Make My Marriage

# System Design Architecture Document

**Version:** 1.0  
**Status:** Draft for Architecture Review  
**Date:** 21 September 2026  
**Source of Truth:** Make My Marriage PRD V1.1 - Approved for System Design / Reconciled Baseline  
**Architecture Style:** TypeScript Modular Monolith  
**Deployment Target:** Vercel

---

## 0. Document Control

| Item | Value |
|---|---|
| Product | Make My Marriage |
| Document | System Design Architecture Document |
| Version | 1.0 |
| Status | Draft for Architecture Review |
| Product baseline | PRD V1.1 reconciled baseline |
| Primary audience | Engineering, architecture, product, QA, future maintainers |
| Architecture boundary | V1 / MVP |
| Change rule | Product behavior must not be changed by this document; scope changes must first update the PRD |

### 0.1 Purpose

This document converts the approved V1.1 Product Requirements Document into an implementation-ready system architecture. It defines the runtime topology, module boundaries, REST API conventions, authentication and authorization model, Wedding-level multi-tenancy, MongoDB data model, Cloudflare R2 media architecture, Resend email processing, integration boundaries, security controls, failure behavior, scaling strategy, operational model, testing strategy, and architecture decisions for V1.

### 0.2 Architecture Summary

Make My Marriage will be implemented as a **TypeScript modular monolith**. Next.js is used for both the React frontend and Node.js backend APIs. All externally meaningful application operations have explicit REST API contracts implemented with Next.js Route Handlers. MongoDB Atlas is the operational database and Mongoose is the ODM. The **Wedding** is the application tenant boundary. Authenticated Wedding Members use custom session-based email/password authentication. Guests remain login-free and access invitation and gallery experiences with secure bearer tokens. Cloudflare R2 stores media using direct signed uploads. Resend delivers transactional and batched email. Google Places powers vendor discovery. Vercel hosts the application and triggers lightweight background email processing.

### 0.3 Approved Technology Baseline

| Area | Decision |
|---|---|
| Architecture | Modular monolith |
| Frontend | Next.js + TypeScript |
| Backend | Next.js Route Handlers on Node.js runtime |
| Separate backend | No Express / NestJS service |
| API style | Explicit REST APIs, versioned under `/api/v1` |
| Request validation | Zod |
| Persistence | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | Custom session-based email/password |
| Auth SaaS / framework | No Better Auth, Clerk, Auth0 |
| Email ownership verification | Not required in V1 |
| Roles | Admin, Manager |
| Guest authentication | No login; secure token-based access |
| Hosting | Vercel |
| Media | Cloudflare R2 |
| Media upload | Direct browser-to-R2 using signed upload URL |
| Email | Resend |
| Background email | MongoDB-backed lightweight jobs in small batches |
| Vendor discovery | Google Places API |
| Livestream | YouTube embed |
| Real-time | None in V1 |
| Redis | Not initially |
| External monitoring | None initially |
| Product analytics | None in MVP |
| Logging | Basic structured application/server logs |
| Backups | MongoDB Atlas managed backups |
| Deletion | Domain-specific hard delete with safeguards |

### 0.4 Explicit V1 Architecture Non-Goals

The architecture deliberately does **not** introduce microservices, a separate Express/NestJS backend, Redis, Kafka, RabbitMQ, SQS, a dedicated job worker service, WebSockets, custom livestreaming infrastructure, a photo-moderation queue, external observability SaaS, product analytics tooling, or subscription billing.

---

## 1. Architectural Drivers

The design is primarily driven by the following product characteristics:

1. A Wedding is a collaborative workspace managed by several authenticated family members.
2. V1 supports only one Wedding membership per authenticated user, but each Wedding can have multiple Admins and Managers.
3. Guests are intentionally unauthenticated and must have low-friction invitation, RSVP, gallery, and upload experiences.
4. Strict cross-Wedding isolation is mandatory.
5. Guest counts can reach approximately 1,000 per Wedding.
6. Photo volume can reach approximately 5,000 images per Wedding.
7. The platform should grow to thousands of active Weddings without redesigning the core architecture.
8. Email actions may target hundreds of Guests, but V1 should not add dedicated queue infrastructure.
9. Wedding photos are large binary objects and must not be stored in MongoDB or routinely proxied through the Next.js server.
10. The project should remain understandable and educational while using production-style boundaries and security practices.

### 1.1 Quality Attributes

| Attribute | Architectural response |
|---|---|
| Simplicity | One deployable modular monolith; managed external services |
| Security | Opaque server-side sessions, password hashing, token hashing, Wedding-scoped authorization, secure cookies, rate controls |
| Maintainability | Domain modules, thin Route Handlers, service/repository separation, Zod contracts |
| Scalability | Indexed Wedding-scoped collections, cursor pagination, direct R2 uploads, asynchronous email batches |
| Reliability | Idempotent operations, atomic job claiming, transactions for multi-document invariants, provider failure isolation |
| Cost control | No always-on workers, no Redis, no message broker, no custom media pipeline |
| Mobile performance | Direct media upload, paginated galleries, lazy loading, small API payloads |
| Operational clarity | Structured logs, request IDs, explicit job states, managed database backups |

---

## 2. System Context

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="682pt" height="344pt"
 viewBox="0.00 0.00 682.00 344.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 326)">
<title>G</title>
<!-- admin -->
<g id="node1" class="node">
<title>admin</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M94,-206C94,-206 12,-206 12,-206 6,-206 0,-200 0,-194 0,-194 0,-182 0,-182 0,-176 6,-170 12,-170 12,-170 94,-170 94,-170 100,-170 106,-176 106,-182 106,-182 106,-194 106,-194 106,-200 100,-206 94,-206"/>
<text text-anchor="middle" x="53" y="-191" font-family="Arial" font-size="10.00">Wedding Members</text>
<text text-anchor="middle" x="53" y="-180" font-family="Arial" font-size="10.00">Admin / Manager</text>
</g>
<!-- app -->
<g id="node3" class="node">
<title>app</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="2" d="M353,-177.5C353,-177.5 263,-177.5 263,-177.5 257,-177.5 251,-171.5 251,-165.5 251,-165.5 251,-142.5 251,-142.5 251,-136.5 257,-130.5 263,-130.5 263,-130.5 353,-130.5 353,-130.5 359,-130.5 365,-136.5 365,-142.5 365,-142.5 365,-165.5 365,-165.5 365,-171.5 359,-177.5 353,-177.5"/>
<text text-anchor="middle" x="308" y="-162.5" font-family="Arial" font-size="10.00">Make My Marriage</text>
<text text-anchor="middle" x="308" y="-151.5" font-family="Arial" font-size="10.00">Next.js + TypeScript</text>
<text text-anchor="middle" x="308" y="-140.5" font-family="Arial" font-size="10.00">Modular Monolith</text>
</g>
<!-- admin&#45;&gt;app -->
<g id="edge1" class="edge">
<title>admin&#45;&gt;app</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M106.11,-181C145.99,-175.64 201.16,-168.22 243.59,-162.52"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="243.94,-164.95 250.56,-161.59 243.29,-160.09 243.94,-164.95"/>
<text text-anchor="middle" x="178.5" y="-179.8" font-family="Arial" font-size="9.00">Authenticated web app</text>
</g>
<!-- guest -->
<g id="node2" class="node">
<title>guest</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M71.5,-138C71.5,-138 34.5,-138 34.5,-138 28.5,-138 22.5,-132 22.5,-126 22.5,-126 22.5,-114 22.5,-114 22.5,-108 28.5,-102 34.5,-102 34.5,-102 71.5,-102 71.5,-102 77.5,-102 83.5,-108 83.5,-114 83.5,-114 83.5,-126 83.5,-126 83.5,-132 77.5,-138 71.5,-138"/>
<text text-anchor="middle" x="53" y="-123" font-family="Arial" font-size="10.00">Guests</text>
<text text-anchor="middle" x="53" y="-112" font-family="Arial" font-size="10.00">No login</text>
</g>
<!-- guest&#45;&gt;app -->
<g id="edge2" class="edge">
<title>guest&#45;&gt;app</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M83.52,-123.97C122.61,-129.22 192.58,-138.62 243.84,-145.51"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="243.68,-147.96 250.95,-146.47 244.34,-143.11 243.68,-147.96"/>
<text text-anchor="middle" x="178.5" y="-145.8" font-family="Arial" font-size="9.00">Invitation / gallery token</text>
</g>
<!-- atlas -->
<g id="node4" class="node">
<title>atlas</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M608,-308C608,-308 539,-308 539,-308 533,-308 527,-302 527,-296 527,-296 527,-284 527,-284 527,-278 533,-272 539,-272 539,-272 608,-272 608,-272 614,-272 620,-278 620,-284 620,-284 620,-296 620,-296 620,-302 614,-308 608,-308"/>
<text text-anchor="middle" x="573.5" y="-293" font-family="Arial" font-size="10.00">MongoDB Atlas</text>
<text text-anchor="middle" x="573.5" y="-282" font-family="Arial" font-size="10.00">Mongoose</text>
</g>
<!-- app&#45;&gt;atlas -->
<g id="edge3" class="edge">
<title>app&#45;&gt;atlas</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M337.05,-177.78C351.88,-189.62 370.75,-203.6 389,-214 431.16,-238.03 482.43,-258.61 520.04,-272.27"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="519.49,-274.67 526.9,-274.74 521.15,-270.06 519.49,-274.67"/>
<text text-anchor="middle" x="433" y="-255.8" font-family="Arial" font-size="9.00">Business data</text>
</g>
<!-- r2 -->
<g id="node5" class="node">
<title>r2</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M621,-240C621,-240 526,-240 526,-240 520,-240 514,-234 514,-228 514,-228 514,-216 514,-216 514,-210 520,-204 526,-204 526,-204 621,-204 621,-204 627,-204 633,-210 633,-216 633,-216 633,-228 633,-228 633,-234 627,-240 621,-240"/>
<text text-anchor="middle" x="573.5" y="-225" font-family="Arial" font-size="10.00">Cloudflare R2</text>
<text text-anchor="middle" x="573.5" y="-214" font-family="Arial" font-size="10.00">Private media objects</text>
</g>
<!-- app&#45;&gt;r2 -->
<g id="edge4" class="edge">
<title>app&#45;&gt;r2</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M365.2,-168.5C406.67,-179.2 463.21,-193.8 506.77,-205.04"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="506.25,-207.43 513.64,-206.81 507.48,-202.69 506.25,-207.43"/>
<text text-anchor="middle" x="433" y="-198.8" font-family="Arial" font-size="9.00">Signed media access</text>
</g>
<!-- resend -->
<g id="node6" class="node">
<title>resend</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M634,-172C634,-172 513,-172 513,-172 507,-172 501,-166 501,-160 501,-160 501,-148 501,-148 501,-142 507,-136 513,-136 513,-136 634,-136 634,-136 640,-136 646,-142 646,-148 646,-148 646,-160 646,-160 646,-166 640,-172 634,-172"/>
<text text-anchor="middle" x="573.5" y="-157" font-family="Arial" font-size="10.00">Resend</text>
<text text-anchor="middle" x="573.5" y="-146" font-family="Arial" font-size="10.00">Transactional + batch email</text>
</g>
<!-- app&#45;&gt;resend -->
<g id="edge5" class="edge">
<title>app&#45;&gt;resend</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M365.2,-154C402.64,-154 452.36,-154 493.73,-154"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="493.82,-156.45 500.82,-154 493.82,-151.55 493.82,-156.45"/>
<text text-anchor="middle" x="433" y="-156.8" font-family="Arial" font-size="9.00">Email</text>
</g>
<!-- places -->
<g id="node7" class="node">
<title>places</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M615,-104C615,-104 532,-104 532,-104 526,-104 520,-98 520,-92 520,-92 520,-80 520,-80 520,-74 526,-68 532,-68 532,-68 615,-68 615,-68 621,-68 627,-74 627,-80 627,-80 627,-92 627,-92 627,-98 621,-104 615,-104"/>
<text text-anchor="middle" x="573.5" y="-89" font-family="Arial" font-size="10.00">Google Places API</text>
<text text-anchor="middle" x="573.5" y="-78" font-family="Arial" font-size="10.00">Vendor discovery</text>
</g>
<!-- app&#45;&gt;places -->
<g id="edge6" class="edge">
<title>app&#45;&gt;places</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M365.2,-139.5C408.68,-128.28 468.72,-112.78 513,-101.35"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="513.8,-103.68 519.97,-99.56 512.58,-98.93 513.8,-103.68"/>
<text text-anchor="middle" x="433" y="-134.8" font-family="Arial" font-size="9.00">Vendor search</text>
</g>
<!-- yt -->
<g id="node8" class="node">
<title>yt</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M621,-36C621,-36 526,-36 526,-36 520,-36 514,-30 514,-24 514,-24 514,-12 514,-12 514,-6 520,0 526,0 526,0 621,0 621,0 627,0 633,-6 633,-12 633,-12 633,-24 633,-24 633,-30 627,-36 621,-36"/>
<text text-anchor="middle" x="573.5" y="-21" font-family="Arial" font-size="10.00">YouTube</text>
<text text-anchor="middle" x="573.5" y="-10" font-family="Arial" font-size="10.00">Embedded livestream</text>
</g>
<!-- app&#45;&gt;yt -->
<g id="edge7" class="edge">
<title>app&#45;&gt;yt</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M337.05,-130.22C351.88,-118.38 370.75,-104.4 389,-94 428.34,-71.57 475.61,-52.16 512.32,-38.56"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="513.32,-40.81 519.05,-36.09 511.63,-36.21 513.32,-40.81"/>
<text text-anchor="middle" x="433" y="-96.8" font-family="Arial" font-size="9.00">Embed URL</text>
</g>
</g>
</svg>
</div>

**Figure 1 - System context.** Wedding Members and Guests interact with one Next.js application. Managed services are used only where they materially reduce complexity: MongoDB Atlas for data, R2 for media, Resend for email, Google Places for discovery, and YouTube for livestream playback.

### 2.1 Trust Boundaries

- **Authenticated application boundary:** Admin and Manager requests use server-side sessions.
- **Guest bearer-link boundary:** invitation and gallery links act as capability tokens and must be treated as secrets.
- **Wedding tenant boundary:** every internal domain operation is scoped to one Wedding.
- **External provider boundary:** R2, Resend, Google Places, and YouTube are accessed through integration adapters, not directly from domain logic.

---

## 3. High-Level Runtime Architecture

The production runtime is one Vercel-hosted Next.js application backed by MongoDB Atlas. The same codebase contains presentation, REST endpoints, application services, persistence adapters, and integration adapters. This is a **modular monolith**, not an unstructured monolith.

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="1057pt" height="140pt"
 viewBox="0.00 0.00 1057.00 140.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 122)">
<title>G</title>
<!-- route -->
<g id="node1" class="node">
<title>route</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M154,-70C154,-70 12,-70 12,-70 6,-70 0,-64 0,-58 0,-58 0,-46 0,-46 0,-40 6,-34 12,-34 12,-34 154,-34 154,-34 160,-34 166,-40 166,-46 166,-46 166,-58 166,-58 166,-64 160,-70 154,-70"/>
<text text-anchor="middle" x="83" y="-55" font-family="Arial" font-size="10.00">Presentation / HTTP</text>
<text text-anchor="middle" x="83" y="-44" font-family="Arial" font-size="10.00">Next.js pages + Route Handlers</text>
</g>
<!-- auth -->
<g id="node2" class="node">
<title>auth</title>
<path fill="#f4f6f8" stroke="#17324d" stroke-width="1.2" d="M419,-70C419,-70 225,-70 225,-70 219,-70 213,-64 213,-58 213,-58 213,-46 213,-46 213,-40 219,-34 225,-34 225,-34 419,-34 419,-34 425,-34 431,-40 431,-46 431,-46 431,-58 431,-58 431,-64 425,-70 419,-70"/>
<text text-anchor="middle" x="322" y="-55" font-family="Arial" font-size="10.00">Cross&#45;cutting</text>
<text text-anchor="middle" x="322" y="-44" font-family="Arial" font-size="10.00">Session, tenant context, Zod, errors, logging</text>
</g>
<!-- route&#45;&gt;auth -->
<g id="edge1" class="edge">
<title>route&#45;&gt;auth</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M166.23,-52C178.86,-52 192.1,-52 205.3,-52"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="205.62,-54.45 212.62,-52 205.62,-49.55 205.62,-54.45"/>
</g>
<!-- services -->
<g id="node3" class="node">
<title>services</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M623,-70C623,-70 490,-70 490,-70 484,-70 478,-64 478,-58 478,-58 478,-46 478,-46 478,-40 484,-34 490,-34 490,-34 623,-34 623,-34 629,-34 635,-40 635,-46 635,-46 635,-58 635,-58 635,-64 629,-70 623,-70"/>
<text text-anchor="middle" x="556.5" y="-55" font-family="Arial" font-size="10.00">Application / Domain Services</text>
<text text-anchor="middle" x="556.5" y="-44" font-family="Arial" font-size="10.00">Business rules + orchestration</text>
</g>
<!-- auth&#45;&gt;services -->
<g id="edge2" class="edge">
<title>auth&#45;&gt;services</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M431.08,-52C444.39,-52 457.84,-52 470.73,-52"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="470.83,-54.45 477.83,-52 470.83,-49.55 470.83,-54.45"/>
</g>
<!-- repos -->
<g id="node4" class="node">
<title>repos</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M869,-104C869,-104 694,-104 694,-104 688,-104 682,-98 682,-92 682,-92 682,-80 682,-80 682,-74 688,-68 694,-68 694,-68 869,-68 869,-68 875,-68 881,-74 881,-80 881,-80 881,-92 881,-92 881,-98 875,-104 869,-104"/>
<text text-anchor="middle" x="781.5" y="-89" font-family="Arial" font-size="10.00">Repositories / Models</text>
<text text-anchor="middle" x="781.5" y="-78" font-family="Arial" font-size="10.00">Mongoose access scoped by weddingId</text>
</g>
<!-- services&#45;&gt;repos -->
<g id="edge3" class="edge">
<title>services&#45;&gt;repos</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M635.18,-63.84C648.03,-65.8 661.53,-67.86 674.92,-69.9"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="674.62,-72.34 681.91,-70.97 675.36,-67.49 674.62,-72.34"/>
</g>
<!-- integ -->
<g id="node5" class="node">
<title>integ</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M869,-36C869,-36 694,-36 694,-36 688,-36 682,-30 682,-24 682,-24 682,-12 682,-12 682,-6 688,0 694,0 694,0 869,0 869,0 875,0 881,-6 881,-12 881,-12 881,-24 881,-24 881,-30 875,-36 869,-36"/>
<text text-anchor="middle" x="781.5" y="-21" font-family="Arial" font-size="10.00">Integration Adapters</text>
<text text-anchor="middle" x="781.5" y="-10" font-family="Arial" font-size="10.00">R2 / Resend / Google Places / YouTube</text>
</g>
<!-- services&#45;&gt;integ -->
<g id="edge5" class="edge">
<title>services&#45;&gt;integ</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M635.18,-40.16C648.03,-38.2 661.53,-36.14 674.92,-34.1"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="675.36,-36.51 681.91,-33.03 674.62,-31.66 675.36,-36.51"/>
</g>
<!-- db -->
<g id="node6" class="node">
<title>db</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M1009,-104C1009,-104 940,-104 940,-104 934,-104 928,-98 928,-92 928,-92 928,-80 928,-80 928,-74 934,-68 940,-68 940,-68 1009,-68 1009,-68 1015,-68 1021,-74 1021,-80 1021,-80 1021,-92 1021,-92 1021,-98 1015,-104 1009,-104"/>
<text text-anchor="middle" x="974.5" y="-83.5" font-family="Arial" font-size="10.00">MongoDB Atlas</text>
</g>
<!-- repos&#45;&gt;db -->
<g id="edge4" class="edge">
<title>repos&#45;&gt;db</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M881.08,-86C894.65,-86 908.14,-86 920.45,-86"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="920.55,-88.45 927.55,-86 920.55,-83.55 920.55,-88.45"/>
</g>
</g>
</svg>
</div>

**Figure 2 - Internal layering.** Route Handlers stay thin. Business rules live in application/domain services. Repositories own Mongoose queries. External providers are isolated behind adapters.

### 3.1 Layer Responsibilities

| Layer | Responsibility | Must not do |
|---|---|---|
| Next.js pages/components | Render UI, collect input, call application APIs/services | Contain persistence logic |
| Route Handlers | HTTP parsing, request ID, Zod validation, auth guard, response mapping | Implement complex business rules |
| Domain/Application Services | Business invariants and orchestration | Depend on HTTP-specific types |
| Repositories | Wedding-scoped database reads/writes through Mongoose | Make product decisions |
| Integration Adapters | R2, Resend, Google Places, YouTube access | Leak provider SDKs throughout modules |
| Shared Infrastructure | logging, errors, tokens, hashing, configuration | Own domain-specific rules |

### 3.2 Internal Dependency Rule

Preferred dependency flow:

```text
UI / Route Handler
        -> Application Service
             -> Repository / Integration Adapter
                  -> MongoDB / Provider
```

A module should call another module through its exported service contract rather than importing another module's Mongoose model and writing directly to its collection.

### 3.3 Server Components and REST APIs

Because frontend and backend are in one process, Server Components may call application services directly for server-rendered reads. They should **not** perform loopback HTTP calls to the application's own REST endpoints. REST Route Handlers remain the stable contract for browser mutations, public token flows, future mobile clients, and integration testing.

---

## 4. Proposed Repository Structure

```text
src/
  app/
    (public)/
      w/[slug]/
      invite/[token]/
      gallery/[token]/
      join/[token]/
    (auth)/
      login/
      signup/
      forgot-password/
    (app)/
      dashboard/
      events/
      tasks/
      guests/
      expenses/
      vendors/
      website/
      photos/
      settings/
    api/
      v1/
        auth/
        wedding/
        members/
        events/
        tasks/
        guests/
        invitations/
        expenses/
        vendors/
        website/
        media/
        gallery/
        livestream/
        internal/

  modules/
    auth/
    wedding/
    members/
    events/
    tasks/
    guests/
    invitations/
    expenses/
    vendors/
    website/
    media/
    livestream/
    email/

  integrations/
    mongodb/
    r2/
    resend/
    google-places/
    youtube/

  shared/
    validation/
    errors/
    http/
    logging/
    security/
    config/
    types/
```

A typical module may contain:

```text
modules/events/
  event.model.ts
  event.schemas.ts
  event.repository.ts
  event.service.ts
  event.types.ts
  event.errors.ts
```

---

## 5. Request Processing Standard

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="1073pt" height="121pt"
 viewBox="0.00 0.00 1073.00 121.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 103)">
<title>G</title>
<!-- client -->
<g id="node1" class="node">
<title>client</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M49,-51C49,-51 12,-51 12,-51 6,-51 0,-45 0,-39 0,-39 0,-27 0,-27 0,-21 6,-15 12,-15 12,-15 49,-15 49,-15 55,-15 61,-21 61,-27 61,-27 61,-39 61,-39 61,-45 55,-51 49,-51"/>
<text text-anchor="middle" x="30.5" y="-30.5" font-family="Arial" font-size="10.00">Browser</text>
</g>
<!-- route -->
<g id="node2" class="node">
<title>route</title>
<path fill="#f4f6f8" stroke="#17324d" stroke-width="1.2" d="M197,-85C197,-85 120,-85 120,-85 114,-85 108,-79 108,-73 108,-73 108,-61 108,-61 108,-55 114,-49 120,-49 120,-49 197,-49 197,-49 203,-49 209,-55 209,-61 209,-61 209,-73 209,-73 209,-79 203,-85 197,-85"/>
<text text-anchor="middle" x="158.5" y="-70" font-family="Arial" font-size="10.00">Route Handler</text>
<text text-anchor="middle" x="158.5" y="-59" font-family="Arial" font-size="10.00">requestId + parse</text>
</g>
<!-- client&#45;&gt;route -->
<g id="edge1" class="edge">
<title>client&#45;&gt;route</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M61.04,-40.97C72.93,-44.18 87.07,-47.99 100.8,-51.7"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="100.53,-54.16 107.93,-53.62 101.81,-49.43 100.53,-54.16"/>
</g>
<!-- zod -->
<g id="node3" class="node">
<title>zod</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M329,-85C329,-85 268,-85 268,-85 262,-85 256,-79 256,-73 256,-73 256,-61 256,-61 256,-55 262,-49 268,-49 268,-49 329,-49 329,-49 335,-49 341,-55 341,-61 341,-61 341,-73 341,-73 341,-79 335,-85 329,-85"/>
<text text-anchor="middle" x="298.5" y="-64.5" font-family="Arial" font-size="10.00">Zod validation</text>
</g>
<!-- route&#45;&gt;zod -->
<g id="edge2" class="edge">
<title>route&#45;&gt;zod</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M209.32,-67C222.22,-67 236.09,-67 248.92,-67"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="248.93,-69.45 255.93,-67 248.93,-64.55 248.93,-69.45"/>
</g>
<!-- sec -->
<g id="node4" class="node">
<title>sec</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M519,-85C519,-85 400,-85 400,-85 394,-85 388,-79 388,-73 388,-73 388,-61 388,-61 388,-55 394,-49 400,-49 400,-49 519,-49 519,-49 525,-49 531,-55 531,-61 531,-61 531,-73 531,-73 531,-79 525,-85 519,-85"/>
<text text-anchor="middle" x="459.5" y="-70" font-family="Arial" font-size="10.00">Session / token verification</text>
<text text-anchor="middle" x="459.5" y="-59" font-family="Arial" font-size="10.00">Tenant + role authorization</text>
</g>
<!-- zod&#45;&gt;sec -->
<g id="edge3" class="edge">
<title>zod&#45;&gt;sec</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M341.28,-67C353.42,-67 367.09,-67 380.7,-67"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="380.8,-69.45 387.8,-67 380.8,-64.55 380.8,-69.45"/>
</g>
<!-- svc -->
<g id="node5" class="node">
<title>svc</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M660,-85C660,-85 590,-85 590,-85 584,-85 578,-79 578,-73 578,-73 578,-61 578,-61 578,-55 584,-49 590,-49 590,-49 660,-49 660,-49 666,-49 672,-55 672,-61 672,-61 672,-73 672,-73 672,-79 666,-85 660,-85"/>
<text text-anchor="middle" x="625" y="-70" font-family="Arial" font-size="10.00">Domain Service</text>
<text text-anchor="middle" x="625" y="-59" font-family="Arial" font-size="10.00">Business rules</text>
</g>
<!-- sec&#45;&gt;svc -->
<g id="edge4" class="edge">
<title>sec&#45;&gt;svc</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M531.26,-67C544.39,-67 557.91,-67 570.42,-67"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="570.66,-69.45 577.66,-67 570.66,-64.55 570.66,-69.45"/>
</g>
<!-- repo -->
<g id="node6" class="node">
<title>repo</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M833,-85C833,-85 731,-85 731,-85 725,-85 719,-79 719,-73 719,-73 719,-61 719,-61 719,-55 725,-49 731,-49 731,-49 833,-49 833,-49 839,-49 845,-55 845,-61 845,-61 845,-73 845,-73 845,-79 839,-85 833,-85"/>
<text text-anchor="middle" x="782" y="-70" font-family="Arial" font-size="10.00">Repository / Mongoose</text>
<text text-anchor="middle" x="782" y="-59" font-family="Arial" font-size="10.00">scoped query</text>
</g>
<!-- svc&#45;&gt;repo -->
<g id="edge5" class="edge">
<title>svc&#45;&gt;repo</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M672.09,-67C684.43,-67 698.06,-67 711.38,-67"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="711.73,-69.45 718.73,-67 711.73,-64.55 711.73,-69.45"/>
</g>
<!-- resp -->
<g id="node7" class="node">
<title>resp</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M1025,-51C1025,-51 904,-51 904,-51 898,-51 892,-45 892,-39 892,-39 892,-27 892,-27 892,-21 898,-15 904,-15 904,-15 1025,-15 1025,-15 1031,-15 1037,-21 1037,-27 1037,-27 1037,-39 1037,-39 1037,-45 1031,-51 1025,-51"/>
<text text-anchor="middle" x="964.5" y="-36" font-family="Arial" font-size="10.00">Consistent REST response</text>
<text text-anchor="middle" x="964.5" y="-25" font-family="Arial" font-size="10.00">data/error + requestId</text>
</g>
<!-- repo&#45;&gt;resp -->
<g id="edge6" class="edge">
<title>repo&#45;&gt;resp</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M845.12,-55.3C857.97,-52.88 871.67,-50.3 885.02,-47.78"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="885.53,-50.18 891.96,-46.48 884.63,-45.36 885.53,-50.18"/>
</g>
<!-- resp&#45;&gt;client -->
<g id="edge7" class="edge">
<title>resp&#45;&gt;client</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M891.93,-21.92C823.75,-12.33 718.14,0 626,0 297.5,0 297.5,0 297.5,0 215.06,0 119.32,-15.81 68.18,-25.54"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="67.68,-23.14 61.27,-26.87 68.61,-27.95 67.68,-23.14"/>
</g>
</g>
</svg>
</div>

**Figure 3 - Standard request lifecycle.** Every mutating REST request follows the same validation, authentication, tenant authorization, service, persistence, and response pipeline.

### 5.1 Standard Route Handler Pipeline

1. Create or propagate a `requestId`.
2. Parse path/query/body.
3. Validate with Zod.
4. Resolve session or public token.
5. Resolve TenantContext where required.
6. Enforce role/permission.
7. Call domain service.
8. Persist through repositories.
9. Emit structured application log.
10. Return standardized HTTP response.

### 5.2 Response Envelope

Success:

```json
{
  "data": { },
  "meta": { "requestId": "req_..." }
}
```

Failure:

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

### 5.3 HTTP Status Conventions

| Status | Use |
|---|---|
| 200 | Successful read/update |
| 201 | Resource created |
| 202 | Background job accepted |
| 204 | Successful delete with no body |
| 400 | Malformed request |
| 401 | No valid authenticated session |
| 403 | Authenticated but not authorized |
| 404 | Resource not found within authorized tenant/token scope |
| 409 | Business-state conflict, e.g. existing membership or destructive dependency |
| 422 | Semantically valid request that violates a domain rule |
| 429 | Rate limited |
| 500 | Unexpected server error |
| 503 | Critical dependency unavailable where graceful degradation is impossible |

---

## 6. Wedding-Level Multi-Tenancy

The **Wedding** is the tenant boundary. User-facing resource IDs alone are never sufficient authorization.

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="1051pt" height="140pt"
 viewBox="0.00 0.00 1051.00 140.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 122)">
<title>G</title>
<!-- req -->
<g id="node1" class="node">
<title>req</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M112,-52C112,-52 12,-52 12,-52 6,-52 0,-46 0,-40 0,-40 0,-28 0,-28 0,-22 6,-16 12,-16 12,-16 112,-16 112,-16 118,-16 124,-22 124,-28 124,-28 124,-40 124,-40 124,-46 118,-52 112,-52"/>
<text text-anchor="middle" x="62" y="-31.5" font-family="Arial" font-size="10.00">Authenticated Request</text>
</g>
<!-- sess -->
<g id="node2" class="node">
<title>sess</title>
<path fill="#f4f6f8" stroke="#17324d" stroke-width="1.2" d="M252,-52C252,-52 185,-52 185,-52 179,-52 173,-46 173,-40 173,-40 173,-28 173,-28 173,-22 179,-16 185,-16 185,-16 252,-16 252,-16 258,-16 264,-22 264,-28 264,-28 264,-40 264,-40 264,-46 258,-52 252,-52"/>
<text text-anchor="middle" x="218.5" y="-37" font-family="Arial" font-size="10.00">Session lookup</text>
<text text-anchor="middle" x="218.5" y="-26" font-family="Arial" font-size="10.00">userId</text>
</g>
<!-- req&#45;&gt;sess -->
<g id="edge1" class="edge">
<title>req&#45;&gt;sess</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M124.06,-34C137.73,-34 152.1,-34 165.36,-34"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="165.6,-36.45 172.6,-34 165.6,-31.55 165.6,-36.45"/>
</g>
<!-- mem -->
<g id="node3" class="node">
<title>mem</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M440,-52C440,-52 325,-52 325,-52 319,-52 313,-46 313,-40 313,-40 313,-28 313,-28 313,-22 319,-16 325,-16 325,-16 440,-16 440,-16 446,-16 452,-22 452,-28 452,-28 452,-40 452,-40 452,-46 446,-52 440,-52"/>
<text text-anchor="middle" x="382.5" y="-37" font-family="Arial" font-size="10.00">WeddingMember lookup</text>
<text text-anchor="middle" x="382.5" y="-26" font-family="Arial" font-size="10.00">userId &#45;&gt; weddingId + role</text>
</g>
<!-- sess&#45;&gt;mem -->
<g id="edge2" class="edge">
<title>sess&#45;&gt;mem</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M264.2,-34C277.04,-34 291.41,-34 305.58,-34"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="305.96,-36.45 312.96,-34 305.96,-31.55 305.96,-36.45"/>
</g>
<!-- ctx -->
<g id="node4" class="node">
<title>ctx</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M712,-104C712,-104 554,-104 554,-104 548,-104 542,-98 542,-92 542,-92 542,-80 542,-80 542,-74 548,-68 554,-68 554,-68 712,-68 712,-68 718,-68 724,-74 724,-80 724,-80 724,-92 724,-92 724,-98 718,-104 712,-104"/>
<text text-anchor="middle" x="633" y="-89" font-family="Arial" font-size="10.00">TenantContext</text>
<text text-anchor="middle" x="633" y="-78" font-family="Arial" font-size="10.00">userId / memberId / weddingId / role</text>
</g>
<!-- mem&#45;&gt;ctx -->
<g id="edge3" class="edge">
<title>mem&#45;&gt;ctx</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M452.06,-48.35C478.93,-53.97 510.17,-60.51 539.01,-66.54"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="538.55,-68.95 545.9,-67.98 539.55,-64.15 538.55,-68.95"/>
</g>
<!-- deny -->
<g id="node7" class="node">
<title>deny</title>
<path fill="#fcecef" stroke="#17324d" stroke-width="1.2" d="M695,-36C695,-36 571,-36 571,-36 565,-36 559,-30 559,-24 559,-24 559,-12 559,-12 559,-6 565,0 571,0 571,0 695,0 695,0 701,0 707,-6 707,-12 707,-12 707,-24 707,-24 707,-30 701,-36 695,-36"/>
<text text-anchor="middle" x="633" y="-21" font-family="Arial" font-size="10.00">No membership / wrong role</text>
<text text-anchor="middle" x="633" y="-10" font-family="Arial" font-size="10.00">401 or 403</text>
</g>
<!-- mem&#45;&gt;deny -->
<g id="edge6" class="edge">
<title>mem&#45;&gt;deny</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" stroke-dasharray="5,2" d="M452.06,-29.59C482.91,-27.6 519.54,-25.24 551.67,-23.17"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="552.05,-25.6 558.88,-22.71 551.74,-20.71 552.05,-25.6"/>
<text text-anchor="middle" x="497" y="-30.8" font-family="Arial" font-size="9.00">fail closed</text>
</g>
<!-- svc -->
<g id="node5" class="node">
<title>svc</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M855,-104C855,-104 785,-104 785,-104 779,-104 773,-98 773,-92 773,-92 773,-80 773,-80 773,-74 779,-68 785,-68 785,-68 855,-68 855,-68 861,-68 867,-74 867,-80 867,-80 867,-92 867,-92 867,-98 861,-104 855,-104"/>
<text text-anchor="middle" x="820" y="-83.5" font-family="Arial" font-size="10.00">Domain Service</text>
</g>
<!-- ctx&#45;&gt;svc -->
<g id="edge4" class="edge">
<title>ctx&#45;&gt;svc</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M724.06,-86C738.33,-86 752.67,-86 765.73,-86"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="765.85,-88.45 772.85,-86 765.85,-83.55 765.85,-88.45"/>
</g>
<!-- qry -->
<g id="node6" class="node">
<title>qry</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M1003,-104C1003,-104 928,-104 928,-104 922,-104 916,-98 916,-92 916,-92 916,-80 916,-80 916,-74 922,-68 928,-68 928,-68 1003,-68 1003,-68 1009,-68 1015,-74 1015,-80 1015,-80 1015,-92 1015,-92 1015,-98 1009,-104 1003,-104"/>
<text text-anchor="middle" x="965.5" y="-89" font-family="Arial" font-size="10.00">Repository query</text>
<text text-anchor="middle" x="965.5" y="-78" font-family="Arial" font-size="10.00">_id + weddingId</text>
</g>
<!-- svc&#45;&gt;qry -->
<g id="edge5" class="edge">
<title>svc&#45;&gt;qry</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M867.19,-86C880.45,-86 895.05,-86 908.81,-86"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="908.92,-88.45 915.92,-86 908.92,-83.55 908.92,-88.45"/>
</g>
</g>
</svg>
</div>

**Figure 4 - Tenant resolution.** Authenticated requests derive `weddingId` from the user's WeddingMembership rather than trusting a client-supplied tenant identifier.

### 6.1 TenantContext

Every authenticated domain operation receives a server-created context similar to:

```ts
interface TenantContext {
  userId: string;
  memberId: string;
  weddingId: string;
  role: 'ADMIN' | 'MANAGER';
}
```

### 6.2 Repository Scoping Rule

For Wedding-owned resources, repository methods require `weddingId`.

Preferred:

```ts
findEventByIdForWedding(eventId, weddingId)
```

Avoid in API paths:

```ts
EventModel.findById(eventId)
```

A typical query is effectively:

```ts
{ _id: eventId, weddingId }
```

This prevents insecure direct object reference (IDOR) across Weddings even if an attacker obtains another resource's ObjectId.

### 6.3 One-Wedding-Per-User Rule

A unique index on `weddingMembers.userId` enforces the V1 product rule that one authenticated user can belong to only one Wedding. The design can later relax this index if multi-Wedding users become a future requirement.

---

## 7. Authentication and Session Architecture

### 7.1 Chosen Model

Authentication is custom email/password authentication implemented inside the application. No Better Auth, Clerk, Auth0, or email-ownership verification is required in V1.

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="1288pt" height="72pt"
 viewBox="0.00 0.00 1288.00 72.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 54)">
<title>G</title>
<!-- signup -->
<g id="node1" class="node">
<title>signup</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M126,-36C126,-36 12,-36 12,-36 6,-36 0,-30 0,-24 0,-24 0,-12 0,-12 0,-6 6,0 12,0 12,0 126,0 126,0 132,0 138,-6 138,-12 138,-12 138,-24 138,-24 138,-30 132,-36 126,-36"/>
<text text-anchor="middle" x="69" y="-21" font-family="Arial" font-size="10.00">Signup</text>
<text text-anchor="middle" x="69" y="-10" font-family="Arial" font-size="10.00">name + email + password</text>
</g>
<!-- val -->
<g id="node2" class="node">
<title>val</title>
<path fill="#f4f6f8" stroke="#17324d" stroke-width="1.2" d="M310,-36C310,-36 197,-36 197,-36 191,-36 185,-30 185,-24 185,-24 185,-12 185,-12 185,-6 191,0 197,0 197,0 310,0 310,0 316,0 322,-6 322,-12 322,-12 322,-24 322,-24 322,-30 316,-36 310,-36"/>
<text text-anchor="middle" x="253.5" y="-21" font-family="Arial" font-size="10.00">Zod + email uniqueness</text>
<text text-anchor="middle" x="253.5" y="-10" font-family="Arial" font-size="10.00">NO ownership verification</text>
</g>
<!-- signup&#45;&gt;val -->
<g id="edge1" class="edge">
<title>signup&#45;&gt;val</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M138.22,-18C151.11,-18 164.67,-18 177.76,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="177.97,-20.45 184.97,-18 177.97,-15.55 177.97,-20.45"/>
</g>
<!-- hash -->
<g id="node3" class="node">
<title>hash</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M450,-36C450,-36 381,-36 381,-36 375,-36 369,-30 369,-24 369,-24 369,-12 369,-12 369,-6 375,0 381,0 381,0 450,0 450,0 456,0 462,-6 462,-12 462,-12 462,-24 462,-24 462,-30 456,-36 450,-36"/>
<text text-anchor="middle" x="415.5" y="-21" font-family="Arial" font-size="10.00">Hash password</text>
<text text-anchor="middle" x="415.5" y="-10" font-family="Arial" font-size="10.00">bcrypt</text>
</g>
<!-- val&#45;&gt;hash -->
<g id="edge2" class="edge">
<title>val&#45;&gt;hash</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M322.35,-18C335.45,-18 349,-18 361.54,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="361.8,-20.45 368.8,-18 361.8,-15.55 361.8,-20.45"/>
</g>
<!-- user -->
<g id="node4" class="node">
<title>user</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M590,-36C590,-36 521,-36 521,-36 515,-36 509,-30 509,-24 509,-24 509,-12 509,-12 509,-6 515,0 521,0 521,0 590,0 590,0 596,0 602,-6 602,-12 602,-12 602,-24 602,-24 602,-30 596,-36 590,-36"/>
<text text-anchor="middle" x="555.5" y="-15.5" font-family="Arial" font-size="10.00">users collection</text>
</g>
<!-- hash&#45;&gt;user -->
<g id="edge3" class="edge">
<title>hash&#45;&gt;user</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M462.07,-18C474.79,-18 488.71,-18 501.8,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="501.98,-20.45 508.98,-18 501.98,-15.55 501.98,-20.45"/>
</g>
<!-- token -->
<g id="node5" class="node">
<title>token</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M835,-36C835,-36 661,-36 661,-36 655,-36 649,-30 649,-24 649,-24 649,-12 649,-12 649,-6 655,0 661,0 661,0 835,0 835,0 841,0 847,-6 847,-12 847,-12 847,-24 847,-24 847,-30 841,-36 835,-36"/>
<text text-anchor="middle" x="748" y="-15.5" font-family="Arial" font-size="10.00">Generate opaque random session token</text>
</g>
<!-- user&#45;&gt;token -->
<g id="edge4" class="edge">
<title>user&#45;&gt;token</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M602.13,-18C614.22,-18 627.79,-18 641.65,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="641.92,-20.45 648.92,-18 641.92,-15.55 641.92,-20.45"/>
</g>
<!-- sess -->
<g id="node6" class="node">
<title>sess</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M1018,-36C1018,-36 906,-36 906,-36 900,-36 894,-30 894,-24 894,-24 894,-12 894,-12 894,-6 900,0 906,0 906,0 1018,0 1018,0 1024,0 1030,-6 1030,-12 1030,-12 1030,-24 1030,-24 1030,-30 1024,-36 1018,-36"/>
<text text-anchor="middle" x="962" y="-21" font-family="Arial" font-size="10.00">sessions collection</text>
<text text-anchor="middle" x="962" y="-10" font-family="Arial" font-size="10.00">store token hash + expiry</text>
</g>
<!-- token&#45;&gt;sess -->
<g id="edge5" class="edge">
<title>token&#45;&gt;sess</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M847.24,-18C860.59,-18 874.09,-18 886.91,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="886.96,-20.45 893.96,-18 886.96,-15.55 886.96,-20.45"/>
</g>
<!-- cookie -->
<g id="node7" class="node">
<title>cookie</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M1240,-36C1240,-36 1089,-36 1089,-36 1083,-36 1077,-30 1077,-24 1077,-24 1077,-12 1077,-12 1077,-6 1083,0 1089,0 1089,0 1240,0 1240,0 1246,0 1252,-6 1252,-12 1252,-12 1252,-24 1252,-24 1252,-30 1246,-36 1240,-36"/>
<text text-anchor="middle" x="1164.5" y="-21" font-family="Arial" font-size="10.00">HttpOnly Secure SameSite cookie</text>
<text text-anchor="middle" x="1164.5" y="-10" font-family="Arial" font-size="10.00">contains raw opaque token</text>
</g>
<!-- sess&#45;&gt;cookie -->
<g id="edge6" class="edge">
<title>sess&#45;&gt;cookie</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M1030.04,-18C1042.84,-18 1056.45,-18 1069.9,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="1069.91,-20.45 1076.91,-18 1069.91,-15.55 1069.91,-20.45"/>
</g>
</g>
</svg>
</div>

**Figure 5 - Signup and session creation.** Passwords are hashed; the browser receives an opaque session token in an HttpOnly cookie; MongoDB stores only the token hash.

### 7.2 Password Storage

- Store **only password hashes**, never plaintext passwords.
- V1 recommendation: `bcrypt` with a configurable work factor benchmarked on the Vercel Node.js runtime.
- The work factor is an engineering configuration, not a product requirement.
- Password comparisons must use the library's constant-time verification path.

### 7.3 Session Model

Use **opaque server-side sessions**, not role-bearing JWTs.

Flow:

1. Generate a cryptographically random 256-bit session token.
2. Send raw token only in the browser cookie.
3. Store `SHA-256(token)` in MongoDB with `userId`, timestamps, and expiry.
4. On each request, hash the cookie token and look up the session.
5. Resolve current membership/role from MongoDB so role removal is immediately effective.

Recommended cookie properties:

```text
HttpOnly = true
Secure = true in production
SameSite = Lax
Path = /
```

A default session lifetime of approximately 7 days is a reasonable engineering starting point and remains configurable.

### 7.4 Email Rules

Signup performs:

- required email field validation;
- normalization to lowercase/canonical form;
- basic syntax validation;
- uniqueness enforcement.

It does **not** require proof that the user owns the email address.

### 7.5 Signup -> Create / Join Wedding

After authentication, a user without a `WeddingMember` record enters onboarding:

```text
Create Wedding
or
Join Wedding using a valid member invitation
```

A user who already has a Wedding membership cannot create or join a second Wedding in V1.

### 7.6 Login, Logout, Password Reset

- **Login:** verify normalized email + password hash; create new session.
- **Logout:** delete/revoke current session and clear cookie.
- **Password reset:** email a high-entropy one-time reset token through Resend; store only token hash; use a short configurable expiry; revoke existing sessions after successful reset.
- Authentication error messages should not reveal whether a given email is registered.

### 7.7 Accepted Risk: No Email Ownership Verification

Because ownership verification is intentionally omitted, the system cannot cryptographically prove that a new account owner controls the supplied email address. The architecture mitigates but does not eliminate this product-approved risk through unique email enforcement, secure member-invitation tokens, email-string matching during invite acceptance, password-reset controls, and rate limiting.

---

## 8. Wedding Member Invitations and Role Management

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="1045pt" height="72pt"
 viewBox="0.00 0.00 1045.00 72.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 54)">
<title>G</title>
<!-- admin -->
<g id="node1" class="node">
<title>admin</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M42,-36C42,-36 12,-36 12,-36 6,-36 0,-30 0,-24 0,-24 0,-12 0,-12 0,-6 6,0 12,0 12,0 42,0 42,0 48,0 54,-6 54,-12 54,-12 54,-24 54,-24 54,-30 48,-36 42,-36"/>
<text text-anchor="middle" x="27" y="-15.5" font-family="Arial" font-size="10.00">Admin</text>
</g>
<!-- create -->
<g id="node2" class="node">
<title>create</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M223,-36C223,-36 113,-36 113,-36 107,-36 101,-30 101,-24 101,-24 101,-12 101,-12 101,-6 107,0 113,0 113,0 223,0 223,0 229,0 235,-6 235,-12 235,-12 235,-24 235,-24 235,-30 229,-36 223,-36"/>
<text text-anchor="middle" x="168" y="-21" font-family="Arial" font-size="10.00">Create member invitation</text>
<text text-anchor="middle" x="168" y="-10" font-family="Arial" font-size="10.00">email + role</text>
</g>
<!-- admin&#45;&gt;create -->
<g id="edge1" class="edge">
<title>admin&#45;&gt;create</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M54.14,-18C65.46,-18 79.33,-18 93.43,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="93.81,-20.45 100.81,-18 93.81,-15.55 93.81,-20.45"/>
</g>
<!-- mail -->
<g id="node3" class="node">
<title>mail</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M397,-36C397,-36 294,-36 294,-36 288,-36 282,-30 282,-24 282,-24 282,-12 282,-12 282,-6 288,0 294,0 294,0 397,0 397,0 403,0 409,-6 409,-12 409,-12 409,-24 409,-24 409,-30 403,-36 397,-36"/>
<text text-anchor="middle" x="345.5" y="-21" font-family="Arial" font-size="10.00">Resend invitation email</text>
<text text-anchor="middle" x="345.5" y="-10" font-family="Arial" font-size="10.00">secure join token</text>
</g>
<!-- create&#45;&gt;mail -->
<g id="edge2" class="edge">
<title>create&#45;&gt;mail</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M235.35,-18C248.21,-18 261.72,-18 274.68,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="274.82,-20.45 281.82,-18 274.82,-15.55 274.82,-20.45"/>
</g>
<!-- person -->
<g id="node4" class="node">
<title>person</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M536,-36C536,-36 468,-36 468,-36 462,-36 456,-30 456,-24 456,-24 456,-12 456,-12 456,-6 462,0 468,0 468,0 536,0 536,0 542,0 548,-6 548,-12 548,-12 548,-24 548,-24 548,-30 542,-36 536,-36"/>
<text text-anchor="middle" x="502" y="-21" font-family="Arial" font-size="10.00">Invitee</text>
<text text-anchor="middle" x="502" y="-10" font-family="Arial" font-size="10.00">Signup or Login</text>
</g>
<!-- mail&#45;&gt;person -->
<g id="edge3" class="edge">
<title>mail&#45;&gt;person</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M409.34,-18C422.33,-18 435.88,-18 448.46,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="448.74,-20.45 455.74,-18 448.74,-15.55 448.74,-20.45"/>
</g>
<!-- accept -->
<g id="node5" class="node">
<title>accept</title>
<path fill="#f4f6f8" stroke="#17324d" stroke-width="1.2" d="M739,-36C739,-36 607,-36 607,-36 601,-36 595,-30 595,-24 595,-24 595,-12 595,-12 595,-6 601,0 607,0 607,0 739,0 739,0 745,0 751,-6 751,-12 751,-12 751,-24 751,-24 751,-30 745,-36 739,-36"/>
<text text-anchor="middle" x="673" y="-21" font-family="Arial" font-size="10.00">Accept join token</text>
<text text-anchor="middle" x="673" y="-10" font-family="Arial" font-size="10.00">email string must match invite</text>
</g>
<!-- person&#45;&gt;accept -->
<g id="edge4" class="edge">
<title>person&#45;&gt;accept</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M548.29,-18C560.53,-18 574.18,-18 587.82,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="587.94,-20.45 594.94,-18 587.94,-15.55 587.94,-20.45"/>
</g>
<!-- tx -->
<g id="node6" class="node">
<title>tx</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M997,-36C997,-36 810,-36 810,-36 804,-36 798,-30 798,-24 798,-24 798,-12 798,-12 798,-6 804,0 810,0 810,0 997,0 997,0 1003,0 1009,-6 1009,-12 1009,-12 1009,-24 1009,-24 1009,-30 1003,-36 997,-36"/>
<text text-anchor="middle" x="903.5" y="-21" font-family="Arial" font-size="10.00">MongoDB transaction</text>
<text text-anchor="middle" x="903.5" y="-10" font-family="Arial" font-size="10.00">create membership + mark invite accepted</text>
</g>
<!-- accept&#45;&gt;tx -->
<g id="edge5" class="edge">
<title>accept&#45;&gt;tx</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M751.04,-18C763.84,-18 777.34,-18 790.79,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="790.81,-20.45 797.81,-18 790.81,-15.55 790.81,-20.45"/>
</g>
</g>
</svg>
</div>

**Figure 6 - Wedding Member invitation flow.** A secure invitation token plus matching signed-in email is required before a membership is created.

### 8.1 Member Invitation Record

Recommended fields:

```text
weddingId
emailNormalized
role               ADMIN | MANAGER
invitedByUserId
tokenHash
status             PENDING | ACCEPTED | REVOKED | EXPIRED
expiresAt
acceptedByUserId?
createdAt
acceptedAt?
```

### 8.2 Acceptance Rules

To accept an invitation:

1. User must be signed in.
2. User must not already belong to a Wedding.
3. Invitation token must be valid, pending, and unexpired.
4. Signed-in user's normalized email must match the invited email string.
5. Create `WeddingMember` and mark invitation accepted in one MongoDB transaction.

### 8.3 Admin Invariant

The system must never permit zero Admins.

The following operations must be transactionally guarded:

- Admin -> Manager demotion.
- Admin removal.

If the member is the last Admin, return a business conflict and make no change.

### 8.4 Manager Restrictions

Managers cannot create/revoke Wedding Member invitations, remove members, or change member roles. All other approved Wedding operations remain accessible.

---

## 9. Guest Invitation and RSVP Architecture

Guests do not have authenticated accounts.

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="1065pt" height="72pt"
 viewBox="0.00 0.00 1065.00 72.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 54)">
<title>G</title>
<!-- member -->
<g id="node1" class="node">
<title>member</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M88,-36C88,-36 12,-36 12,-36 6,-36 0,-30 0,-24 0,-24 0,-12 0,-12 0,-6 6,0 12,0 12,0 88,0 88,0 94,0 100,-6 100,-12 100,-12 100,-24 100,-24 100,-30 94,-36 88,-36"/>
<text text-anchor="middle" x="50" y="-15.5" font-family="Arial" font-size="10.00">Wedding Member</text>
</g>
<!-- guest -->
<g id="node2" class="node">
<title>guest</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M254,-36C254,-36 159,-36 159,-36 153,-36 147,-30 147,-24 147,-24 147,-12 147,-12 147,-6 153,0 159,0 159,0 254,0 254,0 260,0 266,-6 266,-12 266,-12 266,-24 266,-24 266,-30 260,-36 254,-36"/>
<text text-anchor="middle" x="206.5" y="-21" font-family="Arial" font-size="10.00">Guest record</text>
<text text-anchor="middle" x="206.5" y="-10" font-family="Arial" font-size="10.00">party + invited events</text>
</g>
<!-- member&#45;&gt;guest -->
<g id="edge1" class="edge">
<title>member&#45;&gt;guest</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M100.31,-18C112.83,-18 126.48,-18 139.67,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="139.95,-20.45 146.95,-18 139.95,-15.55 139.95,-20.45"/>
</g>
<!-- inv -->
<g id="node3" class="node">
<title>inv</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M440,-36C440,-36 325,-36 325,-36 319,-36 313,-30 313,-24 313,-24 313,-12 313,-12 313,-6 319,0 325,0 325,0 440,0 440,0 446,0 452,-6 452,-12 452,-12 452,-24 452,-24 452,-30 446,-36 440,-36"/>
<text text-anchor="middle" x="382.5" y="-21" font-family="Arial" font-size="10.00">GuestInvitation</text>
<text text-anchor="middle" x="382.5" y="-10" font-family="Arial" font-size="10.00">unique random token hash</text>
</g>
<!-- guest&#45;&gt;inv -->
<g id="edge2" class="edge">
<title>guest&#45;&gt;inv</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M266.41,-18C278.97,-18 292.41,-18 305.5,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="305.74,-20.45 312.74,-18 305.74,-15.55 305.74,-20.45"/>
</g>
<!-- send -->
<g id="node4" class="node">
<title>send</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M630,-36C630,-36 511,-36 511,-36 505,-36 499,-30 499,-24 499,-24 499,-12 499,-12 499,-6 505,0 511,0 511,0 630,0 630,0 636,0 642,-6 642,-12 642,-12 642,-24 642,-24 642,-30 636,-36 630,-36"/>
<text text-anchor="middle" x="570.5" y="-21" font-family="Arial" font-size="10.00">Email via Resend</text>
<text text-anchor="middle" x="570.5" y="-10" font-family="Arial" font-size="10.00">or manual WhatsApp share</text>
</g>
<!-- inv&#45;&gt;send -->
<g id="edge3" class="edge">
<title>inv&#45;&gt;send</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M452.23,-18C465.07,-18 478.57,-18 491.65,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="491.87,-20.45 498.87,-18 491.87,-15.55 491.87,-20.45"/>
</g>
<!-- page -->
<g id="node5" class="node">
<title>page</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M819,-36C819,-36 701,-36 701,-36 695,-36 689,-30 689,-24 689,-24 689,-12 689,-12 689,-6 695,0 701,0 701,0 819,0 819,0 825,0 831,-6 831,-12 831,-12 831,-24 831,-24 831,-30 825,-36 819,-36"/>
<text text-anchor="middle" x="760" y="-21" font-family="Arial" font-size="10.00">Guest opens /invite/{token}</text>
<text text-anchor="middle" x="760" y="-10" font-family="Arial" font-size="10.00">No login</text>
</g>
<!-- send&#45;&gt;page -->
<g id="edge4" class="edge">
<title>send&#45;&gt;page</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M642.12,-18C654.99,-18 668.49,-18 681.55,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="681.76,-20.45 688.76,-18 681.76,-15.55 681.76,-20.45"/>
</g>
<!-- rsvp -->
<g id="node6" class="node">
<title>rsvp</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M1017,-36C1017,-36 890,-36 890,-36 884,-36 878,-30 878,-24 878,-24 878,-12 878,-12 878,-6 884,0 890,0 890,0 1017,0 1017,0 1023,0 1029,-6 1029,-12 1029,-12 1029,-24 1029,-24 1029,-30 1023,-36 1017,-36"/>
<text text-anchor="middle" x="953.5" y="-21" font-family="Arial" font-size="10.00">RSVP update</text>
<text text-anchor="middle" x="953.5" y="-10" font-family="Arial" font-size="10.00">attendance &lt;= allowed count</text>
</g>
<!-- page&#45;&gt;rsvp -->
<g id="edge5" class="edge">
<title>page&#45;&gt;rsvp</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M831.22,-18C844.01,-18 857.45,-18 870.55,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="870.78,-20.45 877.78,-18 870.78,-15.55 870.78,-20.45"/>
</g>
</g>
</svg>
</div>

**Figure 7 - Guest invitation and RSVP flow.** A guest party is represented by one Guest record and one secure invitation token.

### 9.1 Guest Record

The Guest record represents the invited party/family, not each attendee.

Core fields:

```text
weddingId
name
email?
phone?
maxGuestsAllowed
invitedEventIds[]
rsvpStatus          PENDING | ATTENDING | NOT_ATTENDING
numberAttending
notes?
```

### 9.2 Guest Invitation Token

- Generate a cryptographically random high-entropy token.
- Store only its hash in `guestInvitations`.
- Token resolves Guest + Wedding + invited events.
- Public URLs can use `/invite/<token>`.
- Logs must redact or template token-bearing URL segments.
- Invitation records support revocation/expiry because the PRD includes invalid and expired link behavior.

### 9.3 RSVP Rule

For an attending RSVP:

```text
1 <= numberAttending <= maxGuestsAllowed
```

A later submission through the same valid invitation token replaces the current RSVP state.

### 9.4 Guest Link Security

Public guest endpoints are protected by:

- high-entropy tokens;
- token hashes at rest;
- rate limiting;
- strict Wedding resolution from the token;
- no ability to request arbitrary Wedding or Guest IDs;
- token redaction in logs.

---

## 10. REST API Design

### 10.1 Principles

- Base prefix: `/api/v1`.
- JSON request/response for business APIs.
- Zod validates path/query/body contracts.
- IDs use MongoDB ObjectId strings internally; public guest flows use opaque tokens.
- Route Handlers do not contain domain logic.
- List endpoints are paginated.
- Filters are allow-listed; arbitrary MongoDB operators are never accepted from clients.
- Mutating bulk actions that can outlive one request return `202 Accepted` with a job identifier.
- Operations prone to duplicate submission support idempotency.

### 10.2 Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/signup` | Create User and session |
| POST | `/api/v1/auth/login` | Authenticate and create session |
| POST | `/api/v1/auth/logout` | Revoke session |
| GET | `/api/v1/auth/me` | Current user/session state |
| POST | `/api/v1/auth/forgot-password` | Send password reset email |
| POST | `/api/v1/auth/reset-password` | Reset password using token |

### 10.3 Wedding and Member APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/weddings` | Create Wedding + first Admin |
| GET | `/api/v1/wedding` | Get current Wedding |
| PATCH | `/api/v1/wedding` | Update Wedding details/location |
| GET | `/api/v1/members` | List Wedding Members |
| POST | `/api/v1/member-invitations` | Admin invites member |
| POST | `/api/v1/member-invitations/accept` | Accept invite token |
| DELETE | `/api/v1/member-invitations/:id` | Admin revokes pending invite |
| PATCH | `/api/v1/members/:memberId/role` | Admin changes role |
| DELETE | `/api/v1/members/:memberId` | Admin removes member |

### 10.4 Planning APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/v1/events` | List/create events |
| GET/PATCH/DELETE | `/api/v1/events/:eventId` | Read/update/delete event |
| GET/POST | `/api/v1/tasks` | List/create tasks |
| GET/PATCH/DELETE | `/api/v1/tasks/:taskId` | Read/update/delete task |

### 10.5 Guest, Invitation and RSVP APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/v1/guests` | List/create Guests |
| GET/PATCH/DELETE | `/api/v1/guests/:guestId` | Guest CRUD |
| POST | `/api/v1/guests/:guestId/invitation/send` | Send/resend one invitation |
| POST | `/api/v1/invitations/send-bulk` | Queue bulk invitations |
| POST | `/api/v1/invitations/remind-pending` | Queue RSVP reminders |
| GET | `/api/v1/public/invitations/:token` | Resolve public invitation |
| PATCH | `/api/v1/public/invitations/:token/rsvp` | Create/update RSVP |

### 10.6 Expense APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/v1/expenses` | List/create expenses |
| GET/PATCH/DELETE | `/api/v1/expenses/:expenseId` | Read/update/delete expense |

### 10.7 Vendor APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/v1/vendors` | List/add My Vendors |
| GET/PATCH/DELETE | `/api/v1/vendors/:vendorId` | Vendor CRUD |
| GET | `/api/v1/vendor-discovery` | Search Google Places using Wedding/default or overridden location |
| POST | `/api/v1/vendor-discovery/add` | Copy selected discovery result into My Vendors |

### 10.8 Website / Livestream APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET/PATCH | `/api/v1/website` | Theme/content/config |
| POST | `/api/v1/website/publish` | Publish website |
| POST | `/api/v1/website/unpublish` | Unpublish website |
| GET/PATCH | `/api/v1/livestream` | YouTube Live configuration |

### 10.9 Gallery and Media APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET/PATCH | `/api/v1/gallery/settings` | Gallery visibility / guest uploads |
| GET | `/api/v1/photos` | Authenticated photo list |
| DELETE | `/api/v1/photos/:mediaId` | Delete photo + R2 object |
| POST | `/api/v1/media/upload-intents` | Member signed upload URL |
| POST | `/api/v1/media/upload-intents/:uploadId/confirm` | Confirm uploaded object |
| GET | `/api/v1/public/gallery/:token/photos` | Guest gallery listing |
| POST | `/api/v1/public/gallery/:token/upload-intents` | Guest signed upload URL |
| POST | `/api/v1/public/gallery/:token/upload-intents/:uploadId/confirm` | Confirm guest upload |

### 10.10 Internal Job APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/internal/jobs/email/process` | Process next email batch; protected by internal secret |
| GET | `/api/v1/email-jobs/:jobId` | Organizer-visible job progress |

---

## 11. Zod Validation Strategy

Create separate schemas for:

- HTTP request DTOs;
- domain values/enums;
- external provider response normalization.

Example rules:

- email normalization + syntax;
- wedding date as ISO date;
- latitude `[-90, 90]`;
- longitude `[-180, 180]`;
- task status/priority enums;
- positive monetary amount;
- RSVP attendee count integer;
- allowed MIME type / declared upload size;
- YouTube URL host allow-list;
- Google Place ID/string lengths.

Do not use Mongoose validation as the only API boundary. Zod rejects invalid client input before domain services execute; Mongoose remains a persistence-level safety net.

---

## 12. MongoDB Data Architecture

MongoDB Atlas stores structured operational data only. Large media binaries stay in R2.

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="822pt" height="458pt"
 viewBox="0.00 0.00 822.00 458.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 440)">
<title>G</title>
<!-- user -->
<g id="node1" class="node">
<title>user</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M42,-238C42,-238 12,-238 12,-238 6,-238 0,-232 0,-226 0,-226 0,-214 0,-214 0,-208 6,-202 12,-202 12,-202 42,-202 42,-202 48,-202 54,-208 54,-214 54,-214 54,-226 54,-226 54,-232 48,-238 42,-238"/>
<text text-anchor="middle" x="27" y="-217.5" font-family="Arial" font-size="10.00">User</text>
</g>
<!-- membership -->
<g id="node2" class="node">
<title>membership</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M252,-238C252,-238 165,-238 165,-238 159,-238 153,-232 153,-226 153,-226 153,-214 153,-214 153,-208 159,-202 165,-202 165,-202 252,-202 252,-202 258,-202 264,-208 264,-214 264,-214 264,-226 264,-226 264,-232 258,-238 252,-238"/>
<text text-anchor="middle" x="208.5" y="-223" font-family="Arial" font-size="10.00">WeddingMember</text>
<text text-anchor="middle" x="208.5" y="-212" font-family="Arial" font-size="10.00">role Admin/Manager</text>
</g>
<!-- user&#45;&gt;membership -->
<g id="edge1" class="edge">
<title>user&#45;&gt;membership</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M54.1,-220C78.06,-220 114.48,-220 145.82,-220"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="145.83,-222.45 152.83,-220 145.83,-217.55 145.83,-222.45"/>
<text text-anchor="middle" x="103.5" y="-222.8" font-family="Arial" font-size="9.00">1 : 0..1 in V1</text>
</g>
<!-- wedding -->
<g id="node3" class="node">
<title>wedding</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="2" d="M460,-238C460,-238 359,-238 359,-238 353,-238 347,-232 347,-226 347,-226 347,-214 347,-214 347,-208 353,-202 359,-202 359,-202 460,-202 460,-202 466,-202 472,-208 472,-214 472,-214 472,-226 472,-226 472,-232 466,-238 460,-238"/>
<text text-anchor="middle" x="409.5" y="-223" font-family="Arial" font-size="10.00">Wedding</text>
<text text-anchor="middle" x="409.5" y="-212" font-family="Arial" font-size="10.00">TENANT BOUNDARY</text>
</g>
<!-- membership&#45;&gt;wedding -->
<g id="edge2" class="edge">
<title>membership&#45;&gt;wedding</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M264.14,-220C287.49,-220 315.02,-220 339.74,-220"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="339.97,-222.45 346.97,-220 339.97,-217.55 339.97,-222.45"/>
<text text-anchor="middle" x="305.5" y="-222.8" font-family="Arial" font-size="9.00">many : 1</text>
</g>
<!-- event -->
<g id="node4" class="node">
<title>event</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M568.5,-372C568.5,-372 538.5,-372 538.5,-372 532.5,-372 526.5,-366 526.5,-360 526.5,-360 526.5,-348 526.5,-348 526.5,-342 532.5,-336 538.5,-336 538.5,-336 568.5,-336 568.5,-336 574.5,-336 580.5,-342 580.5,-348 580.5,-348 580.5,-360 580.5,-360 580.5,-366 574.5,-372 568.5,-372"/>
<text text-anchor="middle" x="553.5" y="-351.5" font-family="Arial" font-size="10.00">Event</text>
</g>
<!-- wedding&#45;&gt;event -->
<g id="edge3" class="edge">
<title>wedding&#45;&gt;event</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M425.67,-238.21C442.11,-257.47 469.53,-288.28 496,-312 503.69,-318.89 512.46,-325.81 520.76,-331.99"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="519.32,-333.97 526.41,-336.13 522.22,-330.02 519.32,-333.97"/>
</g>
<!-- task -->
<g id="node5" class="node">
<title>task</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M755.5,-422C755.5,-422 725.5,-422 725.5,-422 719.5,-422 713.5,-416 713.5,-410 713.5,-410 713.5,-398 713.5,-398 713.5,-392 719.5,-386 725.5,-386 725.5,-386 755.5,-386 755.5,-386 761.5,-386 767.5,-392 767.5,-398 767.5,-398 767.5,-410 767.5,-410 767.5,-416 761.5,-422 755.5,-422"/>
<text text-anchor="middle" x="740.5" y="-401.5" font-family="Arial" font-size="10.00">Task</text>
</g>
<!-- wedding&#45;&gt;task -->
<g id="edge4" class="edge">
<title>wedding&#45;&gt;task</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M416.62,-238.17C429.6,-273.65 463.53,-351.85 521,-388 578,-423.85 660.65,-417.77 706.22,-410.61"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="706.7,-413.01 713.21,-409.45 705.9,-408.18 706.7,-413.01"/>
</g>
<!-- guest -->
<g id="node6" class="node">
<title>guest</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M568.5,-238C568.5,-238 538.5,-238 538.5,-238 532.5,-238 526.5,-232 526.5,-226 526.5,-226 526.5,-214 526.5,-214 526.5,-208 532.5,-202 538.5,-202 538.5,-202 568.5,-202 568.5,-202 574.5,-202 580.5,-208 580.5,-214 580.5,-214 580.5,-226 580.5,-226 580.5,-232 574.5,-238 568.5,-238"/>
<text text-anchor="middle" x="553.5" y="-217.5" font-family="Arial" font-size="10.00">Guest</text>
</g>
<!-- wedding&#45;&gt;guest -->
<g id="edge5" class="edge">
<title>wedding&#45;&gt;guest</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M472.37,-220C488.54,-220 505.34,-220 519.37,-220"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="519.43,-222.45 526.43,-220 519.43,-217.55 519.43,-222.45"/>
</g>
<!-- expense -->
<g id="node8" class="node">
<title>expense</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M760,-155C760,-155 721,-155 721,-155 715,-155 709,-149 709,-143 709,-143 709,-131 709,-131 709,-125 715,-119 721,-119 721,-119 760,-119 760,-119 766,-119 772,-125 772,-131 772,-131 772,-143 772,-143 772,-149 766,-155 760,-155"/>
<text text-anchor="middle" x="740.5" y="-134.5" font-family="Arial" font-size="10.00">Expense</text>
</g>
<!-- wedding&#45;&gt;expense -->
<g id="edge7" class="edge">
<title>wedding&#45;&gt;expense</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M466.19,-201.94C483.65,-196.53 503.06,-190.76 521,-186 584,-169.27 658.2,-153.44 701.91,-144.5"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="702.55,-146.87 708.92,-143.07 701.57,-142.07 702.55,-146.87"/>
</g>
<!-- vendor -->
<g id="node9" class="node">
<title>vendor</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M569,-104C569,-104 538,-104 538,-104 532,-104 526,-98 526,-92 526,-92 526,-80 526,-80 526,-74 532,-68 538,-68 538,-68 569,-68 569,-68 575,-68 581,-74 581,-80 581,-80 581,-92 581,-92 581,-98 575,-104 569,-104"/>
<text text-anchor="middle" x="553.5" y="-83.5" font-family="Arial" font-size="10.00">Vendor</text>
</g>
<!-- wedding&#45;&gt;vendor -->
<g id="edge8" class="edge">
<title>wedding&#45;&gt;vendor</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M425.67,-201.79C442.11,-182.53 469.53,-151.72 496,-128 503.47,-121.31 511.96,-114.59 520.05,-108.55"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="521.94,-110.19 526.13,-104.07 519.04,-106.25 521.94,-110.19"/>
</g>
<!-- media -->
<g id="node10" class="node">
<title>media</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M766.5,-338C766.5,-338 714.5,-338 714.5,-338 708.5,-338 702.5,-332 702.5,-326 702.5,-326 702.5,-314 702.5,-314 702.5,-308 708.5,-302 714.5,-302 714.5,-302 766.5,-302 766.5,-302 772.5,-302 778.5,-308 778.5,-314 778.5,-314 778.5,-326 778.5,-326 778.5,-332 772.5,-338 766.5,-338"/>
<text text-anchor="middle" x="740.5" y="-317.5" font-family="Arial" font-size="10.00">MediaAsset</text>
</g>
<!-- wedding&#45;&gt;media -->
<g id="edge9" class="edge">
<title>wedding&#45;&gt;media</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M468.98,-238.05C485.77,-243.22 504.1,-248.85 521,-254 581.45,-272.43 651.37,-293.51 695.51,-306.79"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="694.96,-309.18 702.37,-308.85 696.37,-304.49 694.96,-309.18"/>
</g>
<!-- job -->
<g id="node11" class="node">
<title>job</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M574,-36C574,-36 533,-36 533,-36 527,-36 521,-30 521,-24 521,-24 521,-12 521,-12 521,-6 527,0 533,0 533,0 574,0 574,0 580,0 586,-6 586,-12 586,-12 586,-24 586,-24 586,-30 580,-36 574,-36"/>
<text text-anchor="middle" x="553.5" y="-15.5" font-family="Arial" font-size="10.00">EmailJob</text>
</g>
<!-- wedding&#45;&gt;job -->
<g id="edge10" class="edge">
<title>wedding&#45;&gt;job</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M421.18,-201.67C439.91,-170.05 480.53,-103.67 521,-52 523.74,-48.51 526.75,-44.94 529.81,-41.5"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="531.71,-43.05 534.59,-36.21 528.08,-39.76 531.71,-43.05"/>
</g>
<!-- event&#45;&gt;task -->
<g id="edge11" class="edge">
<title>event&#45;&gt;task</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" stroke-dasharray="5,2" d="M580.61,-361.06C613.58,-369.97 670.31,-385.3 706.31,-395.03"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="705.82,-397.44 713.22,-396.9 707.1,-392.71 705.82,-397.44"/>
<text text-anchor="middle" x="640.5" y="-386.8" font-family="Arial" font-size="9.00">optional</text>
</g>
<!-- event&#45;&gt;media -->
<g id="edge12" class="edge">
<title>event&#45;&gt;media</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" stroke-dasharray="5,2" d="M580.68,-347.48C589.91,-345.28 600.39,-342.9 610,-341 638.16,-335.42 669.99,-330.25 695.05,-326.43"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="695.7,-328.81 702.26,-325.34 694.97,-323.96 695.7,-328.81"/>
<text text-anchor="middle" x="640.5" y="-343.8" font-family="Arial" font-size="9.00">optional album</text>
</g>
<!-- gin -->
<g id="node7" class="node">
<title>gin</title>
<path fill="white" stroke="#17324d" stroke-width="1.2" d="M774,-238C774,-238 707,-238 707,-238 701,-238 695,-232 695,-226 695,-226 695,-214 695,-214 695,-208 701,-202 707,-202 707,-202 774,-202 774,-202 780,-202 786,-208 786,-214 786,-214 786,-226 786,-226 786,-232 780,-238 774,-238"/>
<text text-anchor="middle" x="740.5" y="-217.5" font-family="Arial" font-size="10.00">GuestInvitation</text>
</g>
<!-- guest&#45;&gt;gin -->
<g id="edge6" class="edge">
<title>guest&#45;&gt;gin</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M580.61,-220C608.32,-220 652.83,-220 687.7,-220"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="687.99,-222.45 694.99,-220 687.99,-217.55 687.99,-222.45"/>
</g>
<!-- vendor&#45;&gt;expense -->
<g id="edge13" class="edge">
<title>vendor&#45;&gt;expense</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" stroke-dasharray="5,2" d="M581.34,-93.35C604.96,-99.83 640.27,-109.52 671,-118 681.05,-120.77 691.93,-123.79 702,-126.58"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="701.42,-128.96 708.82,-128.47 702.73,-124.24 701.42,-128.96"/>
<text text-anchor="middle" x="640.5" y="-120.8" font-family="Arial" font-size="9.00">optional</text>
</g>
</g>
</svg>
</div>

**Figure 8 - Core logical data model.** Every Wedding-owned aggregate carries `weddingId`; User is connected through WeddingMember.

### 12.1 Collections

| Collection | Purpose | Wedding-scoped? |
|---|---|---:|
| `users` | Account identity and password hash | No |
| `sessions` | Opaque server-side sessions | No |
| `passwordResetTokens` | One-time reset tokens | No |
| `weddings` | Tenant root and configuration | Root |
| `weddingMembers` | User-to-Wedding membership + role | Yes |
| `memberInvitations` | Pending/accepted Admin/Manager invitations | Yes |
| `events` | Wedding events | Yes |
| `tasks` | Planning tasks | Yes |
| `guests` | Guest parties + RSVP state | Yes |
| `guestInvitations` | Guest invitation token + send state | Yes |
| `expenses` | Expense tracker | Yes |
| `vendors` | My Vendors | Yes |
| `mediaAssets` | R2 object metadata for covers/photos | Yes |
| `emailJobs` | Lightweight bulk email job state | Yes |
| `rateLimitBuckets` | Lightweight security throttling | Usually key-scoped |

### 12.2 User

```ts
{
  _id,
  name,
  email,
  emailNormalized,
  passwordHash,
  createdAt,
  updatedAt
}
```

Indexes:

```text
UNIQUE emailNormalized
```

### 12.3 Session

```ts
{
  _id,
  userId,
  tokenHash,
  expiresAt,
  createdAt,
  lastSeenAt
}
```

Indexes:

```text
UNIQUE tokenHash
TTL expiresAt
userId
```

### 12.4 Wedding

```ts
{
  _id,
  brideName,
  groomName,
  title,
  description?,
  weddingDate,
  slug,
  location: {
    displayName,
    formattedAddress?,
    city?,
    state?,
    country?,
    postalCode?,
    placeId?,
    coordinates: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  },
  coverMediaId?,
  website: {
    theme,
    published,
    welcomeMessage?
  },
  gallery: {
    enabled,
    guestUploadsEnabled,
    accessTokenHash
  },
  livestream: { youtubeUrl? },
  createdAt,
  updatedAt
}
```

Indexes:

```text
UNIQUE slug
2dsphere location.coordinates
```

### 12.5 WeddingMember

```ts
{
  _id,
  weddingId,
  userId,
  role: "ADMIN" | "MANAGER",
  joinedAt
}
```

Indexes:

```text
UNIQUE userId                         // enforces one Wedding per user in V1
UNIQUE (weddingId, userId)
(weddingId, role)
```

### 12.6 Event

```ts
{
  _id,
  weddingId,
  name,
  type,
  date,
  startTime?,
  endTime?,
  venueName?,
  address?,
  location?,
  description?,
  dressCode?,
  coverMediaId?,
  createdAt,
  updatedAt
}
```

Indexes:

```text
(weddingId, date)
```

### 12.7 Task

```ts
{
  _id,
  weddingId,
  title,
  description?,
  assignedMemberId?,
  eventId?,
  dueDate?,
  priority: "LOW" | "MEDIUM" | "HIGH",
  status: "TODO" | "IN_PROGRESS" | "COMPLETED",
  createdAt,
  updatedAt
}
```

Indexes:

```text
(weddingId, status, dueDate)
(weddingId, assignedMemberId, status)
(weddingId, eventId)
```

### 12.8 Guest

```ts
{
  _id,
  weddingId,
  name,
  email?,
  phone?,
  maxGuestsAllowed,
  invitedEventIds: [],
  rsvpStatus: "PENDING" | "ATTENDING" | "NOT_ATTENDING",
  numberAttending,
  notes?,
  createdAt,
  updatedAt
}
```

Indexes:

```text
(weddingId, rsvpStatus)
(weddingId, name)
(weddingId, createdAt)
```

Guest emails are **not** globally or per-Wedding unique because the same family email could legitimately be reused.

### 12.9 GuestInvitation

```ts
{
  _id,
  weddingId,
  guestId,
  tokenHash,
  status: "ACTIVE" | "REVOKED" | "EXPIRED",
  invitationSentAt?,
  invitationSendCount,
  lastReminderAt?,
  expiresAt?,
  createdAt,
  updatedAt
}
```

Indexes:

```text
UNIQUE tokenHash
UNIQUE guestId
(weddingId, invitationSentAt)
```

### 12.10 Expense

```ts
{
  _id,
  weddingId,
  title,
  amountMinor,          // store currency in integer minor units
  currency: "INR",
  date,
  category,
  eventId?,
  vendorId?,
  notes?,
  createdAt,
  updatedAt
}
```

Indexes:

```text
(weddingId, date)
(weddingId, category)
(weddingId, vendorId)
```

Money should be persisted as integer minor units rather than floating-point currency values.

### 12.11 Vendor

```ts
{
  _id,
  weddingId,
  name,
  category,
  contactPerson?,
  phone?,
  email?,
  address?,
  website?,
  totalAgreedCostMinor?,
  eventIds: [],
  notes?,
  source: "MANUAL" | "GOOGLE_PLACES",
  googlePlaceId?,
  location?,
  createdAt,
  updatedAt
}
```

Indexes:

```text
(weddingId, category)
(weddingId, name)
```

### 12.12 MediaAsset

```ts
{
  _id,
  weddingId,
  kind: "WEDDING_COVER" | "EVENT_COVER" | "GALLERY_PHOTO",
  eventId?,
  objectKey,
  originalFileName,
  mimeType,
  sizeBytes,
  uploadedByType: "MEMBER" | "GUEST",
  uploadedByUserId?,
  uploadedByGuestId?,
  createdAt
}
```

Indexes:

```text
(weddingId, kind, createdAt)
(weddingId, eventId, createdAt)
UNIQUE objectKey
```

### 12.13 EmailJob

```ts
{
  _id,
  weddingId,
  type: "GUEST_INVITATION" | "RSVP_REMINDER" | "MEMBER_INVITE" | "ANNOUNCEMENT",
  recipientIds: [],
  cursor,
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "PARTIAL_FAILURE" | "FAILED",
  processedCount,
  successCount,
  failureCount,
  attempts,
  nextAttemptAt?,
  lockedUntil?,
  idempotencyKey?,
  createdByUserId,
  createdAt,
  updatedAt
}
```

Indexes:

```text
(status, nextAttemptAt, createdAt)
lockedUntil
UNIQUE (weddingId, idempotencyKey) where idempotencyKey exists
```

At the current scale, up to roughly 1,000 recipient IDs can remain in one job document. If recipient volume grows significantly, this can later evolve into an `emailJobItems` collection without changing the user-facing API.

---

## 13. MongoDB Transaction Boundaries

Use MongoDB transactions only where multiple documents must change atomically.

Recommended transaction cases:

1. Create Wedding + create first Admin membership.
2. Accept Wedding Member invitation + create membership + mark invitation accepted.
3. Admin demotion/removal where the last-Admin invariant must be preserved.
4. Guest deletion where invitation records must be removed consistently.

Avoid transactions for ordinary single-document CRUD.

### 13.1 Mongoose Operational Rules

- Reuse the MongoDB/Mongoose connection across warm Vercel invocations.
- Do not establish a fresh connection for every request.
- Keep the pool size conservative and configurable for serverless execution.
- Disable uncontrolled automatic index creation in production; manage important indexes deliberately through deployment/migration scripts.
- Use `.lean()` for read-only list queries where Mongoose documents are unnecessary.
- Use field projections to avoid loading large unused documents.

---

## 14. Location and Geospatial Design

Location is a reusable value object for Wedding, Event, and Vendor data.

Recommended structure:

```ts
{
  displayName: string,
  formattedAddress?: string,
  city?: string,
  state?: string,
  country?: string,
  postalCode?: string,
  placeId?: string,
  coordinates: {
    type: "Point",
    coordinates: [longitude, latitude]
  }
}
```

**Important:** GeoJSON coordinate order is `[longitude, latitude]`.

Vendor discovery defaults to the Wedding's saved coordinates. The organizer may supply a different search location for a particular discovery request without changing the Wedding itself.

---

## 15. Wedding Website Architecture

### 15.1 Public Route

```text
/w/<slug>
```

Example:

```text
/w/akshay-princi-2027-02-14
```

### 15.2 Slug Creation

Base slug:

```text
normalize(brideName) + normalize(groomName) + YYYY-MM-DD
```

A unique database index prevents collisions. If the base already exists, append a short unique suffix.

Once a Wedding URL has been shared/published, the slug should remain stable even if names or the Wedding date are later edited, preventing broken links.

### 15.3 Rendering

The public Wedding page reads only published Wedding information. Authenticated management data is never exposed through the public route. Public pages may use Next.js caching/revalidation; authenticated dashboard pages remain user-specific and should not use shared public caches.

### 15.4 Gallery Privacy

The Wedding website and the token-protected private gallery are separate access paths. The private gallery token must never be silently exposed in page source or logs. If gallery content is explicitly configured to appear on the Wedding website, that setting is treated as an organizer decision to make that content visible through the website.

---

## 16. Cloudflare R2 Media Architecture

R2 is private object storage for Wedding and Event cover images plus gallery photos. MongoDB stores metadata only.

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="708pt" height="241pt"
 viewBox="0.00 0.00 708.00 241.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 223)">
<title>G</title>
<!-- browser -->
<g id="node1" class="node">
<title>browser</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M122,-148C122,-148 12,-148 12,-148 6,-148 0,-142 0,-136 0,-136 0,-124 0,-124 0,-118 6,-112 12,-112 12,-112 122,-112 122,-112 128,-112 134,-118 134,-124 134,-124 134,-136 134,-136 134,-142 128,-148 122,-148"/>
<text text-anchor="middle" x="67" y="-127.5" font-family="Arial" font-size="10.00">Guest / Member Browser</text>
</g>
<!-- intent -->
<g id="node2" class="node">
<title>intent</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M363.5,-104C363.5,-104 264.5,-104 264.5,-104 258.5,-104 252.5,-98 252.5,-92 252.5,-92 252.5,-80 252.5,-80 252.5,-74 258.5,-68 264.5,-68 264.5,-68 363.5,-68 363.5,-68 369.5,-68 375.5,-74 375.5,-80 375.5,-80 375.5,-92 375.5,-92 375.5,-98 369.5,-104 363.5,-104"/>
<text text-anchor="middle" x="314" y="-89" font-family="Arial" font-size="10.00">POST upload intent</text>
<text text-anchor="middle" x="314" y="-78" font-family="Arial" font-size="10.00">metadata + auth/token</text>
</g>
<!-- browser&#45;&gt;intent -->
<g id="edge1" class="edge">
<title>browser&#45;&gt;intent</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M134.3,-118.09C168.57,-111.94 210.32,-104.44 244.85,-98.24"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="245.65,-100.58 252.11,-96.94 244.78,-95.76 245.65,-100.58"/>
<text text-anchor="middle" x="182.5" y="-116.8" font-family="Arial" font-size="9.00">signed URL</text>
</g>
<!-- r2 -->
<g id="node4" class="node">
<title>r2</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M358,-172C358,-172 270,-172 270,-172 264,-172 258,-166 258,-160 258,-160 258,-148 258,-148 258,-142 264,-136 270,-136 270,-136 358,-136 358,-136 364,-136 370,-142 370,-148 370,-148 370,-160 370,-160 370,-166 364,-172 358,-172"/>
<text text-anchor="middle" x="314" y="-157" font-family="Arial" font-size="10.00">Cloudflare R2</text>
<text text-anchor="middle" x="314" y="-146" font-family="Arial" font-size="10.00">Direct binary upload</text>
</g>
<!-- browser&#45;&gt;r2 -->
<g id="edge4" class="edge">
<title>browser&#45;&gt;r2</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M134.3,-136.49C170.57,-140.05 215.23,-144.42 250.83,-147.91"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="250.62,-150.35 257.83,-148.6 251.1,-145.47 250.62,-150.35"/>
<text text-anchor="middle" x="182.5" y="-145.8" font-family="Arial" font-size="9.00">PUT object</text>
</g>
<!-- confirm -->
<g id="node5" class="node">
<title>confirm</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M385,-36C385,-36 243,-36 243,-36 237,-36 231,-30 231,-24 231,-24 231,-12 231,-12 231,-6 237,0 243,0 243,0 385,0 385,0 391,0 397,-6 397,-12 397,-12 397,-24 397,-24 397,-30 391,-36 385,-36"/>
<text text-anchor="middle" x="314" y="-21" font-family="Arial" font-size="10.00">POST confirm upload</text>
<text text-anchor="middle" x="314" y="-10" font-family="Arial" font-size="10.00">server validates object metadata</text>
</g>
<!-- browser&#45;&gt;confirm -->
<g id="edge5" class="edge">
<title>browser&#45;&gt;confirm</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M104.32,-111.94C137.18,-95.76 187.02,-71.62 231,-52 240.81,-47.62 251.36,-43.11 261.52,-38.85"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="262.61,-41.05 268.13,-36.1 260.73,-36.53 262.61,-41.05"/>
</g>
<!-- api -->
<g id="node3" class="node">
<title>api</title>
<path fill="#f4f6f8" stroke="#17324d" stroke-width="1.2" d="M647,-187.5C647,-187.5 519,-187.5 519,-187.5 513,-187.5 507,-181.5 507,-175.5 507,-175.5 507,-152.5 507,-152.5 507,-146.5 513,-140.5 519,-140.5 519,-140.5 647,-140.5 647,-140.5 653,-140.5 659,-146.5 659,-152.5 659,-152.5 659,-175.5 659,-175.5 659,-181.5 653,-187.5 647,-187.5"/>
<text text-anchor="middle" x="583" y="-172.5" font-family="Arial" font-size="10.00">Next.js API</text>
<text text-anchor="middle" x="583" y="-161.5" font-family="Arial" font-size="10.00">validate + create object key</text>
<text text-anchor="middle" x="583" y="-150.5" font-family="Arial" font-size="10.00">return short&#45;lived signed URL</text>
</g>
<!-- intent&#45;&gt;api -->
<g id="edge2" class="edge">
<title>intent&#45;&gt;api</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M375.59,-103.7C412.38,-114.45 459.84,-128.31 499.97,-140.04"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="499.46,-142.44 506.86,-142.05 500.83,-137.73 499.46,-142.44"/>
<text text-anchor="middle" x="445.5" y="-131.8" font-family="Arial" font-size="9.00">signed URL</text>
</g>
<!-- api&#45;&gt;browser -->
<g id="edge3" class="edge">
<title>api&#45;&gt;browser</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M506.84,-179.43C435.4,-191.67 325.2,-204.26 231,-188 189.96,-180.92 145.57,-164.49 113.49,-150.93"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="114.24,-148.58 106.84,-148.08 112.31,-153.09 114.24,-148.58"/>
<text text-anchor="middle" x="314" y="-197.8" font-family="Arial" font-size="9.00">signed URL</text>
</g>
<!-- media -->
<g id="node6" class="node">
<title>media</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M660,-36C660,-36 506,-36 506,-36 500,-36 494,-30 494,-24 494,-24 494,-12 494,-12 494,-6 500,0 506,0 506,0 660,0 660,0 666,0 672,-6 672,-12 672,-12 672,-24 672,-24 672,-30 666,-36 660,-36"/>
<text text-anchor="middle" x="583" y="-21" font-family="Arial" font-size="10.00">mediaAssets collection</text>
<text text-anchor="middle" x="583" y="-10" font-family="Arial" font-size="10.00">publish immediately after validation</text>
</g>
<!-- confirm&#45;&gt;media -->
<g id="edge6" class="edge">
<title>confirm&#45;&gt;media</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M397.29,-18C425.54,-18 457.4,-18 486.6,-18"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="486.96,-20.45 493.96,-18 486.96,-15.55 486.96,-20.45"/>
</g>
</g>
</svg>
</div>

**Figure 9 - Direct-to-R2 upload.** Large media does not pass through the Next.js server.

### 16.1 Upload Intent

The client requests an upload intent with:

```text
fileName
mimeType
declaredSize
kind
optional eventId
```

The API:

1. authenticates a Wedding Member or validates the Wedding gallery token;
2. validates type, size, gallery settings, and target Event ownership;
3. generates the R2 object key server-side;
4. records a temporary upload intent;
5. returns a short-lived signed upload URL.

Recommended object-key structure:

```text
weddings/<weddingId>/media/<yyyy>/<mm>/<uuid>
```

Never trust a client-supplied object path.

### 16.2 Direct Upload

Browser uploads the binary directly to R2. This avoids Vercel request body limits, function duration pressure, unnecessary bandwidth through the application, and memory spikes.

### 16.3 Confirmation

After R2 upload, client calls `confirm`.

The server verifies the expected object exists and that observable metadata is compatible with the upload intent before creating the permanent `mediaAssets` record. Invalid or abandoned objects should be deleted by cleanup logic.

### 16.4 Guest Publishing

For Guest uploads:

```text
Upload -> server validation -> media metadata created -> immediately visible in gallery
```

There is no moderation state machine in V1.

### 16.5 Private Reads

Keep the R2 bucket private. When gallery pages need image access, issue short-lived signed read URLs rather than exposing permanent public object URLs. Gallery list APIs must first validate the authenticated membership or Wedding gallery token.

### 16.6 R2 CORS

R2 CORS should allow only approved application origins and only the methods/headers needed for signed direct uploads. Development/preview origins should use separate non-production configuration where practical.

### 16.7 Deletion

Permanent photo deletion performs:

1. authorization check;
2. delete R2 object;
3. delete MongoDB metadata;
4. return success only when the operation reaches a consistent final state.

The operation must be idempotent so a retry can safely complete a partially failed delete.

---

## 17. Private Gallery and QR Architecture

### 17.1 One Stable Wedding-Level Token

Each Wedding owns one secure gallery access token. Store only its hash in MongoDB. The raw token appears in the shared gallery URL and printed QR code.

```text
/gallery/<opaque-token>
```

The token should be high entropy and generated once. It remains stable so printed QR codes continue working after the Wedding unless the organizer disables or explicitly regenerates access.

### 17.2 Gallery Authorization

Token resolution yields only one Wedding. Public gallery APIs do not accept a separate `weddingId` from the caller.

### 17.3 Gallery Settings

Simple V1 settings:

```text
galleryEnabled
guestUploadsEnabled
```

No per-photo or per-guest permission matrix is introduced.

---

## 18. Email Architecture with Resend

Email types include member invitations, guest invitations, resend actions, RSVP reminders, password reset, and approved Wedding announcements.

### 18.1 Transactional Email

Single-recipient operations may call Resend synchronously after core database state is safely persisted.

### 18.2 Bulk Email

Bulk sends are asynchronous.

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="981pt" height="158pt"
 viewBox="0.00 0.00 981.00 158.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 140)">
<title>G</title>
<!-- click -->
<g id="node1" class="node">
<title>click</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M130,-113C130,-113 12,-113 12,-113 6,-113 0,-107 0,-101 0,-101 0,-89 0,-89 0,-83 6,-77 12,-77 12,-77 130,-77 130,-77 136,-77 142,-83 142,-89 142,-89 142,-101 142,-101 142,-107 136,-113 130,-113"/>
<text text-anchor="middle" x="71" y="-98" font-family="Arial" font-size="10.00">Organizer clicks</text>
<text text-anchor="middle" x="71" y="-87" font-family="Arial" font-size="10.00">Send All / Remind Pending</text>
</g>
<!-- job -->
<g id="node2" class="node">
<title>job</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M335,-113C335,-113 206,-113 206,-113 200,-113 194,-107 194,-101 194,-101 194,-89 194,-89 194,-83 200,-77 206,-77 206,-77 335,-77 335,-77 341,-77 347,-83 347,-89 347,-89 347,-101 347,-101 347,-107 341,-113 335,-113"/>
<text text-anchor="middle" x="270.5" y="-98" font-family="Arial" font-size="10.00">Create emailJob in MongoDB</text>
<text text-anchor="middle" x="270.5" y="-87" font-family="Arial" font-size="10.00">status=PENDING</text>
</g>
<!-- click&#45;&gt;job -->
<g id="edge1" class="edge">
<title>click&#45;&gt;job</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M142.19,-95C156.57,-95 171.85,-95 186.63,-95"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="186.85,-97.45 193.85,-95 186.85,-92.55 186.85,-97.45"/>
</g>
<!-- ret -->
<g id="node3" class="node">
<title>ret</title>
<path fill="#f4f6f8" stroke="#17324d" stroke-width="1.2" d="M560,-122C560,-122 478,-122 478,-122 472,-122 466,-116 466,-110 466,-110 466,-98 466,-98 466,-92 472,-86 478,-86 478,-86 560,-86 560,-86 566,-86 572,-92 572,-98 572,-98 572,-110 572,-110 572,-116 566,-122 560,-122"/>
<text text-anchor="middle" x="519" y="-101.5" font-family="Arial" font-size="10.00">Return 202 + jobId</text>
</g>
<!-- job&#45;&gt;ret -->
<g id="edge2" class="edge">
<title>job&#45;&gt;ret</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M347.13,-97.76C383.07,-99.07 425.39,-100.62 458.92,-101.84"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="458.86,-104.29 465.94,-102.1 459.03,-99.4 458.86,-104.29"/>
</g>
<!-- claim -->
<g id="node5" class="node">
<title>claim</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="1.2" d="M572,-45C572,-45 466,-45 466,-45 460,-45 454,-39 454,-33 454,-33 454,-21 454,-21 454,-15 460,-9 466,-9 466,-9 572,-9 572,-9 578,-9 584,-15 584,-21 584,-21 584,-33 584,-33 584,-39 578,-45 572,-45"/>
<text text-anchor="middle" x="519" y="-30" font-family="Arial" font-size="10.00">Atomically claim job</text>
<text text-anchor="middle" x="519" y="-19" font-family="Arial" font-size="10.00">small configurable batch</text>
</g>
<!-- job&#45;&gt;claim -->
<g id="edge6" class="edge">
<title>job&#45;&gt;claim</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" stroke-dasharray="5,2" d="M336.91,-76.96C370.87,-67.59 412.42,-56.13 447.14,-46.55"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="447.9,-48.88 453.99,-44.66 446.59,-44.16 447.9,-48.88"/>
<text text-anchor="middle" x="402" y="-68.8" font-family="Arial" font-size="9.00">pending work</text>
</g>
<!-- cron -->
<g id="node4" class="node">
<title>cron</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M338,-36C338,-36 203,-36 203,-36 197,-36 191,-30 191,-24 191,-24 191,-12 191,-12 191,-6 197,0 203,0 203,0 338,0 338,0 344,0 350,-6 350,-12 350,-12 350,-24 350,-24 350,-30 344,-36 338,-36"/>
<text text-anchor="middle" x="270.5" y="-15.5" font-family="Arial" font-size="10.00">Vercel Cron / scheduled trigger</text>
</g>
<!-- cron&#45;&gt;claim -->
<g id="edge3" class="edge">
<title>cron&#45;&gt;claim</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M350.17,-20.87C381.09,-22 416.33,-23.29 446.51,-24.39"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="446.58,-26.84 453.66,-24.65 446.76,-21.95 446.58,-26.84"/>
</g>
<!-- resend -->
<g id="node6" class="node">
<title>resend</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M695,-45C695,-45 645,-45 645,-45 639,-45 633,-39 633,-33 633,-33 633,-21 633,-21 633,-15 639,-9 645,-9 645,-9 695,-9 695,-9 701,-9 707,-15 707,-21 707,-21 707,-33 707,-33 707,-39 701,-45 695,-45"/>
<text text-anchor="middle" x="670" y="-30" font-family="Arial" font-size="10.00">Resend</text>
<text text-anchor="middle" x="670" y="-19" font-family="Arial" font-size="10.00">Send batch</text>
</g>
<!-- claim&#45;&gt;resend -->
<g id="edge4" class="edge">
<title>claim&#45;&gt;resend</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M584.05,-27C598.16,-27 612.78,-27 625.83,-27"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="625.91,-29.45 632.91,-27 625.91,-24.55 625.91,-29.45"/>
</g>
<!-- update -->
<g id="node7" class="node">
<title>update</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M933,-45C933,-45 768,-45 768,-45 762,-45 756,-39 756,-33 756,-33 756,-21 756,-21 756,-15 762,-9 768,-9 768,-9 933,-9 933,-9 939,-9 945,-15 945,-21 945,-21 945,-33 945,-33 945,-39 939,-45 933,-45"/>
<text text-anchor="middle" x="850.5" y="-30" font-family="Arial" font-size="10.00">Update progress / retry state</text>
<text text-anchor="middle" x="850.5" y="-19" font-family="Arial" font-size="10.00">COMPLETED or PARTIAL_FAILURE</text>
</g>
<!-- resend&#45;&gt;update -->
<g id="edge5" class="edge">
<title>resend&#45;&gt;update</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M707.12,-27C719.38,-27 733.74,-27 748.53,-27"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="748.82,-29.45 755.82,-27 748.82,-24.55 748.82,-29.45"/>
</g>
</g>
</svg>
</div>

**Figure 10 - Lightweight background email processing.** The initial HTTP request creates work and returns quickly; scheduled invocations process small batches.

### 18.3 Job Creation

Example:

```text
POST /api/v1/invitations/send-bulk
 -> validate Admin/Manager permission
 -> determine eligible Guest IDs
 -> create emailJob
 -> return 202 Accepted + jobId
```

### 18.4 Processor Trigger

Recommended V1 trigger: **Vercel Cron** invokes an internal Route Handler on a schedule. The handler is protected by an internal secret and cannot be used as an ordinary public API.

### 18.5 Atomic Claiming

The processor uses an atomic MongoDB update to claim a job with `lockedUntil`. This prevents overlapping cron invocations from processing the same batch concurrently.

### 18.6 Batch Size

Use a configurable small batch, initially around **25-50 recipients per processing step**. This is an engineering default, not a product limit.

### 18.7 Delivery Semantics

Use an **at-least-once processing model with idempotency controls**:

- record the job cursor/progress;
- provide a stable provider idempotency key when available;
- update GuestInvitation send state only after confirmed provider acceptance;
- retry transient failures with backoff;
- stop retrying permanent invalid-address failures;
- expose job progress to the organizer.

### 18.8 Failure States

```text
PENDING
PROCESSING
COMPLETED
PARTIAL_FAILURE
FAILED
```

A Resend outage must not corrupt Wedding data. Jobs remain retryable while the rest of the application continues operating.

---

## 19. Google Places Vendor Discovery

### 19.1 Integration Boundary

Only the vendor integration adapter knows Google Places request/response formats. Domain services receive normalized provider-independent results.

### 19.2 Search Flow

1. Organizer opens Discover Vendors.
2. Default search center comes from Wedding coordinates.
3. Organizer may override location/category.
4. Backend calls Google Places with server-held API credentials.
5. Normalize response into application DTO.
6. Organizer may select a result and persist it as a normal `Vendor` record.

### 19.3 Persisted Vendor Data

When a discovered result is added to My Vendors, persist only the fields required by the product plus the provider Place ID. The My Vendors feature must continue to work even if Google Places is unavailable later.

### 19.4 Failure Behavior

Google Places failure disables only Vendor Discovery. Existing manually added/booked vendor management remains available.

---

## 20. YouTube Livestream Integration

The system stores a validated YouTube Live URL on the Wedding. The public Wedding website renders a YouTube embed only when configured.

Controls:

- allow-list YouTube URL formats/hosts;
- do not accept arbitrary embed HTML;
- do not proxy video;
- if the embed fails, the rest of the Wedding website still loads.

---

## 21. Dashboard Read Model

The V1 dashboard can compute cards from MongoDB using parallel indexed queries/aggregations:

```text
Event count
Task total/completed
Guest count
RSVP counts
Expense total
Vendor count
Upcoming events
Upcoming tasks
```

At current scale, a separate analytics/read database is unnecessary. Use `Promise.all` for independent queries and compact projections. If future load makes dashboard aggregation expensive, a denormalized Wedding summary can be introduced later without changing the product contract.

---

## 22. Pagination and Query Strategy

### 22.1 Pagination

All potentially large lists use pagination:

- Guests
- Tasks
- Expenses
- Vendors
- Photos

Prefer cursor-based pagination for photos and other append-heavy lists. Offset pagination is acceptable for smaller administrative lists where users benefit from page numbers.

### 22.2 No Unbounded Reads

No API should return all 5,000 photos or all 1,000 Guests in one response. Page sizes are configurable and capped server-side.

### 22.3 Filtering

Only documented filters are accepted. Example Guest filters:

```text
rsvpStatus
eventId
search text
```

Do not accept raw client MongoDB filter objects.

---

## 23. Caching Strategy

V1 does not use Redis.

Recommended cache behavior:

- Authenticated dashboard/API reads: dynamic and tenant-specific.
- Public Wedding website: Next.js cache/revalidation may be used.
- Google Places: optional short-lived application/provider caching can be added later if cost/latency justifies it.
- Gallery/media: rely on signed direct object delivery and browser/CDN caching semantics where safe.

Do not add a distributed cache until measured workload demonstrates a need.

---

## 24. Security Architecture

### 24.1 Threat and Control Matrix

| Threat | Primary controls |
|---|---|
| Cross-Wedding IDOR | TenantContext, `weddingId` in every tenant query, repository scoping |
| Password database leak | bcrypt hashes only; no plaintext |
| Session theft | high-entropy opaque token, HttpOnly/Secure/SameSite cookie, expiry, server-side revocation |
| Guest token guessing | 256-bit random tokens, hash at rest, rate controls |
| Token leakage in logs | redact cookies, tokens, signed URLs, token-bearing route segments |
| Credential stuffing | login throttling, generic errors, structured security logs |
| CSRF | SameSite cookie + Origin/Referer validation for state-changing same-origin requests |
| XSS | React escaping, plain/sanitized user content, Content Security Policy |
| NoSQL injection | Zod allow-lists; build queries server-side; never pass raw Mongo operators |
| Upload abuse | signed intents, server-generated keys, MIME/size allow-list, post-upload validation, rate controls |
| Arbitrary embed injection | allow-list YouTube URL patterns; no raw iframe HTML from user |
| Secret exposure | Vercel environment variables; never ship provider secrets to client |
| Double bulk send | idempotency key + job state |

### 24.2 Rate Limiting Without Redis

Because Redis is intentionally absent, use a lightweight MongoDB-backed `rateLimitBuckets` collection with atomic increments and TTL cleanup for sensitive endpoints such as:

- signup/login;
- forgot/reset password;
- member invite acceptance;
- public guest token resolution;
- RSVP mutation;
- guest upload intents.

This is sufficient for V1 scale and can later be replaced by edge/provider rate limiting.

### 24.3 Content Security

Recommended HTTP security headers:

```text
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy
Permissions-Policy
```

CSP must explicitly allow the application's own assets, required R2 delivery hosts, and YouTube frames while avoiding broad wildcards.

### 24.4 Logging Rules

Never log:

```text
passwords
password hashes
session tokens
member invitation tokens
guest invitation tokens
gallery tokens
R2 signed URLs
Resend API keys
Google API keys
raw authentication cookies
```

---

## 25. Logging and Operational Visibility

No external observability product is required initially.

### 25.1 Structured Log Shape

Recommended fields:

```json
{
  "timestamp": "...",
  "level": "info",
  "requestId": "req_...",
  "userId": "...",
  "weddingId": "...",
  "action": "guest.rsvp.updated",
  "message": "RSVP updated"
}
```

Include `userId` / `weddingId` only when known and safe. Do not include Guest PII unless essential for a controlled error investigation.

### 25.2 Levels

```text
INFO  - normal state-changing operations and job lifecycle
WARN  - recoverable provider failures, retries, suspicious requests
ERROR - unexpected failures requiring developer investigation
```

### 25.3 Health Endpoint

A minimal `/api/health` may report application status without exposing secrets, stack traces, cluster names, or credentials. Production health checks should not execute expensive queries.

---

## 26. Deployment Architecture

<div class="diagram"><!-- Generated by graphviz version 2.42.4 (0)
 -->
<!-- Title: G Pages: 1 -->
<svg style="max-width:100%;height:auto" width="656pt" height="344pt"
 viewBox="0.00 0.00 656.00 344.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(18 326)">
<title>G</title>
<!-- internet -->
<g id="node1" class="node">
<title>internet</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M79,-264C79,-264 12,-264 12,-264 6,-264 0,-258 0,-252 0,-252 0,-240 0,-240 0,-234 6,-228 12,-228 12,-228 79,-228 79,-228 85,-228 91,-234 91,-240 91,-240 91,-252 91,-252 91,-258 85,-264 79,-264"/>
<text text-anchor="middle" x="45.5" y="-243.5" font-family="Arial" font-size="10.00">Users / Guests</text>
</g>
<!-- vercel -->
<g id="node2" class="node">
<title>vercel</title>
<path fill="#f2ecf5" stroke="#17324d" stroke-width="2" d="M294,-201.5C294,-201.5 152,-201.5 152,-201.5 146,-201.5 140,-195.5 140,-189.5 140,-189.5 140,-166.5 140,-166.5 140,-160.5 146,-154.5 152,-154.5 152,-154.5 294,-154.5 294,-154.5 300,-154.5 306,-160.5 306,-166.5 306,-166.5 306,-189.5 306,-189.5 306,-195.5 300,-201.5 294,-201.5"/>
<text text-anchor="middle" x="223" y="-186.5" font-family="Arial" font-size="10.00">Vercel</text>
<text text-anchor="middle" x="223" y="-175.5" font-family="Arial" font-size="10.00">Next.js Node.js runtime</text>
<text text-anchor="middle" x="223" y="-164.5" font-family="Arial" font-size="10.00">Pages + Route Handlers + Cron</text>
</g>
<!-- internet&#45;&gt;vercel -->
<g id="edge1" class="edge">
<title>internet&#45;&gt;vercel</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M91.24,-228.66C110.39,-221.24 133.18,-212.42 154.32,-204.22"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="155.48,-206.4 161.12,-201.59 153.71,-201.83 155.48,-206.4"/>
</g>
<!-- r2 -->
<g id="node4" class="node">
<title>r2</title>
<path fill="#eaf7f0" stroke="#17324d" stroke-width="1.2" d="M577,-308C577,-308 484,-308 484,-308 478,-308 472,-302 472,-296 472,-296 472,-284 472,-284 472,-278 478,-272 484,-272 484,-272 577,-272 577,-272 583,-272 589,-278 589,-284 589,-284 589,-296 589,-296 589,-302 583,-308 577,-308"/>
<text text-anchor="middle" x="530.5" y="-293" font-family="Arial" font-size="10.00">Cloudflare R2</text>
<text text-anchor="middle" x="530.5" y="-282" font-family="Arial" font-size="10.00">Private media bucket</text>
</g>
<!-- internet&#45;&gt;r2 -->
<g id="edge4" class="edge">
<title>internet&#45;&gt;r2</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" stroke-dasharray="5,2" d="M91.07,-250.06C176.83,-257.87 365.07,-275.02 464.7,-284.1"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="464.53,-286.54 471.72,-284.74 464.97,-281.66 464.53,-286.54"/>
<text text-anchor="middle" x="223" y="-271.8" font-family="Arial" font-size="9.00">signed upload/read</text>
</g>
<!-- atlas -->
<g id="node3" class="node">
<title>atlas</title>
<path fill="#eaf3fb" stroke="#17324d" stroke-width="1.2" d="M608,-104C608,-104 453,-104 453,-104 447,-104 441,-98 441,-92 441,-92 441,-80 441,-80 441,-74 447,-68 453,-68 453,-68 608,-68 608,-68 614,-68 620,-74 620,-80 620,-80 620,-92 620,-92 620,-98 614,-104 608,-104"/>
<text text-anchor="middle" x="530.5" y="-89" font-family="Arial" font-size="10.00">MongoDB Atlas</text>
<text text-anchor="middle" x="530.5" y="-78" font-family="Arial" font-size="10.00">Primary operational data + backups</text>
</g>
<!-- vercel&#45;&gt;atlas -->
<g id="edge2" class="edge">
<title>vercel&#45;&gt;atlas</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M302.28,-154.43C351.82,-139.51 415.19,-120.42 462.42,-106.2"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="463.27,-108.5 469.27,-104.14 461.86,-103.81 463.27,-108.5"/>
</g>
<!-- vercel&#45;&gt;r2 -->
<g id="edge3" class="edge">
<title>vercel&#45;&gt;r2</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M278.75,-201.52C295.14,-208.35 313.22,-215.67 330,-222 375.31,-239.1 427.09,-256.7 466.54,-269.7"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="465.84,-272.05 473.26,-271.91 467.37,-267.4 465.84,-272.05"/>
<text text-anchor="middle" x="373.5" y="-253.8" font-family="Arial" font-size="9.00">sign / confirm / delete</text>
</g>
<!-- resend -->
<g id="node5" class="node">
<title>resend</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M547.5,-240C547.5,-240 513.5,-240 513.5,-240 507.5,-240 501.5,-234 501.5,-228 501.5,-228 501.5,-216 501.5,-216 501.5,-210 507.5,-204 513.5,-204 513.5,-204 547.5,-204 547.5,-204 553.5,-204 559.5,-210 559.5,-216 559.5,-216 559.5,-228 559.5,-228 559.5,-234 553.5,-240 547.5,-240"/>
<text text-anchor="middle" x="530.5" y="-219.5" font-family="Arial" font-size="10.00">Resend</text>
</g>
<!-- vercel&#45;&gt;resend -->
<g id="edge5" class="edge">
<title>vercel&#45;&gt;resend</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M306.27,-189.85C367.67,-198.69 448.52,-210.34 494.16,-216.91"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="493.9,-219.35 501.18,-217.92 494.6,-214.5 493.9,-219.35"/>
</g>
<!-- places -->
<g id="node6" class="node">
<title>places</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M562.5,-172C562.5,-172 498.5,-172 498.5,-172 492.5,-172 486.5,-166 486.5,-160 486.5,-160 486.5,-148 486.5,-148 486.5,-142 492.5,-136 498.5,-136 498.5,-136 562.5,-136 562.5,-136 568.5,-136 574.5,-142 574.5,-148 574.5,-148 574.5,-160 574.5,-160 574.5,-166 568.5,-172 562.5,-172"/>
<text text-anchor="middle" x="530.5" y="-151.5" font-family="Arial" font-size="10.00">Google Places</text>
</g>
<!-- vercel&#45;&gt;places -->
<g id="edge6" class="edge">
<title>vercel&#45;&gt;places</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M306.27,-171.54C361.41,-167.21 432.23,-161.64 479.16,-157.95"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="479.4,-160.39 486.19,-157.4 479.02,-155.51 479.4,-160.39"/>
</g>
<!-- yt -->
<g id="node7" class="node">
<title>yt</title>
<path fill="#fff6e5" stroke="#17324d" stroke-width="1.2" d="M550,-36C550,-36 511,-36 511,-36 505,-36 499,-30 499,-24 499,-24 499,-12 499,-12 499,-6 505,0 511,0 511,0 550,0 550,0 556,0 562,-6 562,-12 562,-12 562,-24 562,-24 562,-30 556,-36 550,-36"/>
<text text-anchor="middle" x="530.5" y="-15.5" font-family="Arial" font-size="10.00">YouTube</text>
</g>
<!-- vercel&#45;&gt;yt -->
<g id="edge7" class="edge">
<title>vercel&#45;&gt;yt</title>
<path fill="none" stroke="#5b6670" stroke-width="1.15" d="M259.76,-154.49C301.91,-127.45 374.62,-82.82 441,-52 457.46,-44.36 476.16,-36.99 492.11,-31.08"/>
<polygon fill="#5b6670" stroke="#5b6670" stroke-width="1.15" points="493.04,-33.35 498.77,-28.64 491.35,-28.75 493.04,-33.35"/>
</g>
</g>
</svg>
</div>

**Figure 11 - Deployment topology.** Vercel hosts the only application runtime. Managed services remain independently scalable and failure-isolated.

### 26.1 Vercel

- Use Node.js runtime for Route Handlers that require Mongoose and server SDKs.
- Do not move database/auth code to Edge runtime unless explicitly validated.
- Keep provider credentials in Vercel environment variables.
- Use deployment environments for local/development, preview/staging, and production with separate non-production resources where practical.

### 26.2 MongoDB Atlas Connection Management

- Cache the Mongoose connection in the server runtime.
- Use a bounded connection pool.
- Configure supported Atlas/Vercel network access rather than embedding network assumptions in code.
- Database credentials are server-only.

### 26.3 Environment Variables

Representative server-only variables:

```text
MONGODB_URI
APP_BASE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_ENDPOINT
RESEND_API_KEY
GOOGLE_PLACES_API_KEY
INTERNAL_CRON_SECRET
```

Do not prefix secrets with `NEXT_PUBLIC_`.

---

## 27. Background Processing on Vercel

V1 has no dedicated worker deployment. Scheduled short-lived Vercel invocations process pending jobs.

Rules:

- each invocation performs bounded work;
- no long-running loop;
- job claiming is atomic;
- jobs are retryable;
- processor is idempotent;
- provider timeouts leave recoverable state in MongoDB;
- configuration controls batch size and retry limits.

This keeps background work compatible with a serverless hosting model.

---

## 28. Failure and Degradation Strategy

| Failure | Expected behavior |
|---|---|
| MongoDB unavailable | Authenticated writes/reads fail closed; return service unavailable; no silent fallback |
| Resend unavailable | Email job remains pending/retryable; planning features remain available |
| R2 upload unavailable | Photo/cover upload fails cleanly; planning modules remain available |
| R2 read unavailable | Gallery media cannot load; metadata and other modules remain available |
| Google Places unavailable | Discover Vendors unavailable; My Vendors still works |
| YouTube unavailable | Livestream area fails gracefully; Wedding website still renders |
| Vercel Cron delayed | Email jobs wait; no duplicate send due to claim/idempotency controls |
| Client retries after timeout | Idempotent endpoints return/reuse existing final state where supported |
| Event has dependencies on delete | Return conflict with dependency information; do not silently orphan critical links |

### 28.1 External Call Timeouts

All provider requests need explicit timeouts. Provider latency should not indefinitely consume a Vercel invocation.

### 28.2 Retry Policy

Retry only failures that are likely transient. Use bounded exponential backoff for email jobs. Do not automatically retry validation failures or invalid addresses.

---

## 29. Data Deletion and Referential Behavior

V1 intentionally avoids soft-delete-everywhere.

### 29.1 Wedding Member Removal

Delete the `WeddingMember` relationship, not the underlying `User` account. The final Admin cannot be removed.

### 29.2 Event Deletion

Before delete, check for dependent invitations, tasks, vendors, expenses, or photos. V1 should block unsafe deletion with a `409 Conflict` until dependencies are resolved, rather than silently creating orphaned critical references.

### 29.3 Vendor Deletion

Vendor linkage from Expense is optional. If a Vendor is permanently removed, related historical Expense records remain; the optional vendor reference should be cleared or handled in a controlled cleanup so expense history is not lost.

### 29.4 Photo Deletion

Hard delete the R2 object and metadata. The operation is idempotent and recoverable from partial failure.

### 29.5 Task and Expense Deletion

Hard delete is acceptable when authorized and not prohibited by a dependent business rule.

---

## 30. Backup and Recovery

### 30.1 MongoDB

Use **MongoDB Atlas managed backups** in production. No custom backup service is required in V1.

Backup retention, point-in-time recovery window, RPO, and RTO depend on the selected Atlas production tier and should be documented as deployment configuration rather than guessed in product requirements.

### 30.2 Restore Procedure

High-level database restore runbook:

1. Identify restore point.
2. Restore to a new Atlas database/cluster according to Atlas procedure.
3. Validate schema/indexes and critical records.
4. Update production connection configuration if required.
5. Run smoke tests: login, tenant isolation, guest invitation, RSVP, photo metadata, email jobs.
6. Reopen traffic only after validation.

### 30.3 R2

No custom R2 backup infrastructure is introduced in V1. Product hard deletes should therefore be treated as destructive actions. If future business requirements demand media undelete/version recovery, that becomes a new retention requirement.

---

## 31. Scalability Strategy

V1 planning assumptions:

```text
~1,000 Guests / Wedding
~5,000 photos / Wedding
Thousands of active Weddings platform-wide over time
```

### 31.1 Database

Scale with:

- compound indexes beginning with `weddingId`;
- pagination;
- projections;
- no unbounded arrays except bounded relationship lists such as invited event IDs;
- Atlas vertical/cluster scaling as measured load grows.

### 31.2 Media

R2 scales independently from MongoDB and Vercel. Direct uploads remove large binary load from the application runtime.

### 31.3 Email

Email throughput scales by increasing job frequency/batch size before introducing a dedicated queue. Dedicated queue infrastructure is a future optimization, not a V1 dependency.

### 31.4 Application Runtime

Vercel horizontally invokes Node.js functions. The architecture therefore avoids process-local state and assumes multiple concurrent instances.

### 31.5 Connection Pressure

Because horizontal function scaling can amplify database connections, Mongoose connections must be reused per warm runtime and pool settings kept bounded.

---

## 32. Performance Engineering Targets

These are engineering targets, not contractual product SLAs:

- normal indexed CRUD APIs should generally complete within sub-second server time excluding third-party provider latency;
- bulk email creation returns quickly with `202` instead of waiting for sends;
- photo upload bandwidth bypasses application functions;
- gallery list responses are paginated and contain metadata, not embedded image binaries;
- public pages use appropriate caching/revalidation;
- dashboard queries execute in parallel and use indexes;
- no request loads an entire large Wedding collection without a limit.

Performance must be measured in preview/staging before production rather than assumed from local development.

---

## 33. Consistency and Idempotency

### 33.1 Strong Invariants

Use atomic writes/transactions for:

- one Wedding membership per User;
- create Wedding + first Admin;
- accept member invitation;
- final-Admin protection;
- unique slug/token/index constraints.

### 33.2 Eventually Completed Work

Email delivery and media upload confirmation are asynchronous/multi-system workflows. Their state models must tolerate retries and partial failure.

### 33.3 Idempotent Operations

Recommended idempotency for:

- bulk send/reminder requests;
- upload confirmation;
- logout;
- R2 deletion;
- email batch processing.

---

## 34. Concurrency Considerations

Examples:

- Two Admins attempt to demote/remove each other: use transaction + current Admin count.
- Same member invite accepted twice: unique membership and invitation status make second request idempotent/conflict safely.
- RSVP submitted from two tabs: last valid update wins; validation always checks max guests.
- Same photo confirm called twice: unique object key/upload intent prevents duplicate media metadata.
- Two cron processors wake simultaneously: `lockedUntil` atomic claim prevents double processing.
- Two Weddings generate same slug: unique index detects collision and suffix generation retries.

---

## 35. Schema Evolution and Migrations

MongoDB is schemaless at the engine level, but the application treats schemas as versioned contracts.

Rules:

- all schema changes live in version-controlled code;
- prefer additive/backward-compatible changes;
- write explicit migration scripts for required backfills/index creation;
- do not rely on uncontrolled Mongoose auto-indexing in production;
- deployment should tolerate old and new document shapes during a rolling release where practical;
- migrations should be idempotent and log progress.

---

## 36. Testing Strategy

### 36.1 Unit Tests

Focus on:

- domain rules;
- Zod validation;
- role checks;
- token utilities;
- slug generation;
- email job state transitions;
- deletion dependency rules.

### 36.2 Integration Tests

Use a dedicated test MongoDB database for:

- repositories;
- Mongoose indexes;
- transactions;
- session lifecycle;
- tenant isolation;
- RSVP updates;
- email job claiming.

Provider SDKs should be wrapped so tests can use fakes/stubs.

### 36.3 End-to-End Tests

Recommended E2E coverage with Playwright or equivalent:

1. Signup -> Create Wedding.
2. Signup/Login -> Accept Member Invitation -> Join Wedding.
3. Admin cannot remove/demote final Admin.
4. Manager cannot manage Wedding Members.
5. Cross-Wedding resource ID attack is rejected.
6. Create Event/Task/Guest/Expense/Vendor.
7. Guest invitation -> RSVP without login.
8. RSVP cannot exceed allowed guest count.
9. Wedding website publish and slug rendering.
10. Guest gallery token -> direct R2 upload intent -> confirm -> visible photo.
11. Organizer photo delete.
12. Bulk invitation -> email job -> processor -> completed state.
13. Google Places failure does not break My Vendors.

### 36.4 Security Regression Tests

Mandatory tests should attempt:

- invalid/expired/revoked tokens;
- session cookie theft simulation/revocation;
- cross-Wedding ObjectId access;
- Manager privilege escalation;
- raw Mongo operator injection;
- upload intent for another Wedding's event;
- path/object-key manipulation;
- token disclosure in logs.

### 36.5 Load Tests

Before public launch, test representative workloads:

- 1,000 Guest list/filter operations;
- creation of a 1,000-recipient email job;
- concurrent RSVP submissions;
- paginated gallery with 5,000 metadata records;
- concurrent upload-intent generation.

---

## 37. CI/CD and Environments

### 37.1 Environments

Recommended:

```text
Local / Development
Preview / Staging
Production
```

Use separate databases/buckets/API credentials for production vs non-production.

### 37.2 Pipeline Gates

Before production deployment:

1. TypeScript typecheck.
2. Lint/format.
3. Unit tests.
4. Integration tests.
5. Build Next.js.
6. Security-sensitive E2E smoke tests.
7. Apply controlled database migrations/index changes.
8. Deploy Vercel.
9. Run post-deployment smoke test.

### 37.3 Rollback

Application rollback should use the hosting platform's previous deployment. Database migrations should be designed to remain compatible with a rollback wherever possible; destructive migrations require an explicit rollback plan.

---

## 38. PRD Release Phase Mapping

| PRD phase | Architecture work |
|---|---|
| Phase 1 - Foundation | auth/session, Wedding tenant, memberships, Mongoose base, REST conventions, Vercel |
| Phase 2 - Planning | Events + Tasks modules, indexes, deletion rules |
| Phase 3 - Guests | Guests, tokens, RSVP, Resend, email jobs, WhatsApp share URL |
| Phase 4 - Financial and Vendors | Expense model, Vendor model, Google Places adapter |
| Phase 5 - Wedding Experience | Website slug/publish/theme, YouTube validation/embed |
| Phase 6 - Memories | R2 signed uploads, gallery token, QR, media metadata, direct uploads |
| Phase 7 - Production Readiness | security review, rate controls, backups, logs, load tests, failure drills |

---

## 39. Operational Runbooks

### 39.1 Email Job Stuck

1. Inspect job status, `lockedUntil`, attempts, last error using internal/admin diagnostics.
2. If lock expired, next processor run may reclaim it.
3. Verify Resend credentials/provider availability.
4. Retry only failed batch; do not recreate whole job blindly.
5. Check invitation send state for duplicates before manual recovery.

### 39.2 Failed Photo Upload

1. If direct R2 upload never completed, allow client retry with a new signed URL.
2. If object exists but confirmation failed, confirm idempotently using upload intent.
3. Cleanup abandoned upload intents/objects after configured retention.

### 39.3 Suspected Gallery Token Leak

1. Admin explicitly regenerates gallery access token.
2. Old token becomes invalid.
3. New QR/link must be redistributed; previously printed QR will no longer work after intentional rotation.

### 39.4 Suspected Account Compromise

1. Reset password.
2. Revoke all sessions for User.
3. Review Wedding Member role.
4. Rotate relevant member invitations if necessary.

---

## 40. Key Architecture Decision Records

### ADR-001 - Modular Monolith

**Decision:** One deployable Next.js application with explicit internal modules.  
**Reason:** Lowest operational complexity while preserving maintainability and teaching value.  
**Rejected:** microservices.

### ADR-002 - Next.js as Frontend and Backend

**Decision:** Next.js Route Handlers run the Node.js backend.  
**Reason:** avoids duplicate Express/NestJS infrastructure and deployment.  
**Rejected:** separate backend service.

### ADR-003 - Explicit REST APIs

**Decision:** Versioned `/api/v1` REST surface.  
**Reason:** clear contracts, testability, future client compatibility.

### ADR-004 - TypeScript Everywhere

**Decision:** shared language across UI, API, services, models.  
**Reason:** safer refactoring and contracts.

### ADR-005 - MongoDB Atlas + Mongoose

**Decision:** MongoDB Atlas managed cluster with Mongoose ODM.  
**Reason:** fits document-centric Wedding aggregates and user preference.

### ADR-006 - Zod at HTTP Boundary

**Decision:** validate all external request data before domain execution.  
**Reason:** predictable APIs and reduced injection/data-quality risk.

### ADR-007 - Custom Opaque Session Authentication

**Decision:** custom email/password + MongoDB-backed opaque sessions.  
**Reason:** learning value, explicit revocation, no external auth dependency.  
**Rejected:** Better Auth, Clerk, Auth0.

### ADR-008 - No Email Ownership Verification in V1

**Decision:** validate syntax + uniqueness but do not require verification.  
**Trade-off:** accepted account-ownership risk documented in Section 7.7.

### ADR-009 - Wedding as Tenant Boundary

**Decision:** tenant scope derived from WeddingMember and enforced in repositories.  
**Reason:** central security invariant.

### ADR-010 - Vercel Deployment

**Decision:** deploy modular monolith to Vercel.  
**Reason:** simple Next.js deployment and learning-friendly operations.

### ADR-011 - Cloudflare R2 for Media

**Decision:** private R2 bucket, direct signed client uploads, metadata in MongoDB.  
**Reason:** removes large binaries from DB and app servers.

### ADR-012 - Resend + MongoDB Email Jobs

**Decision:** Resend delivery with MongoDB-backed small-batch processing.  
**Reason:** reliable enough for V1 without queue infrastructure.

### ADR-013 - Google Places for Vendor Discovery

**Decision:** server-side integration adapter using Wedding location as default search context.

### ADR-014 - No Realtime / Redis Initially

**Decision:** standard HTTP request/refresh behavior and indexed MongoDB.  
**Reason:** PRD excludes realtime; no measured cache need.

### ADR-015 - Basic Logs, No External Monitoring/Analytics in MVP

**Decision:** structured application/server logs only.  
**Reason:** reduce initial complexity; PRD V1.1 explicitly defers analytics/observability tooling.

### ADR-016 - MongoDB Atlas Managed Backups

**Decision:** production database backups are managed by Atlas.  
**Reason:** no custom backup platform required.

### ADR-017 - Domain-Specific Hard Delete

**Decision:** no universal soft-delete layer.  
**Reason:** simpler queries and lifecycle; protect destructive domains with dependency checks.

### ADR-018 - One Shared Gallery Token, Unique Guest Invitation Tokens

**Decision:** Wedding-level stable gallery/QR access plus Guest-specific invitation token.  
**Reason:** matches low-friction PRD flows and printed QR stability.

---

## 41. Engineering Configuration Defaults

The following are **implementation defaults, not product promises**. They can be tuned without changing the architecture.

| Setting | Initial engineering direction |
|---|---|
| Session lifetime | ~7 days, configurable |
| Password reset token lifetime | Short-lived, e.g. ~30 minutes |
| Member invitation lifetime | Configurable, e.g. several days |
| Signed upload URL lifetime | Short-lived, e.g. ~10 minutes |
| Signed media read URL | Short-lived |
| Email processor batch | ~25-50 recipients |
| Email retry count | Small bounded number with backoff |
| List page size | Server-capped; endpoint-specific |
| Photo upload max size | Configurable after mobile-photo testing |
| Public endpoint rate limits | Endpoint-specific, stored in MongoDB buckets |

These values must be benchmarked and validated in the target Vercel/R2 environment before launch.

---

## 42. Future Evolution Triggers

The architecture intentionally leaves clear extraction points without building them early.

| Trigger | Possible future evolution |
|---|---|
| Email throughput overwhelms cron jobs | Dedicated queue/worker service |
| Read load exceeds MongoDB design | Redis/cache/read model |
| Photo transformations become important | Image processing service / variants |
| Planner users need many Weddings | Relax unique membership rule; add Wedding switcher |
| Analytics becomes a product need | Add event instrumentation and analytics platform |
| Operational complexity grows | External monitoring/error tracking |
| Vendor marketplace added | New booking/payment bounded context |
| Billing requirements defined | Subscription/billing module |
| Realtime collaboration required | WebSocket/realtime infrastructure |

No future capability above is part of V1 unless the PRD is updated.

---

## 43. Architecture Review Checklist

Before implementation starts, confirm:

- [ ] PRD V1.1 remains the product source of truth.
- [ ] All tenant-owned repositories require `weddingId`.
- [ ] `weddingMembers.userId` is unique in V1.
- [ ] Last Admin removal/demotion is transactionally blocked.
- [ ] Passwords are hashed; sessions are opaque and revocable.
- [ ] No email ownership verification is accidentally added as a blocking flow.
- [ ] Public Guest/Gallery tokens are high entropy and hashed at rest.
- [ ] Token-bearing URLs and cookies are redacted from logs.
- [ ] R2 bucket is private; uploads are direct via signed URL.
- [ ] Large binaries are not stored in MongoDB.
- [ ] Gallery uploads publish only after post-upload validation succeeds.
- [ ] Bulk email returns 202 and processes through MongoDB-backed batches.
- [ ] Cron processor has atomic job locking and idempotency.
- [ ] Google Places failure does not break My Vendors.
- [ ] No Redis, queue broker, external monitoring, or analytics platform is required for MVP.
- [ ] Production Atlas backups are enabled before launch.
- [ ] Critical cross-Wedding and guest-token security tests pass.

---

## 44. Final Architecture Statement

Make My Marriage V1 is a **Wedding-tenant, TypeScript modular monolith** hosted on Vercel. Next.js provides both the React application and Node.js REST backend. Business logic is separated into domain modules with Zod request validation, custom opaque-session authentication, Wedding-scoped authorization, and Mongoose persistence in MongoDB Atlas. Cloudflare R2 stores media through direct signed uploads, Resend handles transactional and MongoDB-batched email, Google Places powers vendor discovery, and YouTube is embedded for livestreaming. Guests remain login-free through secure invitation and gallery tokens. The design deliberately avoids microservices, dedicated queues, Redis, realtime infrastructure, external monitoring, and analytics in the MVP while retaining clear evolution paths if future scale or requirements justify them.
