/**
 * Makale kapak görseli çözümleyici
 * Veritabanında görsel URL'i boş olsa bile başlığa göre uygun editoryal görseli döndürür.
 */
export function getArticleCoverImage(article: any): string | null {
  if (!article) return null;

  // 1. Açıkça belirtilmiş görsel URL'i varsa kullan
  if (article.featuredImage && typeof article.featuredImage === 'string' && article.featuredImage.trim()) {
    return article.featuredImage.trim();
  }
  if (article.imageUrl && typeof article.imageUrl === 'string' && article.imageUrl.trim()) {
    return article.imageUrl.trim();
  }

  // 2. Başlık ve ID eşleşmelerine göre otomatik kapak ataması
  const title = (article.title || '').toLocaleLowerCase('tr-TR');
  const id = (article.id || '').toLocaleLowerCase('tr-TR');

  if (
    title.includes('görülme') ||
    title.includes('gorulme') ||
    title.includes('ayrıcalık') ||
    title.includes('ayricalik') ||
    id.includes('gorulme') ||
    id.includes('ayricalik')
  ) {
    return '/makaleler/gorulmeden-once-gorme-ayricaligi.jpg';
  }

  if (title.includes('yüzleşme') || title.includes('yuzlesme') || id.includes('yuzlesme')) {
    return '/makaleler/yuzlesme-sanati-psikoterapi.jpg';
  }

  if (title.includes('simgesel') || id.includes('simgesel')) {
    return '/makaleler/simgesel-baba-coktugunde.jpg';
  }

  if (title.includes('öteki') || title.includes('oteki') || id.includes('oteki')) {
    return '/makaleler/oteki-ile-kuramadigin-bag.jpg';
  }

  if (title.includes('doğum') || title.includes('dogum') || id.includes('dogum')) {
    return '/makaleler/oncesiyle-ve-sonrasiyla-dogum.jpg';
  }

  return null;
}

