import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deen API hanya berisi Route Handlers (tanpa halaman UI).
  serverExternalPackages: ["firebase-admin", "bcryptjs"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
