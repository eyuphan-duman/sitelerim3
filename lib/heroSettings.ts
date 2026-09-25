export interface HeroSlide1 {
  eyebrow: string;
  titlePart1: string;
  titlePart2: string;
  titlePart3: string;
  description: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  primaryBtnBadge: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  searchPlaceholder: string;
  bgImage: string;
}

export interface HeroSlide2 {
  eyebrow: string;
  titlePart1: string;
  titlePart2: string;
  titlePart3: string;
  description: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  primaryBtnBadge: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  bgImage: string;
  highlight1Title: string;
  highlight1Desc: string;
  highlight2Title: string;
  highlight2Desc: string;
  highlight3Title: string;
  highlight3Desc: string;
}

export interface HeroSettings {
  autoSlide: boolean;
  slideInterval: number; // in seconds (e.g. 20)
  slide1: HeroSlide1;
  slide2: HeroSlide2;
}

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  autoSlide: true,
  slideInterval: 20,
  slide1: {
    eyebrow: 'Varoluşçu · Psikanalitik · Psikoterapi',
    titlePart1: 'Kendinizi',
    titlePart2: 'Anlama',
    titlePart3: 'Yolculuğu',
    description: 'Varoluşçu-psikanalitik yaklaşımla ilgili derinlemesine incelemeler, forum tartışmaları ve yazılar. Bilinçdışının katmanlarını keşfederek özgün bir anlam inşa edin.',
    primaryBtnText: 'Foruma Katıl',
    primaryBtnLink: '/forum',
    primaryBtnBadge: 'v2.0',
    secondaryBtnText: 'Randevular Hakkında Bilgi Almak İçin İletişime Geçin',
    secondaryBtnLink: '/iletisim',
    searchPlaceholder: 'Site içinde ara — yazılar, forum, içerikler...',
    bgImage: '/hero-bg.jpg',
  },
  slide2: {
    eyebrow: 'CANLI TOPLULUK & PSİKOLOJİ FORUMU',
    titlePart1: 'Sorularınızı Sorun,',
    titlePart2: 'Birlikte',
    titlePart3: 'Keşfedelim',
    description: 'Psikolojiye, ilişkilere ve içsel dünyanıza dair merak ettiğiniz her şeyi foruma taşıyın. İster uzman psikoloğumuz ister deneyimli forum üyeleri yanıtlasın; hemen üye olun, güvenli ve samimi bir alanda paylaşmaya başlayın.',
    primaryBtnText: 'Hemen Üye Ol & Foruma Katıl',
    primaryBtnLink: '/forum',
    primaryBtnBadge: 'CANLI',
    secondaryBtnText: 'Tartışmaları ve Konuları İncele',
    secondaryBtnLink: '/forum',
    bgImage: '',
    highlight1Title: 'Uzman & Topluluk Rehberliği',
    highlight1Desc: 'Merak ettiğin sorulara psikolog ve topluluk bakış açısıyla yanıt al.',
    highlight2Title: 'Gizlilik ve Güvenli Alan',
    highlight2Desc: 'Anonim veya profilinle özgürce soru sor, iç dünyanı paylaş.',
    highlight3Title: 'Aktif Tartışmalar & Paylaşım',
    highlight3Desc: 'Rüya analizleri, varoluşsal kaygılar ve ilişki dinamikleri üzerine canlı sohbetler.',
  }
};
