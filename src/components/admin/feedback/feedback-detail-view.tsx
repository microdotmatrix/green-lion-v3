import {
  ArrowLeft,
  Building2,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  Loader2,
} from "lucide-react";
import * as React from "react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { FeedbackStatusBadge } from "./feedback-status-badge";
import { FeedbackTypeBadge } from "./feedback-type-badge";
import { useFeedbackDetail, useFeedbackMutations } from "./hooks";
import { formatDate } from "./utils";

type FeedbackDetailViewProps = {
  submissionId: string;
  onBack: () => void;
};

export function FeedbackDetailView({
  submissionId,
  onBack,
}: FeedbackDetailViewProps) {
  const {
    data: submission,
    isLoading,
    error,
  } = useFeedbackDetail(submissionId, !!submissionId);
  const { updateStatusMut, replyMut } = useFeedbackMutations();
  const [replyMessage, setReplyMessage] = React.useState("");

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    replyMut.mutate(
      { submissionId, message: replyMessage.trim() },
      { onSuccess: () => setReplyMessage("") },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <p className="text-destructive">
            Failed to load submission details.
          </p>
          <Button variant="outline" onClick={onBack} className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{submission.title}</h1>
          <p className="text-muted-foreground">
            Submitted {formatDate(submission.createdAt)}
          </p>
        </div>
        <FeedbackTypeBadge type={submission.type} />
        <FeedbackStatusBadge status={submission.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar: Customer Info + Status */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                {submission.firstName} {submission.lastName}
              </p>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {submission.companyName}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${submission.email}`}
                  className="text-primary hover:underline"
                >
                  {submission.email}
                </a>
              </div>
              {submission.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${submission.phone}`}
                    className="text-primary hover:underline"
                  >
                    {submission.phone}
                  </a>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Select
                value={submission.status}
                onValueChange={(status) =>
                  updateStatusMut.mutate({ id: submissionId, status })
                }
                disabled={updateStatusMut.isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main content: Message + Replies */}
        <div className="md:col-span-2 space-y-6">
          {/* Original Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Message</CardTitle>
              <CardDescription>
                {submission.firstName} {submission.lastName} &middot;{" "}
                {formatDate(submission.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submission.message ? (
                <p className="whitespace-pre-wrap">{submission.message}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  No message provided.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Replies */}
          {submission.replies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5" />
                  Replies ({submission.replies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                        <span className="text-sm font-medium">
                          {reply.adminName ?? "Unknown"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(reply.sentAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">
                      {reply.message}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Reply</CardTitle>
              <CardDescription>
                Reply will be emailed to {submission.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || replyMut.isPending}
                >
                  {replyMut.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
              {replyMut.isError && (
                <p className="text-sm text-destructive">
                  Failed to send reply. Please try again.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
