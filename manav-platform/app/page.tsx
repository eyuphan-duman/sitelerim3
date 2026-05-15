'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Quote, Search, X, FileText, MessageCircle, User } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { LOCAL_ARTICLES } from '@/data/local-articles';

const stripHtml = (html: string) => {
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

const truncateText = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  const sub = text.slice(0, limit);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace === -1) return sub + '...';
  return sub.slice(0, lastSpace) + '...';
};

export default function HomePage() {
  const { user } = useAuth();
  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];
  const [searchOpen, setSearchOpen] = useState(false);
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const QUOTES = [
    { text: "Varoluş özden önce gelir. Siz kim olacağınızı kendi eylemlerinizle belirliyorsunuz.", author: "Jean-Paul Sartre" },
    { text: "Kendi alevinle yanmaya hazır olmalısın; önce kül olmadan nasıl yeniden doğabilirsin ki?", author: "Friedrich Nietzsche" },
    { text: "Bir insanın yaşayabileceği en büyük keşif, kendi zihninin derinlikleridir.", author: "Sigmund Freud" },
    { text: "Acı çekmeden bilinç uyanmaz. İnsanlar aydınlanmayı ışığı hayal ederek değil, karanlığı idrak ederek bulurlar.", author: "Carl Jung" },
    { text: "Anlam bulmak, varoluşun en derin ihtiyacıdır.", author: "Viktor Frankl" },
    { text: "İfade edilmemiş duygular asla ölmez; sadece diri diri gömülür ve sonradan daha korkunç şekillerde tezahür ederler.", author: "Sigmund Freud" }
  ];
  const [dailyQuote, setDailyQuote] = useState(QUOTES[0]);

  useEffect(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    setDailyQuote(QUOTES[dayOfYear % QUOTES.length]);
  }, []);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const snap = await getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(10)));
        const fbArticles = snap.docs.map(d => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null) };
        });

        const combined = [...fbArticles, ...LOCAL_ARTICLES]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2);

        setLatestArticles(combined);
      } catch (e) {
        console.error("Error fetching latest articles:", e);
      }
    }
    fetchLatest();
  }, []);



  useEffect(() => {
    if (!searchOpen) { setSearchQ(''); setSearchResults([]); return; }
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const q = searchQ.toLowerCase();
        const [forumSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'forum'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'users'), limit(50))),
        ]);
        const results: any[] = [];
        
        // Static content search
        const staticPages = [
          { title: 'Hakkımda', excerpt: 'Varoluşçu-Psikanalitik yönelimli bir psikolog olarak, kişinin kendi iç dünyasını keşfetmesine alan açmayı hedefliyorum.', type: 'page', href: '/ben-kimim' },
          { title: 'İletişim & Randevu', excerpt: 'Terapötik sürece başlamak veya detaylı bilgi almak için iletişime geçebilirsiniz. Polatlı / Ankara.', type: 'page', href: '/iletisim' },
          { title: 'Videolarım', excerpt: 'Psikoloji, psikanaliz ve varoluşçuluk üzerine hazırladığım video içerikleri.', type: 'page', href: '/videolarim' }
        ];
        
        staticPages.forEach(p => {
          if (p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)) {
            results.push({ ...p, id: p.href });
          }
        });


        forumSnap.docs.forEach(d => {
          const data = d.data();
          if ((data.body||'').toLowerCase().includes(q) || (data.authorName||'').toLowerCase().includes(q) || (data.category||'').toLowerCase().includes(q))
            results.push({ id: d.id, type: 'forum', title: data.authorName, excerpt: data.body?.slice(0, 100), category: data.category, href: '/forum?thread=' + d.id });
        });
        usersSnap.docs.forEach(d => {
          const data = d.data();
          if ((data.displayName||'').toLowerCase().includes(q) || (data.username||'').toLowerCase().includes(q) || (data.bio||'').toLowerCase().includes(q))
            results.push({ id: d.id, type: 'profile', title: data.displayName || 'Kullanıcı', excerpt: data.bio?.slice(0, 100) || `@${data.username}`, href: `/forum/profil/${data.username}` });
        });
        
        setSearchResults(results.slice(0, 10));
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQ]);



  const stats = [
    { n: '8+', label: 'Yıllık Deneyim' },
    { n: '100+', label: 'Yayınlanmış İçerik' },
    { n: '2', label: 'Ankara & Online' },
    { n: '4', label: 'Psikanalitik Çalışmalar' },
  ];

  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        {/* Background image */}
        <Image src="/hero-bg.jpg" alt="Psikolog Furkan Manav" fill priority quality={100} unoptimized={true} className="hero-image" style={{ objectFit: 'cover', objectPosition: 'top center' }} />
        <div className="hero-overlay" />
        <div className="hero-grain" />

        {/* Hero Float Badges (Desktop Only) */}
        <div className="absolute top-[10%] right-[6%] hidden xl:flex flex-col gap-4 z-10">
          {/* Badge 1 — Varoluşçu Psikoterapi */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 transform hover:scale-105 hover:bg-white/18 transition-all duration-300 w-60">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/20">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=200&auto=format&fit=crop" alt="Varoluşçu Psikoterapi" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.58rem] text-white/60 uppercase tracking-widest font-bold mb-0.5">Anlam Arayışı</div>
              <div className="font-serif text-base font-bold leading-tight">Varoluşçu<br/>Psikoterapi</div>
            </div>
          </div>
          {/* Badge 2 — Psikanalitik */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 translate-x-10 transform hover:scale-105 hover:bg-white/18 transition-all duration-300 w-60">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/20">
              <img src="https://images.unsplash.com/photo-1580130601254-05fa235abeab?q=80&w=200&auto=format&fit=crop" alt="Psikanalitik" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.58rem] text-white/60 uppercase tracking-widest font-bold mb-0.5">Bilinçdışı</div>
              <div className="font-serif text-base font-bold leading-tight">Psikanalitik<br/>Çalışmalar</div>
            </div>
          </div>
          {/* Badge 3 — Rüya Analizi */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 transform hover:scale-105 hover:bg-white/18 transition-all duration-300 w-60">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/20">
              <img src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=200&auto=format&fit=crop" alt="Rüya Analizi" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.58rem] text-white/60 uppercase tracking-widest font-bold mb-0.5">Rüya Analizi</div>
              <div className="font-serif text-base font-bold leading-tight">Bilinçdışı<br/>Semboller</div>
            </div>
          </div>
          {/* Badge 4 — Bağlanma */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 translate-x-6 transform hover:scale-105 hover:bg-white/18 transition-all duration-300 w-60">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/20">
              <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=200&auto=format&fit=crop" alt="Bağlanma Kuramı" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.58rem] text-white/60 uppercase tracking-widest font-bold mb-0.5">Bağlanma Kuramı</div>
              <div className="font-serif text-base font-bold leading-tight">İlişki<br/>Dinamikleri</div>
            </div>
          </div>
          {/* Badge 5 — Travma */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 transform hover:scale-105 hover:bg-white/18 transition-all duration-300 w-60">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/20">
              <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop" alt="Travma" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.58rem] text-white/60 uppercase tracking-widest font-bold mb-0.5">Travma Psikolojisi</div>
              <div className="font-serif text-base font-bold leading-tight">İyileşme<br/>Süreci</div>
            </div>
          </div>
          {/* Badge 6 — Kendilik */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 translate-x-8 transform hover:scale-105 hover:bg-white/18 transition-all duration-300 w-60">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/20">
              <img src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200&auto=format&fit=crop" alt="Kendilik" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.58rem] text-white/60 uppercase tracking-widest font-bold mb-0.5">Kendilik Psikolojisi</div>
              <div className="font-serif text-base font-bold leading-tight">Narsisizm<br/>Araştırmaları</div>
            </div>
          </div>
        </div>



        <div className="container-main" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          <div style={{ maxWidth: 680 }}>
            {/* Eyebrow (Desktop) */}
            <div className="eyebrow fade-up fade-up-1 hidden md:block" style={{ marginBottom: 28 }}>
              Varoluşçu · Psikanalitik · Psikoterapi
            </div>

            {/* Main title */}
            <h1 className="display-title fade-up fade-up-2" style={{ fontSize: 'clamp(3rem,7vw,5.5rem)', marginBottom: 28 }}>
              Kendinizi
              <br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Anlama</em> Yolculuğu
            </h1>

            {/* Sub */}
            <p className="crimson fade-up fade-up-3" style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(1rem, 4vw, 1.22rem)', maxWidth: 540, marginBottom: 44, lineHeight: 1.7, overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'auto', WebkitHyphens: 'auto' }}>
              Varoluşçu-psikanalitik yaklaşımla ilgili derinlemesine incelemeler, forum tartışmaları ve yazılar.
              Bilinçdışının katmanlarını keşfederek özgün bir anlam inşa edin.
            </p>

            {/* CTA */}
            <div className="fade-up fade-up-4" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <Link href="/forum" className="btn-gold" style={{ position: 'relative' }}>
                Foruma Katıl
                <span style={{ position: 'absolute', top: -8, right: -8, fontSize: '0.55rem', background: 'var(--navy)', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 900, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>BETA</span>
              </Link>
              <Link href="/iletisim" className="btn-ghost">İletişime Geçin <ArrowRight size={14}/></Link>
            </div>

            {/* Eyebrow (Mobile) */}
            <div className="eyebrow fade-up fade-up-1 block md:hidden" style={{ marginBottom: 40, textAlign: 'center', opacity: 0.8 }}>
              Varoluşçu · Psikanalitik · Psikoterapi
            </div>

            {/* Search bar */}
            <div className="fade-up fade-up-4" style={{ marginBottom: 64 }}>
              <button
                onClick={() => setSearchOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '14px 24px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', width: '100%', maxWidth: 420, transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                <Search size={16} />
                <span>Site içinde ara — yazılar, forum, içerikler...</span>
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em' }}>⌘K</span>
              </button>
            </div>


          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'fadeIn 2s ease 1s both' }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(180deg,transparent,rgba(201,169,110,0.6))' }}/>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'fadeIn 1s ease infinite alternate' }}/>
        </div>
      </section>

      {/* ══════════════════ ABOUT ══════════════════ */}
      <section style={{ padding: '112px 0', background: 'white' }}>
        <div className="container-main">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: 20 }}>Hakkımda</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.1, marginBottom: 28 }}>
              Furkan Manav,
              <br/>
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Psikolog</em>
            </h2>
            <div className="gold-line" style={{ marginBottom: 32, margin: '0 auto' }}/>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36, textAlign: 'left' }}>
              {[
                "Ben Psikolog Furkan Manav. Varoluşçu-Psikanalitik yönelimli bir yaklaşımla, yetişkinlere yönelik bireysel psikolojik danışmanlık hizmeti sunmaktayım.",
                "Geçmiş değiştirilemez belki ama geçmişle kurulan ilişki ve bağ değişebilir. Bastırılmış ya da reddedilmiş yaşantılara yer açıldığında, kişi kendi hikâyesine yeni bir anlam kazandırabilir. Varoluşçu Psikanalitik Psikoterapi, bu dönüşümü mümkün kılan derin bir karşılaşmadır.",
                "Terapide kişi; yalnızca ne hissettiğini değil, neden öyle hissettiğini ve düşüncelerinin ardında hangi anlamların gizlendiğini keşfetmeye başlar. Semptomlar çoğu zaman yalnızca birer şikâyet değil, daha derin psikolojik süreçlerin birer yansımasıdır. Bu süreçte, sözcüklerin ötesine geçerek bilinçdışı örüntüleri anlamaya ve kişinin kendi hakikatiyle karşılaşmasına eşlik ediyorum."
              ].map((p, i) => (
                <p key={i} className="crimson" style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.75, textAlign: 'center' }}>{p}</p>
              ))}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
              {['Psikanaliz','Varoluşçu Yaklaşım','Felsefe','Topluluk','Videolarım','Blog','Forum'].map(t => (
                <span key={t} className="tag-navy">{t === 'Videolarım' ? (
                  <Link href="/videolarim" style={{ textDecoration: 'none', color: 'inherit' }}>{t}</Link>
                ) : t}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <Link href="/forum" className="btn-gold">
                Topluluğa Katıl
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* ══════════════════ LATEST ARTICLES ══════════════════ */}
      {latestArticles.length > 0 && (
        <section style={{ padding: '80px 0', background: '#f8fafc' }}>
          <div className="container-main">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--gold-dim)' }}>Güncel İçerikler</div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem,3.5vw,2.6rem)', fontWeight: 700, color: 'var(--navy)' }}>Son Makaleler</h2>
              </div>
              <Link href="/yazilarim" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--navy)', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Tümünü Gör <ArrowRight size={14}/>
              </Link>
            </div>
            <div className="yz-grid">
              {latestArticles.map(a => (
                <Link href={`/yazilarim/${a.id}`} key={a.id} className="article-card" style={{ textDecoration: 'none' }}>
                  {a.featuredImage && (
                    <div className="article-card-image">
                      <img src={a.featuredImage} alt={a.title} loading="lazy" />
                    </div>
                  )}
                  <div className="article-card-body">
                    <div className="article-card-meta">
                      {a.category && <span className="article-card-category">{a.category}</span>}
                      {a.createdAt && <span className="article-card-date">{format(new Date(a.createdAt), 'd MMM yyyy', { locale: tr })}</span>}
                    </div>
                    <h3 className="article-card-title">{a.title}</h3>
                    {a.excerpt && <p className="article-card-excerpt">{a.excerpt}</p>}
                    <span className="article-card-btn">Makaleyi Oku <ArrowRight size={14} className="article-card-btn-arrow" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ QUOTE CTA ══════════════════ */}
      <section style={{ padding: '120px 0', background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,169,110,0.08),transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,169,110,0.06),transparent 70%)', pointerEvents: 'none' }}/>

        <div className="container-main" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Quote size={36} color="var(--gold)" style={{ margin: '0 auto 28px', opacity: 0.7 }}/>
          <blockquote className="crimson" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(1.4rem,3vw,2.1rem)', fontStyle: 'italic', maxWidth: 780, margin: '0 auto 20px', lineHeight: 1.6 }}>
            "{dailyQuote.text}"
          </blockquote>
          <p style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 56 }}>
            {dailyQuote.author}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Yalnızca yazılara ve düşüncelere alan tanıyan bu platformda tartışmalara katılın.
          </p>
          <Link href="/forum" className="btn-gold" style={{ position: 'relative' }}>
            Foruma Git
            <span style={{ position: 'absolute', top: -8, right: -8, fontSize: '0.55rem', background: '#fff', color: 'var(--navy)', padding: '2px 6px', borderRadius: 4, fontWeight: 900, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>BETA</span>
          </Link>
        </div>
      </section>

      {/* ══════════════════ GLOBAL SEARCH MODAL ══════════════════ */}
      {searchOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh', padding: '10vh 20px 20px' }}
          onClick={() => setSearchOpen(false)}
        >
          <div style={{ width: '100%', maxWidth: 640, background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <Search size={20} color="#94a3b8" />
              <input
                ref={searchRef}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Yazı, forum gönderisi, konu ara..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1.05rem', color: '#0f172a', background: 'transparent' }}
              />
              {searching && <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={20} /></button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Results */}
            {searchResults.length > 0 && (
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {searchResults.map((r, i) => (
                  <Link key={i} href={r.href} onClick={() => setSearchOpen(false)} style={{ display: 'flex', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f8fafc', textDecoration: 'none', transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = '#f8fafc')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: r.type === 'profile' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : r.type === 'post' ? 'linear-gradient(135deg,#0f172a,#1e293b)' : r.type === 'page' ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {r.type === 'profile' ? <User size={16} color="white" /> : r.type === 'post' ? <FileText size={16} color="white" /> : r.type === 'page' ? <ArrowRight size={16} color="white" /> : <MessageCircle size={16} color="white" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                        <span style={{ background: r.type === 'profile' ? '#fef3c7' : r.type === 'post' ? '#f1f5f9' : r.type === 'page' ? '#e0f2fe' : '#ede9fe', color: r.type === 'profile' ? '#b45309' : r.type === 'post' ? '#475569' : r.type === 'page' ? '#0369a1' : '#7c3aed', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', flexShrink: 0 }}>{r.type === 'profile' ? 'Kullanıcı' : r.type === 'post' ? 'Yazı' : r.type === 'page' ? 'Sayfa' : (r.category || 'Forum')}</span>
                      </div>
                      <p style={{ fontSize: '0.83rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{r.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {searchQ && !searching && searchResults.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 700 }}>"<em>{searchQ}</em>" için sonuç bulunamadı</p>
              </div>
            )}

            {!searchQ && (
              <div style={{ padding: '24px 20px' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Hızlı Bağlantılar</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[{ label: 'Videolarım', href: '/videolarim', icon: '🎬' }, { label: 'Forum', href: '/forum', icon: '💬' }, { label: 'Hakkımda', href: '/ben-kimim', icon: '🧠' }, { label: 'İletişim', href: '/iletisim', icon: '📬' }].map(l => (
                    <Link key={l.href} href={l.href} onClick={() => setSearchOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: '#334155', fontSize: '0.92rem', fontWeight: 500, transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = '#f8fafc')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ fontSize: '1.1rem' }}>{l.icon}</span> {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', marginTop: 16 }}>ESC veya dışarı tıklayarak kapat</p>
        </div>
      )}
    </>
  );
}
