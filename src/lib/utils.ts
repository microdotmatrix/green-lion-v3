import { clsx, type ClassValue } from "clsx";
import { twMerge } from "fluid-tailwindcss/tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to format canonical URL
export function formatCanonicalURL(url: string | URL) {
  let path = url.toString();
  const hasQueryParams = path.includes("?");
  // If there are query params, make sure the URL has no trailing slash
  if (hasQueryParams) {
    path = path.replace(/\/(?=\?)/, "");
  }
  // otherwise, canonical URL always has a trailing slash
  return path.replace(/\/?$/, hasQueryParams ? "" : "/");
}
