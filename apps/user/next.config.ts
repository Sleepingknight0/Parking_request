import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@nacc/ui",
    "@nacc/types",
    "@nacc/db",
    "@nacc/auth",
    "@nacc/utils",
  ],
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
