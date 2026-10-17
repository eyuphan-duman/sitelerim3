import Link from 'next/link';
import s from '../gizlilik/gizlilik.module.css';

export const metadata = {
  title: 'Hesabını Sil — Logos',
  description: 'Logos psikoloji forumu hesabını ve verilerini nasıl silebileceğin.',
};

const MAIL = 'pskfurkan.manav@gmail.com';

export default function HesapSilmePage() {
  return (
    <div className={s.page}>
      <div className="page-header">
        <div className="page-header-inner">
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.2rem,5vw,3.6rem)', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: 24 }}>
            Hesabını sil
          </h1>
          <div className="gold-line" style={{ marginBottom: 24 }} />
          <p className="crimson" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', maxWidth: 560 }}>
            Logos — Psikoloji Forumu (Psikolog Furkan Manav)
          </p>
        </div>
      </div>

      <div className={s.wrap}>
        <p className={s.lead}>
          Logos hesabını uygulamanın içinden kendin silebilir ya da bizden silmemizi isteyebilirsin.
        </p>

        <section className={s.section}>
          <h2>Uygulamadan ya da siteden silmek</h2>
          <ul>
            <li>Logos&apos;ta giriş yap ve alttaki menüden <b>Profil</b>&apos;e dokun.</li>
            <li>Profilindeki dişli simgesine dokunarak <b>Ayarlar</b>&apos;ı aç.</li>
            <li><b>Hesap</b> bölümüne gir ve <b>Hesabı sil</b>&apos;i seç.</li>
            <li>Şifreni gir (Google ile kayıt olduysan Google hesabınla doğrula), onaylamak için kutuya <b>SİL</b> yaz ve silmeyi onayla.</li>
          </ul>
          <p>Silme işlemi hemen gerçekleşir. Aynı e-posta adresiyle daha sonra yeniden kayıt olabilirsin.</p>
        </section>

        <section className={s.section}>
          <h2>Bizden silmemizi istemek</h2>
          <p>
            Uygulamaya giremiyorsan ya da tüm verilerinin tamamen silinmesini istiyorsan, hesabına kayıtlı e-posta adresinden{' '}
            <a href={`mailto:${MAIL}?subject=Hesap%20silme%20talebi`}>{MAIL}</a> adresine &quot;Hesap silme talebi&quot; konulu bir e-posta gönder.
            Mesajına kullanıcı adını da yaz. Talebini en geç 30 gün içinde yerine getirir ve sana e-postayla bildiririz.
          </p>
        </section>

        <section className={s.section}>
          <h2>Neler silinir</h2>
          <h3>Uygulamadan sildiğinde hemen</h3>
          <ul>
            <li>Giriş bilgilerin; bu hesapla bir daha giriş yapılamaz</li>
            <li>Adın, kullanıcı adın, profil ve kapak fotoğrafın, biyografin</li>
            <li>Profilin &quot;Silinmiş Hesap&quot; olarak gösterilir ve gönderilerin akışlarda görünmez</li>
          </ul>
          <h3>E-postayla istediğinde ayrıca</h3>
          <ul>
            <li>E-posta adresin, ad soyadın ve doğum tarihin</li>
            <li>Gönderilerin, yanıtların, beğenilerin, takip ve engelleme kayıtların, bildirimlerin</li>
            <li>Yüklediğin fotoğraflar</li>
          </ul>
          <h3>Saklanabilecek olanlar</h3>
          <ul>
            <li>Yasal bir yükümlülük ya da kötüye kullanım incelemesi gerektirdiğinde, ilgili kayıtlar yalnızca bu süre boyunca ve en fazla 1 yıl saklanır.</li>
          </ul>
          <p className={s.note}>
            Ayrıntılar için <Link href="/gizlilik">Gizlilik Politikası</Link>&apos;na bakabilirsin.
          </p>
        </section>

        <div className={s.back}>
          <Link href="/forum">← Foruma dön</Link>
          <Link href="/gizlilik">Gizlilik politikası</Link>
          <Link href="/iletisim">İletişim</Link>
        </div>
      </div>
    </div>
  );
}
