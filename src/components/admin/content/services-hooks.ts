import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "./services-api";
import type { ServiceFormData } from "./services-types";

export function useServices() {
  return useQuery({
    queryKey: ["admin-services"],
    queryFn: fetchServices,
  });
}

export function useServiceMutations() {
  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceFormData> }) =>
      updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  return { createMut, updateMut, deleteMut };
}
