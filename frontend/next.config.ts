import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the Node.js deprecation warning emitted by @supabase/supabase-js
  // until we can move the project to Node 22. Pure build-time noise; doesn't
  // affect functionality.
  turbopack: {},
};

export default nextConfig;