import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: 'Psikoterapi, psikolog seçimi, online terapi ve kaygı gibi konularda en çok merak edilen soruların cevapları.',
};

export default function SssLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
