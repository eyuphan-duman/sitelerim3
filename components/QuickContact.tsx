'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Phone, Mail, X, MessageCircle } from 'lucide-react';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.765.46 3.488 1.332 5.006L2.128 21.87l4.982-1.306A9.957 9.957 0 0012.012 22c5.532 0 10.012-4.48 10.012-10.012C22.024 6.48 17.544 2 12.012 2z" fill="#25D366"/>
    <path d="M17.472 15.654c-.26-.13-1.542-.762-1.78-.85-.238-.088-.412-.13-.586.13-.174.26-.674.85-.826 1.024-.152.174-.304.196-.564.066a7.286 7.286 0 01-2.146-1.32c-.822-.71-1.378-1.586-1.54-1.846-.162-.26-.018-.4.112-.53.118-.118.26-.304.39-.456.13-.152.174-.26.26-.434.088-.174.044-.326-.022-.456-.066-.13-.586-1.412-.804-1.934-.212-.508-.426-.438-.586-.446-.152-.008-.326-.008-.5-.008a.964.964 0 00-.694.326c-.238.26-.912.89-.912 2.172 0 1.282.934 2.52 1.064 2.694.13.174 1.836 2.802 4.444 3.896.62.26 1.106.416 1.482.532.622.194 1.188.166 1.636.1.498-.074 1.542-.63 1.76-1.24.218-.61.218-1.13.152-1.24-.066-.11-.24-.174-.5-.304z" fill="#FFF"/>
  </svg>
);

export default function QuickContact() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide completely on forum, notification, and admin pages as requested
  const isExcludedRoute = 
    Boolean(pathname?.startsWith('/forum')) || 
    Boolean(pathname?.startsWith('/bildirimler')) ||
    Boolean(pathname?.startsWith('/admin')) ||
    (typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/forum') || 
      window.location.pathname.startsWith('/bildirimler') ||
      window.location.pathname.startsWith('/admin')
    ));

  if (isExcludedRoute) {
    return null;
  }

  const rawPhoneNumber = '5078751503';
  
  // WhatsApp Link - Pre-filled with a professional message
  const whatsappUrl = `https://wa.me/90${rawPhoneNumber}?text=Merhaba%20Furkan%20Bey,%20psikoterapi%20seanslar%C4%B1%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.`;
  const callUrl = `tel:+90${rawPhoneNumber}`;

  const handleConversionClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ads_conversion_Ki_i_1');
    }
    setIsOpen(false);
  };

  return (
    <div className="quick-contact-container" ref={containerRef}>
      {/* Styles injected to guarantee local styling without complex build dependencies */}
      <style jsx global>{`
        .quick-contact-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-family: 'Inter', sans-serif;
        }
        .quick-contact-menu {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          will-change: transform, opacity;
        }
        .quick-contact-menu.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .quick-contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          outline: none;
          text-decoration: none;
        }
        .quick-contact-label {
          background: #0a1628;
          color: #e8dcc8;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 4px;
          border: 1px solid rgba(201, 169, 110, 0.3);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          opacity: 0;
          transform: translateX(10px);
          transition: transform 0.25s ease, opacity 0.25s ease;
          will-change: transform, opacity;
          white-space: nowrap;
          pointer-events: none;
        }
        .quick-contact-item:hover .quick-contact-label {
          opacity: 1;
          transform: translateX(0);
        }
        .quick-contact-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          will-change: transform;
          color: white;
        }
        .quick-contact-btn:hover {
          transform: scale(1.1);
        }
        .quick-contact-main-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: var(--gold);
          color: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          box-shadow: 0 6px 22px rgba(201, 169, 110, 0.35);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          will-change: transform;
          position: relative;
        }
        .quick-contact-main-btn:hover {
          transform: scale(1.06);
        }
        .quick-contact-main-pulse {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          border: 2px solid var(--gold);
          animation: quick-contact-pulse 2s infinite;
          pointer-events: none;
          opacity: 0.6;
          z-index: -1;
        }
        @keyframes quick-contact-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @media (max-width: 640px) {
          .quick-contact-container {
            bottom: 16px;
            right: 16px;
          }
          .quick-contact-main-btn {
            width: 52px;
            height: 52px;
          }
          .quick-contact-btn {
            width: 44px;
            height: 44px;
          }
          .quick-contact-label {
            display: none; /* Hide labels on small mobile screens to prevent overflow */
          }
        }
      `}</style>

      {/* Menu options */}
      <div className={`quick-contact-menu ${isOpen ? 'open' : ''}`}>
        
        {/* WhatsApp Option */}
        <a 
          href={whatsappUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="quick-contact-item"
          onClick={handleConversionClick}
          aria-label="WhatsApp İle İletişime Geçin"
        >
          <span className="quick-contact-label">WhatsApp'tan Yazın</span>
          <div className="quick-contact-btn" style={{ background: 'white' }}>
            <WhatsAppIcon />
          </div>
        </a>

        {/* Call (Ara) Option */}
        <a 
          href={callUrl} 
          className="quick-contact-item"
          onClick={handleConversionClick}
          aria-label="Telefonla Arayın"
        >
          <span className="quick-contact-label">Hemen Arayın</span>
          <div className="quick-contact-btn" style={{ background: '#0070f3' }}>
            <Phone size={18} />
          </div>
        </a>

        {/* Contact Page Option */}
        <button 
          type="button"
          className="quick-contact-item" 
          onClick={() => {
            router.push('/iletisim');
            setIsOpen(false);
          }}
          aria-label="İletişim Formuna Git"
        >
          <span className="quick-contact-label">İletişim Formu</span>
          <div className="quick-contact-btn" style={{ background: '#0a1628', border: '1.5px solid var(--gold)', color: 'var(--gold)' }}>
            <Mail size={18} />
          </div>
        </button>

      </div>

      {/* Main Floating Action Button */}
      <button 
        type="button"
        className="quick-contact-main-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Hızlı İletişim Seçenekleri"
        style={{ transform: isOpen ? 'rotate(135deg)' : 'none', background: isOpen ? '#f43f5e' : 'var(--gold)', color: isOpen ? 'white' : 'var(--navy)' }}
      >
        {isOpen ? (
          <X size={24} style={{ transform: 'rotate(-135deg)' }} />
        ) : (
          <MessageCircle size={26} />
        )}
        
        {/* Pulse effect showing when the menu is closed */}
        {!isOpen && <div className="quick-contact-main-pulse" />}
      </button>
    </div>
  );
}
