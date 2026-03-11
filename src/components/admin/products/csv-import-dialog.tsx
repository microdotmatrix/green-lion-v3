import { AlertCircle, FileDown, Loader2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ImportResult } from "./api";
import { useImportProducts } from "./hooks";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [importResults, setImportResults] = React.useState<ImportResult | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const mutation = useImportProducts();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setImportResults(null);
      setError(null);
      setSelectedFileName(null);
      mutation.reset();
    }
    onOpenChange(isOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setError(null);
    mutation.mutate(file, {
      onSuccess: (data) => {
        setImportResults(data);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Import failed";
        setError(message);
        toast.error(message);
      },
    });
    // Reset file input so same file can be re-selected after reset
    e.target.value = "";
  };

  const handleImportAnother = () => {
    setImportResults(null);
    setError(null);
    setSelectedFileName(null);
    mutation.reset();
  };

  const isLoading = mutation.isPending;
  const hasResults = importResults !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file to import products. Existing products with
            matching SKUs will be updated; new SKUs will be inserted.
          </DialogDescription>
        </DialogHeader>

        {/* Idle state: file picker */}
        {!isLoading && !hasResults && (
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <label
              htmlFor="csv-file-input"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-accent/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <span className="text-sm font-medium">
                  {selectedFileName ?? "Click to select a CSV file"}
                </span>
                {!selectedFileName && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only .csv files are accepted
                  </p>
                )}
              </div>
              <input
                id="csv-file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            <a
              href="/utils/product-import-template.csv"
              download="product-import-template.csv"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <FileDown className="h-3.5 w-3.5" />
              Download CSV template
            </a>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Importing products...
            </p>
          </div>
        )}

        {/* Results state */}
        {hasResults && importResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {importResults.inserted}
                </p>
                <p className="text-xs text-muted-foreground">Inserted</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {importResults.updated}
                </p>
                <p className="text-xs text-muted-foreground">Updated</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {importResults.skipped.length}
                </p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>

            {importResults.skipped.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Skipped rows</span>
                </div>
                <ScrollArea className="h-40 rounded-md border p-2">
                  <ul className="space-y-1">
                    {importResults.skipped.map((row) => (
                      <li
                        key={row.sku}
                        className="text-xs text-muted-foreground"
                      >
                        Row {row.row}
                        {row.sku ? ` (SKU: ${row.sku})` : ""}: {row.reason}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {hasResults ? (
            <>
              <Button variant="outline" onClick={handleImportAnother}>
                Import another
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
