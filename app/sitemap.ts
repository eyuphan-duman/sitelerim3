import { MetadataRoute } from 'next';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LOCAL_ARTICLES } from '@/data/local-articles';
import { LOCAL_FAQ } from '@/data/local-faq';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pskfurkanmanav.com';

  // 1. Ana (Statik) Sayfalar
  const staticRoutes = [
    '',
    '/ben-kimim',
    '/yazilarim',
    '/sss',
    '/forum',
    '/iletisim',
    '/videolarim',
    '/gizlilik',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly' | 'monthly' | 'yearly',
    priority: route === '' ? 1.0 : (route === '/gizlilik' ? 0.3 : 0.8),
  }));

  // 2. Yerel Yazılar
  const localArticleRoutes = LOCAL_ARTICLES.map((article) => ({
    url: `${baseUrl}/yazilarim/${article.id}`,
    lastModified: article.createdAt ? new Date(article.createdAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // 2b. Yerel Sıkça Sorulan Sorular
  const localFaqRoutes = LOCAL_FAQ.map((faq) => ({
    url: `${baseUrl}/sss/${faq.id}`,
    lastModified: faq.date ? new Date(faq.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // 3. Firestore'dan Dinamik Yazılar
  let fbArticleRoutes: MetadataRoute.Sitemap = [];
  try {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    fbArticleRoutes = snap.docs.map((doc) => {
      const data = doc.data();
      let lastMod = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          lastMod = data.createdAt.toDate();
        } else {
          lastMod = new Date(data.createdAt);
        }
      }
      return {
        url: `${baseUrl}/yazilarim/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    });
  } catch (error) {
    console.error('Error fetching articles for sitemap from Firestore:', error);
    // Hata durumunda sadece yerel ve statik rotaları dönüyoruz ki derleme/çalışma esnasında patlamasın.
  }

  // 4. Firestore'dan Dinamik Sıkça Sorulan Sorular
  let fbFaqRoutes: MetadataRoute.Sitemap = [];
  try {
    const q = query(collection(db, 'faq'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    fbFaqRoutes = snap.docs.map((doc) => {
      const data = doc.data();
      let lastMod = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          lastMod = data.createdAt.toDate();
        } else {
          lastMod = new Date(data.createdAt);
        }
      }
      return {
        url: `${baseUrl}/sss/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      };
    });
  } catch (error) {
    console.error('Error fetching FAQ entries for sitemap from Firestore:', error);
  }

  // Mükerrer (duplicate) URL'leri engellemek için filtreleme yapalım (yerel ile firestore çakışırsa)
  const allRoutes = [...staticRoutes, ...localArticleRoutes, ...fbArticleRoutes, ...localFaqRoutes, ...fbFaqRoutes];
  const uniqueRoutesMap = new Map<string, typeof allRoutes[0]>();

  for (const route of allRoutes) {
    if (!uniqueRoutesMap.has(route.url)) {
      uniqueRoutesMap.set(route.url, route);
    } else {
      const existing = uniqueRoutesMap.get(route.url)!;
      const existingDate = existing.lastModified ? new Date(existing.lastModified).getTime() : 0;
      const currentDate = route.lastModified ? new Date(route.lastModified).getTime() : 0;
      if (currentDate > existingDate) {
        uniqueRoutesMap.set(route.url, route);
      }
    }
  }

  return Array.from(uniqueRoutesMap.values());
}

