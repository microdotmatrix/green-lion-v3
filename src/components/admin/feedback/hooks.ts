import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFeedbackReply,
  fetchFeedback,
  fetchFeedbackDetail,
  updateFeedbackStatus,
} from "./api";

export function useFeedback(params: {
  page: number;
  status: string;
  type: string;
  search: string;
  enabled?: boolean;
}) {
  const { page, status, type, search, enabled = true } = params;
  return useQuery({
    queryKey: ["admin-feedback", page, status, type, search],
    queryFn: () => fetchFeedback({ page, status, type, search }),
    enabled,
  });
}

export function useFeedbackDetail(submissionId: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-feedback-detail", submissionId],
    queryFn: () => fetchFeedbackDetail(submissionId),
    enabled,
  });
}

export function useFeedbackMutations() {
  const queryClient = useQueryClient();

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateFeedbackStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-feedback-detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
    },
  });

  const replyMut = useMutation({
    mutationFn: ({
      submissionId,
      message,
    }: {
      submissionId: string;
      message: string;
    }) => createFeedbackReply(submissionId, message),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-feedback-detail", variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
    },
  });

  return { updateStatusMut, replyMut };
}
