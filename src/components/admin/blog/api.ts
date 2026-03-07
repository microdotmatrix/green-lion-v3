import type {
  BlogCategory,
  BlogCategoryFormData,
  BlogPost,
  BlogPostFormData,
  BlogPostsResponse,
} from "./types";

// Blog Posts

export async function fetchBlogPosts(page = 1): Promise<BlogPostsResponse> {
  const res = await fetch(`/api/admin/blog-posts?page=${page}&limit=25`);
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json();
}

export async function fetchBlogPost(id: string): Promise<BlogPost> {
  const res = await fetch(`/api/admin/blog-posts/${id}`);
  if (!res.ok) throw new Error("Failed to fetch blog post");
  return res.json();
}

export async function createBlogPost(data: BlogPostFormData): Promise<BlogPost> {
  const res = await fetch("/api/admin/blog-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create blog post");
  }
  return res.json();
}

export async function updateBlogPost(
  id: string,
  data: Partial<BlogPostFormData>,
): Promise<BlogPost> {
  const res = await fetch(`/api/admin/blog-posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update blog post");
  }
  return res.json();
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await fetch(`/api/admin/blog-posts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete blog post");
  }
}

// Blog Categories

export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  const res = await fetch("/api/admin/blog-categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createBlogCategory(
  data: BlogCategoryFormData,
): Promise<BlogCategory> {
  const res = await fetch("/api/admin/blog-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create category");
  }
  return res.json();
}
