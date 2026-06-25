import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve("../.."),
  transpilePackages: [
    "@nacc/ui",
    "@nacc/types",
    "@nacc/db",
    "@nacc/auth",
    "@nacc/utils",
    "@nacc/storage",
  ],
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
