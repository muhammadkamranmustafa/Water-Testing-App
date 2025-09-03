import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/test-strip-results-analyser',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
