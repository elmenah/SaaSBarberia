import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/book/el-clasico",
        destination: "/demo/book",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default withSentryConfig(nextConfig, {
  // Org y project de tu cuenta en sentry.io
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Sube source maps solo en CI/producción
  silent: true,

  // Desactivar en desarrollo para no ralentizar el build
  disableLogger: true,

  // Tree-shake el SDK de Sentry en el cliente (reduce bundle)
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
});
