import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Current local ESLint/AJV mismatch is noisy in build logs; keep deploy path stable.
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }]
  }
};

export default nextConfig;
