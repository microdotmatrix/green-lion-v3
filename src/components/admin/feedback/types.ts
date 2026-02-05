export interface FeedbackTicket {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  replyCount: number;
}

export interface FeedbackReply {
  id: string;
  message: string;
  sentAt: string;
  adminUserId: string;
  adminName: string | null;
  adminEmail: string | null;
}

export interface FeedbackDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  title: string;
  message: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replies: FeedbackReply[];
}

export interface FeedbackResponse {
  submissions: FeedbackTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
}
