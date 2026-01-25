import { formatDistanceToNow } from "date-fns";
import { Copy, Trash2, UserPlus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import type { CreateInviteResponse, Invite } from "./types";

type InvitesCardProps = {
  invites: Invite[] | undefined;
  isLoading: boolean;
  error: unknown;
  onCreateInvite: (email: string) => Promise<CreateInviteResponse>;
  onRevokeInvite: (id: string) => Promise<unknown>;
  createPending: boolean;
  revokePending: boolean;
};

export function InvitesCard({
  invites,
  isLoading,
  error,
  onCreateInvite,
  onRevokeInvite,
  createPending,
  revokePending,
}: InvitesCardProps) {
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [latestInvite, setLatestInvite] =
    React.useState<CreateInviteResponse | null>(null);

  const handleInviteSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Email is required");
      return;
    }

    try {
      const data = await onCreateInvite(email);
      setLatestInvite(data);
      setInviteEmail("");

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    }
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

  const handleRevokeInvite = async (id: string) => {
    try {
      await onRevokeInvite(id);
      toast.success("Invite revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invite");
    }
  };

  return (
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
          <Button type="submit" disabled={createPending}>
            {createPending ? "Creating invite..." : "Create Invite"}
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
          {error && (
            <p className="text-sm text-destructive">Failed to load invites.</p>
          )}

          {isLoading ? (
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
                          onClick={() => handleRevokeInvite(invite.id)}
                          disabled={revokePending}
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
              <h3 className="mt-3 text-base font-semibold">No invites yet</h3>
              <p className="text-sm text-muted-foreground">
                Create an invite to onboard a new user.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
