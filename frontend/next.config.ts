import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
  // Tell Turbopack to resolve modules from the frontend workspace itself,
  // not the monorepo root. This prevents the "inferred workspace root"
  // warning and ensures deps in frontend/node_modules are found.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
