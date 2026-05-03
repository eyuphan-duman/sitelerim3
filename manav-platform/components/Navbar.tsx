'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const links = [
  { href: '/', label: 'Anasayfa' },
  { href: '/ben-kimim', label: 'Ben Kimim' },
  { href: '/yazilarim', label: 'Yazılarım' },
  { href: '/videolarim', label: 'Videolarım' },
  { href: '/forum', label: 'Forum' },
  { href: '/iletisim', label: 'İletişim' },
];

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!user || user.isAnonymous) { setUnreadCount(0); return; }
    const q = query(collection(db, 'notifications'), where('toUid', '==', user.uid), where('read', '==', false));
    return onSnapshot(q, snap => setUnreadCount(snap.size));
  }, [user]);
  const isProfilePage = pathname?.startsWith('/forum/profil');

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const forceSolid = pathname === '/forum' || pathname === '/yazilarim' || pathname === '/videolarim';

  return (
    <>
      {!isProfilePage && (
        <nav className={`navbar ${scrolled || forceSolid ? 'navbar-scrolled' : 'navbar-transparent'}`}>
          <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 20 }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>
              Furkan Manav
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginTop: 3 }}>
              Psikolog
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex" style={{ gap: 36, alignItems: 'center' }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? 'nav-link-active' : ''}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 14 }}>
            {user ? (
              <>
                {!user.isAnonymous && (
                  <Link href="/bildirimler" style={{ position: 'relative', color: 'white', display: 'flex' }}>
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: -7, right: -7, background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 800, width: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </Link>
                )}
                <Link href={`/forum/profil/${encodeURIComponent(userProfile?.username || user.displayName?.toLowerCase().replace(/\s+/g,'') || '')}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }} className="hover:opacity-80 transition-opacity">
                  <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', transition: 'color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#fca5a5')}
                  onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                  <LogOut size={13}/> Çıkış
                </button>
              </>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="btn-gold" style={{ padding: '10px 22px', fontSize: '0.72rem' }}>
                Giriş / Üye Ol
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden" onClick={() => setOpen(!open)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
            {open ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>

        </nav>
      )}

      {/* Mobile menu (Moved outside nav to guarantee top-level stacking) */}
      {!isProfilePage && open && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: '#0a1628', borderTop: '1px solid var(--border)', padding: '24px 28px 32px', zIndex: 999999 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} className="nav-link" style={{ fontSize: '1rem', padding: '8px 0', display: 'block', borderBottom: '1px solid rgba(201,169,110,0.1)' }} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div style={{ paddingTop: 12 }}>
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Link href={`/forum/profil/${encodeURIComponent(userProfile?.username || user.displayName?.toLowerCase().replace(/\s+/g,'') || '')}`} className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOpen(false)}>
                    Profilim
                  </Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: '#fca5a5', borderColor: 'rgba(252,165,165,0.2)' }}>
                    <LogOut size={14}/> Çıkış Yap
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthOpen(true); setOpen(false); }} className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                  Giriş / Üye Ol
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
