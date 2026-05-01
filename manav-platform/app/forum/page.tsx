import { Metadata } from 'next';
import ForumClient from './ForumClient';

export const metadata: Metadata = {
  title: 'Forum',
  description: 'Psikoloji, psikanaliz ve varoluşçu felsefe üzerine tartışmaların yapıldığı topluluk forumu. Deneyimlerinizi paylaşın ve diğer üyelerle etkileşime geçin.',
  keywords: ['psikoloji forumu', 'psikanaliz tartışmaları', 'varoluşçu topluluk', 'psikoterapi forum', 'furkan manav forum'],
};

export default function ForumPage() {
  return <ForumClient />;
}