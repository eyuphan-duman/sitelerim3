import { Metadata } from 'next';
import { Suspense } from 'react';
import YazilarimClient from './YazilarimClient';

export const metadata: Metadata = {
  title: 'Yazılarım',
  description: 'Psikolog Furkan Manav\'ın varoluşçu ve psikanalitik yaklaşımla kaleme aldığı psikoloji makaleleri, derinlemesine analizler ve düşünsel yazıları.',
  keywords: ['psikoloji yazıları', 'psikanaliz makaleleri', 'varoluşçu felsefe', 'psikoterapi yazıları', 'furkan manav yazıları'],
};

export default function YazilarimPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-500 font-serif italic">Yazılar yükleniyor...</div>}>
      <YazilarimClient />
    </Suspense>
  );
}
