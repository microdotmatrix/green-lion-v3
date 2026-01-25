import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  fetchCategories,
  fetchProduct,
  fetchProducts,
  updateProduct,
} from "./api";
import type { ProductFormData } from "./types";

export function useProducts(params: {
  page: number;
  search: string;
  categoryId: string;
}) {
  const { page, search, categoryId } = params;
  return useQuery({
    queryKey: ["admin-products", page, search, categoryId],
    queryFn: () => fetchProducts({ page, search, categoryId }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchCategories,
  });
}

export function useProductDetail(productId: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => fetchProduct(productId),
    enabled,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createProductMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const updateProductMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      updateProduct(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-product", variables.id],
      });
    },
  });

  const deleteProductMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const duplicateProductMut = useMutation({
    mutationFn: duplicateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  return {
    createProductMut,
    updateProductMut,
    deleteProductMut,
    duplicateProductMut,
  };
}
