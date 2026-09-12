import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/back_dashboard",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
