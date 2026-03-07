import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBlogCategory,
  createBlogPost,
  deleteBlogPost,
  fetchBlogCategories,
  fetchBlogPost,
  updateBlogPost,
} from "./api";
import type { BlogCategoryFormData, BlogPostFormData } from "./types";

export function useBlogCategories() {
  return useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: fetchBlogCategories,
  });
}

export function useBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-blog-post", id],
    queryFn: () => fetchBlogPost(id!),
    enabled: !!id,
  });
}

export function useBlogMutations() {
  const queryClient = useQueryClient();
  const invalidatePosts = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });

  const createPostMut = useMutation({
    mutationFn: (data: BlogPostFormData) => createBlogPost(data),
    onSuccess: () => {
      invalidatePosts();
      toast.success("Post created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updatePostMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogPostFormData> }) =>
      updateBlogPost(id, data),
    onSuccess: (_data, { id }) => {
      invalidatePosts();
      queryClient.invalidateQueries({ queryKey: ["admin-blog-post", id] });
      toast.success("Post saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deletePostMut = useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      invalidatePosts();
      toast.success("Post deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      updateBlogPost(id, { status }),
    onSuccess: (_data, { id }) => {
      invalidatePosts();
      queryClient.invalidateQueries({ queryKey: ["admin-blog-post", id] });
      toast.success("Post status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { createPostMut, updatePostMut, deletePostMut, toggleStatusMut };
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const createCategoryMut = useMutation({
    mutationFn: (data: BlogCategoryFormData) => createBlogCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast.success("Category created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { createCategoryMut };
}
