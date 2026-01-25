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

import type { Attribute } from "./types";

type DeleteAttributeDialogProps = {
  attribute: Attribute | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (attributeId: string) => void;
};

export function DeleteAttributeDialog({
  attribute,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteAttributeDialogProps) {
  return (
    <AlertDialog open={!!attribute} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{attribute?.name}"? This will
            remove it from {attribute?.categoryCount || 0} categories and{" "}
            {attribute?.productCount || 0} products.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => attribute && onDelete(attribute.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
