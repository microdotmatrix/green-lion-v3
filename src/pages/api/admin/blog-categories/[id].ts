import { db } from "@/lib/db";
import { blogCategories } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing category id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [existing] = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Category not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.delete(blogCategories).where(eq(blogCategories.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting blog category:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete blog category" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
