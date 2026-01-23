# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev       # Start development server
pnpm build     # Production build
pnpm preview   # Preview production build
```

## Architecture Overview

This is an Astro 5 full-stack application with React islands for interactive components. It uses the Node.js adapter (`@astrojs/node`) for server-side rendering in standalone mode.

### Key Technologies
- **Framework**: Astro 5 with `@astrojs/react` for React island components
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite` plugin (not the Astro integration)
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless)
- **Auth**: better-auth
- **Email**: Resend

### Project Structure
- `src/pages/` - Astro file-based routing (includes API routes in `src/pages/api/`)
- `src/components/ui/` - shadcn/ui React components (50+ components)
- `src/lib/` - Shared utilities including `cn()` helper for class merging
- `src/hooks/` - React hooks (e.g., `use-mobile.ts`)
- `src/layouts/` - Astro layout components
- `src/styles/global.css` - Tailwind CSS with OKLCH color variables and dark mode support

### Path Aliases
Use `@/*` to reference files from `./src/*` (configured in tsconfig.json).

### Component Conventions
- React components use TypeScript (`.tsx`)
- shadcn/ui components configured via `components.json` with:
  - new-york style variant
  - Lucide icons
  - CSS variables for theming
  - Zinc base color palette

### Styling Notes
- Dark mode is class-based (`.dark` on `<html>`)
- Theme colors defined as OKLCH CSS variables in `src/styles/global.css`
- Use the `cn()` utility from `@/lib/utils` for conditional class merging
