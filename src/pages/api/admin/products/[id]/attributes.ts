import { db } from "@/lib/db";
import { productAttributes, customizationAttributes } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";

// GET: Get all attribute assignments for a product
export const GET: APIRoute = async ({ params, locals }) => {
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
    const assignments = await db
      .select({
        id: productAttributes.id,
        attributeId: productAttributes.attributeId,
        required: productAttributes.required,
        additionalCost: productAttributes.additionalCost,
        supportedOptions: productAttributes.supportedOptions,
        attributeName: customizationAttributes.name,
        attributeType: customizationAttributes.attributeType,
        allOptions: customizationAttributes.options,
      })
      .from(productAttributes)
      .innerJoin(
        customizationAttributes,
        eq(productAttributes.attributeId, customizationAttributes.id),
      )
      .where(eq(productAttributes.productId, id));

    return new Response(JSON.stringify(assignments), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching product attributes:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch product attributes" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// POST: Assign an attribute to a product
export const POST: APIRoute = async ({ params, request, locals }) => {
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
    const body = await request.json();
    const { attributeId, required = false, additionalCost = "0", supportedOptions } = body;

    if (!attributeId) {
      return new Response(JSON.stringify({ error: "Attribute ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate additionalCost is a numeric string
    if (isNaN(Number(additionalCost))) {
      return new Response(
        JSON.stringify({ error: "additionalCost must be a numeric string" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if already assigned
    const [existing] = await db
      .select({ id: productAttributes.id })
      .from(productAttributes)
      .where(
        and(
          eq(productAttributes.productId, id),
          eq(productAttributes.attributeId, attributeId),
        ),
      );

    if (existing) {
      return new Response(
        JSON.stringify({
          error: "Attribute already assigned to this product",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create assignment
    const [newAssignment] = await db
      .insert(productAttributes)
      .values({
        productId: id,
        attributeId,
        required,
        additionalCost,
        supportedOptions: supportedOptions || null,
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

// PUT: Update an existing attribute assignment for a product
export const PUT: APIRoute = async ({ params, request, locals }) => {
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
    const body = await request.json();
    const { attributeId, required, additionalCost, supportedOptions } = body;

    if (!attributeId) {
      return new Response(JSON.stringify({ error: "Attribute ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check assignment exists
    const [existing] = await db
      .select({ id: productAttributes.id })
      .from(productAttributes)
      .where(
        and(
          eq(productAttributes.productId, id),
          eq(productAttributes.attributeId, attributeId),
        ),
      );

    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Attribute assignment not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Update the assignment
    const [updated] = await db
      .update(productAttributes)
      .set({
        required: required !== undefined ? required : false,
        additionalCost: additionalCost !== undefined ? additionalCost : "0",
        supportedOptions: supportedOptions !== undefined ? supportedOptions : null,
      })
      .where(
        and(
          eq(productAttributes.productId, id),
          eq(productAttributes.attributeId, attributeId),
        ),
      )
      .returning();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating attribute assignment:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update attribute" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

// DELETE: Remove an attribute assignment from a product
export const DELETE: APIRoute = async ({ params, request, locals }) => {
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
    const body = await request.json();
    const { attributeId } = body;

    if (!attributeId) {
      return new Response(JSON.stringify({ error: "Attribute ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .delete(productAttributes)
      .where(
        and(
          eq(productAttributes.productId, id),
          eq(productAttributes.attributeId, attributeId),
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
