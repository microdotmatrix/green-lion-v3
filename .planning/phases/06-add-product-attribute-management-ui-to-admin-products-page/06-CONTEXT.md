# Phase 6: Add product attribute management UI to admin products page - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a UI to the admin products area that lets admins assign, configure, and remove `customizationAttributes` on individual products via the `productAttributes` junction table. Covers the Edit flow in `ProductFormDialog` only. No new routes, no CSV changes.

</domain>

<decisions>
## Implementation Decisions

### Location
- Attribute management is **inline in the existing `ProductFormDialog`**, not a separate product detail page
- The dialog gains two tabs: **"Basic Info"** (all current fields) and **"Attributes"** (new)
- The Attributes tab is only shown when **editing an existing product** (not during creation — create flow shows Basic Info only)
- This is consistent with how pricing tiers are managed inline today

### Attribute properties per assignment
- When assigning an attribute to a product, the admin configures **all three fields**: `required` (boolean toggle), `additionalCost` ($), and `supportedOptions` (subset of allowed values)
- These fields are edited in a **separate small dialog** that opens when adding or clicking an assigned attribute — not inline in the row
- `supportedOptions` is only shown for `select` and `multi_select` attribute types, displayed as a **multi-select checklist** of the attribute's full option list

### Category attribute inheritance
- The Attributes tab shows a **read-only "From Category" section** at the top, listing the attributes already assigned to the product's category (informational context)
- Product-level assignments appear below in an **editable section**
- Admin **can** assign an attribute that is already on the category — but the attribute is labeled "also on category" in the picker to make the overlap explicit
- No auto-inherit on category change — assignments are always manual

### CSV import
- Attribute assignment is **manual UI only** for this phase
- CSV import/export continues to handle core product fields only (no attribute columns)
- Attribute columns in CSV are deferred to a future phase

### Claude's Discretion
- Loading skeleton design for the Attributes tab
- Exact tab component/layout (shadcn Tabs component is available)
- API endpoint design for product attributes (GET/POST/DELETE at `/api/admin/products/[id]/attributes`)
- Error state handling within the tab

</decisions>

<specifics>
## Specific Ideas

- The dialog is currently a single scrollable form — tabs should feel natural since the existing form is already long
- The "From Category" read-only section should make it immediately clear to the admin what attributes are already inherited from the category level
- The "also on category" label in the attribute picker prevents confusion about duplication

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ResponsiveModal` / `ResponsiveModalContent` — already used by `ProductFormDialog`, continue using it
- `AddAttributeDialog` (categories) — the pattern for an attribute-picker dialog with existing-attribute filtering; reuse concept for product variant
- `CategoryAttributesCard` — shows assigned attributes with remove buttons; adapt this pattern for the product attributes list inside the tab
- `useAttributes()` hook — already imported in `products-page.tsx`; fetches all `customizationAttributes` to populate the picker
- shadcn `Tabs`, `Switch`, `Checkbox` components — available in `src/components/ui/`

### Established Patterns
- Admin mutations: REST API at `/api/admin/*`, TanStack Query mutations, `onSuccess` callback invalidates query cache
- Dialog pattern: `ResponsiveModal` + form with error display + disabled submit while `isPending`
- Junction table management: category attributes API at `/api/admin/categories/[id]/attributes` — follow the same pattern for `/api/admin/products/[id]/attributes`

### Integration Points
- `ProductFormDialog` at `src/components/admin/products/product-form-dialog.tsx` — add tabs and Attributes tab content here
- New API route needed: `src/pages/api/admin/products/[id]/attributes.ts` (GET list, POST add, DELETE remove, PUT update)
- `useProductDetail` hook in `products/hooks.ts` — currently fetches product + pricingTiers; may need to also fetch `productAttributes` when on the Attributes tab
- `productAttributes` table in schema — already defined with `productId`, `attributeId`, `required`, `additionalCost`, `supportedOptions`

</code_context>

<deferred>
## Deferred Ideas

- CSV attribute columns — future phase (attribute assignment via bulk import)
- Auto-inherit attributes from category when category is assigned/changed — future enhancement

</deferred>

---

*Phase: 06-add-product-attribute-management-ui-to-admin-products-page*
*Context gathered: 2026-03-13*
