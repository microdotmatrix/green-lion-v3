import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className?: string }> = {
  open: { label: "Open", variant: "outline", className: "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400" },
  needs_review: { label: "Needs Review", variant: "outline", className: "border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  closed: { label: "Closed", variant: "outline" },
};

export function FeedbackStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
}
