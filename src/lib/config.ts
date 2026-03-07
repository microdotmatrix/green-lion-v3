import { SITE_URL } from "astro:env/client";

export type Site = {
  website: string;
  author: string;
  profile: string;
  desc: string;
  title: string;
  ogImage?: string;
  lightAndDarkMode: boolean;
};

// Global site metadata
export const SITE: Site = {
  website: SITE_URL,
  author: "John Polinski",
  profile: "https://github.com/microdotmatrix",
  desc: "Green Lion Innovations is a Denver, CO based business strategy firm focused on product development and manufacturing.",
  title: "Green Lion Innovations",
  ogImage: "green-lion.jpg",
  lightAndDarkMode: true,
};

export type NavLinks = {
  link: string;
  title: string;
};

// Navigation menu links
export const NAV_LINKS: NavLinks[] = [
  { link: "products", title: "Products" },
  { link: "services", title: "Services" },
  { link: "case-studies", title: "Case Studies" },
  { link: "blog", title: "Blog" },
  { link: "about", title: "About" },
  { link: "contact", title: "Contact" },
];
