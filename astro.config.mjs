// @ts-check
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

const site = process.env.SITE_URL ?? "https://greenlioninnovations.com";

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    sitemap(),
  ],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "@tiptap/react",
        "@tiptap/react/menus",
        "@tiptap/starter-kit",
        "@tiptap/extension-file-handler",
        "@tiptap/extension-image",
        "@tiptap/extension-link",
        "@tiptap/extension-placeholder",
      ],
    },
  },

  adapter: netlify(),
  output: "server",
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: "server", access: "public" }),
      BETTER_AUTH_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      BETTER_AUTH_URL: envField.string({ context: "server", access: "public" }),
      RESEND_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      SITE_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "https://greenlioninnovations.com",
      }),
    },
  },
});
