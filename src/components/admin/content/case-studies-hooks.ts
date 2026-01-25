import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCaseStudy,
  deleteCaseStudy,
  fetchCaseStudies,
  updateCaseStudy,
} from "./case-studies-api";
import type { CaseStudyFormData } from "./case-studies-types";

export function useCaseStudies() {
  return useQuery({
    queryKey: ["admin-case-studies"],
    queryFn: fetchCaseStudies,
  });
}

export function useCaseStudyMutations() {
  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: createCaseStudy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-case-studies"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CaseStudyFormData> }) =>
      updateCaseStudy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-case-studies"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCaseStudy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-case-studies"] });
    },
  });

  return { createMut, updateMut, deleteMut };
}
