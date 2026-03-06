# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
green-lion-v3/
├── src/
│   ├── actions/            # Astro server actions (type-safe form mutations)
│   ├── assets/             # Static images (team, affiliates, companies)
│   │   └── images/
│   ├── components/         # All UI components
│   │   ├── admin/          # Admin panel React components
│   │   │   ├── pages/      # Full-page admin React islands (one per admin route)
│   │   │   ├── products/   # Product-specific sub-components
│   │   │   ├── categories/ # Category sub-components
│   │   │   ├── attributes/ # Attribute sub-components
│   │   │   ├── quotes/     # Quote sub-components
│   │   │   ├── feedback/   # Feedback sub-components
│   │   │   ├── tradeshows/ # Tradeshow sub-components
│   │   │   ├── users/      # User sub-components
│   │   │   └── content/    # Content (case studies, testimonials) sub-components
│   │   ├── auth/           # Sign-in and sign-up React form components
│   │   ├── catalog/        # Product/category/service display cards (Astro)
│   │   ├── elements/       # Small reusable Astro utility components
│   │   ├── icons/          # Icon components
│   │   ├── layout/         # Header, footer, navigation (Astro)
│   │   ├── providers/      # React context providers
│   │   ├── quote/          # Quote builder multi-step React flow
│   │   ├── sections/       # Homepage and marketing section components (Astro)
│   │   ├── theme/          # Theme toggle component
│   │   └── ui/             # shadcn/ui primitive components (50+ React components)
│   ├── hooks/              # Shared React hooks
│   ├── layouts/            # Astro layout shells
│   ├── lib/                # Shared utilities and server-side singletons
│   │   ├── auth/           # better-auth server instance + React client
│   │   └── db/             # Drizzle client + schema + types
│   ├── pages/              # Astro file-based routing
│   │   ├── admin/          # Admin panel pages (protected)
│   │   │   └── categories/ # Category detail sub-pages
│   │   ├── api/            # API endpoints
│   │   │   ├── admin/      # Protected admin CRUD REST endpoints
│   │   │   │   ├── attributes/
│   │   │   │   ├── case-studies/
│   │   │   │   ├── categories/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── clients/
│   │   │   │   ├── feedback/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── invites/
│   │   │   │   ├── products/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── quotes/
│   │   │   │   ├── services/
│   │   │   │   ├── testimonials/
│   │   │   │   ├── tradeshows/
│   │   │   │   └── users/
│   │   │   ├── auth/       # better-auth catch-all handler
│   │   │   ├── contact/    # Contact form API
│   │   │   └── quotes/     # Public quote submission API
│   │   ├── case-studies/   # Case studies public page
│   │   ├── products/       # Product catalog pages
│   │   │   └── [category]/ # Category + product detail dynamic pages
│   │   └── services/       # Services public page
│   ├── server/             # Server-only integration instances
│   ├── styles/             # Global CSS
│   ├── env.d.ts            # Astro.locals type declarations
│   └── middleware.ts       # Auth middleware
├── drizzle/                # Migration SQL files (generated)
├── public/                 # Static public assets
│   └── fonts/
├── astro.config.mjs        # Astro + Vite + adapter configuration
├── drizzle.config.ts       # Drizzle Kit migration config
├── tsconfig.json           # TypeScript config with @/* path alias
├── components.json         # shadcn/ui configuration
└── package.json
```

## Directory Purposes

**`src/pages/`:**
- Purpose: File-based routing — every `.astro` file is a route, every `.ts` file is an API endpoint
- Contains: Public marketing pages, admin panel pages, REST API routes, auth handler
- Key files:
  - `src/pages/index.astro` — homepage
  - `src/pages/admin/index.astro` — admin dashboard
  - `src/pages/api/auth/[...all].ts` — better-auth handler
  - `src/pages/api/uploadthing.ts` — UploadThing file upload handler

**`src/components/admin/pages/`:**
- Purpose: One full-page React island per admin route; each is mounted with `client:load`
- Contains: Full CRUD interfaces using TanStack Query to fetch from `/api/admin/*`
- Key files: `admin-products-page.tsx`, `admin-categories-page.tsx`, `admin-quotes-page.tsx`

**`src/components/ui/`:**
- Purpose: shadcn/ui component primitives (new-york style, zinc palette)
- Contains: 50+ React components including `button.tsx`, `dialog.tsx`, `sidebar.tsx`, `table.tsx`, `form.tsx`
- Do not modify these directly — regenerate via `shadcn` CLI

**`src/components/catalog/`:**
- Purpose: Read-only display components for public product/category/service browsing
- Contains: Astro components only — `category-card.astro`, `product-card.astro`, `service-card.astro`, `case-study-card.astro`

**`src/components/sections/`:**
- Purpose: Homepage and marketing page sections
- Contains: `hero.astro`, `about.astro`, `mission.astro`, `services.astro`, `testimonials.astro`, `team.astro`; `testimonials-carousel.tsx` (interactive React carousel)

**`src/components/quote/`:**
- Purpose: Multi-step interactive quote builder
- Contains: `quote-builder.tsx` (main flow), `product-browser-modal.tsx`, `cart-items-list.tsx`, `customer-info-form.tsx`, `quote-success.tsx`, `types.ts`

**`src/lib/db/`:**
- Purpose: Database access layer
- Contains:
  - `index.ts` — exports `db` singleton (Drizzle + Neon)
  - `schema.ts` — all table definitions, relations, Zod insert schemas, TypeScript select/insert types

**`src/lib/auth/`:**
- Purpose: Authentication utilities
- Contains:
  - `index.ts` — `auth` server instance (better-auth, used in middleware and API routes)
  - `client.ts` — `authClient` browser instance (used in React components for sign-in/out)

**`src/server/`:**
- Purpose: Server-only singleton instances for external services
- Contains:
  - `resend.ts` — exports `resend` Resend client
  - `uploadthing.ts` — exports `uploadRouter` (UploadThing FileRouter)

**`src/layouts/`:**
- Purpose: HTML document shells
- Contains:
  - `default.astro` — public site layout (Header + Footer + slot)
  - `admin.astro` — admin layout (auth guard + UploadSSR provider + slot, no header/footer)

**`src/actions/`:**
- Purpose: Astro server actions for type-safe form mutations
- Contains: `index.ts` — exports `server` object with `contact` action

**`drizzle/`:**
- Purpose: Migration SQL files generated by `drizzle-kit push`
- Generated: Yes
- Committed: Yes (migration history)

## Key File Locations

**Entry Points:**
- `src/pages/index.astro` — public homepage
- `src/pages/admin/index.astro` — admin dashboard
- `src/middleware.ts` — request auth interceptor
- `src/pages/api/auth/[...all].ts` — auth API handler
- `src/actions/index.ts` — Astro server actions

**Configuration:**
- `astro.config.mjs` — framework, integrations, adapter, typed env schema
- `tsconfig.json` — TypeScript paths (`@/*` alias to `./src/*`)
- `drizzle.config.ts` — migration config pointing to `src/lib/db/schema.ts`
- `components.json` — shadcn/ui new-york style config
- `src/env.d.ts` — `App.Locals` type declarations (user, session)

**Core Logic:**
- `src/lib/db/schema.ts` — entire data model (tables, types, Zod schemas)
- `src/lib/db/index.ts` — `db` export
- `src/lib/auth/index.ts` — `auth` export
- `src/lib/config.ts` — `SITE` and `NAV_LINKS` constants
- `src/lib/utils.ts` — `cn()` utility

**Styling:**
- `src/styles/global.css` — Tailwind CSS 4 import, OKLCH CSS variables, dark mode, custom utilities

## Naming Conventions

**Files:**
- Astro components: `kebab-case.astro` (e.g., `category-card.astro`, `admin-layout.astro`)
- React components: `kebab-case.tsx` (e.g., `quote-builder.tsx`, `admin-products-page.tsx`)
- API routes: `index.ts` for collection endpoints, `[id].ts` or `[...param].ts` for dynamic routes
- Utility/lib files: `kebab-case.ts` (e.g., `utils.ts`, `config.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-mobile.ts`, `use-url-filters.ts`)

**Directories:**
- Feature grouping by domain: `admin/`, `catalog/`, `quote/`, `auth/`
- Infrastructure grouping: `ui/`, `layout/`, `providers/`, `elements/`
- shadcn primitives always in `src/components/ui/`

**Exports:**
- Named exports preferred throughout
- Admin page components export a named function matching file stem: `export function AdminProductsPage()`
- Server singletons exported as named constants: `export const db`, `export const auth`, `export const resend`

## Where to Add New Code

**New public marketing page:**
- Page: `src/pages/[slug].astro`
- Section components: `src/components/sections/[section-name].astro`
- Use `src/layouts/default.astro` as layout

**New admin section (CRUD resource):**
- Page: `src/pages/admin/[resource].astro` — thin shell with `client:load` island
- React page component: `src/components/admin/pages/admin-[resource]-page.tsx`
- Sub-components: `src/components/admin/[resource]/`
- API routes: `src/pages/api/admin/[resource]/index.ts` (collection) + `src/pages/api/admin/[resource]/[id].ts` (single item)
- Schema: Add table + relations + Zod schema + types to `src/lib/db/schema.ts`
- Migration: Run `pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate`

**New API endpoint (protected):**
- Location: `src/pages/api/admin/[resource]/index.ts`
- Guard: Middleware handles 401/403 automatically for `/api/admin/*`; add local `locals.user` check as defense-in-depth

**New API endpoint (public):**
- Location: `src/pages/api/[resource]/index.ts`
- No auth guard needed; validate inputs manually

**New Astro Action:**
- Add to `src/actions/index.ts` as a new key on the `server` export object

**New React hook:**
- Location: `src/hooks/use-[name].ts`

**New shadcn/ui component:**
- Run `pnpm dlx shadcn@latest add [component]` — installs to `src/components/ui/`
- Do not hand-write in `src/components/ui/`

**Shared utilities:**
- `src/lib/utils.ts` — general helpers
- `src/lib/config.ts` — site-wide constants

## Special Directories

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents for AI agent context
- Generated: By GSD mapping agent
- Committed: Yes

**`drizzle/`:**
- Purpose: Database migration SQL files generated by drizzle-kit
- Generated: Yes (via `pnpm drizzle-kit generate`)
- Committed: Yes

**`.astro/`:**
- Purpose: Astro build cache and generated type declarations
- Generated: Yes
- Committed: No (`.gitignore`)

**`public/`:**
- Purpose: Static assets served at root — fonts, favicon, OG images
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-05*
