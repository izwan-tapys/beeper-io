import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // This allows the dev server to accept connections from the tunnel domain
    allowedDevOrigins: ["*.loca.lt", "localhost:3001"],
  },
};

export default nextConfig;
