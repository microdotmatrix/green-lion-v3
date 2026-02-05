// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
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
