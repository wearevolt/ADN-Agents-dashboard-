import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: "bottom-left",
  },
  env: {
    // URL of the main application to open on card click
    MAIN_APP_URL: process.env.MAIN_APP_URL,
  },
};

export default nextConfig;
