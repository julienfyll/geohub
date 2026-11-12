import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/geohub.db"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/play/borderpass",
        destination: "/play/borderpath",
        permanent: true,
      },
      {
        source: "/api/games/borderpass/:path*",
        destination: "/api/games/borderpath/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
