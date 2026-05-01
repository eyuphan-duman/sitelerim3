'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user } = useAuth();
  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];
  const [realPosts, setRealPosts] = useState<any[]>([]);
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
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3));
        const snap = await getDocs(q);
        setRealPosts(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })));
      } catch (err) {
        console.error(err);
      }
    }
    fetchLatest();
  }, []);

  const deletePost = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (confirm('Emin misin?')) {
      try {
        await deleteDoc(doc(db, 'posts', id));
        setRealPosts(prev => prev.filter(p => p.id !== id));
        toast.success('Kaldırıldı.');
      } catch (err) {
        toast.error('Hata oluştu.');
      }
    }
  };

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
        <div className="absolute top-[12%] right-[8%] hidden xl:flex flex-col gap-5 z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 transform hover:scale-105 transition-transform duration-300 w-64">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-inner border border-white/30">
              <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200&auto=format&fit=crop" alt="Varoluşçu" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.65rem] text-white/70 uppercase tracking-widest font-bold mb-1">Anlam Arayışı</div>
              <div className="font-serif text-lg font-bold leading-tight">Varoluşçu<br/>Psikoterapi</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 translate-x-12 transform hover:scale-105 transition-transform duration-300 w-64">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-inner border border-white/30">
              <img src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=200&auto=format&fit=crop" alt="Psikanalitik" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.65rem] text-white/70 uppercase tracking-widest font-bold mb-1">Bilinçdışı</div>
              <div className="font-serif text-lg font-bold leading-tight">Psikanalitik<br/>Çalışmalar</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 transform hover:scale-105 transition-transform duration-300 w-64">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-inner border border-white/30">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" alt="Rüya Analizi" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.65rem] text-white/70 uppercase tracking-widest font-bold mb-1">Rüya Analizi</div>
              <div className="font-serif text-base font-bold leading-tight">Bilinçdışı<br/>Semboller</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 translate-x-8 transform hover:scale-105 transition-transform duration-300 w-64">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-inner border border-white/30">
              <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=200&auto=format&fit=crop" alt="Bağlanma" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.65rem] text-white/70 uppercase tracking-widest font-bold mb-1">Bağlanma Kuramı</div>
              <div className="font-serif text-base font-bold leading-tight">İlişki<br/>Dinamikleri</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 transform hover:scale-105 transition-transform duration-300 w-64">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-inner border border-white/30">
              <img src="https://images.unsplash.com/photo-1493836512294-502baa1986e2?q=80&w=200&auto=format&fit=crop" alt="Travma" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.65rem] text-white/70 uppercase tracking-widest font-bold mb-1">Travma Psikolojisi</div>
              <div className="font-serif text-base font-bold leading-tight">İyileşme<br/>Süreci</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex items-center gap-4 translate-x-10 transform hover:scale-105 transition-transform duration-300 w-64">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-inner border border-white/30">
              <img src="https://images.unsplash.com/photo-1509909756405-be0199881695?q=80&w=200&auto=format&fit=crop" alt="Kendilik" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[0.65rem] text-white/70 uppercase tracking-widest font-bold mb-1">Kendilik Psikolojisi</div>
              <div className="font-serif text-base font-bold leading-tight">Narsisizm<br/>Araştırmaları</div>
            </div>
          </div>
        </div>

        <div className="container-main" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          <div style={{ maxWidth: 680 }}>
            {/* Eyebrow */}
            <div className="eyebrow fade-up fade-up-1" style={{ marginBottom: 28 }}>
              Varoluşçu · Psikanalitik · Psikoterapi
            </div>

            {/* Main title */}
            <h1 className="display-title fade-up fade-up-2" style={{ fontSize: 'clamp(3rem,7vw,5.5rem)', marginBottom: 28 }}>
              Kendinizi
              <br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Anlama</em> Yolculuğu
            </h1>

            {/* Sub */}
            <p className="crimson fade-up fade-up-3" style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.22rem', maxWidth: 540, marginBottom: 44, lineHeight: 1.7 }}>
              Varoluşçu-psikanalitik yaklaşımla ilgili derinlemesine incelemeler, forum tartışmaları ve yazılar.
              Bilinçdışının katmanlarını keşfederek özgün bir anlam inşa edin.
            </p>

            {/* CTA */}
            <div className="fade-up fade-up-4" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 64 }}>
              <Link href="/forum" className="btn-gold">
                Foruma Katıl
              </Link>
              <Link href="/iletisim" className="btn-ghost">
                İletişime Geçin <ArrowRight size={14}/>
              </Link>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36, textAlign: 'left' }}>
              {[
                "Zonguldak Bülent Ecevit Üniversitesi Psikoloji Bölümü'nden lisans derecesine sahibim. Düşünsel arka planımla varoluşçu çerçevede içerikler üretmekteyim.",
                "Bağımsız bir platformda freudiyen düşünceler ile varoluşsal temaları birleştirerek dijital topluluklara değer kazandırmaktayım. Psikoterapi ve psikanaliz üzerine yönelimimle insan doğasının derinliklerine ışık tutmayı hedefliyorum."
              ].map((p, i) => (
                <p key={i} className="crimson" style={{ color: 'var(--muted)', fontSize: '1.05rem', textAlign: 'center' }}>{p}</p>
              ))}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
              {['Psikanaliz','Varoluşçu Yaklaşım','Felsefe','Topluluk','Blog','Forum'].map(t => (
                <span key={t} className="tag-navy">{t}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <Link href="/forum" className="btn-gold">
                Topluluğa Katıl
              </Link>
              <Link href="/yazilarim" className="btn-dark-outline">
                Yazıları İncele
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ LATEST POSTS ══════════════════ */}
      <section style={{ padding: '112px 0', background: 'var(--sand-light)' }}>
        <div className="container-main">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Son Paylaşımlar</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 700, color: 'var(--navy)' }}>Yazılarım</h2>
            </div>
            <Link href="/yazilarim" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--navy)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Tüm Yazılar <ArrowRight size={14}/>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {realPosts.length === 0 && <div className="text-gray-400 italic">Henüz yayınlanan bir makale bulunmuyor.</div>}
            {realPosts.map(p => (
              <a href={`/yazilarim`} key={p.id} className="post-card group flex flex-col overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-300 aspect-square rounded-2xl border border-gray-100">
                {/* Header Section */}
                <div className="h-[45%] p-8 relative overflow-hidden flex flex-col justify-center" style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy-light) 100%)' }}>
                  <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[rgba(201,169,110,0.08)] group-hover:scale-125 transition-transform duration-700"/>
                  <div className="flex justify-between items-start z-10">
                    <span className="tag-gold text-xs px-3 py-1 mb-3">{p.category}</span>

                  </div>
                  <h3 className="font-serif text-white text-xl md:text-2xl font-bold leading-tight line-clamp-2">
                    {p.title}
                  </h3>
                </div>
                {/* Body Section */}
                <div className="flex-1 p-8 flex flex-col justify-between bg-white">
                  <p className="crimson text-gray-500 text-[1.05rem] leading-relaxed line-clamp-4">
                    {p.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-medium">{format(new Date(p.date), 'd MMM yyyy', { locale: tr })}</span>
                    <span className="text-[var(--gold-dim)] text-xs font-bold tracking-widest uppercase flex items-center gap-2 group-hover:gap-3 transition-all">
                      OKU <ArrowRight size={12}/>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

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
          <Link href="/forum" className="btn-gold">
            Foruma Git
          </Link>
        </div>
      </section>
    </>
  );
}
