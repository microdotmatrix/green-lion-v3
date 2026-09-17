import { z } from "zod";

export function sampleJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function requireSampleAdmin(locals: App.Locals): Response | null {
  if (!locals.user || !locals.session)
    return sampleJson({ error: "Unauthorized" }, 401);
  if (!locals.user.approved)
    return sampleJson({ error: "Approval required" }, 403);
  return null;
}

export function sampleError(error: unknown): Response {
  if (error instanceof z.ZodError)
    return sampleJson(
      { error: error.issues[0]?.message || "Invalid sample data" },
      400,
    );
  if (error instanceof SyntaxError)
    return sampleJson({ error: "Invalid JSON body" }, 400);
  console.error("Inbound samples error:", error);
  return sampleJson(
    { error: "Unable to save or load inbound samples. Please try again." },
    500,
  );
}

export const sampleConflict = () =>
  sampleJson(
    {
      error:
        "This sample was changed by another user. Reload the sample before saving again.",
    },
    409,
  );
