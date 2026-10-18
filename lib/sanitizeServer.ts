import sanitizeHtml from 'sanitize-html';

/**
 * Yazı ve SSS içeriği sunucuda sayfa oluşturulurken temizlenir (tarayıcıda ayrıca DOMPurify çalışır).
 * Zengin metin editörünün ürettiği biçimler korunur; betik, olay öznitelikleri ve tehlikeli bağlantılar atılır.
 */
export function cleanHtml(html: unknown): string {
  if (typeof html !== 'string' || !html) return '';
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span', 'u', 's', 'iframe']),
    allowedAttributes: {
      '*': ['class', 'style'],
      a: ['href', 'target', 'rel', 'name'],
      img: ['src', 'alt', 'width', 'height'],
      iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  });
}

/** <script type="application/ld+json"> içine güvenle konacak JSON (</script> ile kaçış engellenir) */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\u003c');
}
