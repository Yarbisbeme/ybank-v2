import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
// 1. Importamos la fuente
import { Plus_Jakarta_Sans } from "next/font/google";

// 2. Configuramos la fuente
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  // Opcional: Define los pesos si quieres restringirlos, si no, los trae todos por defecto en variable fonts
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={plusJakarta.className}>
      <body className="bg-[#F8F9FB] antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}