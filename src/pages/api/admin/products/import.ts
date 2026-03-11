import { db } from "@/lib/db";
import { csvRowSchema, normalizePrice } from "@/lib/csv";
import { categories, pricingTiers, products } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq, inArray, sql } from "drizzle-orm";
import Papa from "papaparse";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rawText = await file.text();
    // Strip Excel UTF-8 BOM — without this, the first column header becomes "\uFEFFsku"
    // causing all rows to fail validation (Pitfall 1 from RESEARCH.md)
    const csvText = rawText.replace(/^\uFEFF/, "");

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (v: string) => v.trim(),
    });

    // Pre-fetch all categories once into a Map<lowercase-name, id>
    // to avoid N+1 queries in the row loop (Pitfall 4 from RESEARCH.md)
    const existingCats = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories);
    const categoryMap = new Map(
      existingCats.map((c) => [c.name.toLowerCase(), c.id]),
    );

    const skipped: Array<{ row: number; sku?: string; reason: string }> = [];

    type ValidRow = {
      product: {
        sku: string;
        name: string;
        description: string;
        categoryId: string | null;
        minimumOrderQuantity: number;
        orderQuantityIncrement: number;
        logoCost: string;
        packagingCost: string;
        images: string[];
      };
      tiers: Array<{ minQuantity: number; pricePerUnit: string }>;
    };

    const validRows: ValidRow[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const rowNum = i + 2; // row 1 = header, row 2 = first data row
      const row = parsed.data[i];

      const validated = csvRowSchema.safeParse(row);
      if (!validated.success) {
        const firstError = validated.error.issues[0];
        skipped.push({
          row: rowNum,
          sku: row.sku || undefined,
          reason: firstError?.message ?? "Validation failed",
        });
        continue;
      }

      const data = validated.data;

      // Resolve category: case-insensitive name match, auto-create if not found
      let categoryId: string | null = null;
      if (data.category && data.category.trim() !== "") {
        const key = data.category.toLowerCase();
        if (categoryMap.has(key)) {
          categoryId = categoryMap.get(key)!;
        } else {
          // Auto-create the category (name only, mirrors blog inline-create pattern)
          const [newCat] = await db
            .insert(categories)
            .values({ name: data.category })
            .returning({ id: categories.id });
          categoryId = newCat.id;
          categoryMap.set(key, newCat.id);
        }
      }

      // Build product insert object
      const productData = {
        sku: data.sku,
        name: data.name,
        description: data.description,
        categoryId,
        minimumOrderQuantity: data.min_order_qty,
        orderQuantityIncrement: data.order_qty_increment,
        logoCost: normalizePrice(data.logo_cost),
        packagingCost: normalizePrice(data.packaging_cost),
        images: data.image_url ? [data.image_url] : [],
      };

      // Extract up to 5 pricing tiers — skip pairs where min_qty or price is absent/zero
      const tierData: Array<{ minQuantity: number; pricePerUnit: string }> = [];
      for (let t = 1; t <= 5; t++) {
        const minQtyKey = `tier${t}_min_qty` as keyof typeof data;
        const priceKey = `tier${t}_price` as keyof typeof data;
        const minQty = data[minQtyKey] as number | undefined;
        const price = data[priceKey] as string | undefined;
        if (minQty && minQty > 0 && price && price.trim() !== "") {
          const normalized = normalizePrice(price);
          if (normalized !== "0") {
            tierData.push({ minQuantity: minQty, pricePerUnit: normalized });
          }
        }
      }

      validRows.push({ product: productData, tiers: tierData });
    }

    if (validRows.length === 0) {
      return new Response(
        JSON.stringify({
          inserted: 0,
          updated: 0,
          skipped,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Pre-check which SKUs already exist to distinguish insert vs update
    const allSkus = validRows.map((r) => r.product.sku);
    const existingSkuRows = await db
      .select({ sku: products.sku })
      .from(products)
      .where(inArray(products.sku, allSkus));
    const existingSkuSet = new Set(existingSkuRows.map((r) => r.sku));

    // Batch upsert all valid products (single INSERT ... ON CONFLICT DO UPDATE)
    const upserted = await db
      .insert(products)
      .values(validRows.map((r) => r.product))
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          categoryId: sql`excluded.category_id`,
          minimumOrderQuantity: sql`excluded.minimum_order_quantity`,
          orderQuantityIncrement: sql`excluded.order_quantity_increment`,
          logoCost: sql`excluded.logo_cost`,
          packagingCost: sql`excluded.packaging_cost`,
          images: sql`excluded.images`,
          updatedAt: new Date(),
        },
      })
      .returning({ id: products.id, sku: products.sku });

    // Build sku -> id map from upsert results
    const upsertedMap = new Map(upserted.map((r) => [r.sku, r.id]));

    // Replace pricing tiers for each upserted product (tier replace strategy)
    // Sequential per-product — matches established [id].ts PUT pattern
    for (const row of validRows) {
      const productId = upsertedMap.get(row.product.sku);
      if (!productId) continue;

      await db
        .delete(pricingTiers)
        .where(eq(pricingTiers.productId, productId));

      if (row.tiers.length > 0) {
        await db.insert(pricingTiers).values(
          row.tiers.map((tier) => ({
            productId,
            minQuantity: tier.minQuantity,
            pricePerUnit: tier.pricePerUnit,
          })),
        );
      }
    }

    // Tally results
    const insertedSkus = upserted
      .map((r) => r.sku)
      .filter((sku) => !existingSkuSet.has(sku));
    const updatedSkus = upserted
      .map((r) => r.sku)
      .filter((sku) => existingSkuSet.has(sku));

    return new Response(
      JSON.stringify({
        inserted: insertedSkus.length,
        updated: updatedSkus.length,
        skipped,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error importing products:", error);
    return new Response(
      JSON.stringify({ error: "Failed to import products" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
