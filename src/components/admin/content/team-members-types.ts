export interface TeamMember {
  id: string;
  name: string;
  title: string;
  summaryHtml: string;
  photoUrl: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface TeamMemberFormData {
  name: string;
  title: string;
  summaryHtml: string;
  photoUrl: string;
  displayOrder: number;
}
