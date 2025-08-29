import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  basePath: "/test-strip-results-analyser",
};

export default nextConfig;
