import {
  ActionError,
  defineAction,
  isActionError,
} from "astro:actions";
import { z } from "astro/zod";
import { db } from "@/lib/db";
import { contactSubmissions, user } from "@/lib/db/schema";
import { resend } from "@/server/resend";
import { eq } from "drizzle-orm";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().optional().default(""),
  companyName: z.string().trim().min(1, "Company name is required"),
  title: z.string().trim().min(1, "Subject is required"),
  message: z.string().optional(),
  type: z
    .enum(["general", "feedback", "quote_inquiry", "support"])
    .default("general"),
});

const CONTACT_FORM_ERROR_MESSAGE =
  "We couldn't submit your message right now. Please try again in a few minutes.";

export const server = {
  contact: defineAction({
    accept: "form",
    input: contactSchema,
    handler: async (input) => {
      try {
        const [submission] = await db
          .insert(contactSubmissions)
          .values({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email.toLowerCase(),
            phone: (input.phone ?? "").trim(),
            companyName: input.companyName,
            title: input.title,
            message: input.message?.trim() || null,
            type: input.type,
            status: "open",
          })
          .returning();

        if (!submission) {
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: CONTACT_FORM_ERROR_MESSAGE,
          });
        }

        sendAdminNotifications(submission).catch((err) =>
          console.error("Failed to send admin notifications:", err),
        );

        return { success: true, id: submission.id };
      } catch (error) {
        if (isActionError(error)) {
          throw error;
        }

        console.error("Error creating contact submission:", error);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: CONTACT_FORM_ERROR_MESSAGE,
        });
      }
    },
  }),
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
