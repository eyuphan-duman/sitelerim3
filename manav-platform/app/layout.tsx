import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "Psikolog Furkan Manav | Varoluşçu Psikanalitik Psikoterapi | Ankara",
    template: "%s | Psikolog Furkan Manav",
  },
  description:
    "Psikolog Furkan Manav - Varoluşçu ve psikanalitik yaklaşımla psikoterapi, derinlemesine psikoloji yazıları, forum tartışmaları ve video içerikler. Ankara ve Online seans.",
  keywords: [
    "psikolog",
    "psikolog ankara",
    "psikoterapi",
    "varoluşçu psikoterapi",
    "psikanaliz",
    "psikanalitik yaklaşım",
    "furkan manav",
    "psikolog furkan manav",
    "online psikoloji",
    "psikoloji forum",
    "psikoloji yazıları",
    "rüya analizi",
    "bağlanma kuramı",
    "travma psikolojisi",
  ],
  authors: [{ name: "Psikolog Furkan Manav" }],
  creator: "Furkan Manav",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Psikolog Furkan Manav | Varoluşçu Psikanalitik Psikoterapi",
    description:
      "Varoluşçu-psikanalitik yaklaşımla psikoterapi, psikoloji yazıları, forum ve video içerikler. Ankara & Online.",
    type: "website",
    locale: "tr_TR",
    siteName: "Psikolog Furkan Manav",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psikolog Furkan Manav | Varoluşçu Psikanalitik Psikoterapi",
    description: "Psikoloji yazıları, forum tartışmaları ve video içerikler.",
  },
  alternates: {
    canonical: "/",
  },
  verification: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://furkanmanav.com" />
      </head>
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                background: "#1c1c1e",
                color: "#e8dcc8",
                border: "1px solid rgba(184,150,90,0.3)",
              },
            }}
          />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
