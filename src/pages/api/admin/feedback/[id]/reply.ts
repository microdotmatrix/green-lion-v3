import { db } from "@/lib/db";
import { contactSubmissions, feedbackReplies } from "@/lib/db/schema";
import { resend } from "@/server/resend";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { z } from "zod";

const replySchema = z.object({
  message: z.string().min(1, "Reply message is required"),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Submission ID required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await request.json();
    const parsed = replySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return new Response(
        JSON.stringify({
          error: firstError?.message ?? "Validation failed",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get the original submission
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

    // Create the reply record
    const [reply] = await db
      .insert(feedbackReplies)
      .values({
        submissionId: id,
        adminUserId: locals.user.id,
        message: parsed.data.message,
      })
      .returning();

    // Send email to customer (fire-and-forget)
    sendReplyEmail(submission, parsed.data.message, locals.user.name).catch(
      (err) => console.error("Failed to send reply email:", err),
    );

    return new Response(
      JSON.stringify({
        ...reply,
        adminName: locals.user.name,
        adminEmail: locals.user.email,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error creating reply:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create reply" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

async function sendReplyEmail(
  submission: typeof contactSubmissions.$inferSelect,
  replyMessage: string,
  adminName: string,
) {
  const submittedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(submission.createdAt));

  await resend.emails.send({
    from: "Green Lion Innovations <no-reply@greenlioninnovations.com>",
    to: [submission.email],
    subject: `Re: ${submission.title} — Green Lion Innovations`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #18181b;">Response from Green Lion Innovations</h2>

        <div style="padding: 16px; background: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(replyMessage)}</p>
          <p style="margin: 12px 0 0; color: #71717a; font-size: 12px;">— ${escapeHtml(adminName)}, Green Lion Innovations</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

        <p style="color: #71717a; font-size: 12px; margin-bottom: 4px;">Your original message</p>
        <div style="padding: 16px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <p style="margin: 0 0 4px; font-weight: 600;">${escapeHtml(submission.title)}</p>
          <p style="margin: 0 0 8px; color: #71717a; font-size: 12px;">
            Submitted on ${submittedDate} by ${escapeHtml(submission.firstName)} ${escapeHtml(submission.lastName)}
            (${escapeHtml(submission.companyName)})
          </p>
          ${
            submission.message
              ? `<p style="margin: 0; white-space: pre-wrap;">${escapeHtml(submission.message)}</p>`
              : `<p style="margin: 0; color: #a1a1aa; font-style: italic;">No message provided.</p>`
          }
        </div>

        <p style="margin-top: 24px; color: #a1a1aa; font-size: 11px;">
          This email was sent from Green Lion Innovations. Please do not reply directly to this email.
        </p>
      </div>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
