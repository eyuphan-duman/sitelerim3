import Link from 'next/link';
import s from './gizlilik.module.css';

export const metadata = {
  title: 'Gizlilik Politikası — Psikolog Furkan Manav',
  description: 'Hangi bilgileri topladığımız, kimlerin görebildiği, hesabını nasıl koruduğumuz ve KVKK kapsamındaki hakların.',
};

const UPDATED = '17 Ekim 2026';
const MAIL = 'pskfurkan.manav@gmail.com';

const TOC = [
  ['sorumlu', 'Veri sorumlusu'],
  ['bilgiler', 'Hangi bilgileri tutuyoruz, kim görebilir'],
  ['hesap', 'Hesabını nasıl koruyoruz'],
  ['forum', 'Forumda kontrol sende'],
  ['kurallar', 'Veritabanı kuralları'],
  ['cerezler', 'Çerezler ve ölçüm'],
  ['hizmetler', 'Kullandığımız hizmetler'],
  ['saklama', 'Saklama süresi ve hesabı silme'],
  ['haklar', 'KVKK kapsamındaki hakların'],
  ['cocuklar', '18 yaş sınırı'],
  ['degisiklik', 'Değişiklikler ve iletişim'],
] as const;

export default function GizlilikPage() {
  return (
    <div className={s.page}>
      <div className="page-header">
        <div className="page-header-inner">
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: 24 }}>
            Gizlilik Politikası
          </h1>
          <div className="gold-line" style={{ marginBottom: 24 }} />
          <p className="crimson" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', maxWidth: 560 }}>
            Son güncelleme: {UPDATED}
          </p>
        </div>
      </div>

      <div className={s.wrap}>
        <p className={s.lead}>
          Bu sayfa, pskfurkanmanav.com ve Logos forumunda hangi bilgilerini tuttuğumuzu, bu bilgileri kimlerin görebildiğini
          ve onları nasıl koruduğumuzu anlatır. Metin 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki
          aydınlatma yükümlülüğümüz için de geçerlidir.
        </p>

        <div className={s.short}>
          <h2>Kısaca</h2>
          <ul>
            <li><b>E-posta adresin, ad soyadın ve doğum tarihin herkese açık değil.</b> Bunları yalnızca sen ve site yöneticisi görebilir.</li>
            <li><b>Kullanıcı adıyla giriş yaptığında e-postan ekrana gelmez.</b> Eşleştirme sunucuda yapılır.</li>
            <li><b>Forumda neyin görüneceğine sen karar verirsin.</b> Gizli hesap, yanıt izni ve engelleme seçeneklerin var.</li>
            <li><b>Verilerini satmıyoruz</b> ve reklam için kimseyle paylaşmıyoruz.</li>
            <li><b>Reklam çerezleri yalnızca onay verirsen çalışır.</b></li>
          </ul>
        </div>

        <nav className={s.toc} aria-label="İçindekiler">
          <b>İçindekiler</b>
          <ol>
            {TOC.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
          </ol>
        </nav>

        <section id="sorumlu" className={s.section}>
          <h2>1. Veri sorumlusu</h2>
          <p>
            Bu site, Psikolog Furkan Manav tarafından işletilir. KVKK kapsamında veri sorumlusu odur.
            Gizlilikle ilgili her konuda <a href={`mailto:${MAIL}`}>{MAIL}</a> adresine yazabilirsin.
          </p>
        </section>

        <section id="bilgiler" className={s.section}>
          <h2>2. Hangi bilgileri tutuyoruz, kim görebilir</h2>
          <p>Yalnızca siteyi ve forumu çalıştırmak için gereken bilgileri tutuyoruz.</p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr><th>Bilgi</th><th>Kim görebilir</th></tr>
              </thead>
              <tbody>
                <tr><td>Görünen ad, kullanıcı adı, profil ve kapak fotoğrafı, biyografi, konum, web sitesi</td><td>Herkes. Bunlar profilinde gösterilir.</td></tr>
                <tr><td>E-posta adresi, ad soyad, doğum tarihi</td><td>Yalnızca sen ve site yöneticisi. Ayrı ve kapalı bir kayıtta tutulur, profilinle birlikte yayınlanmaz.</td></tr>
                <tr><td>Şifre</td><td>Kimse. Şifren Google Firebase tarafından şifrelenmiş olarak saklanır, biz de göremeyiz.</td></tr>
                <tr><td>Gönderiler, yanıtlar, beğeniler, yeniden paylaşımlar</td><td>Herkes. Hesabın gizliyse yalnızca takipçilerin.</td></tr>
                <tr><td>Takip ettiklerin ve takipçilerin</td><td>Herkes. Hesabın gizliyse yalnızca takipçilerin.</td></tr>
                <tr><td>Kaydettiğin gönderiler ve bildirimlerin</td><td>Yalnızca sen.</td></tr>
                <tr><td>Engellediğin kişiler</td><td>Engelleme listeni yalnızca sen görürsün. Engellediğin kişiye bildirim gitmez, ama profilini açarsa engellendiğini görür.</td></tr>
                <tr><td>İsimsiz paylaştığın gönderiler ve bu gönderilere verdiğin yanıtlar</td><td>İçerik herkese açıktır ama kimin paylaştığı gösterilmez. Gönderinin sana ait olduğunu yalnızca sen ve site yöneticisi bilir. Yönetici bu bilgiyi yalnızca kötüye kullanım ve yasal zorunluluk durumlarında kullanır.</td></tr>
                <tr><td>Gönderi taslakların</td><td>Yalnızca sen. Taslaklar sunucuya gönderilmez, kaydettiğin cihazın tarayıcısında kalır.</td></tr>
                <tr><td>Şikayetler, iletişim formu mesajları, randevu talepleri</td><td>Yalnızca site yöneticisi.</td></tr>
                <tr><td>Psikolog başvurusundaki e-Devlet mezun belgesi</td><td>Yalnızca site yöneticisi, yalnızca başvuruyu doğrulamak için. Başvuru onaylandığında ya da reddedildiğinde belge sistemden otomatik olarak kalıcı biçimde silinir.</td></tr>
              </tbody>
            </table>
          </div>
          <p className={s.note}>
            Telefon numaranı ve randevu bilgilerini yalnızca bize iletişim ya da randevu formuyla kendin gönderirsen alırız.
          </p>
        </section>

        <section id="hesap" className={s.section}>
          <h2>3. Hesabını nasıl koruyoruz</h2>
          <ul>
            <li><b>Kullanıcı adıyla giriş:</b> Kullanıcı adını yazdığında e-posta adresin sunucumuzda bulunur ve giriş orada tamamlanır. Adresin tarayıcıya ya da başka bir kullanıcıya gönderilmez.</li>
            <li><b>Şifre sıfırlama:</b> Sıfırlama bağlantısı yalnızca sitede kayıtlı ve gerçekten e-posta alabilen bir adrese gönderilir. Kullanıcı adıyla istenirse adres ekranda yalnızca kısmen gösterilir (ör. ab•••@gmail.com).</li>
            <li><b>Şifre kuralları:</b> Şifren en az 6 karakter olmalı ve en az bir rakam içermeli. Ayrıca güç göstergesinde en az &quot;Orta&quot; seviyesine ulaşmalı.</li>
            <li><b>E-posta doğrulama:</b> E-posta adresini doğrulamadan gönderi paylaşamaz ve yanıt yazamazsın. Böylece başkası senin adresinle hesap açıp içerik paylaşamaz.</li>
            <li><b>Güvenli bağlantı:</b> Site her zaman şifreli bağlantıyla (HTTPS) açılır. Başka sitelerin sayfamızı kendi içinde göstermesi engellenir.</li>
            <li><b>Dosya yükleme:</b> Yalnızca resim, PDF ve video kabul edilir. Boyut sınırı resim ve PDF için 10 MB, video için 100 MB.</li>
          </ul>
        </section>

        <section id="forum" className={s.section}>
          <h2>4. Forumda kontrol sende</h2>
          <p>Bu ayarların çoğu forumda profilinden <b>Ayarlar</b> bölümüne girerek değiştirilebilir.</p>
          <ul>
            <li><b>Gizli hesap:</b> Gönderilerini ve takip listelerini yalnızca takipçilerin görür. Gönderilerin genel akışta ve aramada çıkmaz.</li>
            <li><b>Beğenilerimi gizle, yanıtlarımı gizle:</b> Profilindeki bu sekmeleri yalnızca sen görürsün.</li>
            <li><b>Yanıt izni:</b> Her gönderiyi paylaşırken kimlerin yanıt verebileceğini seçersin: Herkes, Takipçilerim, Sadece psikologlar ya da Hiç kimse.</li>
            <li><b>İsimsiz paylaşım:</b> Paylaşırken maske simgesine basarsan gönderin &quot;İsimsiz kullanıcı&quot; adıyla ve sabit bir görselle yayınlanır. Profiline gidilemez ve gönderi profilinde görünmez. Bu gönderiye gelen beğeni ve yanıt bildirimleri yine sana gelir. Kendi isimsiz gönderine verdiğin yanıtlar da isimsiz görünür. İsimsiz gönderide başkalarından bahsetsen bile onlara bildirim gönderilmez, çünkü bildirim kim olduğunu gösterirdi.</li>
            <li><b>Engelleme:</b> Engellediğin kişi seni takip edemez, gönderilerini göremez ve sana yanıt yazamaz. Onun gönderileri ve bildirimleri de sana gösterilmez. Engelleyince aranızdaki takipler kaldırılır. Engellediklerini Ayarlar › Engellenen hesaplar bölümünden yönetirsin.</li>
            <li><b>Şikayet:</b> Uygunsuz bir gönderiyi şikayet edebilirsin. Şikayetler yalnızca yöneticiye iletilir. Şikayet edilen kişi kimin şikayet ettiğini göremez.</li>
            <li><b>Silme ve dondurma:</b> Gönderilerini ve yanıtlarını istediğin zaman silebilirsin. Hesabını dondurursan profilin ve gönderilerin diğer kullanıcılardan gizlenir.</li>
          </ul>
        </section>

        <section id="kurallar" className={s.section}>
          <h2>5. Veritabanı kuralları</h2>
          <p>
            Yukarıdaki sınırlar yalnızca sayfada gizlenmekle kalmaz. Çoğu veritabanımızın kurallarıyla da korunur.
            Biri sitenin arayüzünü atlayıp doğrudan veritabanına erişmeye çalışsa bile şunları yapamaz:
          </p>
          <ul>
            <li>Senin adına gönderi, yanıt, takip ya da bildirim oluşturmak.</li>
            <li>Senin e-posta adresini, ad soyadını, doğum tarihini, kaydettiklerini ya da bildirimlerini okumak.</li>
            <li>İsimsiz bir gönderinin kime ait olduğunu öğrenmek ya da başkasının isimsiz gönderisini silmek.</li>
            <li>Onaylı psikolog olmadan psikolog rozeti taşımak.</li>
            <li>Yanıt iznini ya da engellemeyi aşarak sana yanıt yazmak veya seni takip etmek.</li>
            <li>Başkasının beğeni ya da kaydetme bilgisini değiştirmek.</li>
            <li>Şikayetleri, iletişim mesajlarını ve randevu taleplerini okumak. Bunları yalnızca yönetici görür.</li>
          </ul>
        </section>

        <section id="cerezler" className={s.section}>
          <h2>6. Çerezler ve ölçüm</h2>
          <h3>Zorunlu olanlar</h3>
          <p>
            Oturumunun açık kalması için Firebase&apos;in tarayıcıya kaydettiği bilgiler zorunludur. Tema seçimin, çerez tercihin,
            izlediğin videolar ve gönderi taslakların da yalnızca kendi tarayıcında saklanır. Bunlar bize gönderilmez.
          </p>
          <h3>Ölçüm ve reklam</h3>
          <ul>
            <li><b>Google Analytics:</b> Hangi sayfaların ziyaret edildiğini isimsiz olarak ölçer. Çerez bandında &quot;Reddet&quot;i seçersen ölçüm çerezleri de kapanır.</li>
            <li><b>Google Ads:</b> Reklam ve dönüşüm çerezleri yalnızca &quot;Kabul et&quot; dersen çalışır. Onay vermezsen kapalı kalır.</li>
          </ul>
          <p className={s.note}>Tercihini değiştirmek için tarayıcında bu sitenin verilerini temizleyebilirsin. Çerez bandı yeniden açılır.</p>
        </section>

        <section id="hizmetler" className={s.section}>
          <h2>7. Kullandığımız hizmetler</h2>
          <ul>
            <li><b>Google Firebase:</b> Giriş ve veritabanı (hesaplar, gönderiler, bildirimler).</li>
            <li><b>Cloudinary:</b> Yüklediğin fotoğraf, video ve belgelerin saklanması.</li>
            <li><b>Vercel:</b> Sitenin yayınlandığı sunucular.</li>
            <li><b>E-posta sunucusu (SMTP):</b> İletişim formundan gönderdiğin mesajın bize ulaştırılması.</li>
            <li><b>Google Analytics ve Google Ads:</b> Yukarıda anlatıldığı gibi ölçüm ve reklam.</li>
            <li><b>Google Haritalar:</b> İletişim sayfasındaki konum haritası.</li>
          </ul>
          <p>
            Bu hizmetlerin bir kısmının sunucuları yurt dışındadır. Bilgilerin yalnızca hizmetin çalışması için bu sağlayıcılara iletilir.
            Hiçbirine satılmaz, reklam amacıyla da paylaşılmaz.
          </p>
        </section>

        <section id="saklama" className={s.section}>
          <h2>8. Saklama süresi ve hesabı silme</h2>
          <ul>
            <li>Hesap bilgilerin ve forum içeriklerin, sen silene ya da hesabını kapatana kadar saklanır.</li>
            <li>
              Ayarlar › Hesap bölümünden hesabını silebilirsin (adım adım anlatım: <Link href="/hesap-silme">Hesabını sil</Link>). Silince giriş bilgilerin kaldırılır ve profilin &quot;Silinmiş Hesap&quot; olarak gösterilir.
              Adın, fotoğrafların ve biyografin silinir. Gönderilerin akışlarda gösterilmez.
            </li>
            <li>
              Gönderilerinin, e-posta adresinin ve diğer kayıtlarının da tamamen silinmesini istersen <a href={`mailto:${MAIL}`}>{MAIL}</a> adresine yaz.
              Talebini en geç 30 gün içinde yerine getiririz.
            </li>
            <li>İletişim formu mesajları en fazla 1 yıl saklanır.</li>
          </ul>
        </section>

        <section id="haklar" className={s.section}>
          <h2>9. KVKK kapsamındaki hakların</h2>
          <p>KVKK&apos;nın 11. maddesine göre şu haklara sahipsin:</p>
          <ul>
            <li>Kişisel verilerinin işlenip işlenmediğini öğrenme ve işlendiyse bilgi isteme</li>
            <li>Verilerinin hangi amaçla işlendiğini ve bu amaca uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde ya da yurt dışında kimlere aktarıldığını bilme</li>
            <li>Eksik ya da yanlış işlenen verilerin düzeltilmesini isteme</li>
            <li>Verilerinin silinmesini ya da yok edilmesini isteme</li>
            <li>Yalnızca otomatik sistemlerle yapılan bir analizin aleyhine sonuç doğurmasına itiraz etme</li>
            <li>Kanuna aykırı işleme nedeniyle uğradığın zararın giderilmesini isteme</li>
          </ul>
          <p>Bu hakları kullanmak için <a href={`mailto:${MAIL}`}>{MAIL}</a> adresine yazman yeterli. En geç 30 gün içinde yanıt veririz.</p>
        </section>

        <section id="cocuklar" className={s.section}>
          <h2>10. 18 yaş sınırı</h2>
          <p>
            Forum 18 yaşını doldurmuş kişiler içindir. 18 yaşından küçük birine ait bir hesap fark edersek hesabı ve verilerini sileriz.
          </p>
        </section>

        <section id="degisiklik" className={s.section}>
          <h2>11. Değişiklikler ve iletişim</h2>
          <p>
            Bu politikayı yeni bir özellik eklediğimizde ya da bir uygulamayı değiştirdiğimizde güncelleriz. Güncel tarih her zaman sayfanın başında yazar.
            Önemli değişiklikleri sitede ayrıca duyururuz.
          </p>
          <p>
            E-posta: <a href={`mailto:${MAIL}`}>{MAIL}</a><br />
            Telefon: +90 507 875 15 03<br />
            Adres: Polatlı/Ankara ve Çankaya/Ankara
          </p>
        </section>

        <div className={s.back}>
          <Link href="/forum">← Foruma dön</Link>
          <Link href="/">Anasayfa</Link>
          <Link href="/kullanici-sozlesmesi">Kullanıcı sözleşmesi</Link>
          <Link href="/iletisim">İletişim</Link>
        </div>
      </div>
    </div>
  );
}
