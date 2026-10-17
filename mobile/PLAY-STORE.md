# Logos — Play Store yayın rehberi

Uygulama, sitenin forum bölümünü (`https://www.pskfurkanmanav.com/forum`) Chrome altyapısıyla tam ekran açan bir
**Trusted Web Activity**'dir. Sitede yapılan her değişiklik uygulamaya da anında yansır; mağazaya yeniden yükleme
yalnızca uygulama adı, ikonu, renkleri ya da sürüm bilgisi değişince gerekir.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `mobile/cikti/logos-1.0.0-1.aab` | Play Console'a yüklenecek paket |
| `mobile/cikti/logos-1.0.0-1.apk` | Bir Android telefona doğrudan kurup denemek için |
| `mobile/cikti/play-store-ikon-512.png` | Mağaza ikonu (512×512) |
| `mobile/cikti/magaza/one-cikan-gorsel-1024x500.png` | Öne çıkan görsel |
| `mobile/cikti/magaza/ekran-*.png` | Telefon ekran görüntüleri (1080×1920) |
| `Masaüstü/logos-android-anahtar/` | **Yükleme anahtarı ve şifresi. Yedekle, kimseyle paylaşma.** |

`mobile/cikti/` git'e gönderilmez; `node mobile/build-android.mjs` ile yeniden üretilir.

## 1. Geliştirici hesabı

1. https://play.google.com/console adresinden geliştirici hesabı aç (tek seferlik 25 $).
2. Kimlik doğrulamasını tamamla.
3. **Kişisel hesap** açtıysan: üretim (herkese açık) yayınından önce en az **12 kişinin 14 gün boyunca**
   kapalı testte uygulamayı kullanması gerekir. Kuruluş (şirket) hesabında bu şart yoktur ama D-U-N-S numarası istenir.

## 2. Uygulamayı oluştur

**Tüm uygulamalar › Uygulama oluştur**

- Uygulama adı: `Logos — Psikoloji Forumu`
- Varsayılan dil: Türkçe – tr-TR
- Uygulama / oyun: Uygulama
- Ücretsiz / ücretli: Ücretsiz

## 3. Mağaza girişi (Büyüme › Mağazadaki varlık › Ana mağaza girişi)

**Kısa açıklama** (en fazla 80 karakter):

> Psikoloji üzerine soru sor; psikologların ve topluluğun yanıtlarını oku.

**Tam açıklama**:

> Logos, psikoloji üzerine düşünmek, soru sormak ve konuşmak isteyenler için bir forum. Psikolog Furkan Manav
> tarafından kuruldu.
>
> Kaygıdan ilişkilere, rüyalardan çocukluk deneyimlerine kadar aklındaki soruyu paylaş. Onaylı psikologlar altın
> rozetle işaretlidir; yanıtlarını kolayca ayırt edersin.
>
> Neler yapabilirsin
> • Gönderi paylaş, fotoğraf ekle, konusunu seç
> • İstersen isimsiz paylaş: adın ve profilin görünmez, bildirimler yine sana gelir
> • Gönderine kimlerin yanıt verebileceğini seç: herkes, takipçilerin, yalnızca psikologlar ya da hiç kimse
> • Yorumlara yanıt ver, beğen, yeniden paylaş, kaydet
> • İlgini çeken kişileri takip et, akışını takip ettiklerinle sınırla
> • Gizli hesap, engelleme ve şikayet seçenekleriyle deneyimini kontrol et
>
> Önemli: Logos bir tartışma ve paylaşım ortamıdır; tanı ya da tedavi yerine geçmez. Acil bir durumda 112'yi ara.

**Grafikler**: uygulama ikonu `play-store-ikon-512.png`, öne çıkan görsel `one-cikan-gorsel-1024x500.png`,
telefon ekran görüntüleri `ekran-*.png` (en az 2).

**İletişim**: e-posta `pskfurkan.manav@gmail.com`, web sitesi `https://www.pskfurkanmanav.com`.

## 4. Uygulama içeriği (Politika › Uygulama içeriği)

| Bölüm | Yanıt |
|---|---|
| Gizlilik politikası | `https://www.pskfurkanmanav.com/gizlilik` |
| Uygulama erişimi | Bazı işlevler giriş gerektirir → inceleme için bir deneme hesabının e-postası ve şifresi verilir (kendi hesabını verme; ayrı bir deneme hesabı aç) |
| Reklamlar | **Evet, reklam içeriyor** (forum sayfalarında Google AdSense yüklü) |
| İçerik derecelendirmesi | Anketi doldur: kategori "Sosyal / iletişim"; kullanıcılar birbiriyle etkileşir ve içerik paylaşır → **Evet**; şiddet, cinsellik, kumar → Hayır |
| Hedef kitle | **18 ve üzeri** |
| Haber uygulaması | Hayır |
| Sağlık uygulamaları | Uygulama sağlık hizmeti sunmuyor; "sağlık ve fitness" seçme, gerekirse "Diğer" |
| Veri güvenliği | Aşağıdaki tablo |
| Hesap silme | Uygulama içi: Profil › Ayarlar › Hesap › Hesabı sil. Web adresi: `https://www.pskfurkanmanav.com/hesap-silme` |

### Veri güvenliği yanıtları

- Veriler aktarım sırasında şifreleniyor mu? **Evet** (HTTPS)
- Kullanıcılar verilerinin silinmesini isteyebilir mi? **Evet**
- Toplanan veriler:

| Veri türü | Toplanıyor | Paylaşılıyor | Amaç | Zorunlu mu |
|---|---|---|---|---|
| Ad (görünen ad, ad soyad) | Evet | Hayır | Hesap yönetimi, uygulama işlevi | Zorunlu |
| E-posta adresi | Evet | Hayır | Hesap yönetimi, iletişim | Zorunlu |
| Kullanıcı kimlikleri (kullanıcı adı, hesap kimliği) | Evet | Hayır | Hesap yönetimi, uygulama işlevi | Zorunlu |
| Doğum tarihi (Kişisel bilgiler › Diğer) | Evet | Hayır | Hesap yönetimi (18 yaş kontrolü) | Zorunlu |
| Fotoğraflar | Evet | Hayır | Uygulama işlevi | İsteğe bağlı |
| Diğer kullanıcı içeriği (gönderi, yanıt) | Evet | Hayır | Uygulama işlevi | İsteğe bağlı |
| Uygulama etkileşimleri (beğeni, takip) | Evet | Hayır | Uygulama işlevi | İsteğe bağlı |
| Uygulama etkileşimleri / Analiz (Google Analytics) | Evet | Hayır | Analiz | İsteğe bağlı |
| Cihaz veya diğer kimlikler (reklam) | Evet | Evet (Google AdSense / Ads) | Reklam | İsteğe bağlı |

## 5. Kapalı test ve yayın

1. **Test › Kapalı test › Kanal oluştur**, test kullanıcılarının e-posta listesini ekle (kişisel hesapta en az 12 kişi).
2. **Yeni sürüm oluştur** → **Play Uygulama İmzalama**'yı kabul et → `logos-1.0.0-1.aab` dosyasını yükle →
   sürüm notu: "İlk sürüm".
3. Sürümü incelemeye gönder.
4. **Önemli:** Yükledikten sonra **Test ve yayınla › Uygulama bütünlüğü › Uygulama imzalama** sayfasındaki
   **"Uygulama imzalama anahtarı sertifikası › SHA-256 sertifika parmak izi"** değerini kopyala. Bu değer siteye
   (`public/.well-known/assetlinks.json`) eklenmezse uygulama üstte adres çubuğuyla açılır.
5. 14 gün sonra **Üretim** için başvur.

## Yeni sürüm çıkarmak

1. `mobile/twa-manifest.json` içinde `appVersionCode`'u 1 artır, `appVersion`'ı güncelle (ör. `1.0.1`).
2. `node mobile/build-android.mjs`
3. Oluşan yeni `.aab` dosyasını Play Console'da yeni sürüm olarak yükle.
