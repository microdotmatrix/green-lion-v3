import { db } from "@/lib/db";
import {
  contactSubmissions,
  feedbackReplies,
  user,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Submission ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [submission] = await db
      .select()
      .from(contactSubmissions)
      .where(eq(contactSubmissions.id, id));

    if (!submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const replies = await db
      .select({
        id: feedbackReplies.id,
        message: feedbackReplies.message,
        sentAt: feedbackReplies.sentAt,
        adminUserId: feedbackReplies.adminUserId,
        adminName: user.name,
        adminEmail: user.email,
      })
      .from(feedbackReplies)
      .leftJoin(user, eq(feedbackReplies.adminUserId, user.id))
      .where(eq(feedbackReplies.submissionId, id))
      .orderBy(desc(feedbackReplies.sentAt));

    return new Response(
      JSON.stringify({ ...submission, replies }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching feedback detail:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch feedback" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
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
    return new Response(JSON.stringify({ error: "Submission ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["open", "needs_review", "closed"];
    if (status && !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [existing] = await db
      .select({ id: contactSubmissions.id })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.id, id));

    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const [updated] = await db
      .update(contactSubmissions)
      .set({ status })
      .where(eq(contactSubmissions.id, id))
      .returning();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update feedback" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
