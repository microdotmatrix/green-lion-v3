"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import * as React from "react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TradeshowRep {
  id: string;
  name: string;
  email: string;
  phone: string;
  slug: string;
  company: string;
  active: boolean;
  createdAt: string;
  leadCount: number;
}

interface Lead {
  id: string;
  repId: string;
  leadName: string;
  leadCompany: string | null;
  contactMethod: string;
  selectedCategoryIds: string[];
  selectedProductIds: string[];
  selectedServiceIds: string[];
  messageTemplate: string | null;
  createdAt: string;
}

interface RepFormData {
  name: string;
  email: string;
  phone: string;
  slug: string;
  company: string;
  active: boolean;
}

async function fetchReps(): Promise<TradeshowRep[]> {
  const response = await fetch("/api/admin/tradeshows");
  if (!response.ok) throw new Error("Failed to fetch reps");
  return response.json();
}

async function fetchRep(id: string): Promise<TradeshowRep & { leads: Lead[] }> {
  const response = await fetch(`/api/admin/tradeshows/${id}`);
  if (!response.ok) throw new Error("Failed to fetch rep");
  return response.json();
}

async function createRep(data: RepFormData): Promise<TradeshowRep> {
  const response = await fetch("/api/admin/tradeshows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create rep");
  }
  return response.json();
}

async function updateRep(
  id: string,
  data: Partial<RepFormData>,
): Promise<TradeshowRep> {
  const response = await fetch(`/api/admin/tradeshows/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update rep");
  }
  return response.json();
}

async function deleteRep(id: string): Promise<void> {
  const response = await fetch(`/api/admin/tradeshows/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete rep");
  }
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function RepFormDialog({
  open,
  onOpenChange,
  rep,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rep?: TradeshowRep | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!rep;

  const [formData, setFormData] = React.useState<RepFormData>({
    name: "",
    email: "",
    phone: "",
    slug: "",
    company: "",
    active: true,
  });

  React.useEffect(() => {
    if (rep) {
      setFormData({
        name: rep.name,
        email: rep.email,
        phone: rep.phone,
        slug: rep.slug,
        company: rep.company,
        active: rep.active,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        slug: "",
        company: "",
        active: true,
      });
    }
  }, [rep, open]);

  const createMutation = useMutation({
    mutationFn: createRep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshows"] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<RepFormData>) => updateRep(rep!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshows"] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Representative" : "Add Representative"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update rep details."
              : "Add a new trade show representative."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="Acme Corp"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1 555-123-4567"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="john-smith"
              required
            />
            <p className="text-xs text-muted-foreground">
              Public URL: /leads/{formData.slug || "slug"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, active: checked }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RepDetailView({
  repId,
  onBack,
}: {
  repId: string;
  onBack: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const {
    data: rep,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-tradeshow", repId],
    queryFn: () => fetchRep(repId),
  });

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/leads/${rep?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !rep) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <p className="text-destructive">Failed to load rep details.</p>
          <Button variant="outline" onClick={onBack} className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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
          <h1 className="text-2xl font-bold">{rep.name}</h1>
          <p className="text-muted-foreground">{rep.company}</p>
        </div>
        <Badge variant={rep.active ? "default" : "secondary"}>
          {rep.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Rep Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p>{rep.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{rep.phone}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Lead Capture URL</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  /leads/{rep.slug}
                </code>
                <Button variant="ghost" size="icon" onClick={handleCopyUrl}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={`/leads/${rep.slug}`} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{rep.leads?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Captured Leads</CardTitle>
            <CardDescription>
              Leads captured by this representative
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rep.leads?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads captured yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rep.leads?.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.leadName}
                      </TableCell>
                      <TableCell>{lead.leadCompany || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lead.contactMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TradeshowsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRep, setEditingRep] = React.useState<TradeshowRep | null>(null);
  const [deletingRep, setDeletingRep] = React.useState<TradeshowRep | null>(
    null,
  );
  const [selectedRepId, setSelectedRepId] = React.useState<string | null>(null);

  const {
    data: reps,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-tradeshows"],
    queryFn: fetchReps,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tradeshows"] });
      setDeletingRep(null);
    },
  });

  const handleEdit = (rep: TradeshowRep) => {
    setEditingRep(rep);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setEditingRep(null);
  };

  if (selectedRepId) {
    return (
      <RepDetailView
        repId={selectedRepId}
        onBack={() => setSelectedRepId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Shows</h1>
          <p className="text-muted-foreground">
            Manage representatives and track leads
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRep(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Representative
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load representatives.</p>
          </CardContent>
        </Card>
      )}

      {/* Reps Table */}
      <Card>
        <CardHeader>
          <CardTitle>Representatives</CardTitle>
          <CardDescription>{reps?.length ?? 0} representatives</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reps?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No representatives yet
              </h3>
              <p className="text-muted-foreground">
                Add your first trade show representative.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingRep(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Representative
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Leads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reps?.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.company}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{rep.email}</p>
                        <p className="text-muted-foreground">{rep.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{rep.leadCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rep.active ? "default" : "outline"}>
                        {rep.active ? "Active" : "Inactive"}
                      </Badge>
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
                            onClick={() => setSelectedRepId(rep.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(rep)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingRep(rep)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Form Dialog */}
      <RepFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rep={editingRep}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingRep}
        onOpenChange={(open) => !open && setDeletingRep(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Representative</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRep?.name}"? This will
              also delete all leads captured by this representative.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingRep && deleteMutation.mutate(deletingRep.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
