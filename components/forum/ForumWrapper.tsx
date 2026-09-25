'use client';

import dynamic from 'next/dynamic';

const ForumClient = dynamic(() => import('@/app/forum/ForumClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.95rem' }}>
      Topluluk yükleniyor...
    </div>
  )
});

export default function ForumWrapper() {
  return <ForumClient />;
}
