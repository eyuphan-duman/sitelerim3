'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Sparkles, Image as ImageIcon, Link as LinkIcon, RefreshCw, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface CoverStudioProps {
  initialTitle?: string;
  initialYoutubeId?: string;
}

const CATEGORIES = [
  'GÜNCEL PSİKOLOJİ',
  'KLİNİK PSİKOLOJİ',
  'İLİŞKİ DİNAMİKLERİ',
  'VAROLUŞÇU PSİKOTERAPİ',
  'BİLİNÇDIŞI SÜREÇLER',
  'SAVUNMA MEKANİZMALARI',
  'PSİKOTERAPİ SÜRECİ',
  'PSİKANALİTİK BAKIŞ'
];

const MOTIFS = [
  { id: 'labyrinth', name: 'Labirent & Geometri' },
  { id: 'sensory', name: 'Duyusal & Dalgalar' },
  { id: 'mirror', name: 'Ayna & İkili Benlik' },
  { id: 'unconscious', name: 'Bilinçdışı & Derinlik' },
  { id: 'attachment', name: 'Bağlanma Halkaları' },
  { id: 'existential', name: 'Varoluşsal Pusula' },
];

export default function CoverStudio({ initialTitle = '', initialYoutubeId = '' }: CoverStudioProps) {
  const [title, setTitle] = useState(initialTitle || 'MODERN DÜNYANIN GETİRDİĞİ PSİKOLOJİ EKOLLERİ');
  const [line1, setLine1] = useState('MODERN DÜNYANIN');
  const [line2, setLine2] = useState('GETİRDİĞİ');
  const [line3, setLine3] = useState('PSİKOLOJİ EKOLLERİ');
  const [category, setCategory] = useState('GÜNCEL PSİKOLOJİ');
  const [subtitle, setSubtitle] = useState('Hız Çağında Benlik Arayışı ve Yeni Yaklaşımlar');
  const [motif, setMotif] = useState('labyrinth');
  const [youtubeId, setYoutubeId] = useState(initialYoutubeId || '');
  const [photoYOffset, setPhotoYOffset] = useState(0); // -100 to 100
  const [photoScale, setPhotoScale] = useState(100); // 80 to 160%
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto split title into 2 or 3 lines when title changes
  const handleAutoSplit = useCallback((text: string) => {
    const clean = text.replace(/#[^\s#]+/g, '').replace(/^["“”']+|["“”']+$/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= 2) {
      setLine1(words[0] || '');
      setLine2(words[1] || '');
      setLine3('');
    } else if (words.length === 3) {
      setLine1(words[0]);
      setLine2(words[1]);
      setLine3(words[2]);
    } else if (words.length === 4) {
      setLine1(words.slice(0, 2).join(' '));
      setLine2(words.slice(2).join(' '));
      setLine3('');
    } else {
      const mid = Math.ceil(words.length / 3);
      setLine1(words.slice(0, mid).join(' '));
      setLine2(words.slice(mid, mid * 2).join(' '));
      setLine3(words.slice(mid * 2).join(' '));
    }
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    handleAutoSplit(val);
  };

  // Load default photo on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImageObj(img);
    img.src = '/pskfurkanmanav.jpeg';
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        toast.success('Fotoğraf başarıyla yüklendi!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle YouTube Shorts link / ID
  const handleFetchYoutubeThumb = (urlOrId: string) => {
    const trimmed = urlOrId.trim();
    let id = trimmed;
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const m = trimmed.match(/(?:shorts\/|v=|vi=|youtu\.be\/|\/v\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (m && m[1]) id = m[1];
    }
    if (id.length !== 11) {
      toast.error('Geçerli bir YouTube linki veya 11 karakterli video ID girin.');
      return;
    }
    setYoutubeId(id);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      toast.success('YouTube kapak fotoğrafı başarıyla getirildi!');
    };
    img.onerror = () => {
      // Fallback to hqdefault
      const img2 = new Image();
      img2.crossOrigin = 'anonymous';
      img2.onload = () => {
        setImageObj(img2);
        toast.success('YouTube görseli getirildi!');
      };
      img2.onerror = () => toast.error('YouTube görseli yüklenemedi.');
      img2.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    };
    // Try oar2 first (9:16 vertical), then maxresdefault
    img.src = `https://i.ytimg.com/vi/${id}/oar2.jpg`;
  };

  // Draw on Canvas (1080 x 1920 high-res)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;

    // 1. Midnight Navy Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#060d1a');
    bgGrad.addColorStop(0.5, '#071021');
    bgGrad.addColorStop(1, '#040913');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Photo (Upper Portrait Area)
    if (imageObj) {
      ctx.save();
      // Bounding box for portrait: 0 to 1100
      ctx.beginPath();
      ctx.rect(0, 0, W, 1140);
      ctx.clip();

      const scale = photoScale / 100;
      const imgW = imageObj.width;
      const imgH = imageObj.height;
      const coverRatio = Math.max(W / imgW, 1140 / imgH) * scale;
      const renderW = imgW * coverRatio;
      const renderH = imgH * coverRatio;
      const renderX = (W - renderW) / 2;
      const renderY = (1140 - renderH) / 2 + (photoYOffset * 4);

      ctx.drawImage(imageObj, renderX, renderY, renderW, renderH);

      // Portrait Top Vignette
      const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
      topGrad.addColorStop(0, 'rgba(6, 13, 26, 0.65)');
      topGrad.addColorStop(1, 'rgba(6, 13, 26, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 180);

      // Portrait Bottom Seamless Gradient Fade into dark stage
      const bottomGrad = ctx.createLinearGradient(0, 780, 0, 1140);
      bottomGrad.addColorStop(0, 'rgba(6, 13, 26, 0)');
      bottomGrad.addColorStop(0.65, 'rgba(6, 13, 26, 0.88)');
      bottomGrad.addColorStop(1, '#060d1a');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, 780, W, 360);

      ctx.restore();
    }

    // 3. Lower Stage Backdrop
    const stageGrad = ctx.createLinearGradient(0, 860, 0, H);
    stageGrad.addColorStop(0, 'rgba(6, 13, 26, 0)');
    stageGrad.addColorStop(0.2, '#060d1a');
    stageGrad.addColorStop(1, '#040913');
    ctx.fillStyle = stageGrad;
    ctx.fillRect(0, 860, W, H - 860);

    // 4. Central Spotlight Ambient Glow behind title
    const glow = ctx.createRadialGradient(540, 1300, 20, 540, 1300, 320);
    glow.addColorStop(0, 'rgba(59, 110, 158, 0.35)');
    glow.addColorStop(0.6, 'rgba(30, 61, 99, 0.12)');
    glow.addColorStop(1, 'rgba(6, 13, 26, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(540, 1300, 320, 0, Math.PI * 2);
    ctx.fill();

    // 5. Architectural Borders & Registration Brackets
    ctx.strokeStyle = 'rgba(158, 192, 230, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, 1008, 1848);

    ctx.strokeStyle = 'rgba(158, 192, 230, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, 984, 1824);

    // Corner brackets
    ctx.strokeStyle = '#9ec0e6';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Top Left
    ctx.moveTo(36, 72); ctx.lineTo(36, 36); ctx.lineTo(72, 36);
    // Top Right
    ctx.moveTo(1008, 36); ctx.lineTo(1044, 36); ctx.lineTo(1044, 72);
    // Bottom Left
    ctx.moveTo(36, 1848); ctx.lineTo(36, 1884); ctx.lineTo(72, 1884);
    // Bottom Right
    ctx.moveTo(1008, 1884); ctx.lineTo(1044, 1884); ctx.lineTo(1044, 1848);
    ctx.stroke();

    // 6. Header Badge
    ctx.fillStyle = 'rgba(6, 13, 26, 0.8)';
    ctx.strokeStyle = 'rgba(158, 192, 230, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(74, 72, 360, 48, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9ec0e6';
    ctx.beginPath();
    ctx.arc(102, 96, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e6effa';
    ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('PSİKANALİTİK NOTLAR', 120, 102);

    // 7. Divider Rule
    ctx.strokeStyle = 'rgba(158, 192, 230, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(360, 1130);
    ctx.lineTo(720, 1130);
    ctx.stroke();

    ctx.fillStyle = '#9ec0e6';
    ctx.beginPath();
    ctx.arc(540, 1130, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 8. Category Pill
    if (category) {
      const catText = category.toUpperCase();
      ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const textWidth = ctx.measureText(catText).width + 64;
      const pillW = Math.max(textWidth, 380);
      const pillX = (W - pillW) / 2;

      ctx.fillStyle = 'rgba(11, 23, 43, 0.88)';
      ctx.strokeStyle = 'rgba(158, 192, 230, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(pillX, 1216, pillW, 46, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#b8d0eb';
      ctx.textAlign = 'center';
      ctx.fillText(catText, 540, 1245);
    }

    // 9. Editorial Headline Lines
    const hasThreeLines = Boolean(line3.trim());
    const fontSize = hasThreeLines ? 68 : 82;
    const lineGap = hasThreeLines ? 80 : 94;
    const yLine1 = hasThreeLines ? 1375 : 1412;
    const yLine2 = yLine1 + lineGap;
    const yLine3 = yLine2 + lineGap;
    const ySub = hasThreeLines ? 1630 : 1592;

    ctx.textAlign = 'center';
    ctx.font = `700 ${fontSize}px "Playfair Display", Georgia, serif`;

    if (line1.trim()) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line1.trim(), 540, yLine1);
    }
    if (line2.trim()) {
      ctx.fillStyle = '#9ec0e6';
      ctx.fillText(line2.trim(), 540, yLine2);
    }
    if (line3.trim()) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line3.trim(), 540, yLine3);
    }

    // 10. Subtitle
    if (subtitle.trim()) {
      ctx.fillStyle = '#c3d3e6';
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(subtitle.trim(), 540, ySub);
    }

    // 11. Bottom Ledger & Monogram Seal
    ctx.strokeStyle = 'rgba(158, 192, 230, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(76, 1730);
    ctx.lineTo(1004, 1730);
    ctx.stroke();

    // FM Monogram box
    ctx.fillStyle = '#0d1b30';
    ctx.strokeStyle = 'rgba(158, 192, 230, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(76, 1760, 60, 60, 4);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '700 24px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('F', 93, 1798);
    ctx.fillStyle = '#9ec0e6';
    ctx.fillText('M', 117, 1798);

    // Name & Title text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('PSK. FURKAN MANAV', 156, 1785);

    ctx.fillStyle = '#8eb4db';
    ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('VAROLUŞÇU · PSİKANALİTİK', 156, 1812);

    // Right Play Pill
    ctx.fillStyle = 'rgba(125, 162, 200, 0.14)';
    ctx.strokeStyle = 'rgba(158, 192, 230, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(832, 1764, 172, 52, 26);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafd';
    ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('İZLE', 895, 1797);

    ctx.fillStyle = '#9ec0e6';
    ctx.beginPath();
    ctx.moveTo(945, 1780);
    ctx.lineTo(963, 1790);
    ctx.lineTo(945, 1800);
    ctx.fill();

  }, [imageObj, photoScale, photoYOffset, category, line1, line2, line3, subtitle]);

  // Re-render whenever parameters change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Download high-resolution JPG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanTitle = (title || 'kapak').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const link = document.createElement('a');
    link.download = `${cleanTitle}-kapak.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
    toast.success('1080x1920 yüksek çözünürlüklü kapak indirildi!');
  };

  // Save directly to server /public/video-covers/[youtubeId].jpg
  const handleSaveToServer = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanId = (youtubeId || title).trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanId) {
      toast.error('Lütfen bir YouTube ID veya geçerli bir dosya adı girin.');
      return;
    }

    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const res = await fetch('/api/admin/save-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: cleanId, dataUrl }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Kapak "${cleanId}.jpg" olarak siteye kaydedildi!`);
      } else {
        toast.error(data.error || 'Kaydedilemedi.');
      }
    } catch (err: any) {
      toast.error('Kayıt sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Başlık Alanı */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold)', marginBottom: 6 }}>
          <Sparkles size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Video ve İçerik Kütüphanesi
          </span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'Playfair Display, serif' }}>
          Kapak Fotoğrafı Stüdyosu
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: 4 }}>
          Videonun başlığını ve fotoğrafını girin; platformun editoryal tasarım diline uygun 1080x1920 dikey kapak fotoğrafını anında oluştursun.
        </p>
      </div>

      {/* Grid: Sol Form Kontrolleri (60%) - Sağ Canlı Önizleme (40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 420px)', gap: 32, alignItems: 'start' }}>
        
        {/* SOL: Kontrol Formu */}
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          
          {/* 1. Başlık Girişi */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Video Başlığı (Otomatik 2-3 Satıra Bölünür)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Örn: MODERN DÜNYANIN GETİRDİĞİ PSİKOLOJİ EKOLLERİ"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}
            />
          </div>

          {/* Satır İnce Ayarları (Manuel Kontrol) */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase' }}>
              Başlık Satırları (İsteğe Bağlı Özelleştirme)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>1. Satır (Beyaz)</label>
                <input
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>2. Satır (Açık Mavi)</label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>3. Satır (Beyaz)</label>
                <input
                  type="text"
                  value={line3}
                  onChange={(e) => setLine3(e.target.value)}
                  placeholder="(Boş bırakılabilir)"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          {/* 2. Fotoğraf Kaynağı Seçimi */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fotoğraf Kaynağı
            </label>

            {/* A: Bilgisayardan Yükle */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', background: '#f1f5f9', border: '1.5px dashed #cbd5e1', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}
              >
                <Upload size={16} />
                <span>Fotoğraf Yükle</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => {
                  const img = new Image();
                  img.onload = () => setImageObj(img);
                  img.src = '/pskfurkanmanav.jpeg';
                  toast.success('Varsayılan profil fotoğrafı seçildi.');
                }}
                style={{ padding: '12px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}
              >
                Profil Fotoğrafı
              </button>
            </div>

            {/* B: YouTube Linki / ID'si ile Getir */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="YouTube Video Linki veya ID'si (Örn: vMqVipY7zVM)"
                value={youtubeId}
                onChange={(e) => setYoutubeId(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => handleFetchYoutubeThumb(youtubeId)}
                style={{ padding: '10px 16px', background: '#0f172a', color: '#ffffff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LinkIcon size={14} />
                <span>Görseli Getir</span>
              </button>
            </div>
          </div>

          {/* 3. Fotoğraf Konumu & Yakınlaştırma (İnce Ayar Slider) */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  <span>Dikey Konum (Y)</span>
                  <span>{photoYOffset > 0 ? `+${photoYOffset}` : photoYOffset}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={photoYOffset}
                  onChange={(e) => setPhotoYOffset(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--navy)' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  <span>Boyut / Zoom</span>
                  <span>%{photoScale}</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="150"
                  value={photoScale}
                  onChange={(e) => setPhotoScale(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--navy)' }}
                />
              </div>
            </div>
          </div>

          {/* 4. Kategori ve Alt Başlık */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kategori Rozeti
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: category === cat ? 'var(--navy)' : '#cbd5e1',
                    background: category === cat ? 'var(--navy)' : '#ffffff',
                    color: category === cat ? '#ffffff' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Özel kategori adı"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Alt Başlık / Açıklayıcı Tez
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Örn: Hız Çağında Benlik Arayışı ve Yeni Yaklaşımlar"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          {/* Butonlar */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 20px',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(15,23,42,0.18)'
              }}
            >
              <Download size={18} />
              <span>1080x1920 Kapağı İndir</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToServer}
              disabled={saving}
              style={{
                padding: '14px 20px',
                background: 'var(--gold)',
                color: 'var(--navy)',
                borderRadius: 10,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={18} />
              <span>{saving ? 'Kaydediliyor...' : 'Siteye Video Kapağı Yap'}</span>
            </button>
          </div>
        </div>

        {/* SAĞ: Canlı 9:16 Önizleme */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#091324', padding: '16px 20px', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ec0e6', fontSize: '0.82rem', fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span>CANLI EDİTORYAL ÖNİZLEME (1080 × 1920)</span>
            </div>
            <button
              type="button"
              onClick={renderCanvas}
              title="Yeniden Çiz"
              style={{ background: 'transparent', border: 'none', color: '#9ec0e6', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ background: '#040913', padding: 12, borderRadius: '0 0 20px 20px', border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center' }}>
            <canvas
              ref={canvasRef}
              width={1080}
              height={1920}
              style={{
                width: '100%',
                maxWidth: 380,
                height: 'auto',
                aspectRatio: '9/16',
                borderRadius: 14,
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                display: 'block'
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
