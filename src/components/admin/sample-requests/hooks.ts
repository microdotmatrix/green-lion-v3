import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSampleRequest,
  deleteSampleRequest,
  fetchProductCapacityOptions,
  fetchSampleRequest,
  fetchSampleRequests,
  searchProducts,
  updateSampleRequestStatus,
} from "./api";
import type { SampleRequestFormData } from "./types";

export function useSampleRequests(params: {
  page: number;
  status: string;
  search: string;
  enabled?: boolean;
}) {
  const { page, status, search, enabled = true } = params;
  return useQuery({
    queryKey: ["admin-sample-requests", page, status, search],
    queryFn: () => fetchSampleRequests({ page, status, search }),
    enabled,
  });
}

export function useSampleRequestDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-sample-request", id],
    queryFn: () => fetchSampleRequest(id),
    enabled,
  });
}

export function useSampleRequestMutations() {
  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: (data: SampleRequestFormData) => createSampleRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sample-requests"] });
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateSampleRequestStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-sample-request", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-sample-requests"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSampleRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sample-requests"] });
    },
  });

  return { createMut, updateStatusMut, deleteMut };
}

export function useProductSearch(search: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-product-search", search],
    queryFn: () => searchProducts(search),
    enabled,
  });
}

export function useProductCapacityOptions(productId: string | null) {
  return useQuery({
    queryKey: ["admin-product-capacity", productId],
    queryFn: () => fetchProductCapacityOptions(productId!),
    enabled: !!productId,
  });
}
