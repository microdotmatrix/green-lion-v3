import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Image,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Service {
  id: string;
  title: string;
  description: string;
  features: string[];
  iconName: string | null;
  imageUrl: string | null;
  googleFormUrl: string | null;
  displayOrder: number;
  createdAt: string;
}

interface FormData {
  title: string;
  description: string;
  features: string[];
  iconName: string;
  imageUrl: string;
  googleFormUrl: string;
  displayOrder: number;
}

async function fetchItems(): Promise<Service[]> {
  const res = await fetch("/api/admin/services");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function createItem(data: FormData) {
  const res = await fetch("/api/admin/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function updateItem(id: string, data: Partial<FormData>) {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function deleteItem(id: string) {
  const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
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
  item?: Service | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;
  const [featureInput, setFeatureInput] = React.useState("");

  const [formData, setFormData] = React.useState<FormData>({
    title: "",
    description: "",
    features: [],
    iconName: "",
    imageUrl: "",
    googleFormUrl: "",
    displayOrder: 0,
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        features: item.features || [],
        iconName: item.iconName || "",
        imageUrl: item.imageUrl || "",
        googleFormUrl: item.googleFormUrl || "",
        displayOrder: item.displayOrder,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        features: [],
        iconName: "",
        imageUrl: "",
        googleFormUrl: "",
        displayOrder: 0,
      });
    }
    setFeatureInput("");
  }, [item, open]);

  const createMut = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      onOpenChange(false);
      onSuccess();
    },
  });
  const updateMut = useMutation({
    mutationFn: (data: Partial<FormData>) => updateItem(item!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isEditing ? updateMut.mutate(formData) : createMut.mutate(formData);
  };
  const addFeature = () => {
    if (
      featureInput.trim() &&
      !formData.features.includes(featureInput.trim())
    ) {
      setFormData((p) => ({
        ...p,
        features: [...p.features, featureInput.trim()],
      }));
      setFeatureInput("");
    }
  };
  const removeFeature = (f: string) =>
    setFormData((p) => ({ ...p, features: p.features.filter((x) => x !== f) }));
  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription>Manage service details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                required
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
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Add feature"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addFeature}>
                Add
              </Button>
            </div>
            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((f) => (
                  <Badge key={f} variant="secondary" className="gap-1">
                    {f}
                    <button
                      type="button"
                      onClick={() => removeFeature(f)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon Name</Label>
              <Input
                value={formData.iconName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, iconName: e.target.value }))
                }
                placeholder="Package, Cpu, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, imageUrl: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Google Form URL</Label>
            <Input
              value={formData.googleFormUrl}
              onChange={(e) =>
                setFormData((p) => ({ ...p, googleFormUrl: e.target.value }))
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

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Service | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<Service | null>(null);

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({ queryKey: ["admin-services"], queryFn: fetchItems });
  const deleteMut = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      setDeletingItem(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage company services</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load services.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>{items?.length ?? 0} services</CardDescription>
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
              <Image className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No services yet</h3>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.features?.length || 0} features
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
                          {item.googleFormUrl && (
                            <DropdownMenuItem asChild>
                              <a
                                href={item.googleFormUrl}
                                target="_blank"
                                rel="noopener"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Form
                              </a>
                            </DropdownMenuItem>
                          )}
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
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deletingItem?.title}?
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
