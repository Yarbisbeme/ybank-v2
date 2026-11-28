import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Metadata, Viewport } from "next";
import Script from "next/script"; 

export const viewport: Viewport = {
  themeColor: "#1f4bff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "YBank",
  description: "Tus cuentas, tarjetas y movimientos en DOP y USD, claros y bajo control.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YBank",
  },
  formatDetection: {
    telephone: false, 
  },
  icons: {
    apple: "/icons/logoy.png", 
  },
};

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-bricolage",
});

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter", 
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="es" 
      suppressHydrationWarning 
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background antialiased font-sans" suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem
        >
          {children}
          <Toaster richColors position="top-right" className="y2-vt-toasts" />
          
          {/* 💡 2. Usamos next/script con strategy="afterInteractive" */}
          <Script id="sw-registration" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `}
          </Script>
        </ThemeProvider>
      </body>
    </html>
  );
}