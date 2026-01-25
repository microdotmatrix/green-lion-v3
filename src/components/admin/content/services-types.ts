export interface Service {
  id: string;
  title: string;
  description: string;
  features: string[];
  iconName: string | null;
  imageUrl: string | null;
  googleFormUrl: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface ServiceFormData {
  title: string;
  description: string;
  features: string[];
  iconName: string;
  imageUrl: string;
  googleFormUrl: string;
  displayOrder: number;
}
