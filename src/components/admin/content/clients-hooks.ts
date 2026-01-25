import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "./clients-api";
import type { ClientFormData } from "./clients-types";

export function useClients() {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: fetchClients,
  });
}

export function useClientMutations() {
  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientFormData> }) =>
      updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });

  return { createMut, updateMut, deleteMut };
}
