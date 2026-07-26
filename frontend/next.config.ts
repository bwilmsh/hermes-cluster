import type { NextConfig } from "next";
import path from "path";

// npm workspaces hoist `next` to the monorepo root. Turbopack must treat that
// root as the project root, otherwise module resolution fails with
// "Next.js package not found" and HMR panics in a refresh loop.
const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
