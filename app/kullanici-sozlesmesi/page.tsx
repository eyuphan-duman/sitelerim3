import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni — Psikolog Furkan Manav',
  description: 'Psikolog Furkan Manav platformu kullanıcı sözleşmesi, üyelik şartları ve 6698 sayılı KVKK aydınlatma metni.',
};

export default function KullaniciSozlesmesiPage() {
  const updateDate = '30 Eylül 2026';

  return (
    <div className="min-h-screen bg-[#070e1b] text-slate-200 py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb back */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#d4aa70] hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Ana Sayfaya Dön
          </Link>
        </div>

        {/* Title Card */}
        <div className="bg-[#0e1a2f] border border-white/10 rounded-2xl p-6 sm:p-10 mb-8 shadow-xl">
          <div className="flex items-center gap-3 text-[#d4aa70] mb-3">
            <ShieldCheck size={28} />
            <span className="text-xs uppercase tracking-widest font-bold">Yasal Bilgilendirme ve Güvence</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white mb-3">
            Kullanıcı ve Kayıt Sözleşmesi
          </h1>
          <p className="text-sm text-slate-400">
            Son Güncelleme Tarihi: {updateDate} • 6698 sayılı KVKK ve 5651 sayılı kanun hükümleriyle tam uyumlu
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-[#0e1a2f]/70 border border-white/10 rounded-2xl p-6 sm:p-10 space-y-8 leading-relaxed text-sm sm:text-base text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
              <FileText size={20} className="text-[#d4aa70]" /> 1. Giriş ve Taraflar
            </h2>
            <p>
              İşbu Kullanıcı ve Kayıt Sözleşmesi, <strong>pskfurkanmanav.com</strong> internet platformu (&quot;Platform&quot;) ile bu platforma kayıt olan, hizmetlerden veya forum alanından faydalanan gerçek kişi (&quot;Kullanıcı&quot;) arasında akdedilmiştir. Platforma kaydolarak veya platformu kullanarak işbu sözleşmenin tüm maddelerini okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#d4aa70]" /> 2. Hizmet Kapsamı ve Acil Durum Uyarısı
            </h2>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs sm:text-sm">
              <strong>ÖNEMLİ UYARI:</strong> Bu web sitesi ve forum alanı bir acil psikiyatrik/tıbbi kriz müdahale birimi değildir. İntihar düşüncesi, kendine veya başkasına yönelik şiddet riski ya da ani tıbbi kriz durumlarında lütfen vakit kaybetmeksizin <strong>112 Acil Çağrı Merkezi</strong>&apos;ni arayınız ya da en yakın hastanenin acil servisine başvurunuz.
            </div>
            <p>
              Platformda yer alan makaleler, videolar ve forum etkileşimleri bilgilendirme ve farkındalık amaçlıdır; klinik tanı, psikiyatrik reçete veya doğrudan tıbbi teşhis yerine geçmez.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">
              3. Üyelik Şartları ve Hesap Güvenliği
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
              <li>Kullanıcı, kayıt esnasında sağladığı kimlik, kullanıcı adı ve e-posta bilgilerinin gerçek ve doğru olduğunu taahhüt eder.</li>
              <li>Hesap şifresinin gizliliğinin sağlanması ve hesap üzerinden yapılan tüm işlemlerin sorumluluğu bizzat Kullanıcı&apos;ya aittir.</li>
              <li>18 yaşını doldurmamış bireyler, veli veya yasal vasilerinin bilgisi ve rızası dahilinde platformu kullanabilir.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">
              4. 5651 Sayılı Kanun Uyarınca Yer Sağlayıcı ve Topluluk Kuralları
            </h2>
            <p>
              Platform, 5651 sayılı &quot;İnternet Ortamında Yapılan Yayınların Düzenlenmesi ve Bu Yayınlar Yoluyla İşlenen Suçlarla Mücadele Edilmesi Hakkında Kanun&quot; kapsamında <strong>Yer Sağlayıcı</strong> konumundadır.
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
              <li>Kullanıcılar forum veya yorum alanında paylaştıkları her türlü metin ve görselden hukuki ve cezai olarak bizzat sorumludur.</li>
              <li>Hakaret, küfür, tehdit, taciz, nefret söylemi, ayrımcılık, ırkçılık veya pornografik nitelikteki içerikler kesinlikle yasaktır ve tespiti halinde derhal kaldırılır.</li>
              <li>Üçüncü şahıslara ait kişisel verilerin (telefon, adres, kimlik no vb.) izinsiz ifşa edilmesi yasaktır.</li>
              <li>Telif hakkı ihlali oluşturan veya izinsiz ticari reklam/spam içeren gönderiler platform yönetimince silinir.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-serif text-white">
              5. Psikolog Uzman Üyelikleri ve Doğrulama
            </h2>
            <p>
              Platformda psikolog unvanı ve uzman rozeti alabilmek için YÖK onaylı lisans veya lisansüstü psikoloji/klinik psikoloji diplomalarının yüklenmesi gerekmektedir. Sahte belge veya yetkisiz unvan kullanımı durumunda üyelik iptal edilir ve TCK ilgili maddeleri uyarınca yasal yollara başvurulabilir.
            </p>
          </section>

          <section className="space-y-3 border-t border-white/10 pt-6">
            <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
              <Lock size={20} className="text-[#d4aa70]" /> 6. 6698 Sayılı KVKK Aydınlatma Metni
            </h2>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusu <strong>Psikolog Furkan Manav</strong>&apos;dır.
            </p>
            <p>
              Toplanan kimlik ve iletişim verileriniz (kullanıcı adı, e-posta vb.), 5651 sayılı kanun kapsamındaki yasal log tutma yükümlülükleri, üyelik hesabının oluşturulması ve platform güvenliğinin tesisi amacıyla KVKK m. 5/2 uyarınca işlenmektedir. Kişisel verileriniz hiçbir surette üçüncü kişilere ticari olarak satılmaz veya devredilmez.
            </p>
            <p>
              KVKK&apos;nın 11. maddesi uyarınca veri sorumlusuna başvurarak; verilerinizin işlenip işlenmediğini öğrenme, yanlış verilerin düzeltilmesini isteme veya verilerinizin silinmesini talep etme hakkınız saklıdır. Talepleriniz için <strong>pskfurkan.manav@gmail.com</strong> adresine başvurabilirsiniz.
            </p>
          </section>

          <section className="space-y-3 border-t border-white/10 pt-6">
            <h2 className="text-xl font-bold font-serif text-white">
              7. Yetkili Yargı Mercii
            </h2>
            <p>
              İşbu sözleşmenin uygulanmasından doğabilecek her türlü uyuşmazlığın çözümünde Türkiye Cumhuriyeti Kanunları uygulanacak olup, <strong>Ankara Mahkemeleri ve İcra Daireleri</strong> yetkilidir.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
