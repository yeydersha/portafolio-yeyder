import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      // El loader de Tailwind se aplica a todo CSS, pero se omite `as` para que
      // Turbopack siga tratando `*.module.css` como CSS Module con clases locales.
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
};

export default nextConfig;