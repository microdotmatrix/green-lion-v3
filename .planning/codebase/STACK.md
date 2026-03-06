# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- TypeScript 5.9 - All source files: `src/**/*.ts`, `src/**/*.tsx`, Astro frontmatter
- Astro template syntax - Page and layout components: `src/**/*.astro`

**Secondary:**
- CSS - Global styles: `src/styles/global.css`

## Runtime

**Environment:**
- Node.js v24.x (confirmed active runtime; no `.nvmrc` pinned)

**Package Manager:**
- pnpm (latest)
- Lockfile: `pnpm-lock.yaml` present and committed

## Frameworks

**Core:**
- Astro 5.16 - Full-stack framework with file-based routing, SSR mode, and API routes
- React 19.2 - Island architecture for interactive components via `@astrojs/react`

**Build/Dev:**
- `@tailwindcss/vite` 4.1 - Tailwind CSS injected as a Vite plugin (not Astro integration)
- `babel-plugin-react-compiler` 1.0 - React Compiler optimization applied to all React components
- Prettier 3.8 with `prettier-plugin-astro` - Code formatting; config in `.prettierrc`
- `@astrojs/check` 0.9 - TypeScript type checking via `astro check`
- Drizzle Kit 0.31 - Database migration and schema management CLI

**Testing:**
- Not detected

## Key Dependencies

**Critical:**
- `drizzle-orm` 0.45 - ORM for all database access; schema at `src/lib/db/schema.ts`
- `drizzle-zod` 0.8 - Auto-generates Zod schemas from Drizzle table definitions
- `better-auth` 1.4 - Authentication library; server config at `src/lib/auth/index.ts`
- `@neondatabase/serverless` 1.0 - Neon PostgreSQL client using HTTP transport
- `zod` 4.3 - Runtime validation for API routes and form data
- `resend` 6.8 - Transactional email sending; client at `src/server/resend.ts`
- `uploadthing` 7.7 / `@uploadthing/react` 7.3 - File upload service; router at `src/server/uploadthing.ts`

**UI:**
- `radix-ui` 1.4 - Headless UI primitives (Radix v2 unified package)
- `lucide-react` 0.562 - Icon library used throughout
- `class-variance-authority` 0.7 - Variant-based component styling
- `tailwind-merge` 3.4 - Intelligent Tailwind class merging in `cn()` utility
- `clsx` 2.1 - Conditional class joining used with `tailwind-merge`
- `sonner` 2.0 - Toast notifications
- `cmdk` 1.1 - Command palette component
- `embla-carousel-react` 8.6 - Carousel component base
- `react-day-picker` 9.13 - Date picker component
- `react-resizable-panels` 4.4 - Resizable panel layouts
- `recharts` 2.15 - Chart components (admin dashboard)
- `vaul` 1.1 - Drawer component
- `input-otp` 1.4 - OTP input component

**Data Fetching:**
- `@tanstack/react-query` 5.90 - Server state management for React components

**Utilities:**
- `date-fns` 4.1 - Date formatting and manipulation
- `fluid-tailwindcss` 1.0 - Fluid typography/spacing Tailwind plugin

**Email Templating:**
- `@react-email/components` 1.0 - React-based email template components

## Configuration

**Environment:**
- Environment variables are typed and validated via Astro's built-in `env` schema in `astro.config.mjs`
- Server-side vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`
- Client-side vars: `SITE_URL` (public, optional, defaults to `https://greenlioninnovations.com`)
- UploadThing token accessed via `import.meta.env.UPLOADTHING_TOKEN` (not in Astro env schema)
- Local dev: `.env.local` (gitignored); production: `.env.production` (gitignored)

**Build:**
- `astro.config.mjs` - Main Astro configuration
- `tsconfig.json` - Extends `astro/tsconfigs/strict`; path alias `@/*` → `./src/*`
- `drizzle.config.ts` - Points to schema at `./src/lib/db/schema.ts`, output migrations to `./drizzle/`
- `components.json` - shadcn/ui config: new-york style, zinc base color, Lucide icons

**shadcn/ui:**
- Style: `new-york`
- Base color: `zinc`
- CSS variables: enabled (OKLCH color space)
- Dark mode: class-based (`.dark` on `<html>`)
- Global styles: `src/styles/global.css`

## Platform Requirements

**Development:**
- Node.js v24+
- pnpm
- Neon PostgreSQL database (connection string in `DATABASE_URL`)
- UploadThing account (`UPLOADTHING_TOKEN`)
- Resend account (`RESEND_API_KEY`)
- better-auth secret and URL

**Production:**
- Deployment target: Netlify (via `@astrojs/netlify` adapter)
- Output mode: `server` (full SSR, no static export)
- Netlify Functions handles SSR rendering and API routes

---

*Stack analysis: 2026-03-05*
