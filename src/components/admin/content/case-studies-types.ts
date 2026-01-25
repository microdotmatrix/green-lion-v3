export interface CaseStudy {
  id: string;
  productName: string;
  brandName: string;
  description: string;
  image: string;
  externalLink: string;
  displayOrder: number;
  createdAt: string;
}

export interface CaseStudyFormData {
  productName: string;
  brandName: string;
  description: string;
  image: string;
  externalLink: string;
  displayOrder: number;
}
