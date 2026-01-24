import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Check,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  images: string[];
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
  categoryId: string | null;
  price: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: string | null;
  image?: string;
  minimumOrderQuantity: number;
  orderQuantityIncrement: number;
}

interface QuoteBuilderProps {
  products: Product[];
  categories: Category[];
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  title: string;
}

const CART_KEY = "quoteCart";

export default function QuoteBuilder({
  products,
  categories,
}: QuoteBuilderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    title: "",
  });
  const [isProductBrowserOpen, setIsProductBrowserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with product data to get images and increment info
        const enrichedItems = parsed.map((item: CartItem) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            ...item,
            image: product?.images?.[0],
            minimumOrderQuantity:
              item.minimumOrderQuantity || product?.minimumOrderQuantity || 1,
            orderQuantityIncrement:
              item.orderQuantityIncrement ||
              product?.orderQuantityIncrement ||
              1,
          };
        });
        setCartItems(enrichedItems);
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
  }, [products]);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    window.dispatchEvent(new CustomEvent("quote-cart-updated"));
  }, [cartItems]);

  // Listen for external cart updates (from product catalog)
  useEffect(() => {
    const handleCartUpdate = () => {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const enrichedItems = parsed.map((item: CartItem) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              ...item,
              image: product?.images?.[0],
              minimumOrderQuantity:
                item.minimumOrderQuantity || product?.minimumOrderQuantity || 1,
              orderQuantityIncrement:
                item.orderQuantityIncrement ||
                product?.orderQuantityIncrement ||
                1,
            };
          });
          setCartItems(enrichedItems);
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

  const calculateLineTotal = (item: CartItem) => {
    if (!item.price) return null;
    return (parseFloat(item.price) * item.quantity).toFixed(2);
  };

  const calculateEstimatedTotal = () => {
    return cartItems
      .reduce((sum, item) => {
        if (!item.price) return sum;
        return sum + parseFloat(item.price) * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!customerInfo.firstName.trim())
      errors.firstName = "First name is required";
    if (!customerInfo.lastName.trim())
      errors.lastName = "Last name is required";
    if (!customerInfo.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!customerInfo.companyName.trim())
      errors.companyName = "Company name is required";
    if (cartItems.length === 0)
      errors.products = "Please add at least one product";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validate()) return;

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

      const result = await response.json();
      setSubmitSuccess(true);
      setCartItems([]);
      localStorage.removeItem(CART_KEY);
      window.dispatchEvent(new CustomEvent("quote-cart-updated"));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      cartItems.length > 0 ||
      Object.values(customerInfo).some((v) => v.trim())
    ) {
      if (
        !confirm(
          "Are you sure you want to cancel? All entered information will be lost.",
        )
      ) {
        return;
      }
    }
    setCartItems([]);
    setCustomerInfo({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      title: "",
    });
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new CustomEvent("quote-cart-updated"));
  };

  if (submitSuccess) {
    return (
      <div className="quote-success">
        <div className="success-icon">
          <Check size={48} />
        </div>
        <h2>Quote Request Submitted!</h2>
        <p>
          Thank you for your interest. Our team will review your request and get
          back to you within 1-2 business days.
        </p>
        <Button onClick={() => (window.location.href = "/products")}>
          Continue Browsing
        </Button>
        <style>{`
          .quote-success {
            text-align: center;
            padding: 4rem 2rem;
            max-width: 32rem;
            margin: 0 auto;
          }
          .success-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 5rem;
            height: 5rem;
            border-radius: 50%;
            background: var(--primary);
            color: var(--primary-foreground);
            margin-bottom: 1.5rem;
          }
          .quote-success h2 {
            margin-bottom: 1rem;
          }
          .quote-success p {
            color: var(--muted-foreground);
            margin-bottom: 2rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="quote-builder">
      {/* Schedule Call Link */}
      <div className="schedule-call">
        <a href="/contact" className="schedule-call-link">
          <Calendar size={16} />
          Schedule a call instead
        </a>
      </div>

      {/* Customer Information */}
      <div className="quote-card">
        <h2 className="card-title">Customer Information</h2>
        <p className="card-subtitle">
          Fields marked with <span className="required">*</span> are required
        </p>

        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="firstName">
              First Name <span className="required">*</span>
            </Label>
            <Input
              id="firstName"
              value={customerInfo.firstName}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, firstName: e.target.value })
              }
              placeholder="John"
              className={validationErrors.firstName ? "error" : ""}
            />
            {validationErrors.firstName && (
              <span className="error-text">{validationErrors.firstName}</span>
            )}
          </div>

          <div className="form-field">
            <Label htmlFor="lastName">
              Last Name <span className="required">*</span>
            </Label>
            <Input
              id="lastName"
              value={customerInfo.lastName}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, lastName: e.target.value })
              }
              placeholder="Doe"
              className={validationErrors.lastName ? "error" : ""}
            />
            {validationErrors.lastName && (
              <span className="error-text">{validationErrors.lastName}</span>
            )}
          </div>

          <div className="form-field">
            <Label htmlFor="email">
              Email <span className="required">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={customerInfo.email}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, email: e.target.value })
              }
              placeholder="john.doe@company.com"
              className={validationErrors.email ? "error" : ""}
            />
            {validationErrors.email && (
              <span className="error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-field">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, phone: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="form-field">
            <Label htmlFor="companyName">
              Company Name <span className="required">*</span>
            </Label>
            <Input
              id="companyName"
              value={customerInfo.companyName}
              onChange={(e) =>
                setCustomerInfo({
                  ...customerInfo,
                  companyName: e.target.value,
                })
              }
              placeholder="ACME Corporation"
              className={validationErrors.companyName ? "error" : ""}
            />
            {validationErrors.companyName && (
              <span className="error-text">{validationErrors.companyName}</span>
            )}
          </div>

          <div className="form-field">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={customerInfo.title}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, title: e.target.value })
              }
              placeholder="Procurement Manager"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="quote-card">
        <div className="card-header">
          <h2 className="card-title">Products</h2>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsProductBrowserOpen(true)}
          >
            <Plus size={16} />
            Add more products
          </Button>
        </div>

        {validationErrors.products && (
          <div className="products-error">{validationErrors.products}</div>
        )}

        {cartItems.length === 0 ? (
          <div className="empty-products">
            <div className="empty-icon">
              <ShoppingBag size={40} />
            </div>
            <p>No products added yet</p>
            <Button
              variant="outline"
              onClick={() => setIsProductBrowserOpen(true)}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.productId} className="cart-item">
                <div className="item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="image-placeholder">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div className="item-details">
                  <span className="item-sku">{item.sku}</span>
                  <h4 className="item-name">{item.name}</h4>
                  {item.price && (
                    <span className="item-price">
                      ${parseFloat(item.price).toFixed(2)} / unit
                    </span>
                  )}
                </div>
                <div className="item-quantity">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.productId, -1)}
                    disabled={item.quantity <= item.minimumOrderQuantity}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">
                    {item.quantity.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.productId, 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="item-total">
                  {calculateLineTotal(item) ? (
                    <span>${calculateLineTotal(item)}</span>
                  ) : (
                    <span className="no-price">Price on request</span>
                  )}
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeProduct(item.productId)}
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="cart-summary">
            <div className="summary-row">
              <span>Estimated Total:</span>
              <span className="total-value">${calculateEstimatedTotal()}</span>
            </div>
            <p className="summary-note">
              Final pricing will be confirmed in your quote
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="quote-footer">
        <Button
          variant="default"
          onClick={() => setIsProductBrowserOpen(true)}
          className="add-products-btn"
        >
          <Plus size={16} />
          Add more products
        </Button>

        <div className="footer-actions">
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
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            Save Draft
          </Button>
          <Button
            variant="default"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            Confirm with Green Lion
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="submit-error">
          <p>{submitError}</p>
        </div>
      )}

      {/* Product Browser Modal */}
      <ProductBrowserModal
        isOpen={isProductBrowserOpen}
        onClose={() => setIsProductBrowserOpen(false)}
        products={products}
        categories={categories}
        cartItems={cartItems}
        onAddProduct={addProduct}
      />

      <style>{`
        .quote-builder {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .schedule-call {
          display: flex;
          justify-content: flex-end;
        }

        .schedule-call-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          color: var(--foreground);
          text-decoration: none;
          transition: all 150ms ease;
        }

        .schedule-call-link:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .quote-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: var(--muted-foreground);
          margin: 0 0 1.5rem;
        }

        .required {
          color: var(--destructive);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-field label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-field input {
          padding: 0.625rem 0.875rem;
        }

        .form-field input.error {
          border-color: var(--destructive);
        }

        .error-text {
          font-size: 0.75rem;
          color: var(--destructive);
        }

        .products-error {
          background: color-mix(in srgb, var(--destructive) 10%, transparent);
          border: 1px solid var(--destructive);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: var(--destructive);
        }

        .empty-products {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
        }

        .empty-icon {
          color: var(--muted-foreground);
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        .empty-products p {
          color: var(--muted-foreground);
          margin-bottom: 1rem;
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 4rem 1fr auto auto auto;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--secondary);
          border-radius: var(--radius-md);
        }

        @media (max-width: 640px) {
          .cart-item {
            grid-template-columns: 4rem 1fr auto;
            grid-template-rows: auto auto;
          }
          .item-quantity,
          .item-total {
            grid-row: 2;
          }
          .remove-btn {
            grid-row: 1;
          }
        }

        .item-image {
          width: 4rem;
          height: 4rem;
          background: #fff;
          border-radius: var(--radius-sm);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .image-placeholder {
          color: var(--muted-foreground);
          opacity: 0.3;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .item-sku {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary);
          text-transform: uppercase;
        }

        .item-name {
          font-size: 0.9375rem;
          font-weight: 600;
          margin: 0;
        }

        .item-price {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
        }

        .item-quantity {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .qty-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--background);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .qty-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qty-value {
          min-width: 3rem;
          text-align: center;
          font-weight: 500;
        }

        .item-total {
          font-weight: 600;
          min-width: 5rem;
          text-align: right;
        }

        .no-price {
          font-size: 0.75rem;
          color: var(--muted-foreground);
          font-weight: 400;
        }

        .remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border: none;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--muted-foreground);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .remove-btn:hover {
          background: color-mix(in srgb, var(--destructive) 10%, transparent);
          color: var(--destructive);
        }

        .cart-summary {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.125rem;
        }

        .total-value {
          font-weight: 700;
          font-size: 1.25rem;
        }

        .summary-note {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
          margin-top: 0.5rem;
        }

        .quote-footer {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          position: sticky;
          bottom: 0;
          background: var(--background);
          border-top: 1px solid var(--border);
          margin-top: 1rem;
        }

        .footer-actions {
          display: flex;
          gap: 0.75rem;
        }

        @media (max-width: 640px) {
          .quote-footer {
            flex-direction: column;
          }
          .add-products-btn {
            width: 100%;
          }
          .footer-actions {
            width: 100%;
            flex-direction: column;
          }
          .footer-actions button {
            width: 100%;
          }
        }

        .submit-error {
          background: color-mix(in srgb, var(--destructive) 10%, transparent);
          border: 1px solid var(--destructive);
          border-radius: var(--radius-md);
          padding: 1rem;
          color: var(--destructive);
        }
      `}</style>
    </div>
  );
}

// Product Browser Modal Component
function ProductBrowserModal({
  isOpen,
  onClose,
  products,
  categories,
  cartItems,
  onAddProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  cartItems: CartItem[];
  onAddProduct: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isInCart = (productId: string) =>
    cartItems.some((item) => item.productId === productId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="product-browser-dialog">
        <DialogHeader>
          <DialogTitle>Browse Products</DialogTitle>
        </DialogHeader>

        <div className="browser-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setSearch("")}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="category-tabs">
          <button
            type="button"
            className={`category-tab ${!selectedCategory ? "active" : ""}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="browser-results">
          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <p>No products found</p>
            </div>
          ) : (
            <div className="products-list">
              {filteredProducts.map((product) => (
                <div key={product.id} className="browser-product">
                  <div className="product-image">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="image-placeholder">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <span className="product-sku">{product.sku}</span>
                    <h4 className="product-name">{product.name}</h4>
                    <div className="product-meta">
                      {product.price && (
                        <span className="product-price">
                          From ${parseFloat(product.price).toFixed(2)}
                        </span>
                      )}
                      <span className="product-moq">
                        MOQ: {product.minimumOrderQuantity.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isInCart(product.id) ? "secondary" : "default"}
                    onClick={() => onAddProduct(product)}
                  >
                    {isInCart(product.id) ? (
                      <>
                        <Check size={14} />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <style>{`
          .product-browser-dialog {
            max-width: 48rem;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
          }

          .browser-search {
            position: relative;
            margin-bottom: 1rem;
          }

          .browser-search .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--muted-foreground);
          }

          .browser-search .search-input {
            width: 100%;
            padding: 0.75rem 2.5rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            background: var(--background);
          }

          .browser-search .search-input:focus {
            outline: none;
            border-color: var(--primary);
          }

          .browser-search .clear-btn {
            position: absolute;
            right: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            padding: 0.25rem;
            border: none;
            background: none;
            color: var(--muted-foreground);
            cursor: pointer;
          }

          .category-tabs {
            display: flex;
            gap: 0.5rem;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
          }

          .category-tab {
            flex-shrink: 0;
            padding: 0.5rem 1rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--background);
            font-size: 0.8125rem;
            cursor: pointer;
            transition: all 150ms ease;
          }

          .category-tab:hover {
            border-color: var(--primary);
          }

          .category-tab.active {
            background: var(--primary);
            border-color: var(--primary);
            color: var(--primary-foreground);
          }

          .browser-results {
            flex: 1;
            overflow-y: auto;
            min-height: 20rem;
          }

          .no-results {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 10rem;
            color: var(--muted-foreground);
          }

          .products-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .browser-product {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: var(--secondary);
            border-radius: var(--radius-md);
          }

          .browser-product .product-image {
            width: 3.5rem;
            height: 3.5rem;
            background: #fff;
            border-radius: var(--radius-sm);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .browser-product .product-image img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .browser-product .image-placeholder {
            color: var(--muted-foreground);
            opacity: 0.3;
          }

          .browser-product .product-info {
            flex: 1;
            min-width: 0;
          }

          .browser-product .product-sku {
            font-size: 0.6875rem;
            font-weight: 600;
            color: var(--primary);
            text-transform: uppercase;
          }

          .browser-product .product-name {
            font-size: 0.875rem;
            font-weight: 600;
            margin: 0.125rem 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .browser-product .product-meta {
            display: flex;
            gap: 0.75rem;
            font-size: 0.75rem;
            color: var(--muted-foreground);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
