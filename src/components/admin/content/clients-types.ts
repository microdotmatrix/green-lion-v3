export interface ClientLogo {
  id: string;
  companyName: string;
  logoUrl: string;
  externalLink: string;
  displayOrder: number;
  featuredOnHomepage: boolean;
  createdAt: string;
}

export interface ClientFormData {
  companyName: string;
  logoUrl: string;
  externalLink: string;
  displayOrder: number;
  featuredOnHomepage: boolean;
}
