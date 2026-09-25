'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilRedirectPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || user.isAnonymous) {
      router.replace('/forum');
      return;
    }
    const uname = userProfile?.username || (user.displayName || '').toLowerCase().replace(/\s+/g, '') || (user.email ? user.email.split('@')[0].toLowerCase().replace(/\s+/g, '') : '') || user.uid;
    if (uname) {
      router.replace(`/forum/profil/${encodeURIComponent(uname)}`);
    } else {
      router.replace('/forum');
    }
  }, [user, userProfile, loading, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.95rem' }}>
      Profil yükleniyor...
    </div>
  );
}
