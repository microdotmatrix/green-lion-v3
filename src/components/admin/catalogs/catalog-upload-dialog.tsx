import React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useUploadThing } from "@/lib/uploadthing";
import type { useCatalogMutations } from "./hooks";

interface CatalogUploadDialogProps {
  createCatalogMut: ReturnType<typeof useCatalogMutations>["createCatalogMut"];
}

export function CatalogUploadDialog({
  createCatalogMut,
}: CatalogUploadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [displayName, setDisplayName] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);

  const { startUpload, isUploading } = useUploadThing("pdfUploader", {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: (res) => {
      const pdfUrl = res?.[0]?.ufsUrl;
      if (!pdfUrl) {
        toast.error("Upload completed but URL is missing");
        return;
      }
      createCatalogMut.mutate(
        { displayName: displayName.trim(), pdfUrl },
        {
          onSuccess: () => {
            setOpen(false);
            resetForm();
          },
        },
      );
    },
    onUploadError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setDisplayName("");
    setSelectedFile(null);
    setProgress(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }
    await startUpload([selectedFile]);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Version
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Catalog Version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. 2025 Spring Catalog"
              disabled={isUploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdfFile">PDF File</Label>
            <Input
              id="pdfFile"
              type="file"
              accept="application/pdf"
              disabled={isUploading}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {isUploading && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Uploading... {progress}%
              </p>
              <Progress value={progress} />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || createCatalogMut.isPending}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
