import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';

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

const articleContent = `<p><strong>SİMGESEL BABA ÇÖKTÜĞÜNDE, GERÇEK BABA DA İŞLEVSİZLEŞİR</strong></p>

<p>Günümüzün modern toplum yapısında en sık karşılaştığımız klinik tabloların ve toplumsal huzursuzlukların merkezinde tarifi zor bir "boşluk" hissi yatıyor. Bu boşluk, genellikle "babanın yokluğu" olarak adlandırılsa da psikanalitik bir büyüteçle bakıldığında meselenin biyolojik bir eksikliğin çok ötesinde olduğu görülür. Jacques Lacan’ın kuramsal mirasında baba, bir birey olmanın ötesinde bir “işlev” ve bir “konumdur.” Simgesel baba çöktüğünde, evdeki gerçek baba figürü ne kadar iyi niyetli, orada veya otoriter olursa olsun, yapısal bir işlevsizliğe mahkum kalır.</p>

<p><strong>Simgesel Baba: Et ve Kemikten Öte Bir Kesinti</strong></p>

<p>Simgesel baba, biyolojik babanın karakterinden veya gücünden bağımsız olarak işleyen bir “üçüncü”dür. Çocuğun dünyası başlangıçta anne ile kurulan ikili ve her şeyi kapsayan bir bütünlükten ibarettir. Bu evrede anne, çocuk için hem arzunun tek nesnesi hem de sınırsız bir güçtür. İşte simgesel baba, bu ikili ilişkinin arasına giren bir \"kesinti\"dir. Lacan bu işlevi \"Babanın-Adı\" (Nom-du-Père) olarak tanımlar. Burada kritik olan kelime oyunudur: Fransızca’da \"Babanın-Adı\" (Nom) ile \"Babanın-Hayırı\" (Non) eş seslidir. Baba, \"Hayır\" diyerek sınırı çizer; çocuğu annenin keyfiyetinden kurtarır ve onu dilin, kuralların, kültürün ve toplumsal yasaların dünyasına davet eder. Bu, çocuğu bir \"nesne\" olmaktan çıkarıp bir \"özne\" haline getiren kurucu hamledir.</p>

<p><strong>İşlevsizleşen Gerçek Baba: Otorite mi, Arkadaş mı?</strong></p>

<p>Simgesel baba işlevi çöktüğünde —yani toplumsal değerlerin aktarımı koptuğunda veya yasa, saygınliğini yitirdiğinde— gerçek baba figürü bu boşluğu doldurmak için iki sakıncalı yola sapar:</p>

<p>1. <strong>Zorba ve Aşırı Otoriter:</strong> Simgesel gücünü -sözün gücünü- kaybeden baba, otorite kurabilmek için çıplak güce ve şiddete başvurur. Ancak bu, yasanın temsili değil, bir güç gösterisidir. Çocuk bu durumda yasaya saygı duymaz, sadece güçten korkar. Bu da ileride otoriteye karşı körü körüne bir isyana veya tam bir sinmeye yol açar.</p>

<p>2. <strong>Sınırsız ve \"Arkadaş\" Figür:</strong> Modern babalık imajında sıkça gördüğümüz "çocuğuyla arkadaş olma" çabası, aslında yasa koyma sorumluluğundan bir kaçıştır. Baba sınır çizmediğinde, çocuk kendisini arzularını düzenleyecek bir haritadan mahrum bulur. Sınırın olmadığı yerde özgürlük değil, yoğun bir kaygı hüküm sürer.</p>

<p><strong>Boşluğun Klinik Yansımaları</strong></p>

<p><strong>Kaygı ve Yön Kaybı:</strong> Simgesel babanın çöküşü, bireyin ruhsal dünyasında \"yasanın olmadığı bir boşluk\" yaratır. Bu yapısal eksiklik, klinik pratikte kendini şu belirtilerle gösterebilir:</p>

<p><strong>Arzunun Düzenlenememesi:</strong> Yasa, neyin yasak olduğunu belirleyerek aslında neyin arzulanabilir olduğunu da netleştirir. Bu işlev bozulduğunda kişi, sürekli bir \"ne yapacağını bilememe\" veya \"hiçbir şeyden tatmin olamama\" hali yaşar.</p>

<p><strong>İlişkilerde Sınır İhlalleri:</strong> Kişi, partneriyle olan ilişkisinde nerede duracağını, nerede \"hayır\" diyeceğini veya partnerinin \"hayır\"ını nasıl konumlandıracağını bilemez. Bu, çoğu zaman bağımlı veya kaotik ilişki örüntülerini beraberinde getirir.</p>

<p><strong>Otoriteyle Sorunlu İlişki:</strong> İş hayatında veya toplumsal yaşamda kurallarla barışık olamama, sürekli bir onaylanma ihtiyacı ya da her türlü kurala karşı yıkıcı bir direnç gösterme eğilimi baş gösterir.</p>

<p><em>"Asıl trajedi babanın fiziksel yokluğu değil; babanın temsil ettiği o simgesel makamın boş kalmasıdır. Bu boşlukta çocuk, ne çarpışacağı bir sınır bulabilir ne de yaslanacağı bir yasa."</em></p>

<p><strong>Yeni Bir Sınır İnşa Etmek:</strong></p>

<p>Bugünün dünyasında simgesel babanın çöküşünü konuşmak, bir nostaljiye methiye düzmek değildir. Aksine, öznenin kendi sınırlarını ve yasasını nasıl yeniden inşa edebileceğine dair bir yol aramaktır. Psikanalitik süreç, bu çöken işlevin yarattığı yıkıntılar arasında bireyin kendi sesini ve kendi \"içsel yasasını\" bulmasına olanak tanır. Babanın işlevsizleştiği bir çağda, anlamı yeniden bulmak ancak bu boşlukla yüzleşmekle mümkündür.</p>

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
<p>Fink, B. (2016). Lacanian Özne: Dil ve Arzu Arasında. (Çev. M. Erşen). İstanbul: Encore Yayınları.</p>`;

const updateData = {
  title: "Simgesel Babanın Çöküşü ve Yeniden İnşaası",
  content: articleContent,
  updatedAt: Timestamp.now(),
};

async function sync() {
  try {
    console.log("Syncing via client SDK...");
    
    // IDs to update
    const articleId = "WQVaC7GJCyww6MfvhbsD";
    const postIds = ["2LCGtzQTaoiCIfKwXeb0", "mqeVvWOsK7voUX9HVixk"];

    console.log(`Updating article ${articleId}...`);
    await updateDoc(doc(db, 'articles', articleId), updateData);

    for (const id of postIds) {
      console.log(`Updating post ${id}...`);
      await updateDoc(doc(db, 'posts', id), updateData);
    }

    console.log("Sync completed successfully!");
  } catch (e) {
    console.error("Sync failed:", e);
  }
  process.exit(0);
}

sync();
