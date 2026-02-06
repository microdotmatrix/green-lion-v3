import { ImageIcon, Link2, Upload, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone } from "@/lib/uploadthing";

interface ProductImage {
  id: string;
  name: string;
  imageUrl: string;
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  categoryId?: string;
  label?: string;
  description?: string;
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ImageUpload({
  value,
  onChange,
  categoryId,
  label = "Image",
  description,
}: ImageUploadProps) {
  const [urlInput, setUrlInput] = React.useState("");
  const [urlError, setUrlError] = React.useState("");
  const [productImages, setProductImages] = React.useState<ProductImage[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false);
  const [fetchError, setFetchError] = React.useState("");

  // Fetch products with images when categoryId changes
  React.useEffect(() => {
    if (!categoryId) {
      setProductImages([]);
      setFetchError("");
      return;
    }

    const abortController = new AbortController();
    setIsLoadingProducts(true);
    setFetchError("");

    fetch(`/api/admin/products?categoryId=${categoryId}&limit=100`, {
      signal: abortController.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const products = data.products || [];
        const withImages = products
          .filter((p: any) => p.images && p.images.length > 0)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.images[0],
          }));
        setProductImages(withImages);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch products:", err);
          setFetchError("Failed to load products");
          setProductImages([]);
        }
      })
      .finally(() => setIsLoadingProducts(false));

    return () => abortController.abort();
  }, [categoryId]);

  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    if (!isValidImageUrl(trimmedUrl)) {
      setUrlError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setUrlError("");
    onChange(trimmedUrl);
    setUrlInput("");
  };

  const handleRemove = () => {
    onChange("");
  };

  const handleProductSelect = (productId: string) => {
    const product = productImages.find((p) => p.id === productId);
    if (product) {
      onChange(product.imageUrl);
    }
  };

  // If there's already a value, show the preview with remove option
  if (value) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="relative inline-block">
          <img
            src={value}
            alt="Selected"
            className="h-32 w-32 rounded-lg object-cover border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }

  // No value - show the upload options
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            URL
          </TabsTrigger>
          {categoryId && (
            <TabsTrigger value="products" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Products
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upload" className="mt-3">
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]?.ufsUrl) {
                onChange(res[0].ufsUrl);
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error);
              alert(`Upload failed: ${error.message}`);
            }}
            appearance={{
              container:
                "border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors ut-uploading:border-primary",
              label: "text-sm text-muted-foreground",
              allowedContent: "text-xs text-muted-foreground/75",
              button:
                "bg-primary text-primary-foreground hover:bg-primary/90 ut-uploading:bg-primary/70 px-4 py-2 rounded-md text-sm font-medium",
            }}
          />
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
              >
                Add
              </Button>
            </div>
            {urlError && <p className="text-xs text-destructive">{urlError}</p>}
          </div>
        </TabsContent>

        {categoryId && (
          <TabsContent value="products" className="mt-3">
            {isLoadingProducts ? (
              <p className="text-sm text-muted-foreground">
                Loading products...
              </p>
            ) : fetchError ? (
              <p className="text-sm text-destructive">{fetchError}</p>
            ) : productImages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No products with images in this category
              </p>
            ) : (
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product image" />
                </SelectTrigger>
                <SelectContent>
                  {productImages.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                        <span className="truncate max-w-[200px]">
                          {product.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </TabsContent>
        )}
      </Tabs>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
