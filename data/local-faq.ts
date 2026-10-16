export interface FaqItem {
  id: string;
  title: string;
  category: string;
  date: string;
  createdAt: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
}

export const LOCAL_FAQ: FaqItem[] = [
  {
    id: "varoluscu-psikoterapi-nedir",
    title: "Varoluşçu Psikoterapi Nedir ve Hangi Sorunlarda Tercih Edilir?",
    category: "Terapi Ekolleri",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:00:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    excerpt: "Varoluşçu psikoterapi; hayatın kaçınılmaz gerçekleri, anlam arayışı, ölüm kaygısı ve seçimlerin sorumluluğu üzerine odaklanan felsefi derinlikli bir yaklaşımdır.",
    content: `<p>Varoluşçu psikoterapi, insanı sadece biyolojik ya da davranışsal bir mekanizma olarak değil; hayatına anlam katmak, seçimler yapmak ve bu seçimlerin sorumluluğunu taşımak zorunda olan bir 'özne' olarak ele alan felsefi ve derinlikli bir psikoterapi ekolüdür.</p>

<p><strong>Varoluşun Dört Temel Meselesi</strong></p>
<p>Irvin Yalom, Rollo May ve Viktor Frankl gibi kuramcıların geliştirdiği varoluşçu çerçeve, insanın ruhsal sancılarının çoğunlukla şu dört temel gerçeklikle yüzleşme mücadelesinden doğduğunu kabul eder:</p>
<ul>
  <li><strong>Ölüm ve Sonluluk:</strong> Hayatın sınırlı olduğu gerçeği ve bu sonluluğun uyandırdığı temel kaygı. Ölümü yok saymak yerine hayatın kıymetini hatırlatan bir sınır olarak entegre etmek.</li>
  <li><strong>Özgürlük ve Sorumluluk:</strong> İnsanın kendi kararlarının tek mimarı olması. Başkalarını ya da kaderi suçlamayı bırakıp kendi hayatının faili haline gelme cesareti.</li>
  <li><strong>Varoluşsal Yalıtım (Yalnızlık):</strong> Ne kadar kalabalıklar içinde olsak da bu dünyayı kendi bilincimizle deneyimlediğimiz gerçeğiyle barışmak.</li>
  <li><strong>Anlamsızlık:</strong> Evrenin bize hazır bir senaryo sunmadığı gerçeği karşısında, kendi öznel değerlerimizi ve hayat amacımızı sıfırdan inşa etmek.</li>
</ul>

<p><strong>Hangi Durumlarda Tercih Edilir?</strong></p>
<p>Kariyer geçişleri, boşanma, emeklilik, kayıp gibi hayat dönemeçlerinde; genel bir tatminsizlik, boşluk hissi ve 'Hayatımın anlamı ne?' sorusunun zihni meşgul ettiği süreçlerde varoluşçu psikoterapi kişiye sahici bir rehberlik sunar.</p>`
  },
  {
    id: "psikanalitik-psikoterapi-nasil-uygulanir",
    title: "Psikanaliz ve Psikanalitik Psikoterapi Nedir, Nasıl Uygulanır?",
    category: "Terapi Ekolleri",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:05:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800&auto=format&fit=crop",
    excerpt: "Psikanalitik psikoterapi, şimdiki zamandaki kilitlenmelerin kökeninde yatan bilinçdışı çatışmaları, çocukluk ilişkilerini ve tekrarları anlamlandırmayı hedefler.",
    content: `<p>Psikanalitik psikoterapi; bireyin bugün yaşadığı kaygı, depresyon, öfke ya da ilişki kilitlenmelerinin kökeninde 'bilinçdışı dinamiklerin' ve erken çocukluk yaşantılarının yattığını savunan köklü bir derinlik psikolojisi yöntemidir.</p>

<p><strong>Semptomun Ardındaki Gizli Anlam</strong></p>
<p>Sigmund Freud ve Jacques Lacan'ın teorileştirdiği psikanalitik bakış açısına göre, insan ruhu çözemediği çatışmaları bastırır. Ancak bastırılan hiçbir duygu kaybolmaz; panik atak, takıntı, boşluk hissi ya da psychosomatik ağrılar biçiminde 'semptom' olarak geri döner. Terapi bu semptomu bir düşman gibi susturmak yerine, onun ne anlatmak istediğini dinleme sanatıdır.</p>

<p><strong>Seansın Temel Araçları</strong></p>
<ul>
  <li><strong>Serbest Çağrışım:</strong> Danışanın aklına gelen düşünceleri, ne kadar önemsiz ya da saçma görünürse görünsün, sansürsüzce ifade etmesi.</li>
  <li><strong>Rüya Çözümlemeleri:</strong> Bilinçdışının sembolik dili olan rüyaların danışanın öznel çağrışımlarıyla birlikte incelenmesi.</li>
  <li><strong>Aktarım (Transference):</strong> Danışanın geçmişteki ebeveyn ilişkilerinden getirdiği kalıpları terapistle olan ilişkisinde sahnelemesi ve bunun güvenli bir odada fark edilip onarılması.</li>
</ul>

<p>Bu yaklaşım hızlı bir tavsiye vermek yerine, kişinin kendi bilinçdışı zincirlerini kırmasını ve gerçek arzusunu keşfetmesini sağlar.</p>`
  },
  {
    id: "mukemmeliyetcilik-ve-yetersizlik-hissi",
    title: "Mükemmeliyetçilik ve Yetersizlik Hissi Terapiyle Nasıl Aşılır?",
    category: "Bireysel Gelişim",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:10:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop",
    excerpt: "Mükemmeliyetçilik başarı arzusu değil, sevilmeme ve eleştirilme korkusudur. Terapide katı süperego ve yetersizlik inancı nasıl dönüştürülür?",
    content: `<p>Toplumda çoğu zaman övgüyle karşılanan mükemmeliyetçilik, klinik gerçeklikte kişinin sırtında taşıdığı en ağır duygusal prangalardan biridir. Çoğu mükemmeliyetçi insan, başarıya ulaşsa dahi tatmin olamaz ve derin bir 'yetersizlik' hissiyle kıvranır.</p>

<p><strong>Zihindeki Acımasız Eleştirmen (Katı Süperego)</strong></p>
<p>Mükemmeliyetçilik, hata yapmayı varoluşsal bir felaket olarak algılar. 'Eğer kusursuz olmazsam sevilmem, onaylanmam ve terk edilirim' inancı, çocukluk döneminde sevginin başarı koşuluna bağlandığı aile dinamiklerinden filizlenir.</p>

<p><strong>Erteleme (Procrastination) ile Gizli Bağ</strong></p>
<p>Pek çok mükemmeliyetçi birey, işlerini son ana kadar ertelemekten şikayet eder. Bu tembellik değil; 'Mükemmel yapamayacaksam hiç başlamayayım' korkusunun doğurduğu bir savunma felcidir.</p>

<p><strong>Terapötik Yaklaşım</strong></p>
<ul>
  <li>Öz-değeri başarı ve hatasızlık kriterlerinden bağımsız kılmak.</li>
  <li>D. W. Winnicott'ın geliştirdiği 'Yeterince İyi' (Good Enough) felsefesini içselleştirmek.</li>
  <li>Kendine karşı acımasız iç sesi, şefkatli ve gerçekçi bir yetişkin sesine dönüştürmek.</li>
</ul>`
  },
  {
    id: "sinir-koyma-ve-hayir-diyememek",
    title: "Sınır Koyma Güçlüğü ve 'Hayır' Diyememek Neden Kaynaklanır?",
    category: "İlişkiler",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:15:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    excerpt: "Başkalarını memnun etmek için sürekli 'evet' demek, içsel bir öfke ve tükenmişlik yaratır. Suçluluk hissetmeden sınır çizmek nasıl öğrenilir?",
    content: `<p>Hayatında herkesin yardımına koşan, kimseyi kırmamak için kendi dinlenmesinden, zamanından ve parasından feragat eden insanların ortak sorunu 'hayır' diyememektir. Ancak sınır koyamayan insan, zamanla çevresine karşı gizli bir öfke biriktirir.</p>

<p><strong>Neden Hayır Diyemiyoruz?</strong></p>
<p>Kişi, 'Hayır dersem bencil görünürüm', 'Beni sevmezler', 'Beni dışlarlar' gibi erken dönem koşullanmalarına sahiptir. Kendi sınırlarını çizmek, bilinçdışında bir 'terk edilme tehlikesi' gibi algılanır.</p>

<p><strong>Sınır Çizmek Duvar Örmek Değildir</strong></p>
<p>Sınır koymak ilişkileri koparmaz; aksine ilişkileri istismardan ve yozlaşmaktan korur. Sağlıklı bir 'hayır', kişinin kendi ruhsal bütünlüğüne söylediği sahici bir 'evet'tir.</p>

<p><strong>Terapide Nasıl Çalışılır?</strong></p>
<ul>
  <li>'Hayır' dendiğinde ortaya çıkan yoğun suçluluk duygusuna tahammül etme kapasitesini geliştirmek.</li>
  <li>Karşı tarafın tepkilerinin sorumluluğunu almaktan vazgeçmek.</li>
  <li>İlişkilerde onaylanma ihtiyacının yerine eşit ve dengeli bir ilişki dinamiği koymak.</li>
</ul>`
  },
  {
    id: "narsistik-kisilik-ve-toksik-iliskiler",
    title: "Narsistik Kişilik Örüntüleri ve Toksik İlişki Döngüleri Nasıl Fark Edilir?",
    category: "İlişkiler",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:20:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop",
    excerpt: "Gaslighting, aşırı övgüyle başlayıp değersizleştirmeyle süren toksik döngüler ve narsistik manipülasyonla baş etme yolları.",
    content: `<p>Narsistik örüntülere sahip biriyle ilişki içinde olmak, kişinin zaman içinde kendi aklından, hafızasından ve değerinden şüphe duymasına yol açan derin bir duygusal erozyondur.</p>

<p><strong>Toksik İlişkinin Üç Temel Evresi</strong></p>
<ul>
  <li><strong>İdealizasyon (Love Bombing):</strong> İlişkinin başında aşırı hediyeler, iltifatlar ve 'Ruh ikizimi buldum' yanılsamasıyla sınırların hızlıca eritilmesi.</li>
  <li><strong>Değersizleştirme (Devaluation):</strong> Zaman geçtikçe başlayan iğneleyici eleştiriler, kıyaslamalar, küçümsemeler ve duygusal geri çekilmeler.</li>
  <li><strong>Terk Etme ve Yeniden Çekme (Hoovering):</strong> Partner tam ilişkiden kopmaya karar verdiğinde tekrar aynı büyüleyici başlangıç taktiklerine dönülmesi.</li>
</ul>

<p><strong>Gaslighting: Gerçekliğin Çalınması</strong></p>
<p>'Ben öyle demedim', 'Sen fazla alıngansın', 'Her şeyi kafanda kuruyorsun' cümleleriyle karşı tarafın gerçeklik algısı manipüle edilir. Terapi süreci, danışanın kendi algılarına ve öz-saygısına yeniden güven duymasını ve bu döngüyü kırmasını sağlar.</p>`
  },
  {
    id: "okb-ve-istenmeyen-dusunceler",
    title: "Obsesif Kompulsif Bozukluk (OKB) ve İstenmeyen Düşüncelerle Başa Çıkma",
    category: "Kaygı & Stres",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:25:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?q=80&w=800&auto=format&fit=crop",
    excerpt: "OKB'de akla gelen istenmeyen düşünceler neden korkutur? Düşünce-eylem kaynaşması ve ritüelleri durdurmanın psikolojik dinamikleri.",
    content: `<p>Obsesif Kompulsif Bozukluk (OKB), kişinin iradesi hilafına zihnine hücum eden rahatsız edici düşünceler (obsesyonlar) ve bu düşüncelerin yol açtığı kaygıyı yatıştırmak için sergilenen zihinsel veya davranışsal eylemler (kompulsiyonlar) tablosudur.</p>

<p><strong>Düşünce ile Eylem Bir Değildir</strong></p>
<p>OKB yaşayan kişilerin en büyük tuzağı 'Düşünce-Eylem Kaynaşması'dır (Thought-Action Fusion). Kişi 'Aklıma sevdiklerime zarar verme ya da ahlaksızca bir düşünce geliyorsa ben kötü biriyim' inancına kapılır. Oysa insan beyni günde binlerce rastgele ve tuhaf düşünce üretir; bu düşünceler bizim karakterimizi veya niyetimizi göstermez.</p>

<p><strong>Terapide Nasıl Çözülür?</strong></p>
<ul>
  <li>Ritüelleri (tekrar tekrar kontrol etme, temizleme, sayma) kademeli olarak durdurup belirsizlik kaygısına tahammül geliştirmek.</li>
  <li>Düşünceleri kovmaya çalışmanın onları daha da güçlendirdiğini fark edip zihinsel esneklik kazanmak.</li>
  <li>Obsesyonların ardındaki bilinçdışı suçluluk ve kontrol ihtiyacını çözümlemek.</li>
</ul>`
  },
  {
    id: "kronik-yalnizlik-ve-guvensizlik",
    title: "Kronik Yalnızlık ve İnsanlara Güvenememe Hissi Nasıl İyileşir?",
    category: "İlişkiler",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:30:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop",
    excerpt: "Kalabalıklar içinde bile yalnız hissetmek, bağlanma korkusu ve geçmiş hayal kırıklıklarının yarattığı savunma duvarlarını aşma yolları.",
    content: `<p>Kronik yalnızlık, etrafta hiç kimsenin olmaması demek değildir. Pek çok insan ailesi, arkadaşları ve iş çevresi olduğu halde derin bir 'görülmeme ve anlaşılamama' boşluğu hisseder.</p>

<p><strong>Savunma Kalesi Olarak Yalnızlık</strong></p>
<p>Geçmişte duygusal ihmale uğramış, aldatılmış ya da en çok güvendiği insanlar tarafından yarı yolda bırakılmış bir birey için insanlara yaklaşmak tehlikeli bir risk haline gelir. Kişi incinmemek adına etrafına görünmez cam duvarlar örer. Ancak bu duvarlar kişiyi tehlikeden korurken sevgiden ve canlılıktan da mahrum bırakır.</p>

<p><strong>Terapötik Karşılaşma</strong></p>
<p>Terapi odası, danışanın bir başkasıyla ilk defa maskesiz, savunmasız ve yargılanma kaygısı taşımadan temas kurduğu güvenli bir alandır. Terapistle kurulan güven bağı, dış dünyada da sahici ve besleyici ilişkiler kurmanın provasını oluşturur.</p>`
  },
  {
    id: "duygusal-yeme-ve-beden-algisi",
    title: "Duygusal Yeme ve Beden Algısı Sorunlarının Psikolojik Kökleri",
    category: "Duygusal Düzenleme",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:35:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
    excerpt: "Mide değil ruh acıktığında: Duygusal yeme nöbetleri, bastırılmış öfke ve bedenle kurulan çatışmalı ilişkinin psikolojik kökenleri.",
    content: `<p>Karnımız tok olduğu halde stresli bir günün akşamında kontrolsüzce atıştırmalıklara yöneliyorsak, doyurmaya çalıştığımız şey midemiz değil ruhumuzdaki bir boşluktur.</p>

<p><strong>Duygusal Açlık ile Fiziksel Açlık Farkı</strong></p>
<ul>
  <li>Fiziksel açlık yavaş gelişir, her türlü yiyecekle tatmin olur ve doyduğunda durur.</li>
  <li>Duygusal açlık aniden gelir, belirli yiyeceklere (şeker, karbonhidrat, fast food) aşırı odaklanır ve sonrasında yoğun pişmanlık ve suçluluk bırakır.</li>
</ul>

<p><strong>Yemekle Susturulan Duygular</strong></p>
<p>Çoğu zaman dile getirilemeyen öfke, yalnızlık, hayal kırıklığı ve değersizlik hisleri yemek aracılığıyla uyuşturulur. Terapide danışanın bedenini bir düşman gibi cezalandırmayı bırakması, yeme krizini tetikleyen birincil duygularını tanıyıp bunları dille ifade etmesi hedeflenir.</p>`
  },
  {
    id: "ruyalar-psikoterapide-nasil-ele-alinir",
    title: "Rüyalar Psikoterapide Nasıl Ele Alınır ve Bilinçdışını Nasıl Aydınlatır?",
    category: "Psikanaliz",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:40:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800&auto=format&fit=crop",
    excerpt: "Freud'un 'bilinçdışına giden kral yolu' dediği rüyalar terapide nasıl analiz edilir? Semboller, kabuslar ve gizli arzular.",
    content: `<p>Uykuda bilincin sansür mekanizması gevşediğinde, uyanıkken bastırdığımız arzular, korkular ve işlenmemiş travmatik anılar semboller kılığına bürünerek rüyalarımıza girer.</p>

<p><strong>Görünen İçerik vs. Gizil Anlam</strong></p>
<p>Rüyalar genel geçer rüya tabirleriyle anlaşılamaz. Bir rüyadaki köprü, uçurum ya da kayıp bir anahtar, sadece o rüyayı gören danışanın hayat hikayesinde neyi simgeliyorsa o anlamı taşır.</p>

<p><strong>Tekrarlayan Kabuslar Ne Söyler?</strong></p>
<p>Zihnin defalarca aynı temada kabus görmesi, çözülmemiş bir krizin ruhsal aygıt tarafından defalarca işlenmeye çalışıldığını gösterir. Rüyaları seansa getirmek danışanın kendini çok daha derin bir katmanda tanımasını sağlar.</p>`
  },
  {
    id: "ayrilik-ve-bosanma-sonrasi-toparlanma",
    title: "Ayrılık ve Boşanma Sonrası Ruhsal Toparlanma Süreci Nasıl Yönetilir?",
    category: "Travma & Yas",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:45:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=800&auto=format&fit=crop",
    excerpt: "Ayrılık yalnızca bir partnerin kaybı değil, ortak bir geleceğin ve kimliğin yasıdır. Boşanma sonrası toparlanmanın psikolojik adımları.",
    content: `<p>Uzun süreli bir ilişkinin ya da evliliğin sona ermesi, klinik düzeyde bir yakının vefatı kadar ağır bir yas sürecine neden olabilir. Çünkü birey partneriyle birlikte geleceğe dair hayallerini ve 'biz' kimliğini de geride bırakır.</p>

<p><strong>Ayrılık Yasının Evreleri</strong></p>
<ul>
  <li><strong>İnkar ve Şok:</strong> Bitişin gerçek olmadığını, her şeyin eskisi gibi olabileceğini düşünme hali.</li>
  <li><strong>Öfke ve Suçlama:</strong> Partnerin hatalarına veya kişinin kendi eksikliklerine odaklanan yoğun öfke dalgaları.</li>
  <li><strong>Pazarlık ve Çöküntü:</strong> Keşkeler, derin yalnızlık hissi ve yaşamdan zevk alamama evresi.</li>
  <li><strong>Kabullenme ve Yeniden İnşa:</strong> Yaşananların tecrübe olarak içselleştirilmesi ve bireysel kimliğin yeniden kurulması.</li>
</ul>

<p>Terapi, danışanın bu duyguları bastırmadan sağlıklı bir şekilde yaşamasına ve kendi ayakları üzerinde duran bağımsız bir özne olmasına rehberlik eder.</p>`
  },
  {
    id: "somatizasyon-psikosomatik-agrilar",
    title: "Somatizasyon (Psikosomatik Ağrılar): Beden Ruhun Yükünü Nasıl Taşır?",
    category: "Sağlık & Psikoloji",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:50:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
    excerpt: "Tıbben açıklanamayan mide-bağırsak sorunları, fibromiyalji ve kas gerginlikleri: Beden, dilin söyleyemediği duyguları nasıl konuşur?",
    content: `<p>Hastanelerde sayısız tetkik ve tahlil yapılmasına rağmen herhangi bir organik sebep bulunamayan kronik ağrılar, mide spazmları, baş dönmeleri ve solunum daralmaları çoğu zaman somatizasyondur.</p>

<p><strong>Bedenin Sessiz Çığlığı</strong></p>
<p>Dile dökülemeyen, yutulan öfke, ağlanamayan yas ve ifade edilemeyen kaygılar bedensel gerilim olarak kaslarda, sindirim sisteminde veya bağışıklıkta yer edinir. Beden 'Ben bu yüke artık dayanamıyorum' diyerek imdat sinyali verir.</p>

<p><strong>Terapide İyileşme</strong></p>
<p>Psikoterapi bedenin acıyla haykırdığı o duyguları güvenli bir ortamda kelimelere dökmeyi sağlar. Danışan ruhundaki düğümleri çözdükçe, bedeni de gevşemeyi ve sağlığına kavuşmayı öğrenir.</p>`
  },
  {
    id: "ozguven-ve-degersizlik-inanci",
    title: "Özgüven Eksikliği ve Değersizlik İnancı Nasıl Dönüştürülür?",
    category: "Bireysel Gelişim",
    date: "2026-10-16",
    createdAt: "2026-10-16T09:55:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
    excerpt: "Hakiki özgüven ile dış onay bağımlılığı arasındaki fark nedir? Koşullu sevgi kodlarından kurtulup öz-değeri yeniden inşa etmek.",
    content: `<p>Özgüven eksikliği yaşayan bireyler genellikle başkalarının takdirine muhtaç yaşarlar. En ufak bir eleştiri tüm günlerini mahvedebilirken, aldıkları övgüler bile içlerindeki o derin yetersizlik çukurunu doldurmaya yetmez.</p>

<p><strong>Sahte Özgüven vs. Sahici Özsaygı</strong></p>
<p>Sahte özgüven, sahip olunan arabaya, unvana ya da dış görünüşe dayanır; bu şartlar sarsıldığında çöker. Hakiki özsaygı ise insanın kendi zayıflıkları, eksiklikleri ve kusurlarıyla birlikte kendini kabul edebilme olgunluğudur.</p>

<p><strong>Terapide Dönüşüm</strong></p>
<ul>
  <li>Çocuklukta yerleşen 'Yalnızca uslu/başarılı olursan sevilirsin' koşulunu deşifre etmek.</li>
  <li>Dış onay avcılığını bırakıp kendi iç sesine ve ihtiyaçlarına kulak vermek.</li>
  <li>Hata yaptığında dahi kendi arkasında durabilme gücünü geliştirmek.</li>
</ul>`
  },
  {
    id: "gecmise-takili-kalmak-ve-ruminasyon",
    title: "Geçmişe Takılı Kalmak ve Sürekli Pişmanlık (Ruminasyon) Nasıl Biter?",
    category: "Kaygı & Stres",
    date: "2026-10-16",
    createdAt: "2026-10-16T10:00:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=800&auto=format&fit=crop",
    excerpt: "Zihinde sürekli 'keşke' döngüleri döndürmek: Ruminasyon neden olur ve geçmişle barışıp şimdiki zamana nasıl dönülür?",
    content: `<p>Geçmişte yaşanan kırıcı bir olayı, yapılan bir tercihi ya da söylenen bir sözü zihinde yüzlerce kez yeniden canlandırıp 'Keşke öyle yapmasaydım' diye acı çekme döngüsüne ruminasyon (zihinsel geviş getirme) denir.</p>

<p><strong>Zihnin Kontrol İllüzyonu</strong></p>
<p>İnsan beyni geçmişi tekrar tekrar düşünerek sanki o anı geri getirebileceği ya da sonucunu değiştirebileceği gibi bilinçdışı bir illüzyona kapılır. Ancak bu çaba sadece şimdiki anın enerjisini tüketir ve depresyonu derinleştirir.</p>

<p><strong>Geçmişle Barışmak</strong></p>
<p>Terapide danışan, o günkü kararın o günkü bilinç ve duygu durumuyla verildiği gerçeğini kabul eder. Telafisi olmayan kayıpların yası tutulur ve kontrol edebileceğimiz tek alan olan 'bugün ve şimdi'ye odaklanılır.</p>`
  },
  {
    id: "yetiskinlerde-odaklanma-problemleri",
    title: "Yetişkinlerde Odaklanma Problemleri ve Zihinsel Dağınıklık Psikolojik midir?",
    category: "Yaşam & Kariyer",
    date: "2026-10-16",
    createdAt: "2026-10-16T10:05:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=800&auto=format&fit=crop",
    excerpt: "Beyin sisi, dikkat dağınıklığı ve unutkanlık: Her odaklanma sorunu DEHB midir, yoksa duygusal aşırı yüklenmenin işareti mi?",
    content: `<p>Günlük işleri tamamlarken dikkatin sürekli dağılması, unutkanlık ve 'beyin sisi' şikayetiyle başvuran pek çok yetişkin derhal kendisinde nörolojik bir DEHB olduğunu düşünür. Ancak bu tablonun arkasında çoğunlukla psikolojik etkenler yatar.</p>

<p><strong>Duygusal Aşırı Yüklenme (Overwhelm)</strong></p>
<p>Zihin arka planda bastırılmış bir kaygıyı, mutsuz bir evliliği ya da iş yerindeki yoğun baskıyı işlemeye çalışırken, ön plandaki görevlere odaklanacak işlemci kapasitesi kalmaz. Kaygı ve depresyon dikkatin en büyük hırsızlarıdır.</p>

<p><strong>Çözüm Yolları</strong></p>
<p>Terapi sürecinde zihni meşgul eden asıl duygusal düğümler çözülür, dijital uyarım detoksu ve sağlıklı zihinsel sınırlar planlanarak odaklanma kapasitesi geri kazanılır.</p>`
  },
  {
    id: "terapi-bagimlilik-yapar-mi",
    title: "Terapi Bağımlılık Yapar mı ve Seanslara Ne Kadar Devam Edilmelidir?",
    category: "Terapi Süreci",
    date: "2026-10-16",
    createdAt: "2026-10-16T10:10:00.000Z",
    featuredImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
    excerpt: "Terapiste bağlanmak ile bağımlılık arasındaki fark nedir? Terapinin nihai amacı olan bireyleşme ve sağlıklı sonlandırma süreci.",
    content: `<p>Psikoterapiye başlamaktan çekinen kişilerin sıklıkla sorduğu sorulardan biri şudur: 'Ya terapistime bağımlı olursam ve seanslar hiç bitmezse?'</p>

<p><strong>Terapinin Temel Hedefi: Bireyleşme ve Özerklik</strong></p>
<p>Etik ve profesyonel bir psikoterapi sürecinin temel gayesi, danışanı terapiste bağımlı kılmak değil; tam tersine danışanın kendi içindeki iyileştirici gücü uyandırarak kendi hayatının yetkini olmasını sağlamaktır.</p>

<p><strong>Terapistin İçselleştirilmesi</strong></p>
<p>Sürecin başında danışan seans odasından güç alabilir; ancak zamanla terapistin o sorgulayıcı, şefkatli ve tarafsız sesini kendi içine katar. Artık zorluklarla karşılaştığında kendi kendine rehberlik edebilir hale gelir.</p>

<p><strong>Sonlandırma (Terminasyon)</strong></p>
<p>Terapi aniden kesilmez; hedeflere ulaşıldığında danışan ve terapistin ortak değerlendirmesiyle vedalaşma süreci planlı şekilde yürütülür ve süreç tamamlanır.</p>`
  }
];
