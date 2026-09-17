# Inbound samples

Open **Business → Inbound Samples** in the admin sidebar (`/admin/inbound-samples`). All approved admin users can receive, edit, and review samples, consistent with existing admin access.

## Setup

Apply `drizzle/0011_inbound_samples.sql` through the normal migration workflow before using this module:

```sh
pnpm db:migrate
```

This uses `DATABASE_URL` from `.env.local`. The migration adds only the inbound samples table, its constraints, and indexes. It has not been applied to the configured Neon database during development.

Photo uploads use the existing authenticated UploadThing `imageUploader` and require `UPLOADTHING_TOKEN`. A photo is optional and limited to one image of up to 4 MB. Removing a photo detaches it from the sample; it does not delete the stored upload.

## Workflow

1. Choose **New Sample** to open the shared responsive dialog (a bottom drawer on mobile). Enter the manufacturer and part number, and optionally add a photo, capacity, voltage, and notes/specifications. Creating the sample closes the dialog and refreshes the list.
2. Move through Received, Pending evaluation, Testing, and Evaluated. Record test results in testing notes.
3. Save the Evaluated status, then choose Yes, approve or No, do not approve. The server records the signed-in reviewer and decision date. Until then, approval is awaiting decision.
4. Approved samples remain here for reference. Create catalog products manually in Products.

Uploader attribution stays with the original creator. Editing any saved sample details or evaluation evidence clears the final decision and requires a new review. A repeated, unchanged decision preserves the original reviewer and date. Clear decision reopens the decision without changing the testing status. Concurrent changes return a conflict instead of overwriting newer work.

## Verification

```sh
node --test tests/inbound-samples.test.mjs
pnpm exec astro check
pnpm build
```

The workflow tests run the real API handlers and migration against an isolated, in-memory PostgreSQL instance using the PGlite and esbuild versions already in the lockfile. They do not load `.env.local` or connect to Neon. Coverage includes access control, input validation, attribution, decisions, filtering, concurrent writes, and database constraints.

The production build passed. Type-checking reports the six existing errors in resizable panels and catalog upload code. Desktop/mobile browser checks used an isolated local preview; an actual UploadThing upload was not exercised.
