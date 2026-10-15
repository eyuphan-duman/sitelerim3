export interface CuratedFaq {
  title: string;
  category: string;
  featuredImage: string;
  content: string;
}

export const CURATED_15_FAQS: CuratedFaq[] = [
  {
    title: "Psikoterapi Süreci Nasıl Başlar ve İlk Seansta Neler Konuşulur?",
    category: "Terapi Süreci",
    featuredImage: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=800&auto=format&fit=crop",
    content: `<p>Psikoterapiye başlama kararı almak, kişinin kendi iç dünyasına ve yaşamındaki tıkanıklıklara cesaretle bakma niyetinin ilk adımıdır. Çoğu danışan ilk seansa gelirken ne anlatacağını bilememe, nereden başlayacağını kestirememe gibi haklı bir kaygı taşır.</p><p><strong>İlk Görüşmenin Çerçevesi</strong></p><p>İlk seans bir değerlendirme ve karşılıklı tanışma oturumudur. Bu görüşmede danışanın başvuru sebebi, mevcut semptomları ve hayatında yolunda gitmeyen alanlar dinlenir. Terapist, danışanın ihtiyaç duyduğu çalışma çerçevesini (seans sıklığı, gizlilik kuralları, süreç hedefleri) aktarır.</p><p><strong>Önceden Hazırlık Yapmak Gerekir mi?</strong></p><p>İlk görüşmeye gelmeden önce detaylı bir hazırlık yapmanıza gerek yoktur. Terapi odası, o an aklınıza ve kalbinize gelen düşünceleri serbestçe ifade edebileceğiniz, yargılanma kaygısı taşımayan güvenli bir alandır.</p>`
  },
  {
    title: "Psikolog ile Psikiyatrist Arasındaki Temel Farklar Nelerdir?",
    category: "Genel Bilgilendirme",
    featuredImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=800&auto=format&fit=crop",
    content: `<p>Ruh sağlığı alanında destek almayı düşünen kişilerin en sık karşılaştığı kafa karışıklıklarından biri, psikolog ve psikiyatrist unvanlarının farkıdır. İki meslek alanı da ruh sağlığına hizmet eder ancak eğitimleri ve müdahale yöntemleri farklıdır.</p><p><strong>Psikiyatrist Kimdir?</strong></p><p>Psikiyatrist, tıp fakültesini bitirdikten sonra psikiyatri alanında uzmanlık yapmış tıp doktorudur. Ruhsal bozuklukların biyolojik, nörolojik ve hormonal temellerini inceler, teşhis koyar ve gerektiğinde farmakolojik (ilaç) tedavi uygular.</p><p><strong>Psikolog Kimdir?</strong></p><p>Psikolog, üniversitelerin psikoloji lisans programını tamamlayan, ardından klinik psikoloji veya psikoterapi alanlarında uzmanlaşan profesyoneldir. Psikologlar ilaç yazmaz; konuşma terapisi, psikodinamik çözümleme, bilişsel ve davranışsal teknikler aracılığıyla danışanın duygu, düşünce ve ilişki kalıplarını ele alır.</p>`
  },
  {
    title: "Online Terapi Yüz Yüze Terapi Kadar Etkili midir?",
    category: "Online Terapi",
    featuredImage: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=800&auto=format&fit=crop",
    content: `<p>Gelişen teknoloji ve dijital iletişim olanaklarıyla birlikte online terapi, dünya genelinde yaygın ve kabul gören bir yöntem haline gelmiştir. Çok sayıda bilimsel klinik araştırma, online terapinin yüz yüze terapiyle eşdeğer bir terapötik etki ve güven bağı sağladığını ortaya koymaktadır.</p><p><strong>Online Terapinin Sağladığı Avantajlar</strong></p><ul><li>Farklı şehirlerde veya yurt dışında yaşayan Türkçe konuşan danışanlar için erişim kolaylığı.</li><li>Ulaşım, trafik ve zaman kaybının ortadan kalkması.</li><li>Kişinin kendini en rahat ve güvende hissettiği kişisel ortamında seansa katılabilmesi.</li></ul><p><strong>Verimlilik İçin Gerekli Koşullar</strong></p><p>Online görüşmelerin verimli geçmesi için seans boyunca kesintisiz internet bağlantısı ve üçüncü kişilerin duyamayacağı, dikkatin dağılmayacağı sessiz ve mahrem bir odada bulunulması önerilir.</p>`
  },
  {
    title: "Psikoterapide Gizlilik ve Etik İlkeler Nasıl Korunur?",
    category: "Etik & Gizlilik",
    featuredImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
    content: `<p>Psikoterapi ilişkisinin en temel yapı taşı güvendir. Terapist ve danışan arasındaki ilişkinin güvene dayanabilmesi için danışanın paylaştığı tüm bilgilerin katı etik kurallar çerçevesinde saklanması yasal ve mesleki bir zorunluluktur.</p><p><strong>Gizlilik Sınırları Nelerdir?</strong></p><p>Seans odasında konuşulan hiçbir konu, danışanın açık ve yazılı onayı olmaksızın ailesi, eşi, işvereni veya herhangi bir üçüncü kurumla paylaşılamaz. Notlar ve kayıtlar uluslararası etik standartlara uygun olarak korunur.</p><p><strong>İstisnai Durumlar</strong></p><p>Gizliliğin tek yasal istisnası; danışanın kendi hayatına veya bir başkasının can güvenliğine yönelik doğrudan, somut ve hayati bir tehlike bulunması durumudur. Böyle bir tabloda terapist, koruyucu önlemler almakla yükümlüdür.</p>`
  },
  {
    title: "Terapi Süreci Ne Kadar Sürer ve Seans Sıklığı Nasıl Belirlenir?",
    category: "Terapi Süreci",
    featuredImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
    content: `<p>Terapi sürecinin toplam süresi, her danışanın bireysel ihtiyaçlarına, çalıştığı temel meselelere ve benimsediği terapi ekolüne bağlı olarak değişkenlik gösterir. Standart bir "bitiş takvimi" sunmak gerçekçi değildir.</p><p><strong>Seans Sıklığı</strong></p><p>Terapötik sürecin derinleşmesi ve süreklilik kazanması için seanslar genellikle haftada bir gün, 45-50 dakika olarak planlanır. Sürecin ilerleyen aşamalarında veya danışanın ihtiyacına göre iki haftada bir periyoda geçilebilir.</p><p><strong>Sürecin Tamamlanması</strong></p><p>Terapi, danışanın hedeflerine ulaştığı, içsel kaynaklarını devreye sokabildiği ve yaşamındaki zorluklarla tek başına sağlıklı baş edebilme kapasitesini kazandığı noktada danışan ve terapistin ortak kararıyla sonlandırılır.</p>`
  },
  {
    title: "Bilişsel Davranışçı Terapi (BDT) ile Dinamik Psikoterapi Arasındaki Fark Nedir?",
    category: "Terapi Ekolleri",
    featuredImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
    content: `<p>Psikoterapide danışanın problemine yaklaşırken farklı kuramsal çerçeveler kullanılır. Bu yaklaşımlar arasında Bilişsel Davranışçı Terapi ve Dinamik Psikoterapi en bilinen yöntemlerdendir.</p><p><strong>Bilişsel Davranışçı Terapi (BDT)</strong></p><p>BDT, semptom odaklı ve yapılandırılmış bir yaklaşımdır. Kişinin şu andaki işlevsiz düşünce kalıplarını, otomatik inançlarını ve davranışlarını fark edip yeniden yapılandırmasını hedefler.</p><p><strong>Dinamik ve Psikanalitik Psikoterapi</strong></p><p>Dinamik yaklaşım, semptomun sadece buzdağının görünen kısmı olduğunu kabul eder. Bireyin geçmiş ilişkisel deneyimlerini, bilinçdışı çatışmalarını, savunma mekanizmalarını ve bugünkü hayatına yansıyan tekrarlarını kökten anlamaya ve dönüştürmeye odaklanır.</p>`
  },
  {
    title: "Panik Atak ve Yaygın Kaygı Belirtileriyle Başa Çıkmada Terapi Nasıl Yardımcı Olur?",
    category: "Kaygı & Stres",
    featuredImage: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=800&auto=format&fit=crop",
    content: `<p>Panik atak; aniden başlayan yoğun korku, kalp çarpıntısı, nefes darlığı, terleme, baş dönmesi ve kontrolü kaybetme hissiyle karakterizedir. Kişi bu anlarda kalp krizi geçirdiğini veya öleceğini düşünebilir.</p><p><strong>Terapide Ne Yapılır?</strong></p><ul><li>Bedensel duyumların gerçekte bir tehlike işareti değil, otonom sinir sisteminin aşırı uyarılması olduğunun anlaşılması sağlanır.</li><li>Kaygıyı tetikleyen düşünce örüntüleri ve kaçınma davranışları incelenir.</li><li>Panik anında uygulanabilecek bedensel regülasyon ve nefes teknikleri çalışılır.</li><li>Bilinçdışında bastırılmış öfke, çaresizlik ya da ayrılık kaygısı gibi kök nedenler çözümlenir.</li></ul>`
  },
  {
    title: "Depresyon ve Yaşamdan Keyif Alamama Durumunda Terapi Ne Sağlar?",
    category: "Duygudurum",
    featuredImage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800&auto=format&fit=crop",
    content: `<p>Depresyon yalnızca geçici bir üzüntü hali değildir; kişinin enerjisini, umudunu, ilişkilerini ve kendini algılama biçimini derinden etkileyen klinik bir duygudurum tablosudur.</p><p><strong>Terapötik Müdahale</strong></p><p>Terapi odasında danışanın içe yönelttiği suçluluk ve yetersizlik hisleri güvenli bir diyalog zemininde incelenir. Bireyin kaybettiği anlam duygusu, bastırdığı yas süreçleri ve kendini cezalandırma mekanizmaları analiz edilerek yeniden yaşam enerjisine kavuşması hedeflenir.</p>`
  },
  {
    title: "İlişki Problemleri ve Bağlanma Korkusu Bireysel Terapide Nasıl Ele Alınır?",
    category: "İlişkiler",
    featuredImage: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop",
    content: `<p>İlişkilerimizde yaşadığımız çatışmalar, terk edilme korkuları ya da bir türlü yakınlık kuramama halleri çoğunlukla erken çocukluk döneminde birincil bakım verenlerle kurduğumuz bağlanma stillerinin birer yansımasıdır.</p><p><strong>Bireysel Terapinin İlişkilere Katkısı</strong></p><ul><li>Kişinin partner seçimlerindeki bilinçdışı eğilimleri fark etmesi.</li><li>Kaygılı ya da kaçıngan bağlanma örüntülerinin sağlıklı sınırlara dönüştürülmesi.</li><li>Hayır diyebilme, kendi ihtiyaçlarını suçluluk duymadan dile getirebilme becerisinin geliştirilmesi.</li></ul>`
  },
  {
    title: "Travma ve Yas Süreçlerinde Psikolojik Destek Ne Zaman Alınmalıdır?",
    category: "Travma & Yas",
    featuredImage: "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=800&auto=format&fit=crop",
    content: `<p>Kayıp, ayrılık, kaza, hastalık veya şiddet gibi sarsıcı yaşam olayları insanın temel güvenlik hissini sarsabilir. Yas tutmak insan doğasının sağlıklı bir parçasıdır; ancak yas süreci kilitlendiğinde ya da travmatik belirtiler kronikleştiğinde uzman desteği hayati önem taşır.</p><p><strong>Ne Zaman Destek Alınmalı?</strong></p><p>Yaşanan olayın üzerinden aylar geçmesine rağmen kabuslar, flashback (olayı tekrar yaşama), hissizleşme, yoğun öfke veya dünyadan kopma hissi devam ediyorsa travma odaklı psikoterapi desteği alınmalıdır.</p>`
  },
  {
    title: "Sosyal Anksiyete (Topluluk Önünde Konuşma ve Çekinme) Terapiyle Çözülür mü?",
    category: "Kaygı & Stres",
    featuredImage: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop",
    content: `<p>Sosyal fobi veya sosyal kaygı bozukluğu; başkaları tarafından yargılanma, eleştirilme, küçük düşme veya rezil olma korkusu nedeniyle sosyal ortamlardan kaçınma durumudur.</p><p><strong>İyileşme Süreci</strong></p><p>Psikoterapi sürecinde danışanın 'kusursuz görünme' zorlantısı, katı içsel yargıçları ve zihnindeki varsayımlar sorgulanır. Kademeli maruz bırakma ve bilişsel yapılandırma yöntemleriyle bireyin sosyal yaşamda özgürce ve rahatça var olabilmesi sağlanır.</p>`
  },
  {
    title: "Öfke Kontrol Problemleri ve Duygusal Regülasyon Nasıl Sağlanır?",
    category: "Duygusal Düzenleme",
    featuredImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop",
    content: `<p>Öfke, tehdit veya haksızlık algısına karşı gelişen doğal bir temel duygudur. Ancak öfkenin denetlenemeyen patlamalara dönüşmesi, ilişkilerde yıkıma ve sonrasında yoğun pişmanlığa yol açar.</p><p><strong>Terapötik Yaklaşım</strong></p><p>Öfke çoğu zaman 'ikincil' bir duygudur; altında derin bir kırgınlık, çaresizlik, anlaşılmama veya yetersizlik hissi barındırabilir. Terapide öfkenin altındaki birincil duygular tespit edilir ve duyguyu yıkıcı olmadan ifade etme yolları öğretilir.</p>`
  },
  {
    title: "Tükenmişlik Sendromu (Burnout) Nedir, Nasıl Aşılır?",
    category: "Yaşam & Kariyer",
    featuredImage: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?q=80&w=800&auto=format&fit=crop",
    content: `<p>Tükenmişlik sendromu; uzun süreli iş veya yaşam stresi sonucunda ortaya çıkan duygusal tükenme, duyarsızlaşma ve kişisel başarı hissinde azalma tablosudur.</p><p><strong>Belirtiler ve Çözüm</strong></p><ul><li>Sabahları yataktan kalkmakta aşırı zorlanma ve kronik yorgunluk.</li><li>Mesleki performansta düşüş, işe ve insanlara karşı yabancılaşma.</li><li>Bireysel terapi ile mükemmeliyetçi inançlar incelenir, sağlıklı iş-yaşam sınırları çizilir ve öz-şefkat pratikleri geliştirilir.</li></ul>`
  },
  {
    title: "Psikoterapiye Gitmek Bir Zayıflık Göstergesi midir?",
    category: "Genel Bilgilendirme",
    featuredImage: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=800&auto=format&fit=crop",
    content: `<p>Toplumda geçmişten kalan yanlış algılardan biri, terapiye sadece 'baş edemeyen' ya da 'zayıf' insanların gittiği yönündedir. Oysa gerçeğe bakıldığında kendi kırılganlıklarıyla yüzleşebilmek yüksek bir psikolojik olgunluk ve cesaret gerektirir.</p><p><strong>İçsel Güç ve Farkındalık</strong></p><p>Bedenimiz hastalandığında hekime başvurmak ne kadar doğalsa, ruhsal dünyamızda zorlandığımızda bir uzmandan destek almak da o denli akılcı ve sağlıklı bir adımdır. Terapi bir acizlik değil, kişinin kendi hayatının sorumluluğunu eline alma hamlesidir.</p>`
  },
  {
    title: "Seanslar Sırasında Terapist Danışana Tavsiye Verir mi?",
    category: "Terapi Süreci",
    featuredImage: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
    content: `<p>Terapiye yeni başlayan pek çok kişinin beklentisi, terapistin kendisine ne yapması gerektiğini söyleyen bir bilge veya akıl hocası olmasıdır. Ancak profesyonel psikoterapi bu temele dayanmaz.</p><p><strong>Terapistin Rolü</strong></p><p>Terapist bir hayat koçu veya tavsiye veren bir dost değildir. Terapistin asıl görevi, danışanın kendi hayat kararlarını alabilmesi için içindeki sesleri duymasını sağlamak, bilinçdışı engelleri aydınlatmak ve kendi yaşamının tek yetkini olmasına eşlik etmektir.</p>`
  }
];
