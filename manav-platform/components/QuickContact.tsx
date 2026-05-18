'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, X, MessageCircle } from 'lucide-react';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.755.002-2.61-1.01-5.063-2.853-6.91C16.638 2.093 14.19 1.079 11.6 1.079c-5.442 0-9.87 4.37-9.874 9.755-.002 1.765.485 3.491 1.412 5.034l-1.026 3.75 3.853-.984zm13.116-6.725c-.27-.133-1.597-.788-1.844-.878-.247-.09-.427-.133-.607.133-.18.267-.697.878-.854 1.058-.157.18-.314.2-.584.066-.27-.133-1.14-.42-2.17-1.34-0.803-.717-1.346-1.604-1.503-1.871-.157-.267-.017-.411.118-.544.12-.12.269-.314.404-.471.135-.157.18-.268.27-.447.09-.179.045-.335-.022-.469-.067-.133-.607-1.462-.832-2.004-.22-.527-.46-.455-.63-.464-.162-.009-.348-.01-.534-.01-.186 0-.49.07-.746.347-.256.278-.978.956-.978 2.33 0 1.375.999 2.7 1.14 2.885.14.184 1.966 3.003 4.76 4.21.665.287 1.184.459 1.587.587.67.213 1.28.183 1.76.111.536-.08 1.598-.653 1.822-1.253.225-.6.225-1.114.157-1.253-.067-.14-.247-.22-.516-.353z"/>
  </svg>
);

export default function QuickContact() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const rawPhoneNumber = '5078751503';
  
  // WhatsApp Link - Pre-filled with a professional message
  const whatsappUrl = `https://wa.me/90${rawPhoneNumber}?text=Merhaba%20Furkan%20Bey,%20psikoterapi%20seanslar%C4%B1%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.`;
  const callUrl = `tel:+90${rawPhoneNumber}`;

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
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
          transition: all 0.25s ease;
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
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: white;
        }
        .quick-contact-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
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
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }
        .quick-contact-main-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 8px 26px rgba(201, 169, 110, 0.55);
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
          onClick={() => setIsOpen(false)}
        >
          <span className="quick-contact-label">WhatsApp'tan Yazın</span>
          <div className="quick-contact-btn" style={{ background: '#25d366' }}>
            <WhatsAppIcon />
          </div>
        </a>

        {/* Call (Ara) Option */}
        <a 
          href={callUrl} 
          className="quick-contact-item"
          onClick={() => setIsOpen(false)}
        >
          <span className="quick-contact-label">Hemen Arayın</span>
          <div className="quick-contact-btn" style={{ background: '#0070f3' }}>
            <Phone size={18} />
          </div>
        </a>

        {/* Contact Page Option */}
        <button 
          className="quick-contact-item" 
          onClick={() => {
            router.push('/iletisim');
            setIsOpen(false);
          }}
        >
          <span className="quick-contact-label">İletişim Formu</span>
          <div className="quick-contact-btn" style={{ background: '#0a1628', border: '1.5px solid var(--gold)', color: 'var(--gold)' }}>
            <Mail size={18} />
          </div>
        </button>

      </div>

      {/* Main Floating Action Button */}
      <button 
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
