import type { APIRoute } from "astro";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { adminInvite } from "@/lib/db/schema";

export const DELETE: APIRoute = async ({ locals, params }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!locals.user.approved) {
    return new Response(JSON.stringify({ error: "Approval required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Invite ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [updated] = await db
      .update(adminInvite)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(adminInvite.id, id),
          isNull(adminInvite.usedAt),
          isNull(adminInvite.revokedAt),
        ),
      )
      .returning();

    if (!updated) {
      return new Response(
        JSON.stringify({ error: "Invite not found or not revocable" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return new Response(JSON.stringify({ error: "Failed to revoke invite" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
