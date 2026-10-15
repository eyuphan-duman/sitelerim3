'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, Calendar, Tag, Edit3, MessageCircle, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

interface Props {
  id: string;
  initialFaq: any;
}

export default function FaqDetailClient({ id, initialFaq: faq }: Props) {
  const { user } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  const dateStr = faq.createdAt || faq.date
    ? format(new Date(faq.createdAt || faq.date), 'd MMMM yyyy', { locale: tr })
    : '';

  return (
    <div className="yz-detail-page">
      <div className="yz-detail-container">
        {/* ── BACK BUTTON ── */}
        <Link href="/sss" className="yz-detail-back-minimal">
          <ArrowLeft size={16} /> Tüm Sorulara Dön
        </Link>

        {/* ── HEADER ── */}
        <header className="yz-detail-header-minimal">
          <h1 className="yz-detail-title-minimal">{faq.title}</h1>

          <div className="yz-detail-meta-minimal">
            {faq.category && (
              <span className="yz-detail-meta-item">
                <Tag size={14} /> {faq.category}
              </span>
            )}
            {dateStr && (
              <span className="yz-detail-meta-item">
                <Calendar size={14} /> {dateStr}
              </span>
            )}
          </div>

          {isAdmin && (
            <div className="yz-detail-admin-bar-minimal">
              <Link href={`/admin?tab=faq`} className="yz-admin-edit-btn-min">
                <Edit3 size={14} /> Admin Panelinden Düzenle
              </Link>
            </div>
          )}
        </header>

        {/* ── CONTENT ── */}
        <div className="yz-detail-content-wrapper">
          <div
            className="yz-detail-content ql-editor-view"
            dangerouslySetInnerHTML={{ __html: faq.content || '' }}
          />
        </div>

        {/* ── SHARE BUTTONS ── */}
        <div className="yz-detail-share-bar">
          <span className="yz-share-label">Bu cevabı paylaş:</span>
          <div className="yz-share-actions">
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(faq.title + ' ' + window.location.href)}`, '_blank')}
              className="yz-share-btn wa" title="WhatsApp'ta Paylaş"
            >
              <MessageCircle size={18} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Bağlantı kopyalandı!');
              }}
              className="yz-share-btn copy" title="Bağlantıyı Kopyala"
            >
              <Link2 size={18} />
            </button>
          </div>
        </div>

        {/* ── CONTACT CTA ── */}
        <div className="yz-detail-cta" style={{ marginTop: 32, padding: 24, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ color: '#334155', marginBottom: 12, fontSize: '0.98rem' }}>
            Bu konuda konuşmak ya da randevu almak ister misiniz?
          </p>
          <Link
            href="/iletisim"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy)', color: 'white', padding: '10px 22px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '0.92rem' }}
          >
            İletişime Geç
          </Link>
        </div>
      </div>
    </div>
  );
}
