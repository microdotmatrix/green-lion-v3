import { Badge } from "@/components/ui/badge";

const typeConfig: Record<string, { label: string; className: string }> = {
  general: { label: "General", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  feedback: { label: "Feedback", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  quote_inquiry: { label: "Quote Inquiry", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  support: { label: "Support", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

export function FeedbackTypeBadge({ type }: { type: string }) {
  const config = typeConfig[type] ?? { label: type, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
