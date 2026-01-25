export interface TradeshowRep {
  id: string;
  name: string;
  email: string;
  phone: string;
  slug: string;
  company: string;
  active: boolean;
  createdAt: string;
  leadCount: number;
}

export interface TradeshowRepWithSelections extends TradeshowRep {
  selectedCategoryIds: string[];
  selectedProductIds: string[];
  selectedServiceIds: string[];
}

export interface Lead {
  id: string;
  repId: string;
  leadName: string;
  leadCompany: string | null;
  contactMethod: string;
  selectedCategoryIds: string[];
  selectedProductIds: string[];
  selectedServiceIds: string[];
  messageTemplate: string | null;
  createdAt: string;
}

export interface LeadWithRep extends Lead {
  repName: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  images: string[];
  categoryId: string | null;
}

export interface ServiceOption {
  id: string;
  title: string;
  imageUrl: string | null;
  iconName: string | null;
}

export interface TradeshowData {
  reps: TradeshowRepWithSelections[];
  categories: CategoryOption[];
  products: ProductOption[];
  services: ServiceOption[];
  leads: LeadWithRep[];
}

export interface RepFormData {
  name: string;
  email: string;
  phone: string;
  slug: string;
  company: string;
  active: boolean;
}

export type TradeshowRepDetail = TradeshowRep & { leads: Lead[] };
