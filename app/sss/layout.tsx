import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular | Psikolog Furkan Manav',
  description: 'Psikoterapi süreci, psikolog seçimi, seans ücret ve süreleri, kaygı, depresyon, online terapi, varoluşçu psikoterapi ve etik kurallar hakkında sıkça sorulan soruların klinik yanıtları.',
  keywords: [
    'psikolog sıkça sorulan sorular',
    'terapi hakkında sorular',
    'online psikolog',
    'psikoterapi süresi',
    'varoluşçu psikoterapi',
    'psikolog ankara',
    'furkan manav sss'
  ],
  alternates: {
    canonical: 'https://pskfurkanmanav.com/sss',
  },
  openGraph: {
    title: 'Sıkça Sorulan Sorular | Psikolog Furkan Manav',
    description: 'Psikoterapi ve psikolojik destek hakkında en çok merak edilen sorular ve kapsamlı klinik yanıtları.',
    url: 'https://pskfurkanmanav.com/sss',
    type: 'website',
    images: [
      {
        url: 'https://pskfurkanmanav.com/pskfurkanmanav.jpeg',
        width: 1200,
        height: 630,
        alt: 'Psikolog Furkan Manav - Sıkça Sorulan Sorular',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sıkça Sorulan Sorular | Psikolog Furkan Manav',
    description: 'Psikoterapi hakkında en çok merak edilen sorular ve klinik cevapları.',
    images: ['https://pskfurkanmanav.com/pskfurkanmanav.jpeg'],
  },
};

export default function SssLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
