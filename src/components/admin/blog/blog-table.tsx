import { CheckCircle, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BlogPostWithCategory } from "./types";

interface BlogTableProps {
  posts: BlogPostWithCategory[];
  onDeleteClick: (post: { id: string; title: string }) => void;
  onStatusToggle: (id: string, currentStatus: "draft" | "published") => void;
  isTogglingId?: string;
}

export function BlogTable({
  posts,
  onDeleteClick,
  onStatusToggle,
  isTogglingId,
}: BlogTableProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No blog posts yet. Create your first post.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            <TableCell className="font-medium">
              <a
                href={`/admin/blog/${post.id}/edit`}
                className="font-medium hover:underline"
              >
                {post.title}
              </a>
            </TableCell>
            <TableCell>
              {post.categoryName ? (
                <Badge variant="secondary">{post.categoryName}</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant={post.status === "published" ? "default" : "outline"}
              >
                {post.status === "published" ? "Published" : "Draft"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/admin/blog/${post.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusToggle(post.id, post.status)}
                  disabled={isTogglingId === post.id}
                >
                  {post.status === "draft" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Publish
                    </>
                  ) : (
                    "Unpublish"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDeleteClick({ id: post.id, title: post.title })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
