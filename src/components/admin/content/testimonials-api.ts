import type { Testimonial, TestimonialFormData } from "./testimonials-types";

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const res = await fetch("/api/admin/testimonials");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export async function createTestimonial(data: TestimonialFormData) {
  const res = await fetch("/api/admin/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed");
  return res.json();
}

export async function updateTestimonial(
  id: string,
  data: Partial<TestimonialFormData>,
) {
  const res = await fetch(`/api/admin/testimonials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function deleteTestimonial(id: string) {
  const res = await fetch(`/api/admin/testimonials/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed");
}
