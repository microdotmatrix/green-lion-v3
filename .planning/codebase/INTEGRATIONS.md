# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**Email:**
- Resend - Transactional email delivery for contact form notifications and admin replies
  - SDK/Client: `resend` npm package, client instantiated at `src/server/resend.ts`
  - Auth: `RESEND_API_KEY` (server-only secret)
  - Sending from: `no-reply@greenlioninnovations.com`
  - Used in: `src/pages/api/contact/index.ts` for admin notifications on form submissions

**File Upload:**
- UploadThing - Managed file/image upload service
  - SDK/Client: `uploadthing` + `@uploadthing/react` packages
  - Router definition: `src/server/uploadthing.ts`
  - API endpoint: `src/pages/api/uploadthing.ts` (GET + POST route handler)
  - Client components: `src/lib/uploadthing.ts` exports `UploadButton` and `UploadDropzone`
  - Auth: `UPLOADTHING_TOKEN` (accessed via `import.meta.env`, not in Astro env schema)
  - SSR config provider: `src/components/providers/upload-ssr.astro`
  - Restriction: Images only, max 4MB, max 1 file per upload, authenticated users only

**Email Templating:**
- React Email (`@react-email/components`) - React-based components for composing HTML email templates
  - Used alongside Resend for structured email content

## Data Storage

**Databases:**
- Neon PostgreSQL (serverless)
  - Connection: `DATABASE_URL` (server-only public env var)
  - Client: `@neondatabase/serverless` with HTTP transport (`neon-http` driver)
  - ORM: Drizzle ORM
  - Client instantiated: `src/lib/db/index.ts`
  - Schema file: `src/lib/db/schema.ts`
  - Migrations: `./drizzle/` directory (4 migration files present)
  - Migration tool: `drizzle-kit` (CLI commands: `db:push`, `db:generate`, `db:migrate`, `db:studio`)

**Database Schema Tables:**
- `user`, `session`, `account`, `verification` - better-auth managed auth tables
- `admin_invite` - Custom invite-only admin registration
- `categories`, `products`, `pricing_tiers` - Product catalog
- `customization_attributes`, `product_attributes`, `category_attributes` - Product customization system
- `quote_requests`, `quote_items` - Customer quote request workflow
- `contact_submissions`, `feedback_replies` - Contact form and admin reply system
- `testimonials`, `case_studies`, `client_logos` - Marketing content
- `services` - Company services catalog
- `tradeshow_reps`, `tradeshow_rep_categories`, `tradeshow_rep_products`, `tradeshow_rep_services`, `tradeshow_leads` - Trade show lead capture system
- `terms_conditions` - Legal documents with PDF embedding

**File Storage:**
- UploadThing CDN - Product and category images stored externally; URLs persisted as text in the database (e.g., `products.images` jsonb array, `categories.imageUrl`)

**Caching:**
- TanStack Query (`@tanstack/react-query`) - Client-side server state caching for React components
- No server-side caching layer detected

## Authentication & Identity

**Auth Provider:**
- better-auth 1.4 - Self-hosted authentication library (not a third-party auth SaaS)
  - Server config: `src/lib/auth/index.ts`
  - Client config: `src/lib/auth/client.ts`
  - API handler: `src/pages/api/auth/[...all].ts` (catches all `/api/auth/*` routes)
  - Strategy: Email + password only (`emailAndPassword.enabled: true`)
  - Database adapter: `drizzleAdapter` with PostgreSQL provider
  - Auth secret: `BETTER_AUTH_SECRET` (server-only secret)
  - Auth URL: `BETTER_AUTH_URL` (server-only public)

**Custom Auth Extensions:**
- Invite-only registration: `admin_invite` table enforces that new users must have a valid, unexpired, unused invite token matching their email before sign-up succeeds
- Approval gate: Users have an `approved` boolean field; unapproved users are blocked from admin routes via middleware at `src/middleware.ts`
- Admin access: Routes under `/admin` and `/api/admin` require both valid session and `approved: true`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, or similar SDK found)

**Logs:**
- `console.error` and `console.log` statements used directly in API routes and server handlers (no structured logging library)

## CI/CD & Deployment

**Hosting:**
- Netlify - Production deployment platform
  - Adapter: `@astrojs/netlify` 6.6
  - Output: Netlify Functions (SSR via `output: "server"` mode)
  - Local Netlify CLI output: `.netlify/` directory (gitignored)

**CI Pipeline:**
- Not detected (no `.github/workflows/`, `netlify.toml`, or similar CI config found in explored files)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Neon PostgreSQL connection string (server, public)
- `BETTER_AUTH_SECRET` - Auth signing secret (server, secret)
- `BETTER_AUTH_URL` - Base URL for auth callbacks (server, public)
- `RESEND_API_KEY` - Resend email API key (server, secret)
- `UPLOADTHING_TOKEN` - UploadThing API token (server, accessed via `import.meta.env`)
- `SITE_URL` - Public site URL (client, optional; defaults to `https://greenlioninnovations.com`)

**Secrets location:**
- Development: `.env.local` (gitignored)
- Production: Netlify environment variable dashboard

## Webhooks & Callbacks

**Incoming:**
- `/api/auth/[...all]` - better-auth handles all auth flows (sign-in, sign-up, session validation)
- `/api/uploadthing` - UploadThing webhook/handler endpoint for file upload events (GET + POST)
- `/api/contact` (POST) - Contact form submission endpoint
- `/api/quotes` (GET, POST) - Quote request creation and listing

**Outgoing:**
- Resend API calls to deliver email notifications when contact forms are submitted (`src/pages/api/contact/index.ts`)

---

*Integration audit: 2026-03-05*
