import { Metadata } from 'next';
import ForumWrapper from '@/components/forum/ForumWrapper';

export const metadata: Metadata = {
  title: 'Topluluk & Forum | Furkan Manav',
  description: 'Psikoloji, psikanaliz ve varoluşçu felsefe üzerine tartışmaların yapıldığı topluluk forumu.',
  keywords: ['psikoloji forumu', 'psikanaliz tartışmaları', 'varoluşçu topluluk', 'psikoterapi forum', 'furkan manav forum'],
  openGraph: {
    title: 'Manav Forum - Psikoloji Topluluğu',
    description: 'Psikoloji, psikanaliz ve varoluşçu felsefe üzerine tartışmaların yapıldığı topluluk forumu.',
    images: [{ url: '/forum-logo.png', width: 1200, height: 630, alt: 'Manav Forum' }],
  },
};

export default function ForumPage() {
  return <ForumWrapper />;
}