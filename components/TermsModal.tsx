'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  isDark?: boolean;
}

export default function TermsModal({ isOpen, onClose, onAccept, isDark = false }: Props) {
  const [activeTab, setActiveTab] = useState<'terms' | 'kvkk'>('terms');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#0f172a' : '#ffffff',
          color: isDark ? '#e2e8f0' : '#1e293b',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        }}
        className="relative w-full max-w-2xl max-h-[88vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div
          style={{
            background: isDark ? '#091120' : '#f8fafc',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`
          }}
          className="p-4 sm:px-6 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                background: isDark ? 'rgba(212,175,55,0.15)' : '#fef3c7',
                color: isDark ? '#facc15' : '#b45309',
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif leading-tight">
                Kayıt ve Kullanıcı Sözleşmesi
              </h2>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b' }} className="text-xs">
                6698 sayılı KVKK ve 5651 sayılı kanun mevzuatına uygun yasal bilgilendirme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            background: isDark ? '#091120' : '#f1f5f9',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`
          }}
          className="flex px-4 sm:px-6 pt-2 gap-2 shrink-0 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            style={{
              borderBottom: activeTab === 'terms' ? '2px solid #b8965a' : '2px solid transparent',
              color: activeTab === 'terms' ? (isDark ? '#facc15' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
              fontWeight: activeTab === 'terms' ? 700 : 500
            }}
            className="pb-3 px-3 text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <FileText size={16} />
            <span>Kullanıcı Sözleşmesi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kvkk')}
            style={{
              borderBottom: activeTab === 'kvkk' ? '2px solid #b8965a' : '2px solid transparent',
              color: activeTab === 'kvkk' ? (isDark ? '#facc15' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
              fontWeight: activeTab === 'kvkk' ? 700 : 500
            }}
            className="pb-3 px-3 text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <Lock size={16} />
            <span>KVKK Aydınlatma Metni</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            color: isDark ? '#cbd5e1' : '#334155',
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs sm:text-sm leading-relaxed space-y-4"
        >
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                <strong>Önemli Bilgilendirme:</strong> Bu platform bir acil tıbbi veya kriz müdahale servisi değildir. Kendinize veya bir başkasına zarar verme riski taşıyan acil durumlarda lütfen derhal <strong>112 Acil Çağrı Merkezi</strong> veya en yakın sağlık kuruluşuna başvurunuz.
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  1. Taraflar ve Amaç
                </h3>
                <p>
                  İşbu Kullanıcı ve Kayıt Sözleşmesi, <strong>pskfurkanmanav.com</strong> platformu (&quot;Platform&quot;) ile platforma üye olan veya platformu kullanan gerçek kişi (&quot;Kullanıcı&quot;) arasında, platformun kullanım koşulları, üyelik hak ve yükümlülüklerinin belirlenmesi amacıyla akdedilmiştir.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  2. Hizmetin Kapsamı
                </h3>
                <p>
                  Platform; psikoloji alanında bilgilendirici makaleler, videolar, forum tartışma alanı ve psikolog doğrulama sistemi sunmaktadır. Platformda sunulan hiçbir içerik veya kullanıcı yorumu doğrudan klinik tanı, tıbbi reçete veya tıbbi tedavi niteliği taşımamaktadır.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  3. Üyelik Şartları ve Hesap Güvenliği
                </h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Kullanıcı, kayıt sırasında doğru, güncel ve eksiksiz bilgi sağlamakla yükümlüdür.</li>
                  <li>Hesap şifresinin gizliliği ve güvenliği tamamen Kullanıcı&apos;nın sorumluluğundadır.</li>
                  <li>Üyelik kişiye özeldir; başkasına devredilemez veya kiralanamaz.</li>
                  <li>18 yaşını doldurmamış bireyler veli veya yasal vasilerinin onayı ile platformu kullanabilirler.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  4. Topluluk ve Forum Kuralları (5651 Sayılı Kanun Uyarınca)
                </h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li><strong>Nefret Söylemi ve Hakaret Yasağı:</strong> Başkalarına hakaret, küfür, tehdit, ayrımcılık ve aşağılayıcı ifadeler kesinlikle yasaktır.</li>
                  <li><strong>Kişisel Veri Gizliliği:</strong> Başkalarına ait kimlik, telefon, adres, fotoğraf gibi özel verilerin izinsiz paylaşılması yasaktır.</li>
                  <li><strong>Yanıltıcı Tıbbi Yönlendirme:</strong> Bilimsel olmayan, zararlı veya reçetesiz ilaç tavsiyesi içeren paylaşımlar yapılamaz.</li>
                  <li><strong>Yer Sağlayıcı Sorumluluğu:</strong> Platform, 5651 sayılı Kanun kapsamında yer sağlayıcıdır; kullanıcıların oluşturduğu içeriklerden hukuki ve cezai olarak ilgili içeriği üreten Kullanıcı bizzat sorumludur.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  5. Psikolog Uzman Üyeliği ve Belge Doğrulaması
                </h3>
                <p>
                  Psikolog unvanı ve rozeti talep eden kullanıcılar, resmi lisans/lisansüstü diplomalarını doğrulamak üzere yüklemekle yükümlüdür. Sahte, yanıltıcı veya tahrif edilmiş belge ibraz eden kişilerin üyelikleri derhal feshedilir ve yasal mercilere bildirim hakkı saklı tutulur.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  6. Fikri Mülkiyet Hakları
                </h3>
                <p>
                  Platformda yer alan özgün metinler, makaleler, grafikler, ses ve video materyalleri, logo ve yazılım kodları 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile korunmaktadır. İzinsiz kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  7. Uyuşmazlıkların Çözümü
                </h3>
                <p>
                  İşbu sözleşmenin uygulanmasından doğabilecek her türlü hukuki uyuşmazlıkta Türkiye Cumhuriyeti kanunları uygulanır ve Ankara Mahkemeleri ile İcra Daireleri yetkilidir.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                <strong>6698 Sayılı KVKK Kapsamında Aydınlatma Metni:</strong> Kişisel verileriniz veri sorumlusu sıfatıyla Psikolog Furkan Manav tarafından kanuna uygun ve yüksek güvenlik standartlarında işlenmektedir.
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  1. Veri Sorumlusu
                </h3>
                <p>
                  Veri Sorumlusu: <strong>Psikolog Furkan Manav</strong><br />
                  Adres: Çankaya & Polatlı / Ankara / Türkiye<br />
                  İletişim E-posta: pskfurkan.manav@gmail.com
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  2. İşlenen Kişisel Veriler
                </h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li><strong>Kimlik Verileri:</strong> Ad, soyad, kullanıcı adı, profil fotoğrafı</li>
                  <li><strong>İletişim Verileri:</strong> E-posta adresi, iletişim formu taleplerinde telefon numarası</li>
                  <li><strong>Hesap ve İşlem Güvenliği:</strong> IP adresi, oturum logları, şifre hash&apos;leri (Google Firebase Auth standartları)</li>
                  <li><strong>İçerik Verileri:</strong> Forum gönderileri, yanıtlar, beğeniler</li>
                  <li><strong>Mesleki Bilgiler (Yalnızca Uzman Başvuruları):</strong> Mezun olunan üniversite, diploma/mezuniyet belgesi görseli</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  3. Verilerin İşlenme Amaçları ve Hukuki Sebepleri
                </h3>
                <p>
                  Verileriniz; KVKK&apos;nın 5. maddesinde belirtilen &quot;Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması&quot;, &quot;Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi (5651 sayılı kanun)&quot; ve &quot;Meşru menfaat&quot; hukuki sebeplerine dayalı olarak; üyelik tesisi, hesap güvenliği, teknik destek sağlama ve topluluk kalitesini koruma amacıyla işlenir.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  4. Kişisel Verilerin Aktarımı ve Saklanması
                </h3>
                <p>
                  Kişisel verileriniz ticari veya reklam amaçlarıyla hiçbir üçüncü kişiye <strong>kesinlikle satılmaz</strong>. Veriler, global güvenlik sertifikalarına (ISO 27001, SOC 2) sahip Google Firebase bulut altyapısında şifrelenmiş olarak saklanır. Yalnızca yetkili adli makamların resmi talepleri doğrultusunda yasal zorunluluk gereği paylaşılabilir.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                  5. İlgili Kişi Olarak Haklarınız (KVKK Madde 11)
                </h3>
                <p>
                  Dilediğiniz zaman veri sorumlusuna başvurarak; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, eksik/yanlış verilerin düzeltilmesini isteme, verilerinizin silinmesini veya anonimleştirilmesini talep etme ve kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme hakkına sahipsiniz.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            background: isDark ? '#091120' : '#f8fafc',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`
          }}
          className="p-4 sm:px-6 flex items-center justify-between gap-3 shrink-0"
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
              color: isDark ? '#cbd5e1' : '#475569'
            }}
            className="px-4 py-2 rounded-lg border text-xs sm:text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Kapat
          </button>

          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              style={{
                background: 'linear-gradient(135deg, #b8965a 0%, #d4aa70 100%)',
                color: '#070e1b',
              }}
              className="px-5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 hover:opacity-95 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Okudum ve Kabul Ediyorum</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
