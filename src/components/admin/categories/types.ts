export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  createdAt?: string;
  productsCount?: number;
}

export interface CategoryFormData {
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
}

export interface Attribute {
  id: string;
  name: string;
  attributeType: string;
  options: string[] | null;
}

export interface CategoryAttribute {
  id: string;
  attributeId: string;
  displayOrder: number;
  activeOptions: string[] | null;
  attributeName: string;
  attributeType: string;
  allOptions: string[] | null;
}
