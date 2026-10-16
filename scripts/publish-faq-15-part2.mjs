import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCh_bkX3vge2P0BTF9UDY5A1lHtGG8kyLs",
  authDomain: "manav-platform.firebaseapp.com",
  projectId: "manav-platform",
  storageBucket: "manav-platform.firebasestorage.app",
  messagingSenderId: "369433755693",
  appId: "1:369433755693:web:c14e8c01bf21eb5fcdf8a4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const NEW_FAQ_ITEMS = [
  {
    title: "Varoluşçu Psikoterapi Nedir ve Hangi Sorunlarda Tercih Edilir?",
    category: "Terapi Ekolleri",
    featuredImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    content: `<p>Varoluşçu psikoterapi; insan olmanın kaçınılmaz gerçeklikleri ve getirdiği temel kaygılar karşısında kişinin kendi anlamını nasıl kurduğunu inceleyen felsefi ve derinlikli bir psikoterapi ekolüdür.</p>
<p><strong>Varoluşun Dört Temel Meselesi</strong></p>
<p>Varoluşçu yaklaşım (Irvin Yalom, Rollo May, Viktor Frankl gibi kuramcıların öncülüğünde), insan ruhundaki çatışmaların dört temel varoluşsal meseleden kaynaklandığını savunur:</p>
<ul>
  <li><strong>Ölüm:</strong> Hayatın sonluluğu ve bu kaçınılmaz gerçeğin yarattığı varoluşsal kaygı.</li>
  <li><strong>Özgürlük ve Sorumluluk:</strong> Kendi seçimlerimizin mimarı olmak ve bu seçimlerin bedelini üstlenmek.</li>
  <li><strong>Varoluşsal Yalıtım (Yalnızlık):</strong> Ne kadar sevilirsek sevilelim bu dünyada tek bir beden ve zihin olarak var olmanın getirdiği ayrılık hissi.</li>
  <li><strong>Anlamsızlık:</strong> Evrenin bize hazır bir anlam sunmadığı gerçeği ve kendi öznel anlamımızı inşa etme gerekliliği.</li>
</ul>
<p><strong>Hangi Durumlarda Başvurulur?</strong></p>
<p>Kişi hayatında büyük bir dönüm noktasındaysa, ani bir yön kaybı, amaçsızlık, yoğun bir boşluk hissi yaşıyorsa veya 'Her şeye sahibim ama neden mutlu hissedemiyorum?' sorusuyla baş başa kaldıysa varoluşçu psikoterapi son derece dönüştürücü bir alan açar.</p>`
  },
  {
    title: "Psikanaliz ve Psikanalitik Psikoterapi Nedir, Nasıl Uygulanır?",
    category: "Terapi Ekolleri",
    featuredImage: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800&auto=format&fit=crop",
    content: `<p>Psikanalitik psikoterapi, insan davranışlarının, duygusal kilitlenmelerinin ve tekrarlayan yaşam döngülerinin kökeninde 'bilinçdışı çatışmaların' yattığını temel alan derinlik psikolojisi ekolüdür.</p>
<p><strong>Buzdağının Görünmeyen Yüzü</strong></p>
<p>Sigmund Freud ve Jacques Lacan çizgisindeki psikanalitik bakış, günlük yaşamda karşılaştığımız panik, kaygı, depresyon veya ilişki sorunlarını sadece susturulması gereken birer arıza olarak değil, bilinçdışının dille söyleyemediğini semptomla fısıldaması olarak görür.</p>
<p><strong>Seansta Neler Olur?</strong></p>
<ul>
  <li><strong>Serbest Çağrışım:</strong> Danışan aklına gelen hiçbir düşünceyi filtrelemeden, sansürlemeden özgürce kelimelere döker.</li>
  <li><strong>Rüya Analizi:</strong> Bilinçdışı arzuların ve bastırılmış korkuların sembolik dili çözümlenir.</li>
  <li><strong>Aktarım (Transference):</strong> Danışanın geçmişteki önemli figürlerle (anne, baba) yaşadığı ilişki kalıplarını terapistle olan ilişkisinde yeniden sahnelemesi ve bunun güvenli bir ortamda fark edilip çözülmesi sağlanır.</li>
</ul>
<p>Bu süreç, kişiye hazır reçeteler vermek yerine kendi içsel hakikatiyle yüzleşme ve özgürleşme imkanı tanır.</p>`
  },
  {
    title: "Mükemmeliyetçilik ve Yetersizlik Hissi Terapiyle Nasıl Aşılır?",
    category: "Bireysel Gelişim",
    featuredImage: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop",
    content: `<p>Mükemmeliyetçilik çoğu zaman bir başarı meziyeti gibi görünse de klinik pratikte aslında derin bir 'yetersizlik korkusu' ve sevilmeme endişesinin savunma zırhıdır.</p>
<p><strong>Acımasız İçsel Yargıç (Süperego)</strong></p>
<p>Mükemmeliyetçi birey, hata yapmayı varlığına yönelik bir tehdit olarak algılar. Kendi zihninde kurduğu kusursuzluk standardına ulaşamadığında kendini acımasızca eleştirir. Bu durum çoğu zaman işleri erteleme (procrastination), tükenmişlik ve performans kaygısına dönüşür.</p>
<p><strong>Terapötik Dönüşüm</strong></p>
<p>Terapi odasında şu temel adımlar üzerinde çalışılır:</p>
<ul>
  <li>Değer duygusunu başarı ve onaylanma şartından ayrıştırmak.</li>
  <li>Hata yapmanın öğrenme ve büyüme için kaçınılmaz bir insani hakikat olduğunu kabul etmek.</li>
  <li>D. W. Winnicott'ın 'yeterince iyi' (good enough) kavramını içselleştirerek katı beklentileri esnetmek ve öz-şefkat geliştirmek.</li>
</ul>`
  },
  {
    title: "Sınır Koyma Güçlüğü ve 'Hayır' Diyememek Neden Kaynaklanır?",
    category: "İlişkiler",
    featuredImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    content: `<p>İlişkilerinde sürekli başkalarını memnun etmeye çalışan, kendi ihtiyaçlarını hep erteleyen ve 'hayır' demekte zorlanan bireyler sıklıkla kronik öfke, tükenmişlik ve değersizlik hissi yaşarlar.</p>
<p><strong>Hayır Demekten Neden Korkarız?</strong></p>
<p>Çoğu zaman 'hayır' demenin ilişkiyi bozacağı, karşı tarafı kıracağı veya terk edilmeyle sonuçlanacağı inancı erken çocukluk deneyimlerinden beslenir. Birey, sadece 'uyumlu ve verici' olduğu takdirde sevgi göreceğini öğrenmiştir.</p>
<p><strong>Sınır Çizmek Neden Bencillik Değildir?</strong></p>
<p>Sağlıklı bir sınır, iki insan arasına örülen aşılmaz bir duvar değil; ilişkinin nefes almasını sağlayan koruyucu bir kapıdır. Terapide kişi, sınır koyduğunda yaşadığı suçluluk duygusuyla kalabilmeyi, kendi duygusal alanını savunabilmeyi ve onay bağımlılığından özgürleşmeyi öğrenir.</p>`
  },
  {
    title: "Narsistik Kişilik Örüntüleri ve Toksik İlişki Döngüleri Nasıl Fark Edilir?",
    category: "İlişkiler",
    featuredImage: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop",
    content: `<p>Narsistik örüntülere sahip bir partnerle ilişki yaşamak, kişinin kendi aklından, algılarından ve değerinden şüphe etmesine yol açan son derece yıpratıcı bir süreçtir.</p>
<p><strong>Klasik Toksik Döngü</strong></p>
<ul>
  <li><strong>İdealizasyon (Göklere Çıkarma):</strong> İlişkinin başında aşırı ilgi, övgü ve büyük vaatlerle danışanın sınırları hızla aşılır.</li>
  <li><strong>Değersizleştirme:</strong> Zamanla eleştiriler, küçümsemeler ve soğukluk başlar; kişi kendisini sürekli hata yapıyormuş gibi hisseder.</li>
  <li><strong>Gaslighting (Manipülasyon):</strong> Partner, olayları ve gerçekliği inkar ederek diğer kişinin hafızasını ve sezgilerini sorgulatır ('Sen fazla hassassın', 'Ben öyle demedim').</li>
</ul>
<p><strong>Terapi Desteği</strong></p>
<p>Bireysel terapi, bu ilişkide kaybedilen özgüvenin yeniden toparlanması, sınırların yeniden kurulması ve neden benzer partnerlere çekim duyulduğunun bilinçdışı kökenlerini aydınlatmak için gereklidir.</p>`
  },
  {
    title: "Obsesif Kompulsif Bozukluk (OKB) ve İstenmeyen Düşüncelerle Başa Çıkma",
    category: "Kaygı & Stres",
    featuredImage: "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?q=80&w=800&auto=format&fit=crop",
    content: `<p>Obsesif Kompulsif Bozukluk (OKB); kişinin iradesi dışında zihnine üşüşen rahatsız edici, tekrarlayıcı düşünceler (obsesyonlar) ve bu düşüncelerin yarattığı yoğun kaygıyı azaltmak için yapılan ritüeller (kompulsiyonlar) ile belirginleşir.</p>
<p><strong>Düşünce ile Eylem Arasındaki Yanılgı</strong></p>
<p>OKB yaşayan kişiler genellikle 'Aklıma kötü bir şey geliyorsa ben kötü biriyim' veya 'Düşünüyorsam gerçekleşebilir' yanılgısına (düşünce-eylem kaynaşması) kapılırlar. Oysa insan zihni günde binlerce rastgele ve saçma düşünce üretir.</p>
<p><strong>Terapide Nasıl Çalışılır?</strong></p>
<p>Bilişsel yaklaşımlar ve maruz bırakma teknikleriyle ritüeller kademeli olarak durdurulurken, dinamik psikoterapiyle obsesyonların altında yatan bastırılmış öfke, suçluluk ve kontrol ihtiyacı ele alınır.</p>`
  },
  {
    title: "Kronik Yalnızlık ve İnsanlara Güvenememe Hissi Nasıl İyileşir?",
    category: "İlişkiler",
    featuredImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop",
    content: `<p>Kalabalıklar içinde bile derin bir yalıtılmışlık hissetmek, kimseye güvenememek ve gerçek benliğini saklama ihtiyacı, günümüz insanının en sık karşılaştığı ruhsal yaralardandır.</p>
<p><strong>Savunma Amaçlı İzolasyon</strong></p>
<p>Geçmişte güveni suiistimal edilmiş, aldatılmış veya erken çocuklukta ihmale uğramış kişiler için yakınlık kurmak büyük bir 'incinme tehlikesi' anlamına gelir. Bu yüzden kişi kendini korumak adına yalnızlığı bir kale gibi inşa eder; ancak bu kale zamanla bir hapishaneye dönüşür.</p>
<p><strong>Terapötik Karşılaşma</strong></p>
<p>Terapist ile danışan arasında kurulan tutarlı, güvenli ve şeffaf ilişki, danışanın dünyada güvenilebilecek insanların da var olduğunu deneyimlediği ilk onarıcı laboratuvar vazifesi görür.</p>`
  },
  {
    title: "Duygusal Yeme ve Beden Algısı Sorunlarının Psikolojik Kökleri",
    category: "Duygusal Düzenleme",
    featuredImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
    content: `<p>Fiziksel olarak aç olmadığımız halde stres, üzüntü, yalnızlık veya öfke anlarında kontrolsüzce yemek yeme isteği 'duygusal yeme' olarak adlandırılır.</p>
<p><strong>Yemekle Doldurulan Boşluk</strong></p>
<p>Bebeklikten itibaren beslenme, şefkat ve sakinleşmeyle iç içe geçmiş bir eylemdir. Yetişkinlikte kelimelerle ifade edilemeyen veya tahammül edilemeyen yoğun duygusal acılar, yiyeceklerin anlık dopamin etkisiyle uyuşturulmaya çalışılır. Ancak sonrasında gelen suçluluk hissi yeni bir yeme atağını tetikler.</p>
<p><strong>Terapinin Katkısı</strong></p>
<p>Terapi sürecinde 'Neyi yiyorum?' sorusundan ziyade 'Beni ne yiyip bitiriyor?' sorusuna odaklanılır. Danışanın duygusal açlığını tanıyıp duygularını yemek dışı sağlıklı yollarla düzenlemesi sağlanır.</p>`
  },
  {
    title: "Rüyalar Psikoterapide Nasıl Ele Alınır ve Bilinçdışını Nasıl Aydınlatır?",
    category: "Psikanaliz",
    featuredImage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800&auto=format&fit=crop",
    content: `<p>Sigmund Freud rüyaları 'Bilinçdışına giden kral yolu' olarak tanımlamıştır. Günlük hayatta katı savunmalarımızla bastırdığımız arzu, korku ve çatışmalar, rüyalarda sembolik biçimlere bürünerek yüzeye çıkar.</p>
<p><strong>Görünen Rüya vs. Gizil Anlam</strong></p>
<p>Rüya tabir kitaplarındaki genel geçer kalıpların aksine psikoterapide rüyalar tamamen bireyin öznel yaşam hikayesiyle anlam kazanır. Rüyadaki bir nesne veya olay, yalnızca o rüyayı gören kişinin çağrışımlarıyla çözümlenebilir.</p>
<p><strong>Terapötik Kullanım</strong></p>
<p>Tekrarlayan kabuslar veya çarpıcı rüyalar, danışanın uyanıkken yüzleşmekten kaçtığı bir hakikati işaret eder. Rüyaları terapiye getirmek sürecin hızlanmasını ve bilinçdışı dinamiklerin görünür kılınmasını sağlar.</p>`
  },
  {
    title: "Ayrılık ve Boşanma Sonrası Ruhsal Toparlanma Süreci Nasıl Yönetilir?",
    category: "Travma & Yas",
    featuredImage: "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=800&auto=format&fit=crop",
    content: `<p>Önemli bir ilişkinin bitişi ya da boşanma, sevilen birinin kaybına benzer derin bir yas sürecini beraberinde getirir. Çünkü kişi sadece partnerini değil; ortak geleceği, alışkanlıkları ve 'biz' kimliğini de kaybeder.</p>
<p><strong>Yasın Doğal Evreleri</strong></p>
<p>İnkar, öfke, suçluluk ve derin hüzün bu sürecin beklenen duraklarıdır. Bu duyguları hissetmek bir zayıflık değil, ruhun kaybı sindirme çabasıdır.</p>
<p><strong>Toparlanma ve Bireyleşme</strong></p>
<p>Terapide kişi, eski ilişkinin idealize edilmiş yanılgılarından sıyrılarak yaşananları olduğu gibi kabullenme olgunluğuna erişir. Kendi bireysel kimliğini, sınırlarını ve yaşam enerjisini yeniden inşa eder.</p>`
  },
  {
    title: "Somatizasyon (Psikosomatik Ağrılar): Beden Ruhun Yükünü Nasıl Taşır?",
    category: "Sağlık & Psikoloji",
    featuredImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
    content: `<p>Tıbbi testlerde hiçbir organik neden bulunamadığı halde yaşanan kronik mide-bağırsak problemleri, fibromiyalji ağrıları, baş ağrıları veya nefes darlığı hissi sıklıkla psikosomatik kökenlidir.</p>
<p><strong>Dile Gelmeyen Acının Bedene Dökülmesi</strong></p>
<p>Ruhsal olarak ifade edilemeyen, bastırılan öfke, yas ve kaygı bedensel bir semptom olarak kendini dışa vurur. Freud'un belirttiği gibi: 'İfade edilmemiş duygular asla ölmez; sadece diri diri gömülür ve sonradan daha çirkin şekillerde ortaya çıkarlar.'</p>
<p><strong>Tedavi Yaklaşımı</strong></p>
<p>Psikoterapi süreci, bedenin konuşmak zorunda kaldığı o sessiz acıyı sözcüklerle ifade edebilme becerisini kazandırır. Danışan duygularını tanıdıkça bedensel gerilimler kendiliğinden çözülür.</p>`
  },
  {
    title: "Özgüven Eksikliği ve Değersizlik İnancı Nasıl Dönüştürülür?",
    category: "Bireysel Gelişim",
    featuredImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
    content: `<p>Pek çok insan dışarıdan bakıldığında başarılı ve güçlü görünse de içeride sürekli 'yetersiz ve sahtekar' olduğu hissiyatıyla (İmpostor Sendromu) boğuşur.</p>
<p><strong>Hakiki Özgüven Nedir?</strong></p>
<p>Gerçek özgüven, 'Her şeyi başarabilirim, kimseden korkmam' illüzyonu değil; 'Eksiklerim, hatalarım ve kusurlarımla birlikte bu hayatta var olmaya ve sevilmeye layığım' bilincidir.</p>
<p><strong>Terapide Ne Yapılır?</strong></p>
<p>Erken yaşta ebeveynler veya çevre tarafından koşullu sevgiyle büyütülen kişilerin 'onay alma zorlantısı' incelenir. Kişinin kendi değerini dış faktörlere bağlamaktan vazgeçip kendi içsel merkezini bulması sağlanır.</p>`
  },
  {
    title: "Geçmişe Takılı Kalmak ve Sürekli Pişmanlık (Ruminasyon) Nasıl Biter?",
    category: "Kaygı & Stres",
    featuredImage: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=800&auto=format&fit=crop",
    content: `<p>Geçmişte yaşanan olumsuz olayları, hataları veya keşkeleri zihinde sürekli tekrar tekrar oynatma durumuna 'ruminasyon' (zihinsel geviş getirme) adı verilir.</p>
<p><strong>Neden Geçmişten Kopamayız?</strong></p>
<p>Zihin, geçmişi tekrar düşünerek kontrol edebileceği veya değiştirebileceği gibi bilinçdışı bir yanılsamaya kapılır. Oysa bu sadece bugünün enerjisini tüketir ve depresif döngüyü besler.</p>
<p><strong>Geçmişle Vedalaşmak</strong></p>
<p>Terapide geçmişte yapılan seçimlerin o anki bilinç düzeyi ve şartlar dahilinde yapıldığı gerçeğiyle yüzleşilir. Kayıpların yası tutulur ve dikkatin şimdiki anın imkanlarına yönelmesi sağlanır.</p>`
  },
  {
    title: "Yetişkinlerde Odaklanma Problemleri ve Zihinsel Dağınıklık Psikolojik midir?",
    category: "Yaşam & Kariyer",
    featuredImage: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=800&auto=format&fit=crop",
    content: `<p>Son yıllarda yetişkinler arasında artış gösteren odaklanamama, unutkanlık ve zihinsel dağınıklık şikayetleri her zaman nörolojik bir DEHB tablosuna işaret etmez; çoğunlukla psikolojik aşırı yüklenmenin bir göstergesidir.</p>
<p><strong>Beyin Sisi ve Duygusal Aşırı Yüklenme</strong></p>
<p>Bastırılmış kaygılar, çözümlenmemiş ilişki problemleri ve dijital uyarım bombardımanı zihnin işlem kapasitesini doldurur. Zihin arka planda yoğun bir duygusal kriz çözerken ön plandaki görevlere odaklanamaz.</p>
<p><strong>Çözüm Aşamaları</strong></p>
<p>Bireyin hayatındaki gizli stres kaynakları deşifre edilir, zihinsel sınırlandırma ve dinlenme pratikleri geliştirilir.</p>`
  },
  {
    title: "Terapi Bağımlılık Yapar mı ve Seanslara Ne Kadar Devam Edilmelidir?",
    category: "Terapi Süreci",
    featuredImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
    content: `<p>Terapiye başlamayı düşünen kişilerin taşıdığı yaygın endişelerden biri de 'Terapiste bağımlı hale gelir miyim?' sorusudur.</p>
<p><strong>Terapinin Nihai Amacı: Bireyleşme</strong></p>
<p>Etik ve yetkin bir psikoterapi sürecinin en temel amacı, danışanı terapiste muhtaç kılmak değil; danışanın kendi içindeki iyileştirici kaynakları harekete geçirerek bağımsızlaşmasını sağlamaktır.</p>
<p><strong>Sonlandırma (Terminasyon) Evresi</strong></p>
<p>Danışan hayatındaki krizlerle kendi başına baş edebildiğini hissettiğinde, terapistle vedalaşma süreci planlı şekilde ele alınır. Terapistin içselleştirilmesiyle kişi hayat yolculuğuna kendi pusulasıyla devam eder.</p>`
  }
];

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function run() {
  console.log("Checking current FAQ documents in Firestore...");
  const snap = await getDocs(collection(db, 'faq'));
  console.log(`Current FAQ count in Firestore: ${snap.size}`);

  const existingTitles = new Set(snap.docs.map(d => d.data().title?.trim()));

  let added = 0;
  for (let i = 0; i < NEW_FAQ_ITEMS.length; i++) {
    const item = NEW_FAQ_ITEMS[i];
    if (existingTitles.has(item.title.trim())) {
      console.log(`[SKIP] Already exists: "${item.title}"`);
      continue;
    }

    const raw = stripHtml(item.content);
    const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;

    const docData = {
      title: item.title,
      category: item.category,
      featuredImage: item.featuredImage,
      content: item.content,
      excerpt: excerpt,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'faq'), docData);
    console.log(`[${i + 1}/${NEW_FAQ_ITEMS.length}] Published NEW FAQ: "${item.title}" (ID: ${docRef.id})`);
    added++;
  }

  console.log(`\nSuccessfully published ${added} new FAQ articles to Firestore!`);
  const finalSnap = await getDocs(collection(db, 'faq'));
  console.log(`Total FAQ count now in Firestore: ${finalSnap.size}`);
  process.exit(0);
}

run().catch(err => {
  console.error("Error during publishing new FAQs:", err);
  process.exit(1);
});
