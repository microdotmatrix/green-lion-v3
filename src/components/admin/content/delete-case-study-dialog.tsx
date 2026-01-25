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

import type { CaseStudy } from "./case-studies-types";

type DeleteCaseStudyDialogProps = {
  item: CaseStudy | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
};

export function DeleteCaseStudyDialog({
  item,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteCaseStudyDialogProps) {
  return (
    <AlertDialog open={!!item} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Case Study</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{item?.productName}"?
          </AlertDialogDescription>
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
