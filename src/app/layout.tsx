import type { Metadata } from "next";
import { Inter, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "sonner";

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
    <html lang="en">
      <body className={`${inter.variable} ${ibmPlexSerif.variable} antialiased`}>
        {children}

        {/* Portal for modals, toasts, etc. */}
        <Sonner position="bottom-right" />
      </body>
    </html>
  );
}