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

import type { User } from "./types";

type DeleteUserDialogProps = {
  user: User | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (userId: string) => void;
};

export function DeleteUserDialog({
  user,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteUserDialogProps) {
  return (
    <AlertDialog open={!!user} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {user?.name}? This will also delete
            all their sessions and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => user && onDelete(user.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
