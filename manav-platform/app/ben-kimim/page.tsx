'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Heart, Clock, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const sections = [
  {
    num: '01',
    title: 'Giriş',
    content: `Ben Psikolog Furkan Manav. Varoluşçu-Psikanalitik yönelimli bir yaklaşımla, yetişkinlere yönelik bireysel psikolojik danışmanlık hizmeti sunmaktayım.

Geçmiş değiştirilemez belki ama geçmişle kurulan ilişki ve bağ değişebilir. Bastırılmış ya da reddedilmiş yaşantılara yer açıldığında, kişi kendi hikâyesine yeni bir anlam kazandırabilir. Varoluşçu Psikanalitik Psikoterapi, bu dönüşümü mümkün kılan derin bir karşılaşmadır.

Terapide kişi; yalnızca ne hissettiğini değil, neden öyle hissettiğini ve düşüncelerinin ardında hangi anlamların gizlendiğini keşfetmeye başlar. Semptomlar çoğu zaman yalnızca birer şikâyet değil, daha derin psikolojik süreçlerin birer yansımasıdır. Bu süreçte, sözcüklerin ötesine geçerek bilinçdışı örüntüleri anlamaya ve kişinin kendi hakikatiyle karşılaşmasına eşlik ediyorum.`,
  },
  {
    num: '02',
    title: 'Terapötik Yaklaşımım',
    content: `Çalışmalarımda Varoluşçu-Psikanalitik kuramı temel alıyorum. Bu yaklaşımda terapist, hazır reçeteler sunan bir otorite değil; danışanın kendi iç dünyasını keşfetmesine alan açan etkin bir dinleyicidir. Terapi odası, eski örüntülerin canlı biçimde ortaya çıktığı ve güvenle çalışılabildiği bir alandır.

Neden Varoluşçu Psikanalitik Bakış?

Yaşamın getirdiği kaygı, yalnızlık, özgürlük ve anlam arayışı gibi temel meseleler; kaçınılması gereken sorunlar değil, insanın kendi hakikatine giden kapılardır. Terapide amacımız bu kapıları kapatmak değil, ardındakileri cesaretle anlamlandırmaktır. Kişinin kendi seçimlerinin sorumluluğunu alabildiği, varoluşunu daha sahici bir yerden kurabildiği bir zemin oluşturmayı hedefliyorum.

Sessizlikler, rüyalar, dil sürçmeleri ve tekrarlayan yaşam temaları çalışmamızın temel malzemelerini oluşturur. Belirtiler (semptomlar), bilinçdışında henüz dile gelmemiş olanı duyurmaya çalışır; biz bu işaretleri birlikte tercüme ederiz.`,
  },
  {
    num: '03',
    title: 'Eğitim ve Deneyim',
    content: `Lisans eğitimimi Bülent Ecevit Üniversitesi Psikoloji Bölümü'nde onur derecesiyle tamamladım. Akademik temelimi, insanın derindeki anlam arayışına ve ruhsal yapısına temas eden Varoluşçu-Psikanalitik Psikoterapi alanındaki uzmanlaşma eğitimleriyle derinleştirdim.

Klinik deneyimimi pratiğimde edindiğim tecrübelerle zenginleştirirken; etik ilkeler gereği ve mesleki derinliğimi korumak adına süpervizyon süreçlerime düzenli olarak devam etmekteyim. Benim için terapi, sadece bir teknik uygulama değil, sürekli devam eden bir öğrenme ve karşılaşma halidir.`,
  },
  {
    num: '04',
    title: 'Çalışma Alanları',
    content: 'list',
    listItems: [
      'Anksiyete ve Kaygı Bozuklukları',
      'Depresyon',
      'Travma ve TSSB',
      'Kayıp ve Yas Süreçleri',
      'İlişki ve İletişim Sorunları',
      'Psikosomatik (Bedensel) Belirtiler',
    ],
  },
  {
    num: '05',
    title: 'Seanslar Hakkında',
    content: 'sessions',
    sessionItems: [
      { label: 'Süre', val: 'Seanslar 45 dakika sürer.' },
      { label: 'Sıklık', val: 'Derin ve kalıcı bir dönüşüm için seanslar genellikle haftada bir veya iki kez olacak şekilde planlanır. Süreç, danışanın ihtiyacına göre birlikte şekillendirilir.' },
      { label: 'Etik', val: 'Tüm süreçler tamamen gizlilik esasına ve mesleki etik ilkelere bağlı kalarak yürütülür.' },
    ],
  },
];

export default function BenKimimPage() {
  const [openSection, setOpenSection] = useState<string | null>('01');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand-light)' }}>
      <title>Ben Kimim | Psikolog Furkan Manav</title>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="eyebrow" style={{ marginBottom: 20 }}>Psikolog • Ankara & Online</div>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.05,
              marginBottom: 24,
            }}
          >
            Ben Kimim?
          </h1>
          <div className="gold-line" style={{ marginBottom: 24 }} />
          <p
            className="crimson"
            style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.1rem', maxWidth: 560 }}
          >
            Varoluşçu-Psikanalitik yönelimli bir psikolog olarak, kişinin kendi iç dünyasını
            keşfetmesine alan açmayı hedefliyorum.
          </p>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 64, paddingBottom: 80 }}>

        {/* Two-column layout: Photo + Intro */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 380px) 1fr',
            gap: 56,
            alignItems: 'start',
            marginBottom: 72,
          }}
          className="ben-kimim-hero-grid"
        >
          {/* Photo Card */}
          <div className="ben-kimim-sidebar" style={{ position: 'sticky', top: 90 }}>
            <div
              style={{
                background: 'white',
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid rgba(201,169,110,0.2)',
                boxShadow: '0 8px 40px rgba(10,22,40,0.1)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3/4',
                  background: 'linear-gradient(160deg, var(--navy) 0%, var(--navy-light) 60%, rgba(201,169,110,0.3) 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="/pskfurkanmanav.jpeg"
                  alt="Psikolog Furkan Manav"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                  onError={(e) => {
                    // fallback: show placeholder if image not found
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px;">
                          <div style="width:120px;height:120px;border-radius:50%;background:rgba(201,169,110,0.15);border:2px solid rgba(201,169,110,0.3);display:flex;align-items:center;justify-content:center;">
                            <span style="font-family:'Playfair Display',serif;font-size:3rem;font-weight:700;color:var(--gold)">F</span>
                          </div>
                          <span style="font-family:'Playfair Display',serif;font-size:1.2rem;color:white;font-weight:600;text-align:center">Furkan Manav</span>
                          <span style="font-size:0.75rem;color:rgba(201,169,110,0.8);letter-spacing:0.2em;text-transform:uppercase;">Psikolog</span>
                        </div>`;
                    }
                  }}
                />
                {/* Gold overlay at bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    background: 'linear-gradient(transparent, rgba(10,22,40,0.6))',
                  }}
                />
              </div>
              <div style={{ padding: '24px 28px' }}>
                <div
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'var(--navy)',
                    marginBottom: 4,
                  }}
                >
                  Furkan Manav
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--gold-dim)',
                    marginBottom: 20,
                  }}
                >
                  Psikolog
                </div>
                <div
                  className="gold-line"
                  style={{ width: '100%', marginBottom: 20 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: <GraduationCap size={15} color="var(--gold-dim)" />, text: 'Bülent Ecevit Üniversitesi' },
                    { icon: <Heart size={15} color="var(--gold-dim)" />, text: 'Varoluşçu-Psikanalitik Terapi' },
                    { icon: <Clock size={15} color="var(--gold-dim)" />, text: '45 dk · Haftada 1-2 seans' },
                    { icon: <Shield size={15} color="var(--gold-dim)" />, text: 'Gizlilik & Etik' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: '0.82rem',
                        color: 'var(--muted)',
                        fontWeight: 500,
                      }}
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/iletisim"
                  className="btn-gold"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 24, display: 'flex' }}
                >
                  İletişime Geç
                </Link>
              </div>
            </div>
          </div>

          {/* Accordion Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sections.map((sec, idx) => {
              const isOpen = openSection === sec.num;
              return (
                <div
                  key={sec.num}
                  style={{
                    borderBottom: '1px solid rgba(201,169,110,0.18)',
                    background: isOpen ? 'white' : 'transparent',
                    transition: 'background 0.3s ease',
                    borderRadius: idx === 0 ? '6px 6px 0 0' : idx === sections.length - 1 ? '0 0 6px 6px' : 0,
                    boxShadow: isOpen ? '0 4px 24px rgba(10,22,40,0.06)' : 'none',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    className="ben-kimim-accordion-btn"
                    onClick={() => setOpenSection(isOpen ? null : sec.num)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20,
                      padding: '24px 28px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      className="ben-kimim-accordion-num"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.6rem',
                        fontWeight: 900,
                        color: isOpen ? 'var(--gold)' : 'rgba(201,169,110,0.3)',
                        lineHeight: 1,
                        minWidth: 44,
                        transition: 'color 0.3s',
                      }}
                    >
                      {sec.num}
                    </span>
                    <span
                      className="ben-kimim-accordion-title"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: isOpen ? 'var(--navy)' : 'var(--charcoal)',
                        flex: 1,
                        transition: 'color 0.3s',
                      }}
                    >
                      {sec.title}
                    </span>
                    <span style={{ color: 'var(--gold-dim)', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 28px 32px 92px' }} className="ben-kimim-content-pad">
                      {sec.content === 'list' ? (
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {sec.listItems?.map((item, i) => (
                            <li
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                fontSize: '1rem',
                                color: 'var(--charcoal)',
                                fontFamily: 'Crimson Text, serif',
                                lineHeight: 1.6,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: 'var(--gold)',
                                  flexShrink: 0,
                                }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : sec.content === 'sessions' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {sec.sessionItems?.map((item, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                gap: 16,
                                padding: '16px 20px',
                                background: 'var(--sand-light)',
                                borderRadius: 4,
                                borderLeft: '3px solid var(--gold)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.15em',
                                  textTransform: 'uppercase',
                                  color: 'var(--gold-dim)',
                                  minWidth: 60,
                                  paddingTop: 2,
                                }}
                              >
                                {item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.95rem',
                                  color: 'var(--charcoal)',
                                  lineHeight: 1.65,
                                  fontFamily: 'Crimson Text, serif',
                                }}
                              >
                                {item.val}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {sec.content.split('\n\n').map((para, i) => (
                            <p
                              key={i}
                              className="crimson"
                              style={{
                                fontSize: '1.05rem',
                                color: i === 0 ? 'var(--charcoal)' : '#444',
                                lineHeight: 1.8,
                                marginBottom: i < sec.content.split('\n\n').length - 1 ? 20 : 0,
                                fontWeight: para.startsWith('Neden') ? 700 : 400,
                                fontStyle: para.startsWith('Neden') ? 'normal' : 'normal',
                              }}
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <div
          className="ben-kimim-cta"
          style={{
            background: 'var(--navy)',
            borderRadius: 8,
            padding: '52px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              background: 'radial-gradient(circle, rgba(201,169,110,0.14) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              className="eyebrow"
              style={{ marginBottom: 12, color: 'var(--gold)' }}
            >
              Seans Almak İster Misiniz?
            </div>
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.2,
              }}
            >
              Kendi hikâyenize yeni bir anlam kazandırmak için buradayım.
            </h2>
          </div>
          <div className="ben-kimim-cta-buttons" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <Link href="/iletisim" className="btn-gold">
              İletişime Geç
            </Link>
            <Link href="/forum" className="btn-ghost">
              Topluluğa Katıl
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
