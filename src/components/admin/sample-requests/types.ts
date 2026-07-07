export interface SampleRequestListItem {
  id: string;
  requestNumber: string | null;
  recipientName: string;
  companyName: string | null;
  city: string;
  state: string | null;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface SampleRequestItem {
  id: string;
  sampleRequestId: string;
  productId: string | null;
  sku: string;
  productName: string;
  capacity: string | null;
  quantity: number;
  createdAt: string;
}

export interface SampleRequestDetail {
  id: string;
  requestNumber: string | null;
  recipientName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: SampleRequestItem[];
}

export interface SampleRequestsResponse {
  sampleRequests: SampleRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
}

export interface SampleRequestItemFormData {
  productId: string;
  sku: string;
  productName: string;
  capacity: string;
  quantity: number;
}

export interface SampleRequestFormData {
  recipientName: string;
  companyName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
  items: SampleRequestItemFormData[];
}

export interface ProductSearchResult {
  id: string;
  sku: string;
  name: string;
  categoryName: string | null;
}

export interface ProductAttributeAssignment {
  id: string;
  attributeId: string;
  attributeName: string;
  attributeType: string;
  supportedOptions: string[] | null;
  allOptions: string[] | null;
}
