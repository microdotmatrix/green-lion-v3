import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";

// POST: Duplicate/clone a product
export const POST: APIRoute = async ({ params, locals }) => {
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
    // Get source product
    const [source] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!source) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create clone with new name and SKU
    const clonedName = `${source.name} (Copy)`;
    const clonedSku = `${source.sku}-COPY-${Date.now().toString(36).toUpperCase()}`;

    const [cloned] = await db
      .insert(products)
      .values({
        name: clonedName,
        sku: clonedSku,
        description: source.description,
        images: source.images,
        categoryId: source.categoryId,
        minimumOrderQuantity: source.minimumOrderQuantity,
        orderQuantityIncrement: source.orderQuantityIncrement,
        logoCost: source.logoCost,
        packagingCost: source.packagingCost,
      })
      .returning();

    return new Response(JSON.stringify(cloned), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error cloning product:", error);
    return new Response(JSON.stringify({ error: "Failed to clone product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
