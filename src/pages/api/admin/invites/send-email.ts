import type { APIRoute } from "astro";
import { z } from "zod";

import { resend } from "@/server/resend";

const sendInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  inviteUrl: z.string().url("Invalid invite URL"),
  expiresAt: z.string(),
});

export const POST: APIRoute = async ({ locals, request }) => {
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

  try {
    const body = await request.json();
    const parsed = sendInviteSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return new Response(
        JSON.stringify({
          error: firstError?.message ?? "Validation failed",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { email, inviteUrl, expiresAt } = parsed.data;

    const expiresDate = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(expiresAt));

    const inviterName = locals.user.name || "An administrator";

    await resend.emails.send({
      from: "Green Lion Innovations <no-reply@greenlioninnovations.com>",
      to: [email],
      subject: "You've been invited to Green Lion Innovations",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">You've been invited to Green Lion Innovations</h2>

          <p style="color: #3f3f46; line-height: 1.6;">
            ${escapeHtml(inviterName)} has invited you to create an account on
            <strong>Green Lion Innovations</strong>.
          </p>

          <div style="margin: 24px 0; text-align: center;">
            <a href="${escapeHtml(inviteUrl)}"
               style="display: inline-block; padding: 12px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Accept Invitation
            </a>
          </div>

          <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; font-size: 13px; color: #3f3f46;">
            ${escapeHtml(inviteUrl)}
          </p>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

          <p style="color: #a1a1aa; font-size: 12px;">
            This invitation expires on ${expiresDate}. If you did not expect
            this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send invite email" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
