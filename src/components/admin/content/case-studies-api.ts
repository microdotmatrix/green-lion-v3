import type { CaseStudy, CaseStudyFormData } from "./case-studies-types";

export async function fetchCaseStudies(): Promise<CaseStudy[]> {
  const res = await fetch("/api/admin/case-studies");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createCaseStudy(data: CaseStudyFormData) {
  const res = await fetch("/api/admin/case-studies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
  return res.json();
}

export async function updateCaseStudy(
  id: string,
  data: Partial<CaseStudyFormData>,
) {
  const res = await fetch(`/api/admin/case-studies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
  return res.json();
}

export async function deleteCaseStudy(id: string) {
  const res = await fetch(`/api/admin/case-studies/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete");
}
