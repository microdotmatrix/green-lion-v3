import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquareQuote,
  MoreHorizontal,
  Pencil,
  Plus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  authorTitle: string | null;
  companyName: string;
  companyLink: string | null;
  companyLogo: string | null;
  displayOrder: number;
  createdAt: string;
}

interface FormData {
  quote: string;
  author: string;
  authorTitle: string;
  companyName: string;
  companyLink: string;
  companyLogo: string;
  displayOrder: number;
}

async function fetchItems(): Promise<Testimonial[]> {
  const res = await fetch("/api/admin/testimonials");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function createItem(data: FormData) {
  const res = await fetch("/api/admin/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed");
  return res.json();
}

async function updateItem(id: string, data: Partial<FormData>) {
  const res = await fetch(`/api/admin/testimonials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function deleteItem(id: string) {
  const res = await fetch(`/api/admin/testimonials/${id}`, {
    method: "DELETE",
  });
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
  item?: Testimonial | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;

  const [formData, setFormData] = React.useState<FormData>({
    quote: "",
    author: "",
    authorTitle: "",
    companyName: "",
    companyLink: "",
    companyLogo: "",
    displayOrder: 0,
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        quote: item.quote,
        author: item.author,
        authorTitle: item.authorTitle || "",
        companyName: item.companyName,
        companyLink: item.companyLink || "",
        companyLogo: item.companyLogo || "",
        displayOrder: item.displayOrder,
      });
    } else {
      setFormData({
        quote: "",
        author: "",
        authorTitle: "",
        companyName: "",
        companyLink: "",
        companyLogo: "",
        displayOrder: 0,
      });
    }
  }, [item, open]);

  const createMut = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      onOpenChange(false);
      onSuccess();
    },
  });
  const updateMut = useMutation({
    mutationFn: (data: Partial<FormData>) => updateItem(item!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isEditing ? updateMut.mutate(formData) : createMut.mutate(formData);
  };
  const isLoading = createMut.isPending || updateMut.isPending;
  const error = createMut.error || updateMut.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Testimonial" : "Add Testimonial"}
          </DialogTitle>
          <DialogDescription>Manage testimonial details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error.message}
            </div>
          )}
          <div className="space-y-2">
            <Label>Quote *</Label>
            <Textarea
              value={formData.quote}
              onChange={(e) =>
                setFormData((p) => ({ ...p, quote: e.target.value }))
              }
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Author *</Label>
              <Input
                value={formData.author}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, author: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Author Title</Label>
              <Input
                value={formData.authorTitle}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, authorTitle: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Input
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, companyName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Company Link</Label>
              <Input
                value={formData.companyLink}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, companyLink: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Logo URL</Label>
              <Input
                value={formData.companyLogo}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, companyLogo: e.target.value }))
                }
              />
            </div>
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

export default function TestimonialsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Testimonial | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = React.useState<Testimonial | null>(
    null,
  );

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({ queryKey: ["admin-testimonials"], queryFn: fetchItems });
  const deleteMut = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setDeletingItem(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Manage customer testimonials</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load testimonials.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Testimonials</CardTitle>
          <CardDescription>{items?.length ?? 0} items</CardDescription>
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
              <MessageSquareQuote className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No testimonials yet
              </h3>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[300px] truncate">
                      {item.quote}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.author}</p>
                        {item.authorTitle && (
                          <p className="text-xs text-muted-foreground">
                            {item.authorTitle}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.companyName}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Delete testimonial from {deletingItem?.author}?
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
