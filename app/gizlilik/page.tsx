import Link from 'next/link';

export const metadata = {
  title: 'Gizlilik Politikası — Psikolog Furkan Manav',
  description: 'Furkan Manav psikoloji platformu gizlilik politikası ve kişisel veri işleme aydınlatma metni.',
};

export default function GizlilikPage() {
  const date = '24 Nisan 2025';

  const sections = [
    {
      title: '1. Veri Sorumlusu',
      content: `Bu gizlilik politikası, Psikolog Furkan Manav ("Veri Sorumlusu") tarafından işletilen pskfurkanmanav.com web platformuna ait olup 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) çerçevesinde hazırlanmıştır.

İletişim: pskfurkan.manav@gmail.com | +90 507 875 15 03`
    },
    {
      title: '2. Toplanan Kişisel Veriler',
      content: `Platform üzerinden şu kişisel veriler toplanmaktadır:

• **Kimlik Bilgileri:** Ad, soyad, kullanıcı adı
• **İletişim Bilgileri:** E-posta adresi, telefon numarası
• **Hesap Bilgileri:** Firebase ile kimlik doğrulama bilgileri (Google OAuth dahil)
• **İçerik Verileri:** Forum gönderileri, yorumlar, paylaşılan içerikler
• **Teknik Veriler:** IP adresi, tarayıcı türü, kullanım günlükleri (Firebase Analytics)`
    },
    {
      title: '3. Verilerin Kullanım Amaçları',
      content: `Toplanan veriler yalnızca aşağıdaki amaçlarla işlenmektedir:

• Kullanıcı hesabı oluşturma ve kimlik doğrulama
• Forum ve blog içeriklerinin yönetilmesi
• İletişim sorularına yanıt verilmesi
• Hizmet kalitesinin iyileştirilmesi
• Yasal yükümlülüklerin yerine getirilmesi

Verileriniz hiçbir koşulda üçüncü şahıslara satılmaz veya ticari amaçla kullanılmaz.`
    },
    {
      title: '4. Veri Saklama ve Güvenlik',
      content: `Tüm veriler Google Firebase altyapısında (Firestore, Firebase Storage, Firebase Auth) saklanmaktadır. Google'ın güvenlik standartları ve ISO 27001 sertifikası kapsamında korunmaktadır.

• Forum içerikleri: Kullanıcı silme talebine kadar saklanır
• İletişim mesajları: 1 yıl süreyle saklanır
• Hesap verileri: Hesap silinene kadar saklanır`
    },
    {
      title: '5. Çerezler (Cookies)',
      content: `Bu site zorunlu teknik çerezler kullanmaktadır:

• **Oturum Çerezleri:** Firebase Authentication oturumunu sürdürmek için kullanılır (zorunlu)
• **Tercih Çerezleri:** Kullanıcı arayüzü tercihlerini hatırlamak için kullanılır

Çerezleri tarayıcı ayarlarınızdan reddedebilirsiniz; ancak bu durumda bazı özellikler çalışmayabilir.`
    },
    {
      title: '6. Üçüncü Taraf Hizmetler',
      content: `Platform şu üçüncü taraf hizmetleri kullanmaktadır:

• **Google Firebase:** Kimlik doğrulama, veritabanı ve depolama (Google Gizlilik Politikası geçerlidir)
• **Google Maps:** İletişim sayfasındaki konum haritası için (Google Gizlilik Politikası geçerlidir)
• **EmailJS / SMTP:** İletişim formundan gelen mesajları iletmek için

Bu hizmetlerin gizlilik politikalarını ayrıca incelemenizi öneririz.`
    },
    {
      title: '7. KVKK Kapsamındaki Haklarınız',
      content: `6698 sayılı KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:

• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• Verilerin işlenme amacını ve bunların amaca uygun kullanılıp kullanılmadığını öğrenme
• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
• Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme
• Verilerin silinmesini veya yok edilmesini isteme
• Otomatik sistemler aracılığıyla analiz edilmesi suretiyle aleyhinize bir sonuç ortaya çıkmasına itiraz etme

Bu haklarınızı kullanmak için **pskfurkan.manav@gmail.com** adresine yazılı başvurabilirsiniz.`
    },
    {
      title: '8. Çocukların Gizliliği',
      content: `Bu platform, 18 yaşın altındaki bireylere yönelik değildir. 18 yaşından küçük kişilerden bilerek kişisel veri toplanmamaktadır. Böyle bir durumun farkına varılması halinde ilgili veriler derhal silinecektir.`
    },
    {
      title: '9. Politika Değişiklikleri',
      content: `Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler platformda duyurulacak ve son güncelleme tarihi burada belirtilecektir.

**Son Güncelleme:** ${date}`
    },
    {
      title: '10. İletişim ve Başvuru',
      content: `Gizlilik politikamızla ilgili soru, şikayet veya talepleriniz için:

E-posta: pskfurkan.manav@gmail.com
Telefon: +90 507 875 15 03
Adres: Polatlı/Ankara & Çankaya/Ankara

Başvurularınız en geç 30 gün içinde yanıtlanacaktır.`
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand-light)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="eyebrow" style={{ marginBottom: 20 }}>KVKK Uyumlu</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: 24 }}>
            Gizlilik Politikası
          </h1>
          <div className="gold-line" style={{ marginBottom: 24 }} />
          <p className="crimson" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', maxWidth: 520 }}>
            Son güncelleme: {date}
          </p>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 64, paddingBottom: 80, maxWidth: 800 }}>
        {/* Intro box */}
        <div style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.25)', borderLeft: '4px solid var(--gold)', borderRadius: 4, padding: '20px 24px', marginBottom: 48 }}>
          <p style={{ color: 'var(--navy)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Kişisel verilerinizin güvenliği ve gizliliği bizim için önceliklidir. Bu politika, hangi verileri topladığımızı, nasıl kullandığımızı ve KVKK kapsamındaki haklarınızı açıklamaktadır.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sections.map((section, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: 36, marginBottom: 36 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
                {section.title}
              </h2>
              <div style={{ color: '#444', fontSize: '0.93rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {section.content.split('\n').map((line, j) => {
                  const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return (
                    <p key={j} style={{ marginBottom: line === '' ? 8 : 0 }}
                      dangerouslySetInnerHTML={{ __html: boldLine }} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Back link */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 20 }}>
          <Link href="/" style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Anasayfaya Dön
          </Link>
          <Link href="/iletisim" style={{ color: 'var(--gold-dim)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            İletişim →
          </Link>
        </div>
      </div>
    </div>
  );
}
