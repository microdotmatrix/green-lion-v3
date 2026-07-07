import type { SampleRequestDetail } from "./types";

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatAddress(request: SampleRequestDetail): string[] {
  const cityLine = [
    request.city,
    [request.state, request.postalCode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return [
    request.addressLine1,
    request.addressLine2,
    cityLine,
    request.country !== "US" ? request.country : null,
  ].filter((line): line is string => !!line);
}

export const SAMPLE_REQUEST_STATUSES = [
  "pending",
  "printed",
  "packed",
] as const;
