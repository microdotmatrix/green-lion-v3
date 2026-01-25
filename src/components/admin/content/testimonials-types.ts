export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  authorTitle: string | null;
  companyName: string;
  companyLink: string | null;
  companyLogo: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface TestimonialFormData {
  quote: string;
  author: string;
  authorTitle: string;
  companyName: string;
  companyLink: string;
  companyLogo: string;
  displayOrder: number;
}
