import type { Quote, QuoteDetail, QuotesResponse } from "./types";

export async function fetchQuotes(params: {
  page: number;
  status: string;
  search: string;
}): Promise<QuotesResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "25",
    status: params.status,
    search: params.search,
  });
  const response = await fetch(`/api/admin/quotes?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch quotes");
  return response.json();
}

export async function fetchQuote(id: string): Promise<QuoteDetail> {
  const response = await fetch(`/api/admin/quotes/${id}`);
  if (!response.ok) throw new Error("Failed to fetch quote");
  return response.json();
}

export async function updateQuoteStatus(
  id: string,
  status: string,
): Promise<Quote> {
  const response = await fetch(`/api/admin/quotes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update quote");
  return response.json();
}
