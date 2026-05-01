import { Metadata } from 'next';
import YazilarimClient from './YazilarimClient';

export const metadata: Metadata = {
  title: 'Yazılarım',
  description: 'Psikolog Furkan Manav\'ın varoluşçu ve psikanalitik yaklaşımla kaleme aldığı psikoloji makaleleri, derinlemesine analizler ve düşünsel yazıları.',
  keywords: ['psikoloji yazıları', 'psikanaliz makaleleri', 'varoluşçu felsefe', 'psikoterapi yazıları', 'furkan manav yazıları'],
};

export default function YazilarimPage() {
  return <YazilarimClient />;
}
