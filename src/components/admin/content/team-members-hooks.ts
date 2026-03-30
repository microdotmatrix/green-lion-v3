import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  updateTeamMember,
} from "./team-members-api";
import type { TeamMemberFormData } from "./team-members-types";

const QUERY_KEY = ["admin-team-members"] as const;

export function useTeamMembers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchTeamMembers,
  });
}

export function useTeamMemberMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMut = useMutation({
    mutationFn: (data: TeamMemberFormData) => createTeamMember(data),
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeamMemberFormData> }) =>
      updateTeamMember(id, data),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: invalidate,
  });

  return { createMut, updateMut, deleteMut };
}
