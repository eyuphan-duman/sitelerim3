import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yazılarım | Psikolog Furkan Manav',
  description: 'Psikoloji, psikanaliz ve varoluşçuluk üzerine yazılar ve denemeler.',
};

export default function YazilarimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
