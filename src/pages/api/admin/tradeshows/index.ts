import { db } from "@/lib/db";
import {
  insertTradeshowRepSchema,
  tradeshowRepCategories,
  tradeshowRepProducts,
  tradeshowReps,
  tradeshowRepServices,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc, eq, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch reps with lead counts
    const reps = await db
      .select({
        id: tradeshowReps.id,
        name: tradeshowReps.name,
        email: tradeshowReps.email,
        phone: tradeshowReps.phone,
        slug: tradeshowReps.slug,
        company: tradeshowReps.company,
        active: tradeshowReps.active,
        createdAt: tradeshowReps.createdAt,
        leadCount: sql<number>`(SELECT COUNT(*) FROM tradeshow_leads WHERE tradeshow_leads.rep_id = ${tradeshowReps.id})`,
      })
      .from(tradeshowReps)
      .orderBy(desc(tradeshowReps.createdAt));

    return new Response(JSON.stringify(reps), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching tradeshow reps:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch reps" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { categoryIds, productIds, serviceIds, ...repData } = body;

    // Validate input
    const parsed = insertTradeshowRepSchema.safeParse(repData);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check slug uniqueness
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

    // Create rep
    const [newRep] = await db
      .insert(tradeshowReps)
      .values(parsed.data)
      .returning();

    // Assign categories
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await db.insert(tradeshowRepCategories).values(
        categoryIds.map((catId: string) => ({
          repId: newRep.id,
          categoryId: catId,
        })),
      );
    }

    // Assign products
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      await db.insert(tradeshowRepProducts).values(
        productIds.map((prodId: string) => ({
          repId: newRep.id,
          productId: prodId,
        })),
      );
    }

    // Assign services
    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      await db.insert(tradeshowRepServices).values(
        serviceIds.map((svcId: string) => ({
          repId: newRep.id,
          serviceId: svcId,
        })),
      );
    }

    return new Response(JSON.stringify(newRep), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating tradeshow rep:", error);
    return new Response(JSON.stringify({ error: "Failed to create rep" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
