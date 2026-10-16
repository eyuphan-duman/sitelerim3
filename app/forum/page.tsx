import { Metadata } from 'next';
import ForumWrapper from '@/components/forum/ForumWrapper';

export const metadata: Metadata = {
  title: 'Logos | Psikoloji Forumu',
  description: 'Psikoloji, psikanaliz ve varoluşçu felsefe üzerine tartışmaların yapıldığı topluluk forumu.',
  keywords: ['psikoloji forumu', 'psikanaliz tartışmaları', 'varoluşçu topluluk', 'psikoterapi forum', 'furkan manav forum'],
  openGraph: {
    title: 'Logos | Psikoloji Forumu',
    description: 'Psikoloji, psikanaliz ve varoluşçu felsefe üzerine tartışmaların yapıldığı topluluk forumu.',
    images: [{ url: '/logos-og.png', width: 1200, height: 630, alt: 'Logos Psikoloji Forumu' }],
  },
};

export default function ForumPage() {
  return <ForumWrapper />;
}