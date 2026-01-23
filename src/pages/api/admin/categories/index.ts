import { db } from "@/lib/db";
import { categories, insertCategorySchema, products } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { count } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch categories with product counts
    const categoriesWithCounts = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        imageUrl: categories.imageUrl,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .orderBy(categories.displayOrder, categories.name);

    // Get product counts for each category
    const productCounts = await db
      .select({
        categoryId: products.categoryId,
        count: count(),
      })
      .from(products)
      .groupBy(products.categoryId);

    const countMap = new Map(
      productCounts.map((pc) => [pc.categoryId, pc.count]),
    );

    const result = categoriesWithCounts.map((cat) => ({
      ...cat,
      productsCount: countMap.get(cat.id) || 0,
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch categories" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();

    // Validate input
    const parsed = insertCategorySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create category
    const [newCategory] = await db
      .insert(categories)
      .values(parsed.data)
      .returning();

    return new Response(JSON.stringify(newCategory), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create category" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
