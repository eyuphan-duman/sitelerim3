import { Metadata } from 'next';
import { Suspense } from 'react';
import ForumClient from './ForumClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Forum',
  description: 'Psikoloji, psikanaliz ve varoluşçu felsefe üzerine tartışmaların yapıldığı topluluk forumu. Deneyimlerinizi paylaşın ve diğer üyelerle etkileşime geçin.',
  keywords: ['psikoloji forumu', 'psikanaliz tartışmaları', 'varoluşçu topluluk', 'psikoterapi forum', 'furkan manav forum'],
};

export default function ForumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Yükleniyor...</div>}>
      <ForumClient />
    </Suspense>
  );
}