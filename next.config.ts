import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Move allowedDevOrigins to top level (not inside experimental)
  // Note: This is mainly for local development with tunnels
  allowedDevOrigins: ["*.loca.lt", "localhost:3001", "localhost:3000"],
};

export default nextConfig;
