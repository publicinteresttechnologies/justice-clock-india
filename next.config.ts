import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/judgments": ["./public/data/judgments.json"],
  },
};

export default nextConfig;
