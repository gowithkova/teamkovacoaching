import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is an authenticated, per-operator dashboard with no cacheable
  // static content — every page depends on live client-side data, so
  // Cache Components' prerendering (which requires Suspense boundaries
  // around any dynamic API) has nothing to offer here.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
