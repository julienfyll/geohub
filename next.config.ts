import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure server-only packages are not bundled into the client
  serverExternalPackages: ["node:sqlite"],
};

export default nextConfig;
