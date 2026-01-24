import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { ImageUpload } from "@/components/admin/image-upload";
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
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: string;
  name: string;
}

interface PricingTier {
  id?: string;
  minQuantity: number;
  pricePerUnit: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  images: string[];
  categoryId: string | null;
  categoryName: string | null;
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
  logoCost: string;
  packagingCost: string;
  createdAt: string;
  priceRange: { min: string; max: string } | null;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
  logoCost: string;
  packagingCost: string;
  images: string[];
  pricingTiers: PricingTier[];
}

async function fetchProducts(params: {
  page: number;
  search: string;
  categoryId: string;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: "25",
    search: params.search,
    categoryId: params.categoryId,
  });
  const response = await fetch(`/api/admin/products?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/admin/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

async function createProduct(data: ProductFormData): Promise<Product> {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create product");
  }
  return response.json();
}

async function updateProduct(
  id: string,
  data: Partial<ProductFormData>,
): Promise<Product> {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update product");
  }
  return response.json();
}

async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete product");
  }
}

async function fetchProduct(
  id: string,
): Promise<Product & { pricingTiers: PricingTier[] }> {
  const response = await fetch(`/api/admin/products/${id}`);
  if (!response.ok) throw new Error("Failed to fetch product");
  return response.json();
}

function formatCurrency(value: string | null) {
  if (!value) return "—";
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function ProductFormDialog({
  open,
  onOpenChange,
  productId,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string | null;
  categories: Category[];
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!productId;

  const [formData, setFormData] = React.useState<ProductFormData>({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    minimumOrderQuantity: 1,
    orderQuantityIncrement: 1,
    logoCost: "0",
    packagingCost: "0",
    images: [],
    pricingTiers: [{ minQuantity: 1, pricePerUnit: "0" }],
  });

  // Fetch existing product data when editing
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => fetchProduct(productId!),
    enabled: !!productId && open,
  });

  React.useEffect(() => {
    if (existingProduct) {
      setFormData({
        sku: existingProduct.sku,
        name: existingProduct.name,
        description: existingProduct.description,
        categoryId: existingProduct.categoryId || "",
        minimumOrderQuantity: existingProduct.minimumOrderQuantity,
        orderQuantityIncrement: existingProduct.orderQuantityIncrement,
        logoCost: existingProduct.logoCost,
        packagingCost: existingProduct.packagingCost,
        images: existingProduct.images || [],
        pricingTiers: existingProduct.pricingTiers?.length
          ? existingProduct.pricingTiers
          : [{ minQuantity: 1, pricePerUnit: "0" }],
      });
    } else if (!productId) {
      setFormData({
        sku: "",
        name: "",
        description: "",
        categoryId: "",
        minimumOrderQuantity: 1,
        orderQuantityIncrement: 1,
        logoCost: "0",
        packagingCost: "0",
        images: [],
        pricingTiers: [{ minQuantity: 1, pricePerUnit: "0" }],
      });
    }
  }, [existingProduct, productId, open]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ProductFormData>) =>
      updateProduct(productId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      categoryId: formData.categoryId || undefined,
    };
    if (isEditing) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit as ProductFormData);
    }
  };

  const addPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: [
        ...prev.pricingTiers,
        { minQuantity: 1, pricePerUnit: "0" },
      ],
    }));
  };

  const removePricingTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== index),
    }));
  };

  const updatePricingTier = (
    index: number,
    field: keyof PricingTier,
    value: number | string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier,
      ),
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Create Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update product details."
              : "Add a new product to your catalog."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingProduct && isEditing ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  placeholder="PROD-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Product description"
                rows={3}
                required
              />
            </div>

            <ImageUpload
              label="Product Image"
              value={formData.images[0] || ""}
              onChange={(url) =>
                setFormData((prev) => ({
                  ...prev,
                  images: url ? [url] : [],
                }))
              }
              description="Upload an image or paste a URL"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moq">Minimum Order Qty</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.minimumOrderQuantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minimumOrderQuantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="increment">Order Increment</Label>
                <Input
                  id="increment"
                  type="number"
                  value={formData.orderQuantityIncrement}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      orderQuantityIncrement: parseInt(e.target.value) || 1,
                    }))
                  }
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoCost">Logo Cost ($)</Label>
                <Input
                  id="logoCost"
                  type="number"
                  step="0.01"
                  value={formData.logoCost}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      logoCost: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagingCost">Packaging Cost ($)</Label>
                <Input
                  id="packagingCost"
                  type="number"
                  step="0.01"
                  value={formData.packagingCost}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      packagingCost: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pricing Tiers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPricingTier}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tier
                </Button>
              </div>
              <div className="space-y-2">
                {formData.pricingTiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Min Qty"
                        value={tier.minQuantity}
                        onChange={(e) =>
                          updatePricingTier(
                            index,
                            "minQuantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={1}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={tier.pricePerUnit}
                        onChange={(e) =>
                          updatePricingTier(
                            index,
                            "pricePerUnit",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    {formData.pricingTiers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePricingTier(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
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
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(
    null,
  );
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(
    null,
  );

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchCategories,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-products", page, debouncedSearch, categoryFilter],
    queryFn: () =>
      fetchProducts({
        page,
        search: debouncedSearch,
        categoryId: categoryFilter === "all" ? "" : categoryFilter,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeletingProduct(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setIsFormOpen(true);
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  const handleFormSuccess = () => {
    setEditingProductId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button
          onClick={() => {
            setEditingProductId(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoriesData?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load products. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {data?.pagination.total ?? 0} products total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch || categoryFilter
                  ? "Try adjusting your filters"
                  : "Create your first product"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{product.sku}</code>
                      </TableCell>
                      <TableCell>
                        {product.categoryName ? (
                          <Badge variant="secondary">
                            {product.categoryName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.priceRange ? (
                          <span>
                            {formatCurrency(product.priceRange.min)} -{" "}
                            {formatCurrency(product.priceRange.max)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            No pricing
                          </span>
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
                            <DropdownMenuItem
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(product.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingProduct(product)}
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

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === data.pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        productId={editingProductId}
        categories={categoriesData || []}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingProduct && deleteMutation.mutate(deletingProduct.id)
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
