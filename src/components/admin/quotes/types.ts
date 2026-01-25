export interface Quote {
  id: string;
  quoteNumber: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  companyName: string;
  title: string;
  estimatedTotal: string | null;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface QuoteItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  customizations: Record<string, unknown>;
  lineTotal: string;
  productName: string;
  productSku: string;
  productImages: string[];
  productDescription: string;
  readableCustomizations: Record<string, string>;
}

export interface QuoteDetail extends Quote {
  items: QuoteItem[];
}

export interface QuotesResponse {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
}
