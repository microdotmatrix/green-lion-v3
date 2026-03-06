# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Astro Islands Architecture with full-stack SSR

**Key Characteristics:**
- Astro handles routing, SSR, and static page rendering; React is used only for interactive islands
- Database queries run directly in Astro page frontmatter for server-rendered pages (no separate API layer for read-only public pages)
- Admin UI is fully React (`client:load` islands) that consume a JSON REST API at `/api/admin/*`
- A single middleware (`src/middleware.ts`) enforces authentication on all `/admin` and `/api/admin` routes before any handler runs
- Astro Actions (`src/actions/index.ts`) provide a type-safe server action layer for form submissions (contact form)

## Layers

**Routing / Pages Layer:**
- Purpose: File-based routing, SSR page composition, redirect logic
- Location: `src/pages/`
- Contains: `.astro` pages for public site and admin; `.ts` API route handlers; `[...auth].ts` catch-all for better-auth
- Depends on: layouts, lib/db, lib/auth, server utilities
- Used by: Browser requests; Astro middleware

**Middleware Layer:**
- Purpose: Session validation and route protection for admin paths
- Location: `src/middleware.ts`
- Contains: Single `onRequest` handler that checks `better-auth` session and populates `Astro.locals.user` / `Astro.locals.session`
- Depends on: `src/lib/auth/index.ts`
- Used by: Every request on `/admin` and `/api/admin` routes

**Layout Layer:**
- Purpose: Shared HTML shell, meta, header/footer injection, auth redirect guards
- Location: `src/layouts/`
- Contains: `default.astro` (public site), `admin.astro` (admin — also performs final auth check and redirect)
- Depends on: `src/components/layout/`, `src/lib/config.ts`
- Used by: All `.astro` pages

**Component Layer:**
- Purpose: UI building blocks — both static Astro components and interactive React islands
- Location: `src/components/`
- Contains:
  - `ui/` — shadcn/ui primitives (React)
  - `admin/` — admin page components and sub-components (React)
  - `catalog/` — product/category/service display cards (Astro)
  - `sections/` — homepage and marketing sections (Astro)
  - `elements/` — small reusable Astro elements (scroll-up, logo, etc.)
  - `layout/` — header, footer, navigation (Astro)
  - `auth/` — sign-in/sign-up forms (React)
  - `quote/` — quote builder multi-step flow (React)
  - `providers/` — React context providers (QueryProvider, UploadSSR)
  - `theme/` — theme toggle
  - `icons/` — icon components
- Depends on: `src/lib/`, `src/hooks/`
- Used by: pages and layouts

**Data / Library Layer:**
- Purpose: Database client, schema, auth server config, server-side integrations
- Location: `src/lib/`, `src/server/`
- Contains:
  - `src/lib/db/index.ts` — Drizzle + Neon client singleton
  - `src/lib/db/schema.ts` — all table definitions, Drizzle relations, Zod insert schemas, TypeScript types
  - `src/lib/auth/index.ts` — better-auth server instance with drizzle adapter and invite-token middleware hooks
  - `src/lib/auth/client.ts` — better-auth React client for browser-side sign-in/out
  - `src/lib/config.ts` — site metadata and nav link constants
  - `src/lib/utils.ts` — `cn()` class merging utility
  - `src/lib/uploadthing.ts` — UploadThing React component generators
  - `src/server/resend.ts` — Resend email client singleton
  - `src/server/uploadthing.ts` — UploadThing file router definition
- Depends on: `astro:env/server`, `astro:env/client` (Astro typed env)
- Used by: pages, API routes, actions, middleware

**Actions Layer:**
- Purpose: Type-safe server mutations invocable from Astro forms and React components
- Location: `src/actions/index.ts`
- Contains: `contact` action — validates contact form submission, inserts to DB, fires async admin email notifications
- Depends on: `src/lib/db`, `src/server/resend`
- Used by: contact page form

## Data Flow

**Public Page Request (SSR):**

1. Browser requests a page (e.g., `/products`)
2. Middleware runs — non-admin path, skips auth check, calls `next()`
3. Astro page frontmatter executes server-side: queries DB directly via Drizzle
4. Astro renders HTML with data injected; static catalog components rendered to HTML
5. Response sent to browser; no client-side data fetching for initial view

**Admin Page Request:**

1. Browser requests `/admin/*`
2. Middleware calls `auth.api.getSession()`, populates `locals.user` and `locals.session`, redirects unauthenticated/unapproved users to `/signin`
3. Admin layout (`admin.astro`) performs second-level auth check, further redirecting if needed
4. Astro page passes `user` from `locals` to a React island via `client:load` prop
5. React island mounts with `QueryProvider` wrapping; fetches data from `/api/admin/*` REST endpoints using TanStack Query
6. Admin REST endpoints (`src/pages/api/admin/`) re-check `locals.user` / `locals.session` (middleware already validates, endpoints check as defense-in-depth)

**Contact Form Submission:**

1. User submits form on `/contact`
2. Astro Action `contact` is invoked (type-safe, validated via Zod)
3. Handler inserts `contactSubmissions` row, fires async `sendAdminNotifications()` (Resend email to all approved admins)
4. Returns `{ success: true, id }` to client

**Quote Request:**

1. User builds quote in React `QuoteBuilder` component (`src/components/quote/quote-builder.tsx`)
2. On submit, `POST /api/quotes` is called directly from client
3. API route generates `GLI-XXXXX` quote number, inserts `quoteRequests` + `quoteItems` rows
4. Returns quote confirmation to client

**File Upload:**

1. Admin triggers upload via UploadThing React component (`UploadButton`/`UploadDropzone` from `src/lib/uploadthing.ts`)
2. Request goes to `/api/uploadthing` which proxies through UploadThing's `createRouteHandler`
3. UploadThing middleware verifies the better-auth session before accepting the file
4. On completion, returns `{ url }` for the uploaded file

**State Management:**
- Server-rendered pages: no client state; data lives in Astro frontmatter
- Admin pages: TanStack Query with 5-minute stale time and no refetch-on-focus; queries are keyed per REST endpoint
- Quote builder: local React state within the island component
- Auth state: `Astro.locals.user` / `Astro.locals.session` on server; `authClient` (better-auth React client) for browser-side mutations

## Key Abstractions

**Drizzle Schema (`src/lib/db/schema.ts`):**
- Purpose: Single source of truth for all database tables, relations, Zod validation schemas, and TypeScript types
- All insert schemas derived via `drizzle-zod`'s `createInsertSchema`; all select types via `.$inferSelect`
- Examples: `products`, `categories`, `quoteRequests`, `tradeshowReps`

**`auth` singleton (`src/lib/auth/index.ts`):**
- Purpose: Server-side better-auth instance shared across middleware and API routes
- Used via `auth.api.getSession()` in middleware and upload router; `auth.handler()` in `/api/auth/[...all].ts`

**`db` singleton (`src/lib/db/index.ts`):**
- Purpose: Single Drizzle+Neon client instance imported everywhere DB access is needed
- Pattern: `import { db } from "@/lib/db"` then `db.select().from(table)`

**Admin Page Components (`src/components/admin/pages/`):**
- Purpose: Full-page React components that receive `user` prop from Astro and contain all admin CRUD UI
- Pattern: Thin Astro page shell passes `user` prop; React component manages all data fetching and mutations via TanStack Query + REST API
- Examples: `src/components/admin/pages/admin-products-page.tsx`

**Middleware Auth Guard (`src/middleware.ts`):**
- Purpose: Centralized route protection — sets `locals.user/session` and returns 401/403/302 for unauthorized admin access
- The layout `admin.astro` repeats this check as a final guard before rendering

## Entry Points

**Public Site:**
- Location: `src/pages/index.astro`
- Triggers: HTTP GET `/`
- Responsibilities: Renders homepage composed of section components (Hero, About, Mission, Services, Testimonials)

**Admin Dashboard:**
- Location: `src/pages/admin/index.astro`
- Triggers: Authenticated GET `/admin`
- Responsibilities: Passes `user` to `AdminDashboardPage` React island

**Auth API:**
- Location: `src/pages/api/auth/[...all].ts`
- Triggers: Any `POST/GET /api/auth/*` (better-auth protocol)
- Responsibilities: Delegates all auth handling to the `auth.handler()`

**Admin REST API:**
- Location: `src/pages/api/admin/` (multiple `.ts` files)
- Triggers: Authenticated fetch from admin React islands
- Responsibilities: CRUD operations on all resource types; auth validated by middleware + local guard

**Astro Actions:**
- Location: `src/actions/index.ts`
- Triggers: Astro `actions.contact()` call from contact form
- Responsibilities: Contact form submission, email notification dispatch

## Error Handling

**Strategy:** Per-layer, no unified error boundary

**Patterns:**
- API routes: `try/catch` blocks return JSON `{ error: string }` with appropriate HTTP status codes (400, 401, 403, 500)
- Astro Actions: Use `ActionError` with typed `code` (e.g., `INTERNAL_SERVER_ERROR`)
- better-auth middleware hooks: Use `APIError` to return 400 with descriptive messages for invite validation failures
- Admin React islands: TanStack Query handles loading/error states; no global error boundary observed
- Middleware: Returns `Response` directly for 401/403; `Response.redirect` for unauthenticated page access

## Cross-Cutting Concerns

**Logging:** `console.error()` only; no structured logging library
**Validation:** Zod schemas from `src/lib/db/schema.ts` used in API routes via `insertProductSchema.safeParse()`; Astro Actions use inline `z.object()` schemas
**Authentication:** better-auth, enforced at middleware layer; `Astro.locals.user` is the single source of truth for session data on server; `authClient` used client-side for sign-in/sign-out/sign-up mutations
**Environment Variables:** Astro typed env via `astro:env/server` and `astro:env/client`; schema defined in `astro.config.mjs`

---

*Architecture analysis: 2026-03-05*
