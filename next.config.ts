import type { NextConfig } from "next";

// Static export for Firebase Hosting (public profiles use /pet-profile?username=&petId=).
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
