import {
  ChevronDown,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  images: string[];
  minimumOrderQuantity: number;
  price: string | null;
}

interface AttributeFilter {
  id: string;
  name: string;
  type: string;
  options: string[];
}

interface ProductSearchProps {
  products: Product[];
  categoryName: string;
  categorySlug: string;
  attributeFilters?: AttributeFilter[];
  productAttributeMap?: Record<string, Record<string, string[]>>;
}

type SortField = "name" | "sku" | "price";
type SortDir = "asc" | "desc";

export default function ProductSearch({
  products,
  categorySlug,
  attributeFilters = [],
  productAttributeMap = {},
}: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, Set<string>>
  >({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const hasActiveFilters = Object.values(selectedFilters).some(
    (set) => set.size > 0,
  );

  const toggleAttributeValue = (attributeId: string, value: string) => {
    setSelectedFilters((prev) => {
      const currentSet = prev[attributeId] || new Set<string>();
      const newSet = new Set(currentSet);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [attributeId]: newSet };
    });
  };

  const toggleSection = (attributeId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(attributeId)) {
        newSet.delete(attributeId);
      } else {
        newSet.add(attributeId);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower),
      );
    }

    // Filter by attributes (AND logic between attributes, OR within attribute values)
    for (const [attributeId, selectedValues] of Object.entries(
      selectedFilters,
    )) {
      if (selectedValues.size === 0) continue;

      result = result.filter((p) => {
        const productAttrs = productAttributeMap[p.id];
        if (!productAttrs) return false;

        const productOptions = productAttrs[attributeId] || [];
        // Product must have at least one of the selected values
        return [...selectedValues].some((val) => productOptions.includes(val));
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "sku":
          comparison = a.sku.localeCompare(b.sku);
          break;
        case "price":
          const priceA = a.price ? parseFloat(a.price) : Infinity;
          const priceB = b.price ? parseFloat(b.price) : Infinity;
          comparison = priceA - priceB;
          break;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    products,
    search,
    sortField,
    sortDir,
    selectedFilters,
    productAttributeMap,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="product-search-container">
      {/* Search and Filter Bar */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by name, SKU, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="clear-search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sort-controls">
          <span className="sort-label">Sort by:</span>
          {(["name", "sku", "price"] as SortField[]).map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => toggleSort(field)}
              className={`sort-btn ${sortField === field ? "active" : ""}`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field &&
                (sortDir === "asc" ? (
                  <SortAsc size={14} />
                ) : (
                  <SortDesc size={14} />
                ))}
            </button>
          ))}
        </div>
      </div>

      {/* Attribute Filters */}
      {attributeFilters.length > 0 && (
        <div className="attribute-filters">
          <button
            type="button"
            className={`filter-toggle ${filtersExpanded ? "expanded" : ""} ${hasActiveFilters ? "has-active" : ""}`}
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <Filter size={16} />
            Filter by Attributes
            {hasActiveFilters && (
              <span className="active-count">
                {Object.values(selectedFilters).reduce(
                  (sum, set) => sum + set.size,
                  0,
                )}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`chevron ${filtersExpanded ? "rotated" : ""}`}
            />
          </button>

          {filtersExpanded && (
            <div className="filter-groups">
              {attributeFilters.map((attr) => (
                <div key={attr.id} className="filter-group">
                  <button
                    type="button"
                    className={`filter-group-header ${expandedSections.has(attr.id) ? "expanded" : ""}`}
                    onClick={() => toggleSection(attr.id)}
                  >
                    {attr.name}
                    <ChevronDown
                      size={14}
                      className={`chevron ${expandedSections.has(attr.id) ? "rotated" : ""}`}
                    />
                  </button>

                  {expandedSections.has(attr.id) && (
                    <div className="filter-options">
                      {attr.options.map((option) => {
                        const isSelected =
                          selectedFilters[attr.id]?.has(option) || false;
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`filter-option ${isSelected ? "active" : ""}`}
                            onClick={() =>
                              toggleAttributeValue(attr.id, option)
                            }
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {hasActiveFilters && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={clearAllFilters}
                >
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="results-count">
        {filteredProducts.length}{" "}
        {filteredProducts.length === 1 ? "product" : "products"} found
        {hasActiveFilters && " (filtered)"}
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <article key={product.id} className="product-card">
            <a
              href={`/products/${categorySlug}/${product.sku.toLowerCase()}`}
              className="product-image-link"
            >
              <div className="product-image">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="product-placeholder">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
              </div>
            </a>

            <div className="product-content">
              <span className="product-sku">{product.sku}</span>
              <a
                href={`/products/${categorySlug}/${product.sku.toLowerCase()}`}
                className="product-name-link"
              >
                <h4 className="product-name">{product.name}</h4>
              </a>
              <p className="product-description">{product.description}</p>

              <div className="product-meta">
                {product.price && (
                  <span className="product-price">
                    From{" "}
                    <strong>${parseFloat(product.price).toFixed(2)}</strong>
                  </span>
                )}
                <span className="product-moq">
                  MOQ: {product.minimumOrderQuantity.toLocaleString()}
                </span>
              </div>

              <a
                href={`/products/${categorySlug}/${product.sku.toLowerCase()}`}
                className="view-details-btn"
              >
                View Details
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </article>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <p>No products match your search.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="clear-search-btn"
          >
            Clear search
          </button>
        </div>
      )}

      <style>{`
        .product-search-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .search-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--secondary);
          border-radius: var(--radius-lg);
        }

        @media (min-width: 768px) {
          .search-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          max-width: 32rem;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted-foreground);
        }

        .search-input {
          width: 100%;
          padding: 0.625rem 2.5rem 0.625rem 2.5rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          color: var(--foreground);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent);
        }

        .clear-search {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.25rem;
          background: none;
          border: none;
          color: var(--muted-foreground);
          cursor: pointer;
          border-radius: var(--radius-sm);
        }

        .clear-search:hover {
          color: var(--foreground);
          background: var(--muted);
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-label {
          font-size: 0.875rem;
          color: var(--muted-foreground);
        }

        .sort-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          color: var(--muted-foreground);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .sort-btn:hover {
          border-color: var(--primary);
          color: var(--foreground);
        }

        .sort-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--primary-foreground);
        }

        .results-count {
          font-size: 0.875rem;
          color: var(--muted-foreground);
        }

        /* Attribute Filters */
        .attribute-filters {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .filter-toggle:hover {
          border-color: var(--primary);
        }

        .filter-toggle.expanded {
          border-color: var(--primary);
          background: color-mix(in srgb, var(--primary) 10%, var(--secondary));
        }

        .filter-toggle.has-active {
          border-color: var(--primary);
        }

        .filter-toggle .chevron {
          margin-left: auto;
          transition: transform 200ms ease;
        }

        .filter-toggle .chevron.rotated {
          transform: rotate(180deg);
        }

        .filter-toggle .active-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.25rem;
          height: 1.25rem;
          padding: 0 0.375rem;
          background: var(--primary);
          color: var(--primary-foreground);
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
        }

        .filter-groups {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--foreground);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .filter-group-header:hover {
          border-color: var(--primary);
        }

        .filter-group-header.expanded {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-color: var(--primary);
          background: color-mix(in srgb, var(--primary) 5%, var(--background));
        }

        .filter-group-header .chevron {
          transition: transform 200ms ease;
        }

        .filter-group-header .chevron.rotated {
          transform: rotate(180deg);
        }

        .filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          padding: 0.75rem;
          background: var(--background);
          border: 1px solid var(--primary);
          border-top: none;
          border-bottom-left-radius: var(--radius-sm);
          border-bottom-right-radius: var(--radius-sm);
        }

        .filter-option {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
          background: var(--secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          color: var(--muted-foreground);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .filter-option:hover {
          border-color: var(--primary);
          color: var(--foreground);
        }

        .filter-option.active {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--primary-foreground);
        }

        .clear-filters-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          margin-top: 0.25rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          color: var(--muted-foreground);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .clear-filters-btn:hover {
          border-color: var(--destructive);
          color: var(--destructive);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .product-card {
          display: flex;
          flex-direction: column;
          background: var(--card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .product-card:hover {
          border-color: color-mix(in srgb, var(--primary) 30%, transparent);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 10%, transparent);
        }

        .product-image {
          aspect-ratio: 1;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: hidden;
        }

        .product-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .product-placeholder {
          color: var(--muted-foreground);
          opacity: 0.3;
        }

        .product-content {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          flex: 1;
        }

        .product-sku {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-description {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-meta {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
        }

        .product-price {
          font-size: 0.875rem;
          color: var(--primary);
        }

        .product-price strong {
          font-weight: 700;
        }

        .product-moq {
          font-size: 0.75rem;
          color: var(--muted-foreground);
        }

        .view-details-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          margin-top: auto;
          background: var(--primary);
          color: var(--primary-foreground);
          border-radius: var(--radius-md);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 200ms ease, transform 100ms ease;
        }

        .view-details-btn:hover {
          background: oklch(from var(--primary) l c calc(h * 1.3));
        }

        .view-details-btn:active {
          transform: scale(0.98);
        }

        .product-image-link {
          display: block;
          text-decoration: none;
        }

        .product-name-link {
          text-decoration: none;
          color: inherit;
        }

        .product-name-link:hover .product-name {
          color: var(--primary);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--muted-foreground);
        }

        .clear-search-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: var(--secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .clear-search-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
