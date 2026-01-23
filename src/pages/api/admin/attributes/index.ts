import { db } from "@/lib/db";
import {
  customizationAttributes,
  insertCustomizationAttributeSchema,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch attributes with usage counts
    const attributes = await db
      .select({
        id: customizationAttributes.id,
        name: customizationAttributes.name,
        attributeType: customizationAttributes.attributeType,
        options: customizationAttributes.options,
        createdAt: customizationAttributes.createdAt,
        categoryCount: sql<number>`(SELECT COUNT(*) FROM category_attributes WHERE category_attributes.attribute_id = ${customizationAttributes.id})`,
        productCount: sql<number>`(SELECT COUNT(*) FROM product_attributes WHERE product_attributes.attribute_id = ${customizationAttributes.id})`,
      })
      .from(customizationAttributes)
      .orderBy(customizationAttributes.name);

    return new Response(JSON.stringify(attributes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch attributes" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
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

    // Validate input
    const parsed = insertCustomizationAttributeSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check name uniqueness
    const [existing] = await db
      .select({ id: customizationAttributes.id })
      .from(customizationAttributes)
      .where(eq(customizationAttributes.name, parsed.data.name));

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Attribute name already exists" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create attribute
    const [newAttribute] = await db
      .insert(customizationAttributes)
      .values(parsed.data)
      .returning();

    return new Response(JSON.stringify(newAttribute), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating attribute:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create attribute" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
