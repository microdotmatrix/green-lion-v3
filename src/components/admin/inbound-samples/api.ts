export async function sampleRequest<T>(
  path = "",
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/admin/inbound-samples${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Unable to load or save this sample.");
  return data as T;
}

export function sampleDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
