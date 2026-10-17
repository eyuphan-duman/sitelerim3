import Script from "next/script";
import "@/components/forum/forum.css";
import type { Metadata } from "next";
import ServiceWorker from "@/components/forum/ServiceWorker";

// Forum sayfalarından "uygulamayı yükle" denince Logos uygulaması kurulur
export const metadata: Metadata = {
  manifest: "/logos.webmanifest",
  appleWebApp: { capable: true, title: "Logos", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7052967416613692"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ServiceWorker />
      {children}
    </>
  );
}
