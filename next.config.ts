import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // @ts-ignore
  experimental: {
    // allowedDevOrigins: ["localhost:3000", "192.168.8.100:3000"],
  },
  async redirects() {
    return [
      {
        source: '/search',
        destination: '/global-search',
        permanent: true,
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
})(nextConfig);
