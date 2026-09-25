import { Metadata } from 'next';
import ForumWrapper from '@/components/forum/ForumWrapper';

export const metadata: Metadata = {
  title: 'Topluluk & Forum',
  description: 'Psikoloji, psikanaliz ve varoluşçu felsefe üzerine tartışmaların yapıldığı topluluk forumu.',
  keywords: ['psikoloji forumu', 'psikanaliz tartışmaları', 'varoluşçu topluluk', 'psikoterapi forum', 'furkan manav forum'],
};

export default function ForumPage() {
  return <ForumWrapper />;
}