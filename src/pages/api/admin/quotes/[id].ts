import { db } from "@/lib/db";
import {
  customizationAttributes,
  products,
  quoteItems,
  quoteRequests,
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
    return new Response(JSON.stringify({ error: "Quote ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get quote
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, id));

    if (!quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get quote items with product details
    const items = await db
      .select({
        id: quoteItems.id,
        productId: quoteItems.productId,
        quantity: quoteItems.quantity,
        unitPrice: quoteItems.unitPrice,
        customizations: quoteItems.customizations,
        lineTotal: quoteItems.lineTotal,
        productName: products.name,
        productSku: products.sku,
        productImages: products.images,
        productDescription: products.description,
      })
      .from(quoteItems)
      .leftJoin(products, eq(quoteItems.productId, products.id))
      .where(eq(quoteItems.quoteRequestId, id));

    // Get all attributes for human-readable customization display
    const attributes = await db.select().from(customizationAttributes);
    const attributeMap = new Map(attributes.map((a) => [a.id, a]));

    // Process items to include human-readable customizations
    const processedItems = items.map((item) => {
      const customizations = (item.customizations as Record<string, any>) || {};
      const readableCustomizations: Record<string, string> = {};

      for (const [attrId, value] of Object.entries(customizations)) {
        const attr = attributeMap.get(attrId);
        if (attr) {
          let displayValue: string;
          if (typeof value === "boolean") {
            displayValue = value ? "Yes" : "No";
          } else if (Array.isArray(value)) {
            displayValue = value.join(", ");
          } else {
            displayValue = String(value);
          }
          readableCustomizations[attr.name] = displayValue;
        }
      }

      return {
        ...item,
        readableCustomizations,
      };
    });

    return new Response(
      JSON.stringify({
        ...quote,
        items: processedItems,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching quote:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch quote" }), {
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
    return new Response(JSON.stringify({ error: "Quote ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["pending", "reviewed", "quoted", "closed"];
    if (status && !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if quote exists
    const [existing] = await db
      .select({ id: quoteRequests.id })
      .from(quoteRequests)
      .where(eq(quoteRequests.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update quote
    const [updated] = await db
      .update(quoteRequests)
      .set({ status })
      .where(eq(quoteRequests.id, id))
      .returning();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating quote:", error);
    return new Response(JSON.stringify({ error: "Failed to update quote" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
