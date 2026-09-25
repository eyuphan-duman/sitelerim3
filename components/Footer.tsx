import Link from 'next/link';
import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';

const InstagramIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: '#0b1633' }} className="text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand - 4 columns */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>
                  Psikolog Furkan Manav
                </h3>
                <p className="text-xs uppercase tracking-[0.18em] text-[#d4aa70] font-medium mt-1">
                  Varoluşçu-Psikanalitik Psikoterapi
                </p>
              </div>
              <div className="w-12 h-0.5 bg-[#b8965a]/60 my-4" />
              <p
                className="text-white/65 leading-relaxed text-sm max-w-sm"
                style={{ fontFamily: 'Crimson Text, serif', fontSize: '1.05rem', fontStyle: 'italic' }}
              >
                &ldquo;İnsan kendini anlamaya başladığı anda, değişimin kapısı aralanır. Varoluşun ağırlığını birlikte taşıyalım.&rdquo;
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.instagram.com/pskfurkanmanav/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#d4aa70] hover:bg-white/10 hover:border-[#b8965a]/50 transition-all"
                title="Instagram"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.youtube.com/@pskfurkanmanav"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#d4aa70] hover:bg-white/10 hover:border-[#b8965a]/50 transition-all"
                title="YouTube"
                aria-label="YouTube"
              >
                <YoutubeIcon />
              </a>
              <a
                href="https://www.linkedin.com/in/pskfurkanmanav/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#d4aa70] hover:bg-white/10 hover:border-[#b8965a]/50 transition-all"
                title="LinkedIn"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </a>
            </div>
          </div>

          {/* Sayfalar - 2 columns */}
          <div className="lg:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.16em] text-[#d4aa70] font-semibold mb-5 pb-1 border-b border-white/5 inline-block">
              Hızlı Erişim
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Anasayfa' },
                { href: '/ben-kimim', label: 'Hakkımda' },
                { href: '/yazilarim', label: 'Yazılarım' },
                { href: '/videolarim', label: 'Videolarım' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/60 hover:text-[#d4aa70] hover:translate-x-1 inline-block transition-all text-sm"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Topluluk & Hizmetler - 3 columns */}
          <div className="lg:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.16em] text-[#d4aa70] font-semibold mb-5 pb-1 border-b border-white/5 inline-block">
              Topluluk & Destek
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/forum', label: 'Forum & Topluluk' },
                { href: '/kayit', label: 'Psikolog Kaydı & Başvuru' },
                { href: '/iletisim', label: 'Randevu & Danışmanlık' },
                { href: '/gizlilik', label: 'Gizlilik ve Güvenlik' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/60 hover:text-[#d4aa70] hover:translate-x-1 inline-flex items-center gap-1.5 transition-all text-sm"
                  >
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim - 3 columns */}
          <div className="lg:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.16em] text-[#d4aa70] font-semibold mb-5 pb-1 border-b border-white/5 inline-block">
              İletişim & Konum
            </h4>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-sm text-white/60 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#d4aa70] group-hover:bg-[#b8965a]/15 transition-colors mt-0.5">
                  <MapPin size={15} />
                </div>
                <div className="leading-snug">
                  <span className="text-white/85 font-medium block">Çankaya & Polatlı</span>
                  <span className="text-xs text-white/45">Ankara / Türkiye</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#d4aa70] group-hover:bg-[#b8965a]/15 transition-colors">
                  <Phone size={15} />
                </div>
                <a href="tel:+905078751503" className="hover:text-[#d4aa70] text-white/80 transition-colors">
                  +90 507 875 15 03
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#d4aa70] group-hover:bg-[#b8965a]/15 transition-colors">
                  <Mail size={15} />
                </div>
                <a href="mailto:pskfurkan.manav@gmail.com" className="hover:text-[#d4aa70] text-white/80 transition-colors break-all">
                  pskfurkan.manav@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs text-center md:text-left">
            © {new Date().getFullYear()} Psikolog Furkan Manav. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap justify-center">
            <Link href="/gizlilik" className="hover:text-[#d4aa70] transition-colors">Gizlilik Politikası</Link>
            <span>·</span>
            <Link href="/iletisim" className="hover:text-[#d4aa70] transition-colors">İletişim</Link>
            <span>·</span>
            <span>Varoluşçu-Psikanalitik Düşünce</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
