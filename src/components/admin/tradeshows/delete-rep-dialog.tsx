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

import type { TradeshowRep, TradeshowRepWithSelections } from "./types";

type DeleteRepDialogProps = {
  rep: TradeshowRep | TradeshowRepWithSelections | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (repId: string) => void;
};

export function DeleteRepDialog({
  rep,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteRepDialogProps) {
  return (
    <AlertDialog open={!!rep} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Representative</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{rep?.name}"? This will also delete
            all leads captured by this representative.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => rep && onDelete(rep.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
