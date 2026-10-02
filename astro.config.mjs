import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: process.env.SITE_URL || "https://example.com", // set SITE_URL once the domain exists
  trailingSlash: "always",
  build: { inlineStylesheets: "always" }, // one less render-blocking request on phones
  integrations: [sitemap()],
});
