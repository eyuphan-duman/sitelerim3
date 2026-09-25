'use client';

import dynamic from 'next/dynamic';

const ForumClient = dynamic(() => import('./ForumClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.95rem' }}>
      Yükleniyor...
    </div>
  )
});

export default function ForumPage() {
  return <ForumClient />;
}