import { Button } from "@/components/ui/button";
import { Calendar, Check, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CartItemsList } from "./cart-items-list";
import { CustomerInfoForm } from "./customer-info-form";
import { ProductBrowserModal } from "./product-browser-modal";
import { QuoteSuccess } from "./quote-success";
import {
  CART_KEY,
  INITIAL_CUSTOMER_INFO,
  type CartItem,
  type Category,
  type CustomerInfo,
  type Product,
} from "./types";

interface QuoteBuilderProps {
  products: Product[];
  categories: Category[];
}

function enrichCartItems(items: CartItem[], products: Product[]): CartItem[] {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      ...item,
      image: product?.images?.[0],
      minimumOrderQuantity:
        item.minimumOrderQuantity || product?.minimumOrderQuantity || 1,
      orderQuantityIncrement:
        item.orderQuantityIncrement || product?.orderQuantityIncrement || 1,
    };
  });
}

function validateCustomerInfo(
  info: CustomerInfo,
  cartItems: CartItem[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!info.firstName.trim()) {
    errors.firstName = "First name is required";
  }
  if (!info.lastName.trim()) {
    errors.lastName = "Last name is required";
  }
  if (!info.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    errors.email = "Please enter a valid email";
  }
  if (!info.companyName.trim()) {
    errors.companyName = "Company name is required";
  }
  if (cartItems.length === 0) {
    errors.products = "Please add at least one product";
  }

  return errors;
}

export default function QuoteBuilder({
  products,
  categories,
}: QuoteBuilderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(
    INITIAL_CUSTOMER_INFO,
  );
  const [isProductBrowserOpen, setIsProductBrowserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Track if we're the source of the cart update to prevent infinite loops
  const isInternalUpdate = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCartItems(enrichCartItems(parsed, products));
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
  }, [products]);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    isInternalUpdate.current = true;
    window.dispatchEvent(new CustomEvent("quote-cart-updated"));
    // Reset flag after event loop to allow future external updates
    queueMicrotask(() => {
      isInternalUpdate.current = false;
    });
  }, [cartItems]);

  // Listen for external cart updates (from product catalog)
  useEffect(() => {
    const handleCartUpdate = () => {
      // Skip if this update originated from this component
      if (isInternalUpdate.current) return;

      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCartItems(enrichCartItems(parsed, products));
        } catch (e) {
          console.error("Failed to parse cart:", e);
        }
      }
    };

    window.addEventListener("quote-cart-updated", handleCartUpdate);
    return () =>
      window.removeEventListener("quote-cart-updated", handleCartUpdate);
  }, [products]);

  const addProduct = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + product.orderQuantityIncrement,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: product.minimumOrderQuantity,
          price: product.price,
          image: product.images?.[0],
          minimumOrderQuantity: product.minimumOrderQuantity,
          orderQuantityIncrement: product.orderQuantityIncrement,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const newQuantity = item.quantity + delta * item.orderQuantityIncrement;
        if (newQuantity < item.minimumOrderQuantity) return item;
        return { ...item, quantity: newQuantity };
      }),
    );
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new CustomEvent("quote-cart-updated"));
  }, []);

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft) {
      const errors = validateCustomerInfo(customerInfo, cartItems);
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customerInfo,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price || "0",
          })),
          status: isDraft ? "draft" : "pending",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit quote");
      }

      setSubmitSuccess(true);
      clearCart();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const hasData =
      cartItems.length > 0 || Object.values(customerInfo).some((v) => v.trim());

    if (hasData) {
      if (
        !confirm(
          "Are you sure you want to cancel? All entered information will be lost.",
        )
      ) {
        return;
      }
    }

    setCustomerInfo(INITIAL_CUSTOMER_INFO);
    clearCart();
  };

  if (submitSuccess) {
    return <QuoteSuccess />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Schedule Call Link */}
      <div className="flex justify-end">
        <a
          href="https://calendly.com/mike-greenlioninnovations/intro-to-gli"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
          style={{ textDecoration: "none" }}
        >
          <Calendar className="size-3.5" />
          Schedule a call instead
        </a>
      </div>

      {/* Customer Information */}
      <CustomerInfoForm
        customerInfo={customerInfo}
        onChange={setCustomerInfo}
        errors={validationErrors}
      />

      {/* Products */}
      <CartItemsList
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeProduct}
        onBrowseProducts={() => setIsProductBrowserOpen(true)}
        error={validationErrors.products}
      />

      {/* Footer Actions */}
      <div className="sticky bottom-0 mt-4 flex flex-col gap-4 border-t bg-background py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button
          variant="default"
          onClick={() => setIsProductBrowserOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Add more products
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save Draft
          </Button>
          <Button
            variant="default"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Confirm with Green Lion
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <p>{submitError}</p>
        </div>
      )}

      {/* Product Browser Modal */}
      <ProductBrowserModal
        isOpen={isProductBrowserOpen}
        onOpenChange={setIsProductBrowserOpen}
        products={products}
        categories={categories}
        cartItems={cartItems}
        onAddProduct={addProduct}
      />
    </div>
  );
}
