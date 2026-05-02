import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Metadata, Viewport } from "next";

// 💡 1. Viewport: Ya lo tienes perfecto para evitar el zoom en móviles.
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 💡 2. Metadata: Añadimos iconos específicos para que luzca bien en iPhone/Android.
export const metadata: Metadata = {
  title: "YBank Intelligence",
  description: "Sistema de Telemetría Financiera Personal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YBank",
    // startupImage: "/splash.png", // Opcional: para pantalla de carga en iOS
  },
  formatDetection: {
    telephone: false, // Evita que los balances parezcan links de teléfono
  },
  icons: {
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192x192.png", // Fundamental para iOS
  },
};

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="es" 
      suppressHydrationWarning 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background antialiased font-sans">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}