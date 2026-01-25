import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAttribute,
  deleteAttribute,
  fetchAttributes,
  updateAttribute,
} from "./api";
import type { AttributeFormData } from "./types";

export function useAttributes() {
  return useQuery({
    queryKey: ["admin-attributes"],
    queryFn: fetchAttributes,
  });
}

export function useAttributeMutations() {
  const queryClient = useQueryClient();

  const createAttributeMut = useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
    },
  });

  const updateAttributeMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttributeFormData> }) =>
      updateAttribute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
    },
  });

  const deleteAttributeMut = useMutation({
    mutationFn: deleteAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
    },
  });

  return { createAttributeMut, updateAttributeMut, deleteAttributeMut };
}
