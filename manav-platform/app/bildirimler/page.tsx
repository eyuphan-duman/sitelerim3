'use client';
import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, MessageCircle, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'comment' | 'reaction' | 'mention';
  fromUser: string;
  fromUsername: string;
  postId: string;
  postTitle?: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function BildirimlerPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.isAnonymous) { setLoading(false); return; }
    const q = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
  };

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const iconFor = (type: string) => {
    if (type === 'reaction') return <Heart size={16} className="text-red-400" />;
    if (type === 'mention') return <span className="text-blue-400 font-bold text-sm">@</span>;
    return <MessageCircle size={16} className="text-blue-400" />;
  };

  if (!user || user.isAnonymous) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', paddingTop: 80 }}>
        <div style={{ textAlign: 'center' }}>
          <Bell size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bildirimleri görmek için giriş yapın</h1>
          <Link href="/forum" style={{ color: '#1d9bf0', marginTop: 16, display: 'block' }}>← Foruma Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', paddingTop: 80 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 16px', borderBottom: '1px solid #eaeaea', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/forum" style={{ color: '#111', display: 'flex' }}><ArrowLeft size={22} /></Link>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111' }}>Bildirimler</h1>
          </div>
          {notifications.some(n => !n.read) && (
            <button onClick={markAllRead} style={{ fontSize: '0.85rem', color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Tümünü okundu işaretle
            </button>
          )}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Yükleniyor...</div>}

        {!loading && notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            <Bell size={40} color="#ddd" style={{ margin: '0 auto 12px' }} />
            <p>Henüz bildirim yok</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.map(n => (
            <Link
              key={n.id}
              href={`/forum`}
              onClick={() => markRead(n.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '16px 12px',
                borderBottom: '1px solid #f1f1f1',
                background: n.read ? 'white' : '#eff6ff',
                textDecoration: 'none',
                transition: 'background 0.2s',
                borderRadius: 8,
                marginBottom: 4
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {iconFor(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.95rem', color: '#111', margin: 0, lineHeight: 1.5 }}>
                  <strong>@{n.fromUsername}</strong> {n.message}
                </p>
                {n.postTitle && (
                  <p style={{ fontSize: '0.82rem', color: '#888', margin: '4px 0 0' }}>
                    &quot;{n.postTitle}&quot;
                  </p>
                )}
                <p style={{ fontSize: '0.78rem', color: '#aaa', margin: '4px 0 0' }}>
                  {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d9bf0', flexShrink: 0, marginTop: 6 }} />}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
