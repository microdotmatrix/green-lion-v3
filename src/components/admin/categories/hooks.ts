import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignAttribute,
  createCategory,
  deleteCategory,
  fetchAllAttributes,
  fetchCategories,
  fetchCategory,
  fetchCategoryAttributes,
  removeAttribute,
  updateCategory,
} from "./api";
import type { CategoryFormData } from "./types";

export function useCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchCategories,
  });
}

export function useCategoryDetail(categoryId: string) {
  return useQuery({
    queryKey: ["admin-category", categoryId],
    queryFn: () => fetchCategory(categoryId),
  });
}

export function useCategoryAttributes(categoryId: string) {
  return useQuery({
    queryKey: ["admin-category-attributes", categoryId],
    queryFn: () => fetchCategoryAttributes(categoryId),
    enabled: !!categoryId,
  });
}

export function useAllAttributes() {
  return useQuery({
    queryKey: ["admin-attributes"],
    queryFn: fetchAllAttributes,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  return { createMut, updateMut, deleteMut };
}

export function useCategoryAttributeMutations(categoryId: string) {
  const queryClient = useQueryClient();

  const assignMut = useMutation({
    mutationFn: (attributeId: string) => assignAttribute(categoryId, attributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-category-attributes", categoryId],
      });
    },
  });

  const removeMut = useMutation({
    mutationFn: (attributeId: string) => removeAttribute(categoryId, attributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-category-attributes", categoryId],
      });
    },
  });

  return { assignMut, removeMut };
}
