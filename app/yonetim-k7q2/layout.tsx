import type { Metadata } from 'next';

// Yönetim paneli arama motorlarında listelenmez (robots.txt'ye yazılmaz; orada adres ortaya çıkardı)
export const metadata: Metadata = {
  title: 'Yönetim',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
