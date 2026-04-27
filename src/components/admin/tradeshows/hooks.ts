import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRep,
  deleteRep,
  fetchRep,
  fetchReps,
  fetchTradeshowData,
  updateRep,
} from "./api";
import type { RepUpdateData } from "./types";

export function useTradeshowReps() {
  return useQuery({
    queryKey: ["admin-tradeshows"],
    queryFn: fetchReps,
  });
}

export function useTradeshowData() {
  return useQuery({
    queryKey: ["admin-tradeshow-data"],
    queryFn: fetchTradeshowData,
  });
}

export function useTradeshowRep(repId: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-tradeshow", repId],
    queryFn: () => fetchRep(repId),
    enabled,
  });
}

export function useTradeshowRepMutations() {
  const queryClient = useQueryClient();

  const createRepMut = useMutation({
    mutationFn: createRep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshows"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshow-data"] });
    },
  });

  const updateRepMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RepUpdateData }) =>
      updateRep(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshows"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshow-data"] });
    },
  });

  const deleteRepMut = useMutation({
    mutationFn: deleteRep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshows"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshow-data"] });
    },
  });

  return { createRepMut, updateRepMut, deleteRepMut };
}
