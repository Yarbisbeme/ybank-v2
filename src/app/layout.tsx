import type { Metadata } from "next";
import { Inter, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import logo from "../../public/icons/logoY.svg";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-serif'
});

export const metadata: Metadata = {
  title: "yBank v2",
  description: "Plataforma financiera moderna",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body className={`${inter.variable} ${ibmPlexSerif.variable} antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}