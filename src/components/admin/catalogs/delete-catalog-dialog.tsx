import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { useCatalogMutations } from "./hooks";
import type { Catalog } from "./types";

interface DeleteCatalogDialogProps {
  catalog: Catalog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteMut: ReturnType<typeof useCatalogMutations>["deleteMut"];
}

export function DeleteCatalogDialog({
  catalog,
  open,
  onOpenChange,
  deleteMut,
}: DeleteCatalogDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete catalog version?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{catalog?.displayName}&rdquo;. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (catalog) deleteMut.mutate(catalog.id);
              onOpenChange(false);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
