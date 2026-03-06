import { db } from "@/lib/db";
import { productCatalogs } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    // Verify target exists before transaction
    const [existing] = await db
      .select({ id: productCatalogs.id })
      .from(productCatalogs)
      .where(eq(productCatalogs.id, id));
    if (!existing) {
      return new Response(JSON.stringify({ error: "Catalog not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Atomic: deactivate all, then activate target
    await db.transaction(async (tx) => {
      await tx
        .update(productCatalogs)
        .set({ isActive: false, updatedAt: new Date() });
      await tx
        .update(productCatalogs)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(productCatalogs.id, id));
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error setting active catalog:", error);
    return new Response(JSON.stringify({ error: "Failed to set active catalog" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const [existing] = await db
      .select({ id: productCatalogs.id, isActive: productCatalogs.isActive })
      .from(productCatalogs)
      .where(eq(productCatalogs.id, id));
    if (!existing) {
      return new Response(JSON.stringify({ error: "Catalog not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (existing.isActive) {
      return new Response(
        JSON.stringify({ error: "Set another version active before deleting" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }
    await db.delete(productCatalogs).where(eq(productCatalogs.id, id));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting catalog:", error);
    return new Response(JSON.stringify({ error: "Failed to delete catalog" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
