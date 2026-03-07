import { db } from "@/lib/db";
import { blogCategories } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { asc } from "drizzle-orm";
import slugify from "slugify";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const categories = await db
      .select()
      .from(blogCategories)
      .orderBy(asc(blogCategories.name));
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch blog categories" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
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
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid data", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { name } = parsed.data;
    const slug = slugify(name, { lower: true, strict: true, trim: true });

    const [newCategory] = await db
      .insert(blogCategories)
      .values({ name, slug })
      .returning();

    return new Response(JSON.stringify(newCategory), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return new Response(
        JSON.stringify({ error: "Category with this name already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }
    console.error("Error creating blog category:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create blog category" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
