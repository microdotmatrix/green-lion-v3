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

interface DeleteBlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: { id: string; title: string } | null;
  onConfirm: (id: string) => void;
  isPending: boolean;
}

export function DeleteBlogDialog({
  open,
  onOpenChange,
  post,
  onConfirm,
  isPending,
}: DeleteBlogDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete &ldquo;{post?.title}&rdquo;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={() => {
              if (post) onConfirm(post.id);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
