import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Metadata, Viewport } from "next";
import Script from "next/script"; 

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "YBank Intelligence",
  description: "Sistema de Telemetría Financiera Personal",
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
      <body className="bg-background antialiased font-sans" suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem
        >
          {children}
          <Toaster richColors position="top-right" />
          
          {/* 💡 2. Usamos next/script con strategy="afterInteractive" */}
          <Script id="sw-registration" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('YBank SW registrado con éxito');
                    },
                    function(err) {
                      console.log('Fallo el registro del SW: ', err);
                    }
                  );
                });
              }
            `}
          </Script>
        </ThemeProvider>
      </body>
    </html>
  );
}