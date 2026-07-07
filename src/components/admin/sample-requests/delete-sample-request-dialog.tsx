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

import type { SampleRequestListItem } from "./types";

type DeleteSampleRequestDialogProps = {
  request: SampleRequestListItem | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
};

export function DeleteSampleRequestDialog({
  request,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteSampleRequestDialogProps) {
  return (
    <AlertDialog open={!!request} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sample Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            {request?.requestNumber || "this sample request"}? Its items will be
            removed as well. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => request && onDelete(request.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
