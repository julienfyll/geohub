import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/geohub.db"],
  },
};

export default nextConfig;
