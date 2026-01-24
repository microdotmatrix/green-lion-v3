import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Hash,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  ToggleLeft,
  Trash2,
  Type,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AttributeType = "text" | "number" | "boolean" | "select" | "multi_select";

interface Attribute {
  id: string;
  name: string;
  attributeType: AttributeType;
  options: string[] | null;
  createdAt: string;
  categoryCount: number;
  productCount: number;
}

interface AttributeFormData {
  name: string;
  attributeType: AttributeType;
  options: string[];
}

async function fetchAttributes(): Promise<Attribute[]> {
  const response = await fetch("/api/admin/attributes");
  if (!response.ok) throw new Error("Failed to fetch attributes");
  return response.json();
}

async function createAttribute(data: AttributeFormData): Promise<Attribute> {
  const response = await fetch("/api/admin/attributes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create attribute");
  }
  return response.json();
}

async function updateAttribute(
  id: string,
  data: Partial<AttributeFormData>,
): Promise<Attribute> {
  const response = await fetch(`/api/admin/attributes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update attribute");
  }
  return response.json();
}

async function deleteAttribute(id: string): Promise<void> {
  const response = await fetch(`/api/admin/attributes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete attribute");
  }
}

function getTypeIcon(type: AttributeType) {
  switch (type) {
    case "text":
      return <Type className="h-4 w-4" />;
    case "number":
      return <Hash className="h-4 w-4" />;
    case "boolean":
      return <ToggleLeft className="h-4 w-4" />;
    case "select":
      return <List className="h-4 w-4" />;
    case "multi_select":
      return <CheckSquare className="h-4 w-4" />;
  }
}

function getTypeLabel(type: AttributeType) {
  switch (type) {
    case "text":
      return "Text";
    case "number":
      return "Number";
    case "boolean":
      return "Yes/No";
    case "select":
      return "Single Select";
    case "multi_select":
      return "Multi Select";
  }
}

function AttributeFormDialog({
  open,
  onOpenChange,
  attribute,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute?: Attribute | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!attribute;

  const [formData, setFormData] = React.useState<AttributeFormData>({
    name: "",
    attributeType: "text",
    options: [],
  });
  const [optionInput, setOptionInput] = React.useState("");

  React.useEffect(() => {
    if (attribute) {
      setFormData({
        name: attribute.name,
        attributeType: attribute.attributeType,
        options: attribute.options || [],
      });
    } else {
      setFormData({
        name: "",
        attributeType: "text",
        options: [],
      });
    }
    setOptionInput("");
  }, [attribute, open]);

  const createMutation = useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AttributeFormData>) =>
      updateAttribute(attribute!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
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

  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (trimmed && !formData.options.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, trimmed],
      }));
      setOptionInput("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o !== option),
    }));
  };

  const showOptions =
    formData.attributeType === "select" ||
    formData.attributeType === "multi_select";
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
            {isEditing ? "Edit Attribute" : "Add Attribute"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update attribute properties."
              : "Create a new customization attribute."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Color, Size, Material"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.attributeType}
              onValueChange={(value: AttributeType) =>
                setFormData((prev) => ({ ...prev, attributeType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text (free input)</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Yes/No Toggle</SelectItem>
                <SelectItem value="select">Single Select (dropdown)</SelectItem>
                <SelectItem value="multi_select">
                  Multi Select (checkboxes)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showOptions && (
            <div className="space-y-2">
              <Label>Options *</Label>
              <div className="flex gap-2">
                <Input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="Add an option"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddOption}
                >
                  Add
                </Button>
              </div>
              {formData.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.options.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1">
                      {option}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(option)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {showOptions && formData.options.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add at least one option for select types.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || (showOptions && formData.options.length === 0)
              }
            >
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAttribute, setEditingAttribute] =
    React.useState<Attribute | null>(null);
  const [deletingAttribute, setDeletingAttribute] =
    React.useState<Attribute | null>(null);

  const {
    data: attributes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-attributes"],
    queryFn: fetchAttributes,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
      setDeletingAttribute(null);
    },
  });

  const handleEdit = (attr: Attribute) => {
    setEditingAttribute(attr);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setEditingAttribute(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
          <p className="text-muted-foreground">
            Manage product customization attributes
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAttribute(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load attributes. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attributes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customization Attributes</CardTitle>
          <CardDescription>
            {attributes?.length ?? 0} attributes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : attributes?.length === 0 ? (
            <div className="text-center py-12">
              <Settings2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No attributes yet</h3>
              <p className="text-muted-foreground">
                Create your first attribute to enable product customization.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingAttribute(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attribute
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead className="text-center">Categories</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes?.map((attr) => (
                  <TableRow key={attr.id}>
                    <TableCell className="font-medium">{attr.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(attr.attributeType)}
                        <span>{getTypeLabel(attr.attributeType)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attr.options && attr.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {attr.options.slice(0, 3).map((opt) => (
                            <Badge
                              key={opt}
                              variant="outline"
                              className="text-xs"
                            >
                              {opt}
                            </Badge>
                          ))}
                          {attr.options.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{attr.options.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{attr.categoryCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{attr.productCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(attr)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingAttribute(attr)}
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
      <AttributeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        attribute={editingAttribute}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingAttribute}
        onOpenChange={(open) => !open && setDeletingAttribute(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAttribute?.name}"? This
              will remove it from {deletingAttribute?.categoryCount || 0}{" "}
              categories and {deletingAttribute?.productCount || 0} products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingAttribute && deleteMutation.mutate(deletingAttribute.id)
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
