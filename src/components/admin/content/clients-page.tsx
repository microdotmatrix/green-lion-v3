"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
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

interface ClientLogo {
  id: string;
  companyName: string;
  logoUrl: string;
  externalLink: string;
  displayOrder: number;
  featuredOnHomepage: boolean;
  createdAt: string;
}

interface FormData {
  companyName: string;
  logoUrl: string;
  externalLink: string;
  displayOrder: number;
  featuredOnHomepage: boolean;
}

async function fetchItems(): Promise<ClientLogo[]> {
  const res = await fetch("/api/admin/clients");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function createItem(data: FormData) {
  const res = await fetch("/api/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function updateItem(id: string, data: Partial<FormData>) {
  const res = await fetch(`/api/admin/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function deleteItem(id: string) {
  const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed");
}

function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ClientLogo | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;

  const [formData, setFormData] = React.useState<FormData>({
    companyName: "",
    logoUrl: "",
    externalLink: "",
    displayOrder: 0,
    featuredOnHomepage: false,
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        companyName: item.companyName,
        logoUrl: item.logoUrl,
        externalLink: item.externalLink,
        displayOrder: item.displayOrder,
        featuredOnHomepage: item.featuredOnHomepage,
      });
    } else {
      setFormData({
        companyName: "",
        logoUrl: "",
        externalLink: "",
        displayOrder: 0,
        featuredOnHomepage: false,
      });
    }
  }, [item, open]);

  const createMut = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      onOpenChange(false);
      onSuccess();
    },
  });
  const updateMut = useMutation({
    mutationFn: (data: Partial<FormData>) => updateItem(item!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isEditing ? updateMut.mutate(formData) : createMut.mutate(formData);
  };
  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add Client"}</DialogTitle>
          <DialogDescription>Manage client logo details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input
              value={formData.companyName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, companyName: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Logo URL *</Label>
            <Input
              value={formData.logoUrl}
              onChange={(e) =>
                setFormData((p) => ({ ...p, logoUrl: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>External Link *</Label>
            <Input
              value={formData.externalLink}
              onChange={(e) =>
                setFormData((p) => ({ ...p, externalLink: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    displayOrder: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Featured on Homepage</Label>
              <Switch
                checked={formData.featuredOnHomepage}
                onCheckedChange={(c) =>
                  setFormData((p) => ({ ...p, featuredOnHomepage: c }))
                }
              />
            </div>
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

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ClientLogo | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<ClientLogo | null>(
    null,
  );

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({ queryKey: ["admin-clients"], queryFn: fetchItems });
  const deleteMut = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      setDeletingItem(null);
    },
  });

  const featuredCount = items?.filter((i) => i.featuredOnHomepage).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage client logos ({featuredCount} featured)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load clients.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Client Logos</CardTitle>
          <CardDescription>{items?.length ?? 0} clients</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={item.logoUrl}
                        alt={item.companyName}
                        className="h-10 w-20 object-contain bg-white rounded p-1"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.companyName}
                    </TableCell>
                    <TableCell>
                      {item.featuredOnHomepage && (
                        <Badge>
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={item.externalLink}
                              target="_blank"
                              rel="noopener"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingItem(item);
                              setIsFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingItem(item)}
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

      <ItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        onSuccess={() => setEditingItem(null)}
      />
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(o) => !o && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deletingItem?.companyName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMut.mutate(deletingItem.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
