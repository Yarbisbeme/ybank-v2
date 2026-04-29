import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
// Importamos ambas fuentes
import { Inter, JetBrains_Mono } from "next/font/google";

// Fuente principal para la UI
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", // Variable CSS para usar en Tailwind
});

// Fuente para números y datos técnicos (ADN YBANK)
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
      {/* Cambiamos bg-[#F8F9FB] por bg-background 
          para que use las variables OKLCH de tu globals.css 
      */}
      <body className="bg-background antialiased">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" // Sugiero empezar en light para ver la claridad que buscamos
          enableSystem
        >
          <main>
            {children}
          </main>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}