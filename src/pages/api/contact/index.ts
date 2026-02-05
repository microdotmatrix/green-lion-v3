import { db } from "@/lib/db";
import { contactSubmissions, user } from "@/lib/db/schema";
import { resend } from "@/server/resend";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  phone: z.string().trim(),
  companyName: z.string().min(1, "Company name is required").trim(),
  title: z.string().min(1, "Subject is required").trim(),
  message: z.string().optional(),
  type: z
    .enum(["general", "feedback", "quote_inquiry", "support"])
    .default("general"),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return new Response(
        JSON.stringify({
          error: firstError?.message ?? "Validation failed",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = parsed.data;

    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        title: data.title,
        message: data.message ?? null,
        type: data.type,
        status: "open",
      })
      .returning();

    // Send admin notification emails (fire-and-forget; don't block response)
    sendAdminNotifications(submission).catch((err) =>
      console.error("Failed to send admin notifications:", err),
    );

    return new Response(JSON.stringify({ success: true, id: submission.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating contact submission:", error);
    return new Response(
      JSON.stringify({ error: "Failed to submit contact form" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

async function sendAdminNotifications(
  submission: typeof contactSubmissions.$inferSelect,
) {
  const admins = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.approved, true));

  if (admins.length === 0) return;

  const typeLabel =
    {
      general: "General Inquiry",
      feedback: "Feedback",
      quote_inquiry: "Quote Inquiry",
      support: "Support Request",
    }[submission.type] ?? submission.type;

  const adminEmails = admins.map((a) => a.email);

  await resend.emails.send({
    from: "Green Lion Innovations <no-reply@greenlioninnovations.com>",
    to: adminEmails,
    subject: `New ${typeLabel}: ${submission.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #18181b;">New Contact Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; width: 120px;">Name</td>
            <td style="padding: 8px 0;">${submission.firstName} ${submission.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${submission.email}">${submission.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Phone</td>
            <td style="padding: 8px 0;">${submission.phone || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Company</td>
            <td style="padding: 8px 0;">${submission.companyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Type</td>
            <td style="padding: 8px 0;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Subject</td>
            <td style="padding: 8px 0;">${submission.title}</td>
          </tr>
        </table>
        ${
          submission.message
            ? `<div style="margin-top: 16px; padding: 16px; background: #f4f4f5; border-radius: 8px;">
                <p style="margin: 0; color: #71717a; font-size: 12px;">Message</p>
                <p style="margin: 8px 0 0; white-space: pre-wrap;">${submission.message}</p>
              </div>`
            : ""
        }
        <p style="margin-top: 24px; color: #71717a; font-size: 12px;">
          View and respond to this submission in the <a href="https://greenlioninnovations.com/admin/feedback">admin panel</a>.
        </p>
      </div>
    `,
  });
}
