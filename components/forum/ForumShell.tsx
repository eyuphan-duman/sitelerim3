'use client';

/**
 * Forum sayfalarının ortak kabuğu: sol menü, sağ sütun, mobil alt menü,
 * mobil çekmece, misafir bandı ve tema. Akış, profil ve bildirimler bunu kullanır.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Home, Search, Bell, Users, Bookmark, User, Settings, Sun, Moon, Feather, LogOut, Heart, Trophy, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { Avatar, LogosMark, useForumTheme } from './ui';
import { WhoToFollowPanel } from './WhoToFollow';
import { WeeklyLeaders } from './Scores';
import { loadRecentPosts } from './social';
import { ConfirmHost } from './confirm';
import { InteractionsHost } from './Interactions';
import './forum.css';

export type NavKey = 'home' | 'explore' | 'notif' | 'following' | 'saved' | 'profile' | 'settings' | 'leaders' | 'contact';

export type ShellApi = {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
  openAuth: () => void;
  openDrawer: () => void;
  isMember: boolean;
  myUsername: string;
  myProfileHref: string;
};

type Props = {
  active?: NavKey | null;
  /** Varsayılan gezinme yerine sayfa içi davranış (ör. akışta sekme değiştirmek) */
  onNav?: Partial<Record<NavKey, () => void>>;
  onCompose?: () => void;
  /** Sağ sütunun üst kısmı (arama + gündem); verilmezse varsayılan kullanılır */
  asideTop?: React.ReactNode;
  hideFab?: boolean;
  children: React.ReactNode | ((api: ShellApi) => React.ReactNode);
};

function skipSplash() {
  try {
    sessionStorage.setItem('forum_skip_splash', 'true');
    sessionStorage.setItem('forum_splash_shown', '1');
  } catch {}
}

function useTrends() {
  const [trends, setTrends] = useState<{ tag: string; count: number }[]>([]);
  useEffect(() => {
    let on = true;
    loadRecentPosts().then(posts => {
      if (!on) return;
      const counts: Record<string, { tag: string; count: number }> = {};
      posts.forEach((p: any) => {
        const tags = new Set<string>((p.body?.match(/#([a-zA-Z0-9ğıüşöçİĞÜŞÖÇ_]+)/g) || []).map((t: string) => t.slice(1)));
        tags.forEach(t => {
          const k = t.toLocaleLowerCase('tr-TR');
          (counts[k] ||= { tag: t, count: 0 }).count++;
        });
      });
      setTrends(Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5));
    });
    return () => { on = false; };
  }, []);
  return trends;
}

export default function ForumShell({ active = null, onNav, onCompose, asideTop, hideFab, children }: Props) {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [isDark, toggleTheme, setTheme] = useForumTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  useEffect(() => { if (!authOpen) setAuthMode('signin'); }, [authOpen]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState('');
  const trends = useTrends();

  const isMember = Boolean(user && !user.isAnonymous);
  const myUsername = userProfile?.username || (user?.displayName || '').toLowerCase().replace(/\s+/g, '') || (user?.email ? user.email.split('@')[0].toLowerCase() : '') || user?.uid || '';
  const myProfileHref = myUsername ? `/forum/profil/${encodeURIComponent(myUsername)}` : '/forum';
  const myName = userProfile?.displayName || user?.displayName || '';
  const myPhoto = userProfile?.photoURL || user?.photoURL || '';

  useEffect(() => {
    if (!isMember || !user) { setUnread(0); return; }
    return onSnapshot(query(collection(db, 'notifications'), where('toUid', '==', user.uid), where('read', '==', false)), s => setUnread(s.size));
  }, [isMember, user]);

  // Alt bileşenler giriş gerektiğinde bu olayı yayınlar
  useEffect(() => {
    const open = () => setAuthOpen(true);
    window.addEventListener('forum:need-auth', open);
    return () => window.removeEventListener('forum:need-auth', open);
  }, []);

  const go = (href: string) => { skipSplash(); router.push(href); };
  const needMember = (fn: () => void) => () => (isMember ? fn() : setAuthOpen(true));

  const defaults: Record<NavKey, () => void> = {
    home: () => go('/forum'),
    explore: () => go('/forum?q=open'),
    notif: needMember(() => go('/bildirimler')),
    following: needMember(() => go('/forum?feed=following')),
    saved: needMember(() => go(`${myProfileHref}?tab=bookmarks`)),
    leaders: () => go('/forum/liderler'),
    contact: () => go('/forum/iletisim'),
    profile: needMember(() => go(myProfileHref)),
    settings: needMember(() => go(`${myProfileHref}?settings=open`)),
  };
  const nav = (k: NavKey) => () => {
    if (onNav?.[k] && (k === 'home' || k === 'explore' || isMember)) onNav[k]!();
    else defaults[k]();
  };
  const compose = () => (onCompose ? onCompose() : isMember ? go('/forum?compose=open') : setAuthOpen(true));

  const api: ShellApi = useMemo(() => ({
    isDark, toggleTheme, setTheme,
    openAuth: () => setAuthOpen(true),
    openDrawer: () => setDrawerOpen(true),
    isMember, myUsername, myProfileHref,
  }), [isDark, toggleTheme, setTheme, isMember, myUsername, myProfileHref]);

  const items: { key: NavKey; label: string; icon: any; badge?: number }[] = [
    { key: 'home', label: 'Ana sayfa', icon: Home },
    { key: 'explore', label: 'Keşfet', icon: Search },
    { key: 'notif', label: 'Bildirimler', icon: Bell, badge: unread },
    { key: 'following', label: 'Takip ettiklerin', icon: Users },
    { key: 'leaders', label: 'Liderlik', icon: Trophy },
    { key: 'saved', label: 'Yer işaretleri', icon: Bookmark },
    { key: 'profile', label: 'Profil', icon: User },
    { key: 'settings', label: 'Ayarlar', icon: Settings },
    { key: 'contact', label: 'İletişim', icon: Mail },
  ];

  return (
    <div data-forum-page="true" data-forum-dark={isDark ? 'true' : 'false'}>
      <EmailVerificationBanner isDark={isDark} />

      <div className="fx-shell">
        <nav className="fx-nav" aria-label="Logos menüsü">
          <Link href="/" className="fx-logo" title="Web sitesine dön">
            <span className="fx-logo-full"><LogosMark height={44} /></span>
            <span className="fx-logo-icon"><LogosMark variant="icon" height={34} /></span>
          </Link>

          {items.map(({ key, label, icon: Icon, badge }) => (
            <button key={key} type="button" className={`fx-nav-item ${active === key ? 'is-active' : ''}`} onClick={nav(key)} aria-current={active === key ? 'page' : undefined} title={label}>
              <Icon size={26} strokeWidth={active === key ? 2.4 : 1.8} />
              {badge ? <span className="fx-dot-count">{badge > 99 ? '99+' : badge}</span> : null}
              <span className="fx-nav-label">{label}</span>
            </button>
          ))}

          <button type="button" className="fx-nav-item" onClick={toggleTheme} title={isDark ? 'Açık tema' : 'Koyu tema'}>
            {isDark ? <Sun size={26} strokeWidth={1.8} /> : <Moon size={26} strokeWidth={1.8} />}
            <span className="fx-nav-label">{isDark ? 'Açık tema' : 'Koyu tema'}</span>
          </button>

          <button type="button" className="fx-post-cta" onClick={compose}>
            <span className="fx-cta-label">Gönderi paylaş</span>
            <Feather size={22} className="fx-cta-icon" />
          </button>

          {isMember && (
            <div className="fx-me">
              <Link href={myProfileHref} onClick={skipSplash} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, color: 'inherit', textDecoration: 'none' }} title="Profilin">
                <Avatar src={myPhoto} name={myName} size={40} />
                <span className="fx-me-text">
                  <div className="fx-me-name">{myName || 'Profilin'}</div>
                  <div className="fx-me-handle">@{myUsername}</div>
                </span>
              </Link>
              <button
                type="button"
                className="fx-icon-btn"
                title="Çıkış yap"
                aria-label="Çıkış yap"
                onClick={async () => { try { await logout(); toast.success('Çıkış yapıldı'); } catch (e: any) { toast.error('Çıkış yapılamadı: ' + e.message); } }}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </nav>

        <main className="fx-main">
          {typeof children === 'function' ? children(api) : children}
        </main>

        <aside className="fx-aside" aria-label="Gündem ve öneriler">
          {asideTop ?? (
            <>
              <form className="fx-aside-search" onSubmit={e => { e.preventDefault(); if (q.trim()) go(`/forum?search=${encodeURIComponent(q.trim())}`); }}>
                <label className="fx-search">
                  <Search size={18} />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Forumda ara" aria-label="Forumda ara" />
                </label>
              </form>
              {trends.length > 0 && (
                <section className="fx-panel">
                  <h2 className="fx-panel-title">Gündem</h2>
                  {trends.map(({ tag, count }) => (
                    <Link key={tag} href={`/forum?tag=${encodeURIComponent(tag)}`} onClick={skipSplash} className="fx-panel-row">
                      <span className="fx-trend-tag">#{tag}</span>
                      <small>{count} gönderi</small>
                    </Link>
                  ))}
                </section>
              )}
            </>
          )}

          <WeeklyLeaders />
          <WhoToFollowPanel onNeedAuth={() => setAuthOpen(true)} />

          <nav className="fx-legal" aria-label="Site bağlantıları">
            <Link href="/">Web sitesi</Link>
            <Link href="/yazilarim">Yazılar</Link>
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/kullanici-sozlesmesi">Kullanıcı sözleşmesi</Link>
            <Link href="/iletisim">İletişim</Link>
            <span>© {new Date().getFullYear()} Furkan Manav</span>
          </nav>
        </aside>
      </div>

      {!isMember && (
        <div className="fx-guest-band">
          <div className="fx-guest-inner">
            <div className="fx-guest-copy">
              <strong>Sohbete katıl</strong>
              <span>Soru sor, psikologların ve topluluğun yanıtlarını oku.</span>
            </div>
            <div className="fx-guest-actions">
              <button type="button" className="fx-btn fx-btn-ghost" onClick={() => { setAuthMode('signin'); setAuthOpen(true); }}>Giriş yap</button>
              <button type="button" className="fx-btn fx-btn-solid" onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>Kayıt ol</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fx-tabbar" aria-label="Mobil menü">
        {([
          { key: 'home', icon: Home, label: 'Ana sayfa' },
          { key: 'explore', icon: Search, label: 'Ara' },
          { key: 'following', icon: Users, label: 'Takip ettiklerin' },
          { key: 'notif', icon: Bell, label: unread ? `Bildirimler, ${unread} okunmamış` : 'Bildirimler' },
          { key: 'profile', icon: User, label: 'Profil' },
        ] as { key: NavKey; icon: any; label: string }[]).map(({ key, icon: Icon, label }) => (
          <button key={key} type="button" className={`fx-tabbar-btn ${active === key ? 'is-active' : ''}`} onClick={nav(key)} aria-label={label}>
            <Icon size={26} strokeWidth={active === key ? 2.4 : 1.8} />
            {key === 'notif' && unread > 0 && <span className="fx-tabbar-dot" />}
          </button>
        ))}
      </nav>

      {drawerOpen && (
        <div className="fx-drawer-scrim" onClick={() => setDrawerOpen(false)}>
          <aside className="fx-drawer" onClick={e => e.stopPropagation()} aria-label="Menü">
            <div className="fx-drawer-me">
              {isMember ? (
                <Link href={myProfileHref} onClick={() => { skipSplash(); setDrawerOpen(false); }} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Avatar src={myPhoto} name={myName} size={44} />
                  <div className="fx-drawer-me-name">{myName || 'Profilin'}</div>
                  <div className="fx-drawer-me-handle">@{myUsername}</div>
                </Link>
              ) : (
                <>
                  <LogosMark height={40} />
                  <p style={{ color: 'var(--fx-ink-2)', fontSize: '.92rem', lineHeight: 1.5, margin: '12px 0 14px' }}>
                    Logos'ta psikoloji ve psikanaliz üzerine soru sor, tartış, uzmanlardan yanıt al.
                  </p>
                  <button type="button" className="fx-btn fx-btn-primary" style={{ width: '100%' }} onClick={() => { setDrawerOpen(false); setAuthOpen(true); }}>
                    Giriş yap veya kayıt ol
                  </button>
                </>
              )}
            </div>

            {isMember && (
              <div style={{ paddingTop: 6 }}>
                {[
                  { label: 'Profil', icon: User, href: myProfileHref },
                  { label: 'Takip ettiklerin', icon: Users, href: '/forum?feed=following' },
                  { label: 'Liderlik', icon: Trophy, href: '/forum/liderler' },
                  { label: 'Yer işaretleri', icon: Bookmark, href: `${myProfileHref}?tab=bookmarks` },
                  { label: 'Beğendiklerin', icon: Heart, href: `${myProfileHref}?tab=likes` },
                  { label: 'Ayarlar', icon: Settings, href: `${myProfileHref}?settings=open` },
                ].map(({ label, icon: Icon, href }) => (
                  <button key={label} type="button" className="fx-drawer-link" onClick={() => { setDrawerOpen(false); go(href); }}>
                    <Icon size={24} strokeWidth={1.8} /> {label}
                  </button>
                ))}
              </div>
            )}

            <button type="button" className="fx-drawer-link" onClick={() => { setDrawerOpen(false); go('/forum/iletisim'); }}>
              <Mail size={24} strokeWidth={1.8} /> İletişim
            </button>

            <div className="fx-drawer-sub">
              <Link href="/" className="fx-drawer-link" onClick={() => setDrawerOpen(false)}>Web sitesine dön</Link>
              <button type="button" className="fx-drawer-link" onClick={toggleTheme}>{isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}</button>
              {isMember && (
                <button type="button" className="fx-drawer-link is-danger" onClick={() => { setDrawerOpen(false); logout(); }}>Çıkış yap</button>
              )}
            </div>
          </aside>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} isDark={isDark} initialMode={authMode} />
      <ConfirmHost />
      <InteractionsHost />
    </div>
  );
}
