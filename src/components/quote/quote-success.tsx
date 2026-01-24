import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function QuoteSuccess() {
  return (
    <div className="mx-auto max-w-lg px-8 py-16 text-center">
      <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-12" />
      </div>
      <h2 className="mb-4 text-2xl font-semibold">Quote Request Submitted!</h2>
      <p className="mb-8 text-muted-foreground">
        Thank you for your interest. Our team will review your request and get
        back to you within 1-2 business days.
      </p>
      <Button onClick={() => (window.location.href = "/products")}>
        Continue Browsing
      </Button>
    </div>
  );
}
