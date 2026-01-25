import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTestimonial,
  deleteTestimonial,
  fetchTestimonials,
  updateTestimonial,
} from "./testimonials-api";
import type { TestimonialFormData } from "./testimonials-types";

export function useTestimonials() {
  return useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: fetchTestimonials,
  });
}

export function useTestimonialMutations() {
  const queryClient = useQueryClient();

  const createMut = useMutation({
    mutationFn: createTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TestimonialFormData> }) =>
      updateTestimonial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });

  return { createMut, updateMut, deleteMut };
}
