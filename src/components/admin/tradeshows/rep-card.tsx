import { ChevronDown, ChevronRight, Edit, QrCode, Trash2 } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type {
  CategoryOption,
  ProductOption,
  ServiceOption,
  TradeshowRepWithSelections,
} from "./types";

type RepCardProps = {
  rep: TradeshowRepWithSelections;
  categories: CategoryOption[];
  products: ProductOption[];
  services: ServiceOption[];
  onEdit: (rep: TradeshowRepWithSelections) => void;
  onDelete: (rep: TradeshowRepWithSelections) => void;
  onQrCode: (rep: TradeshowRepWithSelections) => void;
  onUpdateSelections: (
    repId: string,
    type: "categories" | "products" | "services",
    ids: string[],
  ) => void;
};

export const RepCard = ({
  rep,
  categories,
  products,
  services,
  onEdit,
  onDelete,
  onQrCode,
  onUpdateSelections,
}: RepCardProps) => {
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);
  const [servicesOpen, setServicesOpen] = React.useState(false);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newIds = checked
      ? [...rep.selectedCategoryIds, categoryId]
      : rep.selectedCategoryIds.filter((id) => id !== categoryId);
    onUpdateSelections(rep.id, "categories", newIds);
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    const newIds = checked
      ? [...rep.selectedProductIds, productId]
      : rep.selectedProductIds.filter((id) => id !== productId);
    onUpdateSelections(rep.id, "products", newIds);
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    const newIds = checked
      ? [...rep.selectedServiceIds, serviceId]
      : rep.selectedServiceIds.filter((id) => id !== serviceId);
    onUpdateSelections(rep.id, "services", newIds);
  };

  const handleSelectAllCategories = (checked: boolean) => {
    const newIds = checked ? categories.map((c) => c.id) : [];
    onUpdateSelections(rep.id, "categories", newIds);
  };

  const handleSelectAllProducts = (checked: boolean) => {
    const newIds = checked ? products.map((p) => p.id) : [];
    onUpdateSelections(rep.id, "products", newIds);
  };

  const handleSelectAllServices = (checked: boolean) => {
    const newIds = checked ? services.map((s) => s.id) : [];
    onUpdateSelections(rep.id, "services", newIds);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{rep.name}</h3>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="flex">
                <span className="w-20">Company:</span>
                <span className="text-foreground">{rep.company}</span>
              </div>
              <div className="flex">
                <span className="w-20">Phone:</span>
                <span className="text-foreground">{rep.phone}</span>
              </div>
              <div className="flex">
                <span className="w-20">Email:</span>
                <span className="text-foreground">{rep.email}</span>
              </div>
              <div className="flex">
                <span className="w-20">Status:</span>
                <Badge variant={rep.active ? "default" : "secondary"}>
                  {rep.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onQrCode(rep)}
              title="View QR Code"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(rep)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(rep)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 h-auto font-normal hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  {categoriesOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">Categories for {rep.name}</span>
                </span>
                <span className="text-muted-foreground text-sm">
                  {rep.selectedCategoryIds.length} / {categories.length}{" "}
                  selected
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 py-2 border-t">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id={`${rep.id}-all-categories`}
                    checked={
                      rep.selectedCategoryIds.length === categories.length &&
                      categories.length > 0
                    }
                    onCheckedChange={handleSelectAllCategories}
                  />
                  <label
                    htmlFor={`${rep.id}-all-categories`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All Categories
                  </label>
                </div>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${rep.id}-category-${category.id}`}
                      checked={rep.selectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(category.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`${rep.id}-category-${category.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 h-auto font-normal hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  {productsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">Products for {rep.name}</span>
                </span>
                <span className="text-muted-foreground text-sm">
                  {rep.selectedProductIds.length} / {products.length} selected
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 py-2 border-t max-h-80 overflow-y-auto">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id={`${rep.id}-all-products`}
                    checked={
                      rep.selectedProductIds.length === products.length &&
                      products.length > 0
                    }
                    onCheckedChange={handleSelectAllProducts}
                  />
                  <label
                    htmlFor={`${rep.id}-all-products`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All Products
                  </label>
                </div>
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${rep.id}-product-${product.id}`}
                      checked={rep.selectedProductIds.includes(product.id)}
                      onCheckedChange={(checked) =>
                        handleProductToggle(product.id, checked === true)
                      }
                    />
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-6 h-6 object-contain rounded"
                      />
                    )}
                    <label
                      htmlFor={`${rep.id}-product-${product.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {product.name}{" "}
                      <span className="text-muted-foreground">
                        ({product.sku})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 h-auto font-normal hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  {servicesOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">Services for {rep.name}</span>
                </span>
                <span className="text-muted-foreground text-sm">
                  {rep.selectedServiceIds.length} / {services.length} selected
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 py-2 border-t">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id={`${rep.id}-all-services`}
                    checked={
                      rep.selectedServiceIds.length === services.length &&
                      services.length > 0
                    }
                    onCheckedChange={handleSelectAllServices}
                  />
                  <label
                    htmlFor={`${rep.id}-all-services`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All Services
                  </label>
                </div>
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${rep.id}-service-${service.id}`}
                      checked={rep.selectedServiceIds.includes(service.id)}
                      onCheckedChange={(checked) =>
                        handleServiceToggle(service.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`${rep.id}-service-${service.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {service.title}
                    </label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};
