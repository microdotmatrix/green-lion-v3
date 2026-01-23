import { db } from "@/lib/db";
import { categoryAttributes, customizationAttributes } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";

// GET: Get all attribute assignments for a category
export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Category ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get all attributes assigned to this category
    const assignments = await db
      .select({
        id: categoryAttributes.id,
        attributeId: categoryAttributes.attributeId,
        displayOrder: categoryAttributes.displayOrder,
        activeOptions: categoryAttributes.activeOptions,
        attributeName: customizationAttributes.name,
        attributeType: customizationAttributes.attributeType,
        allOptions: customizationAttributes.options,
      })
      .from(categoryAttributes)
      .innerJoin(
        customizationAttributes,
        eq(categoryAttributes.attributeId, customizationAttributes.id),
      )
      .where(eq(categoryAttributes.categoryId, id))
      .orderBy(categoryAttributes.displayOrder);

    return new Response(JSON.stringify(assignments), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching category attributes:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch category attributes" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// POST: Assign an attribute to a category
export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Category ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { attributeId, displayOrder = 0, activeOptions } = body;

    if (!attributeId) {
      return new Response(JSON.stringify({ error: "Attribute ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if already assigned
    const [existing] = await db
      .select({ id: categoryAttributes.id })
      .from(categoryAttributes)
      .where(
        and(
          eq(categoryAttributes.categoryId, id),
          eq(categoryAttributes.attributeId, attributeId),
        ),
      );

    if (existing) {
      return new Response(
        JSON.stringify({
          error: "Attribute already assigned to this category",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create assignment
    const [newAssignment] = await db
      .insert(categoryAttributes)
      .values({
        categoryId: id,
        attributeId,
        displayOrder,
        activeOptions: activeOptions || null,
      })
      .returning();

    return new Response(JSON.stringify(newAssignment), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error assigning attribute:", error);
    return new Response(
      JSON.stringify({ error: "Failed to assign attribute" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// DELETE: Remove an attribute assignment from a category
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Category ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { attributeId } = body;

    if (!attributeId) {
      return new Response(JSON.stringify({ error: "Attribute ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .delete(categoryAttributes)
      .where(
        and(
          eq(categoryAttributes.categoryId, id),
          eq(categoryAttributes.attributeId, attributeId),
        ),
      );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error removing attribute assignment:", error);
    return new Response(
      JSON.stringify({ error: "Failed to remove attribute" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
