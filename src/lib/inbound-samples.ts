import { z } from "zod";

export const sampleStatuses = [
  "received",
  "pending_evaluation",
  "testing",
  "evaluated",
] as const;
export type SampleStatus = (typeof sampleStatuses)[number];
export const sampleStatusLabels: Record<SampleStatus, string> = {
  received: "Received",
  pending_evaluation: "Pending evaluation",
  testing: "Testing",
  evaluated: "Evaluated",
};

export const sampleInputSchema = z
  .object({
    manufacturer: z.string().trim().min(1, "Manufacturer is required").max(200),
    partNumber: z.string().trim().min(1, "Part number is required").max(200),
    imageUrl: z
      .union([
        z.literal(""),
        z
          .string()
          .trim()
          .max(2048)
          .url()
          .refine(
            (value) => /^https?:\/\//i.test(value),
            "Use an HTTP or HTTPS image URL",
          ),
      ])
      .default(""),
    capacity: z.string().trim().max(200).default(""),
    voltage: z.string().trim().max(200).default(""),
    notes: z.string().trim().max(10000).default(""),
    testingNotes: z.string().trim().max(10000).default(""),
    status: z.enum(sampleStatuses).default("received"),
  })
  .strict();

export const sampleUpdateSchema = sampleInputSchema.extend({
  version: z.number().int().positive(),
});
export const sampleReviewSchema = z
  .object({
    approved: z.boolean().nullable(),
    version: z.number().int().positive(),
  })
  .strict();

export const sampleListSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).default(""),
  status: z.enum(["all", ...sampleStatuses]).default("all"),
  approval: z
    .enum(["all", "pending", "approved", "not_approved"])
    .default("all"),
});

export type SampleInput = z.infer<typeof sampleInputSchema>;
export interface InboundSample extends SampleInput {
  id: string;
  version: number;
  uploadedBy: string | null;
  uploaderName: string;
  approved: boolean | null;
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface SampleList {
  samples: InboundSample[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Any changed evidence requires a fresh review; unchanged saves retain the stamp.
export function sampleEvidenceChanged(
  current: SampleInput,
  next: SampleInput,
): boolean {
  return (Object.keys(sampleInputSchema.shape) as (keyof SampleInput)[]).some(
    (key) => current[key] !== next[key],
  );
}

export function canReviewSample(
  status: SampleStatus,
  approved: boolean | null,
): boolean {
  return approved === null || status === "evaluated";
}
