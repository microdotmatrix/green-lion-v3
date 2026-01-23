# Green Lion Innovations - Manufacturing Solutions Platform

## Overview

Green Lion Innovations is a B2B manufacturing solutions platform designed to connect manufacturers with clients seeking custom products across diverse industrial sectors such as packaging, CNC, injection molding, electronics, and functional testing. The platform features a public product catalog, a robust quote request system, detailed case studies, and a comprehensive admin dashboard. Its primary purpose is to streamline the custom manufacturing procurement process by providing a modern, professional, and dark-themed B2B experience. The project aims to enhance efficiency, transparency, and collaboration in industrial manufacturing procurement, positioning Green Lion Innovations as a leader in digital manufacturing solutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The platform utilizes a dark theme aesthetic with a custom HSL-based color palette, Inter/Manrope typography, and Lucide React icons. It features a responsive design implemented with Tailwind CSS and Radix UI, offering over 40 reusable UI components to ensure a consistent and modern user experience. All pages, including the trade show rep lead capture pages (`/rep/[slug]`), feature consistent branding with the Green Lion logo and "GREEN LION | INNOVATIONS" header styling, maintaining dark backgrounds (zinc-900/zinc-800) with primary color accents throughout.

### Technical Implementations

- **Framework**: Built with Astro 4+ as a full-stack framework using the `@astrojs/node` adapter for server-side rendering. React 18+ components are integrated via `@astrojs/react` using Astro's islands architecture for interactive UI elements.
- **Routing**: Astro's file-based routing system handles all page routes. Dynamic routes use bracket syntax (e.g., `src/pages/rep/[slug].astro` for trade show rep pages). API endpoints live in `src/pages/api/` directory.
- **Frontend**: TypeScript throughout, with React components rendered as islands using `client:load`, `client:visible`, or `client:idle` directives for optimal hydration. TanStack Query manages client-side server state with optimized caching strategies (5-minute staleTime for reference data). Form handling uses controlled React components with Zod for schema validation.
- **API Layer**: Server-side API routes in `src/pages/api/` replace the Express backend, providing a modular RESTful API design. Each endpoint exports HTTP method handlers (`GET`, `POST`, `PUT`, `DELETE`). Middleware in `src/middleware.ts` handles authentication, access control, and request processing.
- **Database**: Employs Drizzle ORM with PostgreSQL (Neon DB) for type-safe queries, schema migrations, and Zod validation. Key tables include `categories`, `products`, `pricing_tiers`, `customization_attributes`, `quote_requests`, and `case_studies`, all utilizing UUIDs for primary keys. A flexible attribute system allows global attributes to be assigned to categories and products, supporting `select`, `multi_select`, and `boolean` types.
- **File Upload System**: Integrates with Google Cloud Storage (via Replit Object Storage sidecar) for secure file uploads, featuring custom ACLs, public/private visibility, and metadata storage. Client-side uploads are handled by Uppy within React islands.
- **Email Integration**: Uses Resend for transactional email services, integrated via Replit Connectors, called from Astro API endpoints.
- **Trade Show Lead Collection**: Implements a rep-driven, QR code-based lead capture system for events. Sales reps use `/rep/[slug]` to enter lead information (name and company only), select from their assigned categories/products/services, and generate unique QR codes per lead. When scanned, the QR code opens the lead's messaging app with a pre-filled message TO the rep containing lead details and selected interests. Contact methods include SMS, WhatsApp, Gmail (App) using `googlegmail://` deep link, Apple Mail using `mailto:`, and Other Email using `mailto:`. Database schema includes `tradeshow_reps`, `tradeshow_rep_products`, `tradeshowRepCategories`, `tradeshowRepServices`, and `tradeshow_leads` (with `selectedCategoryIds`, `selectedProductIds`, `selectedServiceIds` jsonb arrays, `contactMethod` field supporting "sms" | "whatsapp" | "gmail" | "applemail" | "otheremail", and `messageTemplate` text field). Admin interface provides comprehensive lead management with sorting, filtering, and CSV export capabilities showing interest counts.
- **Admin Performance Optimizations**: Admin Contact GLI page uses consolidated GET `/api/admin/reference-data` endpoint to fetch all categories, products, and services in one call (previously 3 separate calls), reducing network overhead and improving page load times. Reference data is cached with React Query's staleTime configuration.
- **Admin Modals**: All admin modals are configured to prevent accidental closure on outside clicks, preserving user input during creation or editing.
- **Production Database Seeding**: Automated database seeding via `src/lib/seed-production.ts` runs on server startup (triggered in Astro middleware or integration). It checks if the database is empty (no categories) and automatically populates all production data including 5 categories, 13 products, 74 pricing tiers, 6 services, 3 testimonials, 2 case studies, 10 client logos, 8 customization attributes, 27 category-attribute mappings, and 59 product-attribute mappings. The seed script respects foreign key constraints by inserting data in the correct order and handles the circular reference between categories and products.

### Project Structure

```
src/
├── components/          # Shared React components and UI library
│   ├── ui/             # Shadcn (Radix UI) styled components
│   └── ...             # Feature-specific React components
├── layouts/            # Astro layout components
│   ├── BaseLayout.astro
│   └── AdminLayout.astro
├── pages/              # File-based routing
│   ├── index.astro     # Home page
│   ├── about.astro
│   ├── services.astro
│   ├── products/       # Product catalog routes
│   ├── quote-builder.astro
│   ├── case-studies/
│   ├── rep/
│   │   └── [slug].astro  # Dynamic rep lead capture
│   ├── admin/          # Admin dashboard pages
│   │   ├── index.astro
│   │   ├── categories.astro
│   │   ├── products.astro
│   │   └── ...
│   └── api/            # API endpoints
│       ├── categories/
│       ├── products/
│       ├── quotes/
│       ├── admin/
│       │   ├── reference-data.ts
│       │   └── products/
│       │       ├── template.ts
│       │       └── bulk.ts
│       └── ...
├── lib/                # Shared utilities and business logic
│   ├── db/             # Database schema and connection
│   ├── storage.ts      # File storage helpers
│   ├── email.ts        # Email service
│   └── seed-production.ts
├── middleware.ts       # Auth, access control, request processing
└── styles/             # Global styles
```

### Feature Specifications

- **Public Pages**: Home, About, Services, Product Catalog, Quote Builder, Case Studies, and Rep Lead Capture (`/rep/[slug]`) for trade show lead collection.
- **Admin Pages**: Dashboard, Categories, Products, Quotes, Case Studies, Testimonials, Clients, Users (planned), Attributes, and Trade Shows (renamed from "Contact GLI" for managing reps and leads).
- **Quote Builder**: Allows users to configure custom product quotes, with optimized data fetching for complex product configurations. Implemented as a React island with `client:load` for immediate interactivity.
- **Product Catalog**: Displays detailed product information, supporting advanced categorization and attribute-based filtering. Uses server-side data fetching in Astro pages with React islands for interactive filters.
- **Lead Management**: Provides administrators with tools to manage trade show representatives, assign specific products and categories to them, generate QR codes, and track leads with detailed insights and export options.
- **Attribute Management**: Allows dynamic creation and management of product and category attributes, impacting product customization options.
- **Admin Quote Details**: Enhanced display of quote requests in the admin panel, showing full product details, quantities, prices, and human-readable customization options.
- **Navigation**: "Add more products" functionality in the QuoteBuilder intelligently directs users back to their last browsed category for improved workflow.
- **Top Clients Homepage Section**: Client logos can be marked as "featured" (max 6) via the admin Client Logos page. Featured logos appear in a responsive grid section on the homepage above testimonials (2 cols mobile, 3 cols tablet, 6 cols desktop). The admin interface shows a featured count indicator and star toggle buttons.
- **Bulk Product Upload**: Admin Products page supports CSV-based bulk import. Users can download a template with all product fields and pricing tier columns, then upload a filled CSV. Products are matched by SKU for upsert logic (update if exists, create if new). Upload results show success/failure counts with detailed per-row error reporting. API endpoints: GET `/api/admin/products/template` for CSV template download, POST `/api/admin/products/bulk` for bulk upload processing.

## External Dependencies

### Third-Party Services

- **Neon Database**: Serverless PostgreSQL database.
- **Google Cloud Storage**: Object storage for files (accessed via Replit Object Storage sidecar).
- **Resend**: Transactional email service (integrated via Replit Connectors).

### Key NPM Packages

- **Framework**: `astro`, `@astrojs/react`, `@astrojs/node`, `@astrojs/tailwind`.
- **Frontend**: `react`, `react-dom`, `@tanstack/react-query`, `radix-ui`, `zod`, `@uppy/*`.
- **Database & Services**: `drizzle-orm`, `@neondatabase/serverless`, `@google-cloud/storage`, `resend`.
- **Development**: `typescript`, `drizzle-kit`.

### Design Assets

- **Fonts**: Inter, JetBrains Mono (from Google Fonts).
- **Icons**: Lucide React.
