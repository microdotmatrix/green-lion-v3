import { db } from "@/lib/db";
import { buildExportRows, CSV_COLUMNS } from "@/lib/csv";
import { categories, pricingTiers, products } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import Papa from "papaparse";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Query all products with left-joined category name
    const allProducts = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        category: categories.name,
        minimumOrderQuantity: products.minimumOrderQuantity,
        orderQuantityIncrement: products.orderQuantityIncrement,
        logoCost: products.logoCost,
        packagingCost: products.packagingCost,
        images: products.images,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

    // Query all pricing tiers
    const allTiers = await db.select().from(pricingTiers);

    // Build Map<productId, PricingTier[]> — tiers sorted by minQuantity asc in buildExportRows
    const tiersByProductId = new Map<
      string,
      (typeof allTiers)[number][]
    >();
    for (const tier of allTiers) {
      if (!tiersByProductId.has(tier.productId)) {
        tiersByProductId.set(tier.productId, []);
      }
      tiersByProductId.get(tier.productId)!.push(tier);
    }

    // Build flat export row objects keyed by CSV_COLUMNS names
    const rows = buildExportRows(allProducts, tiersByProductId);

    // Generate CSV string with ordered columns
    const csvString = Papa.unparse(rows, {
      header: true,
      columns: CSV_COLUMNS as unknown as string[],
    });

    const date = new Date().toISOString().split("T")[0];

    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting products:", error);
    return new Response(
      JSON.stringify({ error: "Failed to export products" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
