import { db } from "@/lib/db";
import {
  categories,
  insertTradeshowRepSchema,
  products,
  services,
  tradeshowLeads,
  tradeshowRepCategories,
  tradeshowRepProducts,
  tradeshowReps,
  tradeshowRepServices,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Rep ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get rep
    const [rep] = await db
      .select()
      .from(tradeshowReps)
      .where(eq(tradeshowReps.id, id));

    if (!rep) {
      return new Response(JSON.stringify({ error: "Rep not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get assigned categories
    const assignedCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(tradeshowRepCategories)
      .innerJoin(
        categories,
        eq(tradeshowRepCategories.categoryId, categories.id),
      )
      .where(eq(tradeshowRepCategories.repId, id));

    // Get assigned products
    const assignedProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
      })
      .from(tradeshowRepProducts)
      .innerJoin(products, eq(tradeshowRepProducts.productId, products.id))
      .where(eq(tradeshowRepProducts.repId, id));

    // Get assigned services
    const assignedServices = await db
      .select({
        id: services.id,
        name: services.title, // services table uses 'title' column
      })
      .from(tradeshowRepServices)
      .innerJoin(services, eq(tradeshowRepServices.serviceId, services.id))
      .where(eq(tradeshowRepServices.repId, id));

    // Get leads for this rep
    const leads = await db
      .select()
      .from(tradeshowLeads)
      .where(eq(tradeshowLeads.repId, id))
      .orderBy(desc(tradeshowLeads.createdAt));

    return new Response(
      JSON.stringify({
        ...rep,
        categories: assignedCategories,
        products: assignedProducts,
        services: assignedServices,
        leads,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching tradeshow rep:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch rep" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Rep ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { categoryIds, productIds, serviceIds, ...repData } = body;

    // Validate input
    const parsed = insertTradeshowRepSchema.partial().safeParse(repData);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if rep exists
    const [existing] = await db
      .select()
      .from(tradeshowReps)
      .where(eq(tradeshowReps.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Rep not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check slug uniqueness if changing
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const [existingSlug] = await db
        .select({ id: tradeshowReps.id })
        .from(tradeshowReps)
        .where(eq(tradeshowReps.slug, parsed.data.slug));

      if (existingSlug) {
        return new Response(JSON.stringify({ error: "Slug already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
      return new Response(
        JSON.stringify({ error: "categoryIds must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (productIds !== undefined && !Array.isArray(productIds)) {
      return new Response(
        JSON.stringify({ error: "productIds must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (serviceIds !== undefined && !Array.isArray(serviceIds)) {
      return new Response(
        JSON.stringify({ error: "serviceIds must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    let updated = existing;

    // Selection-only updates have no rep columns to set.
    if (Object.keys(parsed.data).length > 0) {
      const [updatedRep] = await db
        .update(tradeshowReps)
        .set(parsed.data)
        .where(eq(tradeshowReps.id, id))
        .returning();
      updated = updatedRep ?? existing;
    }

    // Update category assignments if provided
    if (categoryIds !== undefined) {
      await db
        .delete(tradeshowRepCategories)
        .where(eq(tradeshowRepCategories.repId, id));
      if (categoryIds.length > 0) {
        await db.insert(tradeshowRepCategories).values(
          categoryIds.map((catId: string) => ({
            repId: id,
            categoryId: catId,
          })),
        );
      }
    }

    // Update product assignments if provided
    if (productIds !== undefined) {
      await db
        .delete(tradeshowRepProducts)
        .where(eq(tradeshowRepProducts.repId, id));
      if (productIds.length > 0) {
        await db.insert(tradeshowRepProducts).values(
          productIds.map((prodId: string) => ({
            repId: id,
            productId: prodId,
          })),
        );
      }
    }

    // Update service assignments if provided
    if (serviceIds !== undefined) {
      await db
        .delete(tradeshowRepServices)
        .where(eq(tradeshowRepServices.repId, id));
      if (serviceIds.length > 0) {
        await db.insert(tradeshowRepServices).values(
          serviceIds.map((svcId: string) => ({
            repId: id,
            serviceId: svcId,
          })),
        );
      }
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating tradeshow rep:", error);
    return new Response(JSON.stringify({ error: "Failed to update rep" }), {
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
    return new Response(JSON.stringify({ error: "Rep ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [existing] = await db
      .select({ id: tradeshowReps.id })
      .from(tradeshowReps)
      .where(eq(tradeshowReps.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Rep not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete rep (leads cascade deleted)
    await db.delete(tradeshowReps).where(eq(tradeshowReps.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting tradeshow rep:", error);
    return new Response(JSON.stringify({ error: "Failed to delete rep" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
