import { Metadata } from 'next';
import BenKimimClient from './BenKimimClient';

export const metadata: Metadata = {
  title: 'Hakkımda',
  description: 'Psikolog Furkan Manav kimdir? Eğitimi, terapötik yaklaşımı (Varoluşçu-Psikanalitik), klinik deneyimi ve çalışma alanları hakkında detaylı bilgi.',
  keywords: ['psikolog furkan manav', 'furkan manav kimdir', 'psikolog eğitimi', 'ankara psikolog', 'varoluşçu psikoterapist'],
};

export default function BenKimimPage() {
  return <BenKimimClient />;
}
