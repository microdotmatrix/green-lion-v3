export type AttributeType = "text" | "number" | "boolean" | "select" | "multi_select";

export interface Attribute {
  id: string;
  name: string;
  attributeType: AttributeType;
  options: string[] | null;
  createdAt: string;
  categoryCount: number;
  productCount: number;
}

export interface AttributeFormData {
  name: string;
  attributeType: AttributeType;
  options: string[];
}
