# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` (e.g., `product-form-dialog.tsx`, `products-page.tsx`)
- Astro components: `kebab-case.astro` (e.g., `hero.astro`, `admin.astro`)
- Hooks: `use-kebab-case.ts` (e.g., `use-mobile.ts`, `use-url-filters.ts`)
- API route files: `index.ts` for collection endpoints, `[id].ts` for individual resource endpoints
- Type files: `types.ts` co-located with the feature they belong to
- API client files: `api.ts` co-located with the feature that consumes them
- Utility files: `utils.ts` co-located with the feature or in `src/lib/`

**Functions:**
- React components: PascalCase (e.g., `function QuoteBuilder(...)`, `function StatCard(...)`)
- React hooks: camelCase with `use` prefix (e.g., `useProducts`, `useUrlFilters`, `useIsMobile`)
- Async API fetchers: camelCase with `fetch` prefix (e.g., `fetchProducts`, `fetchCategories`)
- Async API mutators: camelCase with verb prefix (e.g., `createProduct`, `updateProduct`, `deleteProduct`, `duplicateProduct`)
- Server-only helpers: camelCase (e.g., `sendAdminNotifications`, `hashInviteToken`)
- Astro API route handlers: uppercase HTTP method names (e.g., `GET`, `POST`, `PUT`, `DELETE`)

**Variables:**
- camelCase throughout (e.g., `productId`, `categoryName`, `sortDir`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `CART_KEY`, `DEFAULT_PAGE`, `MOBILE_BREAKPOINT`)
- Schema objects: SCREAMING_SNAKE_CASE for filter schemas (e.g., `PRODUCT_FILTER_SCHEMA`)

**Types and Interfaces:**
- Interfaces: PascalCase with `I`-prefix omitted (e.g., `interface Product`, `interface CartItem`)
- Type aliases: PascalCase (e.g., `type ProductSortBy`, `type SignInState`)
- Exported DB select types: PascalCase matching table name (e.g., `Category`, `Product`, `QuoteRequest`)
- Exported DB insert types: PascalCase with `Insert` prefix (e.g., `InsertProduct`, `InsertCategory`)
- Zod insert schemas: camelCase with `insert` prefix and `Schema` suffix (e.g., `insertProductSchema`)

**Database Schema:**
- Table names: camelCase Drizzle variable, snake_case SQL name (e.g., `const products = pgTable("products", ...)`)
- Column names: camelCase Drizzle key, snake_case SQL name (e.g., `createdAt: timestamp("created_at")`)
- Index names: snake_case following `tableName_columnName_idx` (e.g., `session_userId_idx`)

## Code Style

**Formatting:**
- Tool: Prettier 3.x with `prettier-plugin-astro`
- No config file detected — uses Prettier defaults
- 2-space indentation inferred from source files
- Trailing commas in multi-line structures (observed in all files)
- Double quotes for JSX attributes (React files use double quotes by default)

**Linting:**
- No ESLint config detected
- TypeScript strict mode inferred from `tsconfig.json`; type checking via `@astrojs/check`

## Import Organization

**Order (observed pattern):**
1. External library imports (e.g., `react`, `lucide-react`, `@tanstack/react-query`)
2. Internal `@/` alias imports — UI components first, then lib/utils
3. Relative imports (co-located `./api`, `./types`, `./hooks`)

**Path Aliases:**
- `@/*` maps to `src/*` — use this for all non-relative imports
- `astro:env/client` and `astro:env/server` for typed environment variables
- `astro:actions` for Astro Action definitions

**React Import Style:**
- shadcn/ui components: `import * as React from "react"` (namespace import)
- Feature components: `import { useCallback, useEffect, useRef, useState } from "react"` (named imports)
- Both styles coexist; shadcn/ui files consistently use the namespace form

## Error Handling

**API Routes (Astro `src/pages/api/`):**
- Auth guard at top of each handler — return 401 before any logic:
  ```typescript
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  ```
- Validation via Zod `safeParse`; return 400 with flattened error details:
  ```typescript
  const parsed = insertProductSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid data", details: parsed.error.flatten() }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  ```
- Wrap DB operations in `try/catch`; return 500 with a message string:
  ```typescript
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
  ```
- All `Response` bodies are `JSON.stringify()`-wrapped and `Content-Type: application/json` is always set explicitly.

**Astro Actions (`src/actions/index.ts`):**
- Use `ActionError` from `astro:actions` for structured errors:
  ```typescript
  throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit contact form" });
  ```
- Fire-and-forget side effects (email sending) use `.catch()` to avoid blocking:
  ```typescript
  sendAdminNotifications(submission).catch((err) =>
    console.error("Failed to send admin notifications:", err),
  );
  ```

**Client-side API Functions (`api.ts` files):**
- Check `response.ok` and throw an `Error` with the server's error message:
  ```typescript
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create product");
  }
  ```

**React Components:**
- Use `useActionState` for form actions (e.g., `sign-in.tsx`)
- Display errors via `sonner` toast: `toast.error(state.error)`
- Local async operations: `try/catch` with `useState` error fields
- `localStorage` access wrapped in `try/catch` with `console.error` fallback

**Auth Library (`src/lib/auth/index.ts`):**
- Use `APIError` from `better-auth/api` for middleware errors:
  ```typescript
  throw new APIError("BAD_REQUEST", { message: "Invite token required" });
  ```

## Logging

**Framework:** `console.error` only (no structured logger)

**Patterns:**
- `console.error` in `catch` blocks for server-side errors
- `console.error` for background side-effect failures (email, upload)
- No `console.log` in business logic (one instance in `uploadthing.ts` upload callback is a debug leftover)
- No info-level or structured logging

## Comments

**When to Comment:**
- Inline comments explain non-obvious intent on single lines (e.g., `// E.164 format: +12038140716`, `// 'pending', 'reviewed', 'quoted', 'closed'`)
- Block comments above logical sections within a file (e.g., `// Build query conditions`)
- JSDoc used only in inline `<script is:inline>` blocks in Astro components (non-TS context)

**General policy:** Comment the "why" for workarounds; omit comments for self-evident code.

## Function Design

**Size:** Functions are kept focused. Multi-step operations (auth middleware, API routes) are split into sequential guard blocks before the main logic.

**Parameters:**
- Prefer object params for functions with 3+ arguments (e.g., `fetchProducts(params: {...})`)
- Single-value params passed directly (e.g., `fetchProduct(id: string)`)

**Return Values:**
- API route handlers always return `Response`
- Async data-fetching functions return `Promise<T>` with explicit type annotations
- Hook functions return the `useQuery` / `useMutation` result directly (not destructured at call site)

## Module Design

**Exports:**
- Default export: the primary component of a file (e.g., `export default function QuoteBuilder`)
- Named exports: secondary components, types, constants, and utilities

**Barrel Files:**
- Used at the feature level: `src/components/quote/index.ts` re-exports all public members
- Admin sub-features do NOT use barrel files — imports are direct from co-located files

**Feature Structure Pattern:**
Each complex admin feature (products, categories, quotes, etc.) follows this co-located structure:
```
src/components/admin/{feature}/
├── api.ts          # fetch/mutate functions (pure async, no React)
├── hooks.ts        # React Query hooks wrapping api.ts
├── types.ts        # TypeScript interfaces for the feature
├── utils.ts        # Pure utility functions (formatting, etc.)
├── {feature}-page.tsx    # Top-level orchestrator component
├── {feature}-table.tsx   # Table display component
└── {feature}-form-dialog.tsx  # Create/edit form in a dialog
```

---

*Convention analysis: 2026-03-05*
