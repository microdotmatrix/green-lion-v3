export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export const TYPE_LABELS: Record<string, string> = {
  general: "General",
  feedback: "Feedback",
  quote_inquiry: "Quote Inquiry",
  support: "Support",
};

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  needs_review: "Needs Review",
  closed: "Closed",
};
