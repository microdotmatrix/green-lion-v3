import { Badge } from "@/components/ui/badge";

type QuoteStatusBadgeProps = {
  status: string;
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    pending: "secondary",
    reviewed: "default",
    quoted: "outline",
    closed: "destructive",
  };

  return (
    <Badge variant={variants[status] || "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}
