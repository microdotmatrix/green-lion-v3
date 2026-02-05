import type {
  FeedbackDetail,
  FeedbackReply,
  FeedbackResponse,
  FeedbackTicket,
} from "./types";

export async function fetchFeedback(params: {
  page: number;
  status: string;
  type: string;
  search: string;
}): Promise<FeedbackResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "25",
    status: params.status,
    type: params.type,
    search: params.search,
  });
  const response = await fetch(`/api/admin/feedback?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch feedback");
  return response.json();
}

export async function fetchFeedbackDetail(
  id: string,
): Promise<FeedbackDetail> {
  const response = await fetch(`/api/admin/feedback/${id}`);
  if (!response.ok) throw new Error("Failed to fetch feedback detail");
  return response.json();
}

export async function updateFeedbackStatus(
  id: string,
  status: string,
): Promise<FeedbackTicket> {
  const response = await fetch(`/api/admin/feedback/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update feedback status");
  return response.json();
}

export async function createFeedbackReply(
  submissionId: string,
  message: string,
): Promise<FeedbackReply> {
  const response = await fetch(
    `/api/admin/feedback/${submissionId}/reply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    },
  );
  if (!response.ok) throw new Error("Failed to send reply");
  return response.json();
}
