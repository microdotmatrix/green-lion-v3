import { db } from "@/lib/db";
import {
  categories,
  insertProductSchema,
  pricingTiers,
  products,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params, locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Product ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [product] = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        images: products.images,
        categoryId: products.categoryId,
        categoryName: categories.name,
        minimumOrderQuantity: products.minimumOrderQuantity,
        orderQuantityIncrement: products.orderQuantityIncrement,
        logoCost: products.logoCost,
        packagingCost: products.packagingCost,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get pricing tiers
    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, id))
      .orderBy(pricingTiers.minQuantity);

    return new Response(JSON.stringify({ ...product, pricingTiers: tiers }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Product ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { pricingTiers: tiersData, ...productData } = body;

    // Validate input
    const parsed = insertProductSchema.partial().safeParse(productData);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if product exists
    const [existing] = await db
      .select({ id: products.id, sku: products.sku })
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check SKU uniqueness if changing
    if (parsed.data.sku && parsed.data.sku !== existing.sku) {
      const [existingSku] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.sku, parsed.data.sku));

      if (existingSku) {
        return new Response(JSON.stringify({ error: "SKU already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Update product
    const [updated] = await db
      .update(products)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    // Update pricing tiers if provided
    if (tiersData !== undefined && Array.isArray(tiersData)) {
      // Delete existing tiers
      await db.delete(pricingTiers).where(eq(pricingTiers.productId, id));

      // Insert new tiers
      if (tiersData.length > 0) {
        await db.insert(pricingTiers).values(
          tiersData.map(
            (tier: { minQuantity: number; pricePerUnit: string }) => ({
              productId: id,
              minQuantity: tier.minQuantity,
              pricePerUnit: tier.pricePerUnit,
            }),
          ),
        );
      }
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return new Response(JSON.stringify({ error: "Failed to update product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Product ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete product (pricing tiers cascade deleted)
    await db.delete(products).where(eq(products.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return new Response(JSON.stringify({ error: "Failed to delete product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
