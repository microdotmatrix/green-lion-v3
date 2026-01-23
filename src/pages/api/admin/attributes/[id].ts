import { db } from "@/lib/db";
import {
  customizationAttributes,
  insertCustomizationAttributeSchema,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Attribute ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [attribute] = await db
      .select()
      .from(customizationAttributes)
      .where(eq(customizationAttributes.id, id));

    if (!attribute) {
      return new Response(JSON.stringify({ error: "Attribute not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(attribute), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching attribute:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch attribute" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
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
    return new Response(JSON.stringify({ error: "Attribute ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();

    // Validate input
    const parsed = insertCustomizationAttributeSchema.partial().safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if attribute exists
    const [existing] = await db
      .select({
        id: customizationAttributes.id,
        name: customizationAttributes.name,
      })
      .from(customizationAttributes)
      .where(eq(customizationAttributes.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Attribute not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check name uniqueness if changing
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const [existingName] = await db
        .select({ id: customizationAttributes.id })
        .from(customizationAttributes)
        .where(eq(customizationAttributes.name, parsed.data.name));

      if (existingName) {
        return new Response(
          JSON.stringify({ error: "Attribute name already exists" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Update attribute
    const [updated] = await db
      .update(customizationAttributes)
      .set(parsed.data)
      .where(eq(customizationAttributes.id, id))
      .returning();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating attribute:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update attribute" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
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
    return new Response(JSON.stringify({ error: "Attribute ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [existing] = await db
      .select({ id: customizationAttributes.id })
      .from(customizationAttributes)
      .where(eq(customizationAttributes.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Attribute not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete attribute (category/product associations cascade)
    await db
      .delete(customizationAttributes)
      .where(eq(customizationAttributes.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting attribute:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete attribute" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
