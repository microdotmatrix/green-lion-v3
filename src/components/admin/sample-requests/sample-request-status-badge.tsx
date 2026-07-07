import { Badge } from "@/components/ui/badge";

type SampleRequestStatusBadgeProps = {
  status: string;
};

export function SampleRequestStatusBadge({
  status,
}: SampleRequestStatusBadgeProps) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    pending: "secondary",
    printed: "default",
    packed: "outline",
  };

  return (
    <Badge variant={variants[status] || "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}
