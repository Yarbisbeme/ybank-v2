import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/cizbokgdcvvapncempdu\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "supabase-media",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
          },
          // 💡 Importante: Para dominios externos como Supabase, necesitamos esto:
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cizbokgdcvvapncempdu.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default withPWA(nextConfig);