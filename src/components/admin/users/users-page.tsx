import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  Copy,
  MoreHorizontal,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
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

type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

interface Invite {
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

interface CreateInviteResponse {
  id: string;
  email: string;
  expiresAt: string;
  inviteUrl: string;
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

async function fetchInvites(): Promise<Invite[]> {
  const res = await fetch("/api/admin/invites");
  if (!res.ok) throw new Error("Failed to fetch invites");
  return res.json();
}

async function createInvite(email: string): Promise<CreateInviteResponse> {
  const res = await fetch("/api/admin/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create invite");
  }
  return res.json();
}

async function revokeInvite(id: string) {
  const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to revoke invite");
  }
}

async function deleteUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete user");
  }
}

async function toggleVerified(id: string, verified: boolean) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailVerified: verified }),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

async function toggleApproved(id: string, approved: boolean) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UsersPage({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [deletingUser, setDeletingUser] = React.useState<User | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [latestInvite, setLatestInvite] =
    React.useState<CreateInviteResponse | null>(null);

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const {
    data: invites,
    isLoading: invitesLoading,
    error: invitesError,
  } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: fetchInvites,
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeletingUser(null);
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

  const inviteMut = useMutation({
    mutationFn: createInvite,
    onSuccess: async (data) => {
      setLatestInvite(data);
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(data.inviteUrl);
          toast.success("Invite created and copied to clipboard");
        } else {
          toast.success("Invite created");
        }
      } catch {
        toast.success("Invite created");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    },
  });

  const revokeMut = useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
      toast.success("Invite revoked");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invite");
    },
  });

  const handleInviteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    inviteMut.mutate(email);
  };

  const handleCopyLatestInvite = async () => {
    if (!latestInvite) return;
    try {
      await navigator.clipboard.writeText(latestInvite.inviteUrl);
      toast.success("Invite link copied");
    } catch {
      toast.error("Failed to copy invite link");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load users.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <CardDescription>Invite new admins and sales associates</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleInviteSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Invite Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="new.user@company.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={inviteMut.isPending}>
              {inviteMut.isPending ? "Creating invite..." : "Create Invite"}
            </Button>
          </form>

          {latestInvite && (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Invite link (shown once)</p>
                  <p className="text-xs text-muted-foreground">
                    Expires{" "}
                    {formatDistanceToNow(new Date(latestInvite.expiresAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="mt-2 break-all text-sm">
                    {latestInvite.inviteUrl}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLatestInvite}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6">
            {invitesError && (
              <p className="text-sm text-destructive">
                Failed to load invites.
              </p>
            )}

            {invitesLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : invites && invites.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Invite</Badge>
                          <span className="text-sm">{invite.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invite.status === "pending" && (
                          <Badge variant="default">Pending</Badge>
                        )}
                        {invite.status === "accepted" && (
                          <Badge variant="outline">Accepted</Badge>
                        )}
                        {invite.status === "expired" && (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                        {invite.status === "revoked" && (
                          <Badge variant="destructive">Revoked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(invite.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(invite.expiresAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        {invite.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeMut.mutate(invite.id)}
                            disabled={revokeMut.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <UserPlus className="h-10 w-10 mx-auto text-muted-foreground" />
                <h3 className="mt-3 text-base font-semibold">
                  No invites yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create an invite to onboard a new user.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users?.length ?? 0} users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No users yet</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={u.image || undefined}
                            alt={u.name}
                          />
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{u.name}</p>
                            {u.id === currentUserId && (
                              <Badge variant="outline" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {u.emailVerified ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Unverified
                          </Badge>
                        )}
                        {u.approved ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.sessionCount} active</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(u.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              approveMut.mutate({
                                id: u.id,
                                approved: !u.approved,
                              })
                            }
                            disabled={
                              approveMut.isPending ||
                              (u.id === currentUserId && u.approved)
                            }
                          >
                            {u.approved ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Revoke approval
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              verifyMut.mutate({
                                id: u.id,
                                verified: !u.emailVerified,
                              })
                            }
                            disabled={verifyMut.isPending}
                          >
                            {u.emailVerified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Unverify
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify
                              </>
                            )}
                          </DropdownMenuItem>
                          {u.id !== currentUserId && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingUser(u)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(o) => !o && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.name}? This will
              also delete all their sessions and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && deleteMut.mutate(deletingUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
