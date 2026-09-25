import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Psikolog Furkan Manav',
    short_name: 'Furkan Manav',
    description: 'Varoluşçu ve psikanalitik yaklaşımla psikoterapi ve psikoloji topluluğu.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1c1c1e',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
