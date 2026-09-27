import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuickContact from "@/components/QuickContact";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import CookieConsent from "@/components/CookieConsent";
import { Inter, Playfair_Display, Crimson_Text, Montserrat } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const crimson = Crimson_Text({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-crimson" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });


export const metadata: Metadata = {
  metadataBase: new URL('https://pskfurkanmanav.com'),
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
    url: 'https://pskfurkanmanav.com',
    type: "website",
    locale: "tr_TR",
    siteName: "Psikolog Furkan Manav",
    images: [
      {
        url: '/pskfurkanmanav.jpeg',
        width: 1200,
        height: 630,
        alt: 'Psikolog Furkan Manav',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Psikolog Furkan Manav | Varoluşçu Psikanalitik Psikoterapi",
    description: "Psikoloji yazıları, forum tartışmaları ve video içerikler.",
    images: ['/pskfurkanmanav.jpeg'],
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: 'google64eb6c07aa6ad607',
    other: {
      'google-adsense-account': 'ca-pub-7052967416613692',
    },
  },
  manifest: '/manifest.json',
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Furkan Manav",
  "jobTitle": "Psikolog",
  "url": "https://pskfurkanmanav.com",
  "sameAs": [
    "https://www.instagram.com/furkanmanav", // Örnek sosyal medya linkleri
  ],
  "description": "Varoluşçu ve psikanalitik yaklaşımla psikoterapi, derinlemesine psikoloji yazıları ve forum tartışmaları.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ankara",
    "addressCountry": "TR"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${playfair.variable} ${crimson.variable} ${montserrat.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://pskfurkanmanav.com" />
        <link rel="preload" as="image" href="/hero-bg.jpg" fetchPriority="high" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T1ZW5FQ031"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18148915526"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Varsayılan olarak tüm takipleri reddet
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'wait_for_update': 500
            });

            gtag('js', new Date());
            gtag('config', 'G-T1ZW5FQ031');
            gtag('config', 'AW-18148915526');
          `}
        </Script>
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
          <QuickContact />
          <CookieConsent />
        </AuthProvider>

      </body>
    </html>
  );
}
