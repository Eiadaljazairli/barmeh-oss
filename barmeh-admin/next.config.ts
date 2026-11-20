import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      { source: '/v1/:path*', destination: 'http://localhost:3000/v1/:path*' },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "barmeh",
  project: "barmeh-admin",

  widenClientFileUpload: true,

  tunnelRoute: "/monitoring",
});
