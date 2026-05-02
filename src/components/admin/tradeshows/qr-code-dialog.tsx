import { Check, Copy, ExternalLink } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { TradeshowRepWithSelections } from "./types";

type QrCodeDialogProps = {
  rep: TradeshowRepWithSelections | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const QrCodeDialog = ({
  rep,
  open,
  onOpenChange,
}: QrCodeDialogProps) => {
  const [copied, setCopied] = React.useState(false);

  if (!rep) return null;

  const leadUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/leads/${rep.slug}`
      : `/leads/${rep.slug}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(leadUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(leadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = leadUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>QR Code for {rep.name}</DialogTitle>
          <DialogDescription>
            Scan this QR code to access the lead capture form for {rep.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-w-0 flex-col items-center gap-4 py-4">
          <img
            src={qrCodeUrl}
            alt={`QR Code for ${rep.name}`}
            className="rounded-lg border"
            width={200}
            height={200}
          />
          <div className="flex w-full max-w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <code className="bg-muted text-muted-foreground block min-w-0 w-full flex-1 rounded px-3 py-2 font-mono text-xs break-all sm:text-sm">
              {leadUrl}
            </code>
            <div className="flex shrink-0 gap-2 self-stretch sm:self-auto">
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a
                  href={leadUrl}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Open lead capture page for ${rep.name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
