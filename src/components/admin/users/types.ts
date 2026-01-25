export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  approved: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  sessionCount: number;
}

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invite {
  id: string;
  email: string;
  invitedBy: string | null;
  acceptedBy: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  status: InviteStatus;
}

export interface CreateInviteResponse {
  id: string;
  email: string;
  expiresAt: string;
  inviteUrl: string;
}
