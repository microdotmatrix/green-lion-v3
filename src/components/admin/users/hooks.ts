import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createInvite,
  deleteUser,
  fetchInvites,
  fetchUsers,
  revokeInvite,
  toggleApproved,
  toggleVerified,
} from "./api";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });
}

export function useAdminInvites() {
  return useQuery({
    queryKey: ["admin-invites"],
    queryFn: fetchInvites,
  });
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      toggleVerified(id, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const approveMut = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      toggleApproved(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return { approveMut, deleteMut, verifyMut };
}

export function useAdminInviteMutations() {
  const queryClient = useQueryClient();

  const createInviteMut = useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
    },
  });

  const revokeInviteMut = useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
    },
  });

  return { createInviteMut, revokeInviteMut };
}
