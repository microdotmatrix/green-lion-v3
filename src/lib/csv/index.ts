import type { PricingTier } from "@/lib/db/schema";
import { z } from "zod";

// Ordered column names — lock these for round-trip safety between import and export.
// Both endpoints import from this constant to guarantee column name consistency.
export const CSV_COLUMNS = [
  "sku",
  "name",
  "description",
  "category",
  "min_order_qty",
  "order_qty_increment",
  "logo_cost",
  "packaging_cost",
  "image_url",
  "tier1_min_qty",
  "tier1_price",
  "tier2_min_qty",
  "tier2_price",
  "tier3_min_qty",
  "tier3_price",
  "tier4_min_qty",
  "tier4_price",
  "tier5_min_qty",
  "tier5_price",
] as const;

// Per-row Zod validation schema for CSV import.
// Only sku and name are required — all other fields are optional with safe defaults.
// Do NOT use insertProductSchema here — it rejects empty description/images.
export const csvRowSchema = z.object({
  sku: z.string().min(1, "sku is required"),
  name: z.string().min(1, "name is required"),
  description: z.string().optional().default(""),
  category: z.string().optional(),
  min_order_qty: z.coerce.number().int().positive().optional().default(1),
  order_qty_increment: z.coerce.number().int().positive().optional().default(1),
  logo_cost: z.string().optional().default("0"),
  packaging_cost: z.string().optional().default("0"),
  image_url: z.string().url().optional().or(z.literal("")),
  tier1_min_qty: z.coerce.number().int().positive().optional(),
  tier1_price: z.string().optional(),
  tier2_min_qty: z.coerce.number().int().positive().optional(),
  tier2_price: z.string().optional(),
  tier3_min_qty: z.coerce.number().int().positive().optional(),
  tier3_price: z.string().optional(),
  tier4_min_qty: z.coerce.number().int().positive().optional(),
  tier4_price: z.string().optional(),
  tier5_min_qty: z.coerce.number().int().positive().optional(),
  tier5_price: z.string().optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

// Normalize a price string from CSV.
// Strips currency symbols, thousands separators, and any non-numeric character
// except digits, dots, and minus signs.
// e.g., "$1.50" -> "1.50", "1,500.00" -> "1500.00"
export function normalizePrice(raw: string | undefined): string {
  if (!raw) return "0";
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isFinite(num) ? num.toFixed(2) : "0";
}

// Shape returned from the products query for export.
export interface ProductExportRow {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string | null;
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
  logoCost: string;
  packagingCost: string;
  images: string[];
}

// Build flat CSV row objects from the joined products query result.
// tiersByProductId maps product.id -> PricingTier[] (already fetched separately).
// Returns one plain object per product, keyed by CSV_COLUMNS names, ready for Papa.unparse().
export function buildExportRows(
  allProducts: ProductExportRow[],
  tiersByProductId: Map<string, PricingTier[]>,
): Record<string, string | number> [] {
  return allProducts.map((product) => {
    const tiers = (tiersByProductId.get(product.id) ?? []).sort(
      (a, b) => a.minQuantity - b.minQuantity,
    );

    // Fill up to 5 tier slots; blank string for missing slots
    const tierData: Record<string, string | number> = {};
    for (let i = 1; i <= 5; i++) {
      const tier = tiers[i - 1];
      tierData[`tier${i}_min_qty`] = tier ? tier.minQuantity : "";
      tierData[`tier${i}_price`] = tier ? normalizePrice(tier.pricePerUnit) : "";
    }

    return {
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category ?? "",
      min_order_qty: product.minimumOrderQuantity,
      order_qty_increment: product.orderQuantityIncrement,
      logo_cost: normalizePrice(product.logoCost),
      packaging_cost: normalizePrice(product.packagingCost),
      image_url: product.images[0] ?? "",
      ...tierData,
    };
  });
}
