import * as React from "react";
import { DeleteUserDialog } from "./delete-user-dialog";
import {
  useAdminInviteMutations,
  useAdminInvites,
  useAdminUserMutations,
  useAdminUsers,
} from "./hooks";
import { InvitesCard } from "./invites-card";
import type { User } from "./types";
import { UsersTable } from "./users-table";

export default function UsersPage({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [deletingUser, setDeletingUser] = React.useState<User | null>(null);
  const { data: users, isLoading, error } = useAdminUsers();
  const {
    data: invites,
    isLoading: invitesLoading,
    error: invitesError,
  } = useAdminInvites();
  const { approveMut, deleteMut, verifyMut } = useAdminUserMutations();
  const { createInviteMut, revokeInviteMut } = useAdminInviteMutations();

  const handleDeleteUser = (userId: string) => {
    deleteMut.mutate(userId, {
      onSuccess: () => setDeletingUser(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
      </div>

      <InvitesCard
        invites={invites}
        isLoading={invitesLoading}
        error={invitesError}
        onCreateInvite={createInviteMut.mutateAsync}
        onRevokeInvite={revokeInviteMut.mutateAsync}
        createPending={createInviteMut.isPending}
        revokePending={revokeInviteMut.isPending}
      />

      <UsersTable
        users={users}
        isLoading={isLoading}
        error={error}
        currentUserId={currentUserId}
        approvePending={approveMut.isPending}
        verifyPending={verifyMut.isPending}
        onApprove={(payload) => approveMut.mutate(payload)}
        onVerify={(payload) => verifyMut.mutate(payload)}
        onDeleteRequest={setDeletingUser}
      />

      <DeleteUserDialog
        user={deletingUser}
        isDeleting={deleteMut.isPending}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}
