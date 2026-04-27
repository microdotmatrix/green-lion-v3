import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import { fetchBlogPosts } from "./api";
import { BlogTable } from "./blog-table";
import { DeleteBlogDialog } from "./delete-blog-dialog";
import { useBlogMutations } from "./hooks";

function BlogPageInner() {
  const [page, setPage] = useState(1);
  const [postToDelete, setPostToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog-posts", page],
    queryFn: () => fetchBlogPosts(page),
  });

  const { deletePostMut, toggleStatusMut } = useBlogMutations();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Blog Posts</h1>
        <Button className="w-full sm:w-auto" asChild>
          <a href="/admin/blog/new">+ New Post</a>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : (
        <BlogTable
          posts={data?.posts ?? []}
          onDeleteClick={setPostToDelete}
          onStatusToggle={(id, curr) =>
            toggleStatusMut.mutate({
              id,
              status: curr === "draft" ? "published" : "draft",
            })
          }
          isTogglingId={
            toggleStatusMut.isPending
              ? toggleStatusMut.variables?.id
              : undefined
          }
        />
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <DeleteBlogDialog
        open={!!postToDelete}
        onOpenChange={(open) => {
          if (!open) setPostToDelete(null);
        }}
        post={postToDelete}
        onConfirm={(id) => {
          deletePostMut.mutate(id);
          setPostToDelete(null);
        }}
        isPending={deletePostMut.isPending}
      />
    </div>
  );
}

export function BlogPage() {
  return (
    <QueryProvider>
      <BlogPageInner />
    </QueryProvider>
  );
}
