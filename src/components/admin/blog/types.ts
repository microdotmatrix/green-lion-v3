// BlogCategory — matches blogCategories DB row
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  createdAt: string; // ISO string from JSON
}

// BlogPost — matches blogPosts DB row
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  coverImageUrl: string | null;
  categoryId: string | null;
  authorId: string | null;
  status: "draft" | "published";
  readTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// BlogPostWithCategory — used in the paginated list (includes joined category name)
export interface BlogPostWithCategory extends BlogPost {
  categoryName: string | null;
}

// Paginated list response shape
export interface BlogPostsResponse {
  posts: BlogPostWithCategory[];
  total: number;
  totalPages: number;
  page: number;
}

// Form data shapes for mutations
export interface BlogPostFormData {
  title: string;
  body: string; // HTML from Tiptap
  excerpt: string;
  coverImageUrl?: string;
  categoryId?: string;
  status: "draft" | "published";
}

export interface BlogCategoryFormData {
  name: string;
}
