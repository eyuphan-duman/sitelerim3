import DOMPurify from 'dompurify';

/**
 * Yönetici panelinden yazılan yazı ve SSS içeriği (HTML) gösterilmeden önce temizlenir:
 * betik, olay öznitelikleri (onerror vb.) ve javascript: bağlantıları kaldırılır.
 * Sunucuda çizilen sayfalarda içerik zaten lib/sanitizeServer.ts ile temizlenmiş gelir;
 * sunucuda DOM olmadığından burada olduğu gibi bırakılır, tarayıcıda ayrıca DOMPurify çalışır.
 */
export function safeHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] });
}
