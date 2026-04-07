# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

This is a single Astro 5 SSR application (Green Lion Innovations — B2B manufacturing platform). See `CLAUDE.md` for architecture details and `README.md` for standard commands.

**Required:** PostgreSQL database (Neon serverless) + Astro dev server.
**Optional:** Resend (email — degrades gracefully), UploadThing (file uploads — only for admin image/PDF management).

### Environment variables

A `.env.local` file must exist at the project root with:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Auth session signing secret
- `BETTER_AUTH_URL` — Base URL (e.g. `http://localhost:4321`)
- `RESEND_API_KEY` — Resend email API key
- `UPLOADTHING_TOKEN` — UploadThing API token

All five are injected as environment variables in Cloud Agent VMs. To create `.env.local` from them:

```bash
cat > .env.local << EOF
DATABASE_URL=${DATABASE_URL}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=${BETTER_AUTH_URL}
RESEND_API_KEY=${RESEND_API_KEY}
UPLOADTHING_TOKEN=${UPLOADTHING_TOKEN}
EOF
```

### Running the dev server

```bash
pnpm dev          # Starts on http://localhost:4321
```

The Netlify adapter is used for production but the Astro dev server works independently for local development.

### Lint / type-check

There is no ESLint config. The project uses Prettier (`pnpm prettier --check .`) and Astro's built-in type checker (`npx astro check`).

**Known pre-existing issues:** 6 type errors in `src/components/ui/resizable.tsx` (react-resizable-panels type mismatch) and `src/components/admin/catalogs/catalog-upload-dialog.tsx` (uploadthing type mismatch). These are not regressions.

### Build

```bash
pnpm build        # Production build (outputs to dist/)
```

### Database

Drizzle ORM with Neon PostgreSQL. The drizzle config reads `DATABASE_URL` from `.env.local`. Database commands:

```bash
pnpm db:push      # Push schema to database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

The app has automatic production seeding (runs on server startup if database is empty).

### Gotchas

- The `pnpm.onlyBuiltDependencies` field in `package.json` allows build scripts for esbuild, sharp, @parcel/watcher, and msgpackr-extract. Without it, `pnpm install` prints warnings and native modules may not compile.
- The Astro env schema requires all non-optional env vars to be present at startup. If `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, or `RESEND_API_KEY` are missing, the dev server will fail to start.
- `astro check` exit code is 1 due to the pre-existing type errors noted above — this is expected.
