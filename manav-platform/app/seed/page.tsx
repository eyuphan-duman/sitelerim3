'use client';

import { useEffect, useState } from 'react';
import { serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SeedPage() {
  const [status, setStatus] = useState('Initializing...');

  const articles = [
    {
      id: "mqeVvWOsK7voUX9HVixk", // Corrected Post ID
      title: "Simgesel Babanın Çöküşü ve Yeniden İnşaası",
      category: "Psikanaliz",
      content: `<p><strong>“Öteki ile kuramadığın bağın cezasını kendine verirsin”</strong></p>

<p><strong>SİMGESEL BABA ÇÖKTÜĞÜNDE, GERÇEK BABA DA İŞLEVSİZLEŞİR</strong></p>

<p>Günümüzün modern toplum yapısında en sık karşılaştığımız klinik tabloların ve toplumsal huzursuzlukların merkezinde tarifi zor bir "boşluk" hissi yatıyor. Bu boşluk, genellikle "babanın yokluğu" olarak adlandırılsa da psikanalitik bir büyüteçle bakıldığında meselenin biyolojik bir eksikliğin çok ötesinde olduğu görülür. Jacques Lacan’ın kuramsal mirasında baba, bir birey olmanın ötesinde bir “işlev” ve bir “konumdur.” Simgesel baba çöktüğünde, evdeki gerçek baba figürü ne kadar iyi niyetli, orada veya otoriter olursa olsun, yapısal bir işlevsizliğe mahkum kalır.</p>

<p><strong>Simgesel Baba: Et ve Kemikten Öte Bir Kesinti</strong></p>

<p>Simgesel baba, biyolojik babanın karakterinden veya gücünden bağımsız olarak işleyen bir “üçüncü”dür. Çocuğun dünyası başlangıçta anne ile kurulan ikili ve her şeyi kapsayan bir bütünlükten ibarettir. Bu evrede anne, çocuk için hem arzunun tek nesnesi hem de sınırsız bir güçtür. İşte simgesel baba, bu ikili ilişkinin arasına giren bir \"kesinti\"dir. Lacan bu işlevi "Babanın-Adı" (Nom-du-Père) olarak tanımlar. Burada kritik olan kelime oyunudur: Fransızca’da "Babanın-Adı" (Nom) ile "Babanın-Hayırı" (Non) eş seslidir. Baba, "Hayır" diyerek sınırı çizer; çocuğu annenin keyfiyetinden kurtarır ve onu dilin, kuralların, kültürün ve toplumsal yasaların dünyasına davet eder. Bu, çocuğu bir "nesne" olmaktan çıkarıp bir "özne" haline getiren kurucu hamledir.</p>

<p><strong>İşlevsizleşen Gerçek Baba: Otorite mi, Arkadaş mı?</strong></p>

<p>Simgesel baba işlevi çöktüğünde —yani toplumsal değerlerin aktarımı koptuğunda veya yasa, saygınlığını yitirdiğinde— gerçek baba figürü bu boşluğu doldurmak için iki sakıncalı yola sapar:</p>

<p>1. <strong>Zorba ve Aşırı Otoriter:</strong> Simgesel gücünü -sözün gücünü- kaybeden baba, otorite kurabilmek için çıplak güce ve şiddete başvurur. Ancak bu, yasanın temsili değil, bir güç gösterisidir. Çocuk bu durumda yasaya saygı duymaz, sadece güçten korkar. Bu da ileride otoriteye karşı körü körüne bir isyana veya tam bir sinmeye yol açar.</p>

<p>2. <strong>Sınırsız ve "Arkadaş" Figür:</strong> Modern babalık imajında sıkça gördüğümüz "çocuğuyla arkadaş olma" çabası, aslında yasa koyma sorumluluğundan bir kaçıştır. Baba sınır çizmediğinde, child kendisini arzularını düzenleyecek bir haritadan mahrum bulur. Sınırın olmadığı yerde özgürlük değil, yoğun bir kaygı hüküm sürer.</p>

<p><strong>Boşluğun Klinik Yansımaları</strong></p>

<p><strong>Kaygı ve Yön Kaybı:</strong> Simgesel babanın çöküşü, bireyin ruhsal dünyasında "yasanın olmadığı bir boşluk" yaratır. Bu yapısal eksiklik, klinik pratikte kendini şu belirtilerle gösterebilir:</p>

<p><strong>Arzunun Düzenlenememesi:</strong> Yasa, neyin yasak olduğunu belirleyerek aslında neyin arzulanabilir olduğunu da netleştirir. Bu işlev bozulduğunda kişi, sürekli bir "ne yapacağını bilememe" veya "hiçbir şeyden tatmin olamama" hali yaşar.</p>

<p><strong>İlişkilerde Sınır İhlalleri:</strong> Kişi, partneriyle olan ilişkisinde nerede duracağını, nerede "hayır" diyeceğini veya partnerinin "hayır"ını nasıl konumlandıracağını bilemez. Bu, çoğu zaman bağımlı veya kaotik ilişki örüntülerini beraberinde getirir.</p>

<p><strong>Otoriteyle Sorunlu İlişki:</strong> İş hayatında veya toplumsal yaşamda kurallarla barışık olamama, sürekli bir onaylanma ihtiyacı ya da her türlü kurala karşı yıkıcı bir direnç gösterme eğilimi baş gösterir.</p>

<p><em>"Asıl trajedi babanın fiziksel yokluğu değil; babanın temsil ettiği o simgesel makamın boş kalmasıdır. Bu boşlukta çocuk, ne çarpışacağı bir sınır bulabilir ne de yaslanacağı bir yasa."</em></p>

<p><strong>Yeni Bir Sınır İnşa Etmek:</strong></p>

<p>Bugünün dünyasında simgesel babanın çöküşünü konuşmak, bir nostaljiye methiye düzmek değildir. Aksine, öznenin kendi sınırlarını ve yasasını nasıl yeniden inşa edebileceğine dair bir yol aramaktır. Psikanalitik süreç, bu çöken işlevin yarattığı yıkıntılar arasında bireyin kendi sesini ve kendi "içsel yasasını" bulmasına olanak tanır. Babanın işlevsizleştiği bir çağda, anlamı yeniden bulmak ancak bu boşlukla yüzleşmekle mümkündür.</p>

<p>1. <strong>Eksikliği Kabul Etmek: İdeal Babanın Yasını Tutmak</strong></p>

<p>İnşanın ilk adımı, her şeyi bilen, her şeyi çözen ve bizi her tehlikeden koruyan o ideal baba figürünün artık var olmadığını kabul etmektir. Birçok birey, yaşamı boyunca bu hayali otoriteyi arar; bazen bir liderde, bazen bir partnerde, bazen de katı bir ideolojide bu eksikliği gidermeye çalışır. Ancak sınır inşa etmek, bu arayıştan vazgeçip “babanın da eksik olduğunu” fark etmekle başlar. Baba figürünün yetersizliğiyle yüzleşmek, kişiyi onun onayına muhtaç olmaktan kurtarır.</p>

<p>2. <strong>Kendi \"Hayır\"ını Keşfetmek: Arzuyu Sınırla Korumak</strong></p>

<p>Psikanalizde sınır, sadece kısıtlayıcı bir barikat değil, aynı zamanda arzuyu koruyan bir kaptır. Sınırın olmadığı yerde arzu, uçsuz buçaksız bir okyanusta kaybolabilir. Yeniden sınır inşa etmek, bireyin kendi değerlerine, etik ilkelerine ve limitlerine sahip çıkmasıdır. Kişi, başkalarının beklentileri ile kendi hakikati arasına bir sınır koyabildiğinde, o zamana kadar her yöne dağılmış olan enerjisini -libidosunu- anlamlı bir amaca yönlendirmeye başlar. Bu, pasif bir sürüklenişten, aktif bir özneleşmeye geçiştir.</p>

<p>3. <strong>Sözün Gücünü Geri Kazanmak</strong></p>

<p>Simgesel baba işlevi, temelde "Söz"ün gücüdür. Sınır inşa etmek, kişinin kendi sözünün arkasında durabilmesiyle ilgilidir. "Evet" dediğinde bunun sorumluluğunu alabilen, "Hayır" dediğinde ise bu hayırın yarattığı boşluğu göğüsleyebilen birey, kendi simgesel dünyasını kuruyor demektir. Klinik süreçte bu, semptomların (kaygı, takıntı, boşluk hissi) dil aracılığıyla anlamlandırılması ve kişinin kendi yaşam öyküsünün yazarı haline gelmesi sürecidir.</p>

<p>4. <strong>Kaostan Kozmosa: Kendi Düzenini Kurmak</strong></p>

<p>Mitolojik anlamda baba, kaosu düzene (kosmos) çeviren güçtür. Dış dünyada bu düzen sarsıldığında, birey kendi mikro evreninde bu düzeni kurmakla yükümlüdür. Bu; rutinler oluşturmak, etik tercihler yapmak ve kendi arzusu için bedel ödemeye gönüllü olmakla mümkündür. Yeniden inşa edilen bu sınır, dışarıdan gelen bir emirle değil, kişinin kendi varoluşsal tercihlerinden süzülen bir “öznel yasa” ile ayakta kalır.</p>

<p><em>"Babanın mirası, bize bıraktığı maddi imkanlar veya hazır doğrular değildir; babanın asıl mirası, koyduğu sınır ve bizim kendi yasamızı kurabilmemiz için bıraktığı o 'anlamlı boşluk'tur."</em></p>

<p>Sonuç olarak, simgesel babanın enkazı üzerinde yükselen yeni sınır, bizi dünyadan koparan bir duvar değil; dünyayla sağlıklı, mesafeli ve anlamlı bir ilişki kurmamızı sağlayan bir köprüdür. Kendi sınırını çizebilen insan, başkasının sınırına da saygı duymayı öğrenir ve böylece gerçek bir "başka" ile ilişki kurma kapasitesine erişir.</p>

<p><strong>Referanslar ve Okuma Önerileri</strong></p>

<p>Tura, S. M. (2015). Freud’dan Lacan’a Psikanaliz. İstanbul: Metis Yayınları.</p>
<p>Lacan, J. (2013). Psikanalizin Dört Temel Kavramı: Seminer 11. (Çev. N. Erdem). İstanbul: Metis Yayınları.</p>
<p>Fink, B. (2016). Lacanian Özne: Dil ve Arzu Arasında. (Çev. M. Erşen). İstanbul: Encore Yayınları.</p>`,
      posts: ["2LCGtzQTaoiCIfKwXeb0"]
    },
    {
      id: "oteki-ile-kuramadigin-bag-id", // placeholder or real ID if found
      title: "Bir Tehdit Olarak “Öteki” ve Kurulamayan Bağ.",
      category: "Psikanaliz",
      content: `<p>İnsan, doğası gereği bir "bağ" öznesi olarak dünyaya gelir. Ancak bağ kurma süreci, her zaman göründüğü kadar romantik veya pürüzsüz ilerlemez. Çoğu zaman hayatımızda derin bir sessizlik, bitmek bilmeyen bir mesafe veya kopukluk hissederiz. Genelde bu durumu "yalnızlık" olarak adlandırıp geçsek de işin aslı daha karanlıktır. Ötekiyle -başka- dışarıda kurulamayan her bağ, içeride bir savaş alanına dönüşür.</p>

<p><strong>Öteki İle Karşılaşma</strong></p>

<p>Psikanalitik süreçte ve yaşamın içinde "karşılaşma", sadece iki kişinin aynı ortamda bulunması değildir. Gerçek bir karşılaşma, ötekinin benim üzerimdeki o öngörülemez etkisine izin verdiğim, kendi savunma zırhımı bir anlığına araladığım o sarsıcı andır. Ötekiyle karşılaşmak, aslında kendi narsisistik bütünlüğümüzün bozulmasına rıza göstermektedir.</p>

<p>Genellikle ötekine -başkaya- baktığımızda gördüğümüz şey, kendi arzularımızın veya korkularımızın bir yansımasıdır. Ancak gerçek bir "karşılaşma" gerçekleştiğinde, öteki bizim için bir ayna olmaktan çıkar ve bir “yabancı” olarak belirir. Bu yabancılık bizi korkutabilir çünkü ötekinin bakışı, kontrol edemediğimiz bir güçtür. Emmanuel Levinas’ın da vurguladığı gibi, ötekinin yüzü bize bir sorumluluk yükler. Karşılaşmadan kaçan kişi, aslında bu sorumluluktan ve ötekinin yaratacağı o sarsıntıdan kaçmaktadır.</p>

<p><strong>Tehdit ve Yakınlık</strong></p>

<p>Ötekiyle (başkayla) bağ kuramamak, çoğu zaman sosyal bir beceri eksikliği değil, ruhun derinlerinde işleyen bir “savunma mekanizmasıdır.” Yakınlık kurmak, savunmasız kalmayı göze almaktır. Birine "ihtiyaç duymak" demek, kendi eksikliğimizi ve bağımlılık ihtimalimizi kabul etmektir.</p>

<p>Lacan’ın perspektifinden bakarsak; öteki, hem arzumuzun nesnesi hem de bizi tanımlayan aynadır. Ancak bu ayna bazen o kadar sarsıcıdır ki, kişi kendi kırılganlığıyla yüzleşmektense mesafeyi -bağ kurmamayı- tercih eder. Yakınlık bir risk haline geldiğinde, insan kendini korumak adına kalelerini ve duvarlarını inşa eder. Fakat bu kaleler bizi sadece başkalarından değil, kendi canlılığımızdan da koparır.</p>

<p><strong>Dışarıda Kurulamayan Bağın İçerideki Yankısı</strong></p>

<p>İnsan psikolojisi boşluk ile daima çatışma halindedir. Dışarıdaki o "başka", yani ötekiyle kurulması gereken o temas gerçekleşmediğinde, ortaya çıkan gerilim yok olmaz; yön değiştirir. Bağın kurulamadığı yerde suçluluk, değersizlik ve oto-agresyon (kendine yönelik saldırganlık) devreye girer.</p>

<p>Birey, ötekiyle kuramadığı bağın hıncını, o bağı kurmayı beceremeyen "kendinden" çıkarır. Bu bir tür cezalandırma ayinidir. Bazen “sevilmeye değer olmadığını”, bazen “anlaşılmadığını” düşünür ve kendince yargılar oluşturur: “Zaten herkes eninde sonunda bir gün gider.”</p>

<p>Bu cümleler aslında birer teşhis değil, bağ kurmanın getireceği o büyük sorumluluktan ve incinme ihtimalinden kaçmak için ruhun kendine kestiği cezalardır. Çatışma dışarıda -ilişkide- yaşanmadığında, tüm o yıkıcı enerji içeriye, öznenin kendi benliğine akar.</p>

<p><strong>Karşılaşmanın İyileştirici Gücü</strong></p>

<p>Bağın kurulamadığı ve cezanın içeriye -kendine- kesildiği o kısır döngüden çıkışın yolu, ancak bu sarsıcı karşılaşmayla mümkündür. Karşılaşma, bizi kendi iç dünyamızın tekdüzeliğinden çıkarır.</p>

<p>Kendimize verdiğimiz bu cezadan kurtulmanın yolu, daha fazla "kendini sevme" olumlaması yapmak değildir. Aksine, “eksikliğimizi ve ihtiyacımızı” kabul etmektir. Psikanalitik süreçte gördüğümüz en temel gerçek şudur: Kişi, kendi "muhtaç" tarafıyla barışmadığı sürece, ötekini her zaman bir tehdit olarak görecektir.</p>

<p>Bağ kurmak, birine teslim olmak değil; kendi kırılganlığınla ötekinin -başkanın- karşısında durabilme cesaretidir. Kişinin kendisine verdiği ceza, aslında bir zamanlar kurulamamış olan o güvenli bağın yas tutma biçimidir.</p>

<p><strong>Ötekiyle kurulan o gerçek temas:</strong></p>

<p><strong>Kendi sınırımızı görmemizi sağlar:</strong> "Ben"in nerede bittiğini anlamak için, "Ben olmayan"ın (Öteki) nerede başladığını hissetmek gerekir.</p>

<p><strong>İhtiyacı onurlandırır:</strong> Ötekiyle gerçekten karşılaştığımızda, ona olan ihtiyacımızı bastırmak yerine bu ihtiyacın insani bir hakikat olduğunu fark ederiz.</p>

<p><strong>Yaratıcılığı tetikler:</strong> İki farklı dünyanın çarpışması, tek başımıza asla üretemeyeceğimiz yeni bir anlamın doğmasına vesile olur.</p>

<p><strong>Savunmadan Temasa Geçiş</strong></p>

<p>Elbette bahsettiğimiz bu karşılaşma ve kurulabilir olan bağa direnç uygulamamak bir başka deyişle izin vermek, bir risk almaktır. Ötekiyle karşılaşmak bizi kırabilir, sarsabilir ya da değiştirebilir. Ancak bu risk alınmadığında, kişi kendi kurduğu steril ama boğucu dünyasına hapsolur. Bağ kuramamak bir kader değildir; bir pozisyondur. Ve gayet tabii değiştirilebilir. Ancak bu değişim, kişinin neden "bağsızlığı" bir kale olarak seçtiğini anlamasıyla başlar.</p>

<p>Terapi odası da aslında tam olarak bu "güvenli karşılaşma" alanıdır. Analist, orada her zaman bir ayna değil, yaşayan bir "başka" (öteki) olarak durur. Danışan, analistle kurduğu o özgün bağ sayesinde, dış dünyadaki ötekilerle karşılaşabilme cesaretini prova eder.</p>

<p><strong>Referanslar ve Okuma Önerileri:</strong></p>

<p>Lacan, J. (2013). Psikanalizin Dört Temel Kavramı. (Çev. N. Erdem). İstanbul: Metis Yayınları.</p>
<p>Yalom, I. D. (2018). Varoluşçu Psikoterapi. (Çev. Z. İ. Babayiğit). İstanbul: Pegasus Yayınları.</p>`,
      posts: [] // If I don't have the post IDs, I'll search for them or use the same title match
    }
  ];

  const strip = (h: string) => h.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').trim();

  useEffect(() => {
    async function seed() {
      try {
        for (const art of articles) {
          const raw = strip(art.content);
          const excerpt = raw.length > 220 ? raw.slice(0, 220) + '…' : raw;

          const updateData = {
            title: art.title,
            category: art.category,
            content: art.content,
            featuredImage: "",
            excerpt: excerpt,
            updatedAt: serverTimestamp(),
          };

          if (art.id && !art.id.endsWith('-id')) {
            setStatus(`Updating article ${art.id}...`);
            try {
              await updateDoc(doc(db, 'articles', art.id), updateData);
            } catch (e) {
              console.warn(`Article ${art.id} update failed, trying posts...`);
            }
          }

          for (const postId of art.posts) {
            setStatus(`Updating post ${postId}...`);
            try {
              await updateDoc(doc(db, 'posts', postId), updateData);
            } catch (e) {
              console.error(`Post ${postId} update failed:`, e);
            }
          }
        }

        setStatus('Success! Firestore updated where IDs were known.');
      } catch (err: any) {
        setStatus('Error: ' + err.message);
      }
    }
    seed();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Syncing Article Content</h1>
      <p>Status: {status}</p>
    </div>
  );
}
