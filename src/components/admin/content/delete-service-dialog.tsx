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

import type { Service } from "./services-types";

type DeleteServiceDialogProps = {
  item: Service | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
};

export function DeleteServiceDialog({
  item,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteServiceDialogProps) {
  return (
    <AlertDialog open={!!item} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service</AlertDialogTitle>
          <AlertDialogDescription>Delete {item?.title}?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => item && onDelete(item.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
