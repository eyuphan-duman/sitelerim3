export interface AboutSettings {
  image: string;
  eyebrow: string;
  name: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  quote: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
}

export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  image: '/pskfurkanmanav.jpeg',
  eyebrow: 'Hakkımda',
  name: 'Furkan Manav,',
  title: 'Psikolog',
  paragraph1:
    'Varoluşçu-Psikanalitik yönelimli bir yaklaşımla, yetişkinlere yönelik bireysel psikolojik danışmanlık hizmeti sunmaktayım. Terapi odası, hazır reçeteler sunan bir otorite yeri değil; kişinin kendi iç dünyasını güvenle keşfetmesine alan açan derin bir karşılaşmadır.',
  paragraph2:
    'Terapide kişi; yalnızca ne hissettiğini değil, neden öyle hissettiğini ve düşüncelerinin ardında hangi anlamların gizlendiğini keşfetmeye başlar. Semptomlar çoğu zaman yalnızca birer şikâyet değil, daha derin psikolojik süreçlerin birer yansımasıdır.',
  quote:
    'Geçmiş değiştirilemez belki ama geçmişle kurulan ilişki ve bağ değişebilir.',
  primaryBtnText: 'Devamını Oku',
  primaryBtnLink: '/ben-kimim',
  secondaryBtnText: 'İletişime Geç',
  secondaryBtnLink: '/iletisim',
};
