import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@codeaudit/db"],
  experimental: {
    // Opt into React 19 features
  },
};

export default nextConfig;
