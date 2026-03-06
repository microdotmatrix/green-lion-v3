import { db } from "@/lib/db";
import { insertProductCatalogSchema, productCatalogs } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const catalogs = await db
      .select()
      .from(productCatalogs)
      .orderBy(desc(productCatalogs.createdAt));
    return new Response(JSON.stringify(catalogs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching catalogs:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch catalogs" }), {
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
    const parsed = insertProductCatalogSchema.safeParse({
      displayName: body.displayName,
      pdfUrl: body.pdfUrl,
      uploadedBy: locals.user.id,
      isActive: false,
    });
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid data", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const [newCatalog] = await db
      .insert(productCatalogs)
      .values(parsed.data)
      .returning();
    return new Response(JSON.stringify(newCatalog), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating catalog:", error);
    return new Response(JSON.stringify({ error: "Failed to create catalog" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
