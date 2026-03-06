export interface Catalog {
  id: string;
  displayName: string;
  pdfUrl: string;
  isActive: boolean;
  notes: string | null;
  uploadedBy: string | null;
  createdAt: string; // ISO string from JSON serialization
  updatedAt: string;
}

export interface CatalogFormData {
  displayName: string;
  pdfUrl: string;
}
