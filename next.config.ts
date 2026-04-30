import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 💡 Agrega este bloque 'images' a tu configuración actual
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cizbokgdcvvapncempdu.supabase.co',
        port: '',
        pathname: '/**', // Permite todas las carpetas dentro de este dominio
      },
    ],
  },
};

export default nextConfig;