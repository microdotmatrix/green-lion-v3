import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchQuote, fetchQuotes, updateQuoteStatus } from "./api";

export function useQuotes(params: {
  page: number;
  status: string;
  search: string;
  enabled?: boolean;
}) {
  const { page, status, search, enabled = true } = params;
  return useQuery({
    queryKey: ["admin-quotes", page, status, search],
    queryFn: () => fetchQuotes({ page, status, search }),
    enabled,
  });
}

export function useQuoteDetail(quoteId: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-quote", quoteId],
    queryFn: () => fetchQuote(quoteId),
    enabled,
  });
}

export function useQuoteMutations() {
  const queryClient = useQueryClient();

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateQuoteStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-quote", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
    },
  });

  return { updateStatusMut };
}
