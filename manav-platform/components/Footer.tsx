import Link from 'next/link';
import { MapPin, Phone, Mail, Camera, Tv } from 'lucide-react';

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: '#0d1b3e' }} className="text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>
                Psikolog Furkan Manav
              </h3>
            </div>
            <div className="divider-gold mb-5" />
            <p
              className="text-white/60 leading-relaxed text-sm max-w-sm"
              style={{ fontFamily: 'Crimson Text, serif', fontSize: '1rem', fontStyle: 'italic' }}
            >
              "İnsan kendini anlamaya başladığı anda, değişimin kapısı aralanır. Varoluşun ağırlığını birlikte taşıyalım."
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://www.instagram.com/pskfurkanmanav/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#d4aa70] transition-colors" title="Instagram">
                <Camera size={18} />
              </a>
              <a href="https://www.youtube.com/@pskfurkanmanav" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#d4aa70] transition-colors" title="YouTube">
                <Tv size={18} />
              </a>
              <a href="https://www.linkedin.com/in/pskfurkanmanav/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#d4aa70] transition-colors" title="LinkedIn">
                <LinkedInIcon />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.15em] text-[#b8965a] font-semibold mb-5">
              Sayfalar
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Anasayfa' },
                { href: '/yazilarim', label: 'Yazılarım' },
                { href: '/videolarim', label: 'Videolarım' },
                { href: '/gizlilik', label: 'Gizlilik Politikası' },
                { href: '/iletisim', label: 'İletişim' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/50 hover:text-[#d4aa70] transition-colors text-sm"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.15em] text-[#b8965a] font-semibold mb-5">
              İletişim
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/50">
                <MapPin size={15} className="text-[#b8965a] mt-0.5 flex-shrink-0" />
                <span>Polatlı/ANKARA<br />Çankaya/ANKARA</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Phone size={15} className="text-[#b8965a] flex-shrink-0" />
                <a href="tel:+905078751503" className="hover:text-[#d4aa70] transition-colors">
                  +90 507 875 15 03
                </a>
              </li>
              <li className="flex items-center gap-4 text-gray-300">
                <Mail size={18} className="text-[#d4aa70] drop-shadow-sm min-w-5 shrink-0" />
                <a href="mailto:pskfurkan.manav@gmail.com" className="hover:text-[#d4aa70] transition-colors">
                  pskfurkan.manav@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Psikolog Furkan Manav. Tüm hakları saklıdır.
          </p>
          <p className="text-white/20 text-xs">
            Varoluşçu-Psikanalitik Düşünce · Ankara
          </p>
        </div>
      </div>
    </footer>
  );
}
