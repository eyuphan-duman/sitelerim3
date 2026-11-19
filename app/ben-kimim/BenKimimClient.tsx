'use client';
import React from 'react';
import Link from 'next/link';
import { GraduationCap, Heart, Clock, Shield, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';

const chapters = [
  {
    id: 'giris',
    num: '01',
    roman: 'I',
    eyebrow: 'Biyografi & Perspektif',
    title: 'Giriş',
    paragraphs: [
      'Ben Psikolog Furkan Manav. Varoluşçu-Psikanalitik yönelimli bir yaklaşımla, yetişkinlere yönelik bireysel psikolojik danışmanlık hizmeti sunmaktayım.',
      'Geçmiş değiştirilemez belki ama geçmişle kurulan ilişki ve bağ değişebilir. Bastırılmış ya da reddedilmiş yaşantılara yer açıldığında, kişi kendi hikâyesine yeni bir anlam kazandırabilir. Varoluşçu Psikanalitik Psikoterapi, bu dönüşümü mümkün kılan derin bir karşılaşmadır.',
      'Terapide kişi; yalnızca ne hissettiğini değil, neden öyle hissettiğini ve düşüncelerinin ardında hangi anlamların gizlendiğini keşfetmeye başlar. Semptomlar çoğu zaman yalnızca birer şikâyet değil, daha derin psikolojik süreçlerin birer yansımasıdır. Bu süreçte, sözcüklerin ötesine geçerek bilinçdışı örüntüleri anlamaya ve kişinin kendi hakikatiyle karşılaşmasına eşlik ediyorum.',
    ],
    pullQuote: 'Geçmiş değiştirilemez belki ama geçmişle kurulan ilişki ve bağ değişebilir.',
  },
  {
    id: 'yaklasim',
    num: '02',
    roman: 'II',
    eyebrow: 'Kuramsal Çerçeve',
    title: 'Terapötik Yaklaşımım',
    subtitle: 'Neden Varoluşçu Psikanalitik Bakış?',
    paragraphs: [
      'Çalışmalarımda Varoluşçu-Psikanalitik kuramı temel alıyorum. Bu yaklaşımda terapist, hazır reçeteler sunan bir otorite değil; danışanın kendi iç dünyasını keşfetmesine alan açan etkin bir dinleyicidir. Terapi odası, eski örüntülerin canlı biçimde ortaya çıktığı ve güvenle çalışılabildiği bir alandır.',
      'Yaşamın getirdiği kaygı, yalnızlık, özgürlük ve anlam arayışı gibi temel meseleler; kaçınılması gereken sorunlar değil, insanın kendi hakikatine giden kapılardır. Terapide amacımız bu kapıları kapatmak değil, ardındakileri cesaretle anlamlandırmaktır. Kişinin kendi seçimlerinin sorumluluğunu alabildiği, varoluşunu daha sahici bir yerden kurabildiği bir zemin oluşturmayı hedefliyorum.',
      'Sessizlikler, rüyalar, dil sürçmeleri ve tekrarlayan yaşam temaları çalışmamızın temel malzemelerini oluşturur. Belirtiler (semptomlar), bilinçdışında henüz dile gelmemiş olanı duyurmaya çalışır; biz bu işaretleri birlikte tercüme ederiz.',
    ],
  },
  {
    id: 'egitim',
    num: '03',
    roman: 'III',
    eyebrow: 'Akademik & Klinik Geçmiş',
    title: 'Eğitim ve Deneyim',
    paragraphs: [
      'Lisans eğitimimi Bülent Ecevit Üniversitesi Psikoloji Bölümü’nde onur derecesiyle tamamladım. Akademik temelimi, insanın derindeki anlam arayışına ve ruhsal yapısına temas eden Varoluşçu-Psikanalitik Psikoterapi alanındaki uzmanlaşma eğitimleriyle derinleştirdim.',
      'Klinik deneyimimi pratiğimde edindiğim tecrübelerle zenginleştirirken; etik ilkeler gereği ve mesleki derinliğimi korumak adına süpervizyon süreçlerime düzenli olarak devam etmekteyim. Benim için terapi, sadece bir teknik uygulama değil, sürekli devam eden bir öğrenme ve karşılaşma halidir.',
    ],
  },
];

const workingAreas = [
  { no: 'I', title: 'Anksiyete ve Kaygı Bozuklukları', desc: 'Varoluşsal kaygı, panik süreçleri, belirsizlik tahammülsüzlüğü ve içsel huzursuzluk.' },
  { no: 'II', title: 'Depresyon ve Anlam Kaybı', desc: 'Çökkün duygudurum, isteksizlik, boşluk hissi ve yaşamla kurulan bağın zayıflaması.' },
  { no: 'III', title: 'Travma ve TSSB', desc: 'Geçmişteki sarsıcı yaşantıların bugünkü ilişki ve benlik algısı üzerindeki izleri.' },
  { no: 'IV', title: 'Kayıp ve Yas Süreçleri', desc: 'Sevilen birinin, bir ilişkinin ya da bir yaşam döneminin ardından tutulan yasın işlenmesi.' },
  { no: 'V', title: 'İlişki ve Bağlanma Sorunları', desc: 'Tekrarlayan ilişki döngüleri, sınır koyma güçlükleri, terk edilme ve yakınlık korkusu.' },
  { no: 'VI', title: 'Psikosomatik (Bedensel) Belirtiler', desc: 'Söze dökülemeyen ruhsal çatışmaların beden üzerinden ifade bulduğu süreçler.' },
];

const sessionSpecs = [
  {
    no: '01',
    label: 'Seans Süresi',
    title: '45 Dakika',
    val: 'Her bir seans standart psikanalitik çerçeveye uygun olarak 45 dakika sürer.',
  },
  {
    no: '02',
    label: 'Seans Sıklığı',
    title: 'Haftada 1 veya 2 Kez',
    val: 'Derin ve kalıcı bir dönüşüm için seanslar haftada bir veya iki kez olacak şekilde, danışanın ihtiyacına göre birlikte planlanır.',
  },
  {
    no: '03',
    label: 'Çerçeve & Gizlilik',
    title: 'Etik İlkeler',
    val: 'Tüm görüşmeler (Çankaya, Polatlı ve Online) tam gizlilik esasına ve mesleki etik ilkelere bağlı kalarak yürütülür.',
  },
];

export default function BenKimimClient() {
  return (
    <div className="ed-page">
      {/* ── ÜST KAPAK (MASTHEAD) ── */}
      <header className="ed-hero">
        <div className="hx-grain" aria-hidden="true" />
        <div className="hm-wrap">
          <div className="ed-hero-bar">
            <span className="ed-hero-eyebrow">Psikolog · Varoluşçu-Psikanalitik Psikoterapi</span>
            <span className="ed-hero-rule" aria-hidden="true" />
            <span className="ed-hero-place">Çankaya · Polatlı · Online</span>
          </div>

          <div className="ed-hero-grid">
            <div>
              <h1 className="ed-hero-title">Hakkımda</h1>
              <p className="ed-hero-sub">
                Varoluşçu-Psikanalitik yönelimli bir psikolog olarak, kişinin kendi iç dünyasını, bilinçdışı örüntülerini ve yaşamındaki özgün anlamı keşfetmesine alan açmayı hedefliyorum.
              </p>
            </div>
            <div className="ed-hero-actions">
              <Link href="/iletisim" className="hx-btn">
                <span>Seans & İletişim</span>
                <ArrowRight size={15} strokeWidth={1.6} />
              </Link>
              <Link href="/yazilarim" className="hx-link">
                Yazılarımı İnceleyin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── ANA GÖVDE (SOL SABİT PORTRE & SAĞ EDİTORYAL BÖLÜMLER) ── */}
      <div className="hm-wrap ed-body">
        <div className="bk-layout">
          {/* Sol Sütun: Karanlık Oda Portre Levhası & Künye */}
          <aside className="bk-sidebar">
            <div className="bk-card">
              <div className="bk-portrait-wrap">
                <div className="hx-photo bk-photo">
                  <img
                    src="/pskfurkanmanav.jpeg"
                    alt="Psikolog Furkan Manav"
                  />
                  <div className="hx-photo-tone" aria-hidden="true" />
                </div>
              </div>

              <div className="bk-card-body">
                <div className="bk-card-head">
                  <h2>Furkan Manav</h2>
                  <span>Psikolog · Ankara & Online</span>
                </div>

                <dl className="bk-credentials">
                  <div>
                    <dt><GraduationCap size={14} /> Eğitim</dt>
                    <dd>Bülent Ecevit Üniversitesi Psikoloji (Onur Derecesi)</dd>
                  </div>
                  <div>
                    <dt><Heart size={14} /> Yönelim</dt>
                    <dd>Varoluşçu-Psikanalitik Psikoterapi</dd>
                  </div>
                  <div>
                    <dt><Clock size={14} /> Seans Çerçevesi</dt>
                    <dd>45 Dakika · Haftada 1–2 Seans</dd>
                  </div>
                  <div>
                    <dt><MapPin size={14} /> Çalışma Biçimi</dt>
                    <dd>Çankaya, Polatlı & Online Görüşme</dd>
                  </div>
                  <div>
                    <dt><Shield size={14} /> İlkeler</dt>
                    <dd>Mesleki Etik, Gizlilik & Düzenli Süpervizyon</dd>
                  </div>
                </dl>

                <nav className="bk-toc" aria-label="Sayfa Bölümleri">
                  <span className="bk-toc-label">İçindekiler</span>
                  <a href="#giris"><span>01</span> Giriş</a>
                  <a href="#yaklasim"><span>02</span> Terapötik Yaklaşımım</a>
                  <a href="#egitim"><span>03</span> Eğitim ve Deneyim</a>
                  <a href="#calisma-alanlari"><span>04</span> Çalışma Alanları</a>
                  <a href="#seanslar"><span>05</span> Seanslar Hakkında</a>
                </nav>

                <Link href="/iletisim" className="hm-btn-dark bk-sidebar-cta">
                  <span>Görüşme Talebi Oluştur</span>
                  <ArrowUpRight size={15} strokeWidth={1.6} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Sağ Sütun: Açık Editoryal Bölümler (01 — 05) */}
          <div className="bk-chapters">
            {chapters.map((ch) => (
              <article key={ch.id} id={ch.id} className="bk-chapter">
                <div className="bk-chapter-bar">
                  <span className="bk-chapter-no">Bölüm {ch.num}</span>
                  <span className="bk-chapter-eyebrow">{ch.eyebrow}</span>
                  <span className="bk-chapter-roman">{ch.roman}</span>
                </div>

                <h2 className="bk-chapter-title">{ch.title}</h2>
                {ch.subtitle && <p className="bk-chapter-subtitle">{ch.subtitle}</p>}

                <div className="bk-chapter-prose">
                  {ch.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {ch.pullQuote && (
                  <blockquote className="bk-pullquote">
                    <p>“{ch.pullQuote}”</p>
                  </blockquote>
                )}
              </article>
            ))}

            {/* Bölüm 04: Çalışma Alanları */}
            <article id="calisma-alanlari" className="bk-chapter">
              <div className="bk-chapter-bar">
                <span className="bk-chapter-no">Bölüm 04</span>
                <span className="bk-chapter-eyebrow">Klinik Odak</span>
                <span className="bk-chapter-roman">IV</span>
              </div>

              <h2 className="bk-chapter-title">Çalışma Alanları</h2>
              <p className="bk-chapter-subtitle">
                Yetişkin bireysel psikoterapi sürecinde sıklıkla çalıştığım başlıca temalar:
              </p>

              <div className="bk-areas-grid">
                {workingAreas.map((area) => (
                  <div key={area.no} className="bk-area-item">
                    <span className="bk-area-no">{area.no}.</span>
                    <div>
                      <h3>{area.title}</h3>
                      <p>{area.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Bölüm 05: Seanslar Hakkında */}
            <article id="seanslar" className="bk-chapter">
              <div className="bk-chapter-bar">
                <span className="bk-chapter-no">Bölüm 05</span>
                <span className="bk-chapter-eyebrow">Terapi Çerçevesi</span>
                <span className="bk-chapter-roman">V</span>
              </div>

              <h2 className="bk-chapter-title">Seanslar Hakkında</h2>
              <p className="bk-chapter-subtitle">
                Terapötik sürecin işleyişi, sürekliliği ve etik sınırları:
              </p>

              <div className="bk-sessions-grid">
                {sessionSpecs.map((sp) => (
                  <div key={sp.no} className="bk-session-card">
                    <div className="bk-session-top">
                      <span>{sp.label}</span>
                      <span>{sp.no}</span>
                    </div>
                    <h3>{sp.title}</h3>
                    <p>{sp.val}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        {/* Alt Çağrı Levhası */}
        <div className="bk-bottom-banner">
          <div>
            <span className="bk-bottom-eyebrow">Varoluşçu · Psikanalitik Psikoterapi</span>
            <h2>Kendi hikâyenize yeni bir anlam kazandırmak için buradayım.</h2>
          </div>
          <div className="bk-bottom-actions">
            <Link href="/iletisim" className="hx-btn">
              <span>İletişime Geçin</span>
              <ArrowRight size={15} strokeWidth={1.6} />
            </Link>
            <Link href="/forum" className="hx-link">
              Logos Psikoloji Forumu’na Katılın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
