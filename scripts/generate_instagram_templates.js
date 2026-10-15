const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const desktopDir = path.join(process.env.USERPROFILE, 'Desktop');
const publicDir = path.join(__dirname, '..', 'public', 'instagram-sablonlari');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// 1. ŞABLON 1: SİTE HERO & BUZLU CAM KART (En çok istenen modern glassmorphism)
// ─────────────────────────────────────────────────────────────
const html1 = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    background: #0a1628;
    background-image:
      radial-gradient(circle at 85% 15%, rgba(201, 169, 110, 0.24) 0%, transparent 55%),
      radial-gradient(circle at 15% 85%, rgba(22, 45, 82, 0.6) 0%, transparent 55%),
      linear-gradient(145deg, #070f1c 0%, #0a1628 45%, #101f3a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  /* Arka plan zarif altın ışık halkaları */
  .glow-top {
    position: absolute;
    top: -80px;
    right: -80px;
    width: 520px;
    height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201, 169, 110, 0.18) 0%, transparent 70%);
    filter: blur(50px);
  }
  .glow-bottom {
    position: absolute;
    bottom: -80px;
    left: -80px;
    width: 480px;
    height: 480px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 31, 58, 0.7) 0%, transparent 70%);
    filter: blur(60px);
  }
  /* Sitenin kartlarıyla birebir aynı Glassmorphism Kart */
  .glass-card {
    width: 900px;
    height: 900px;
    background: rgba(255, 255, 255, 0.045);
    border: 1.5px solid rgba(201, 169, 110, 0.28);
    border-radius: 36px;
    box-shadow:
      0 30px 80px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -1px 0 rgba(201, 169, 110, 0.18);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px;
    position: relative;
  }
  /* Üst ve alt altın bölücü çizgiler */
  .gold-divider {
    width: 100%;
    height: 1.5px;
    background: linear-gradient(90deg, transparent 0%, rgba(201, 169, 110, 0.85) 50%, transparent 100%);
  }
  /* Üst mini etiket boş kapsülü */
  .header-pill {
    align-self: center;
    width: 140px;
    height: 28px;
    border-radius: 999px;
    background: rgba(201, 169, 110, 0.12);
    border: 1px solid rgba(201, 169, 110, 0.35);
    margin-bottom: 24px;
  }
</style>
</head>
<body>
  <div class="glow-top"></div>
  <div class="glow-bottom"></div>
  <div class="glass-card">
    <div>
      <div class="header-pill"></div>
      <div class="gold-divider"></div>
    </div>
    <!-- CANVA'DA YAZININ YAZILACAĞI FERAHA GENİŞ ALAN -->
    <div style="flex: 1;"></div>
    <div>
      <div class="gold-divider"></div>
    </div>
  </div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────
// 2. ŞABLON 2: SİTE MİNİMALİST KOYU DEGRADE (Düz, Çerçevesiz, Şık Altın Işık)
// ─────────────────────────────────────────────────────────────
const html2 = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    background: #0a1628;
    background-image:
      radial-gradient(circle at 90% 12%, rgba(201, 169, 110, 0.28) 0%, transparent 52%),
      radial-gradient(circle at 10% 88%, rgba(224, 194, 138, 0.14) 0%, transparent 48%),
      linear-gradient(135deg, #070e1a 0%, #0a1628 42%, #122240 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 70px 80px;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .accent-bar {
    width: 160px;
    height: 3.5px;
    background: linear-gradient(90deg, #c9a96e 0%, rgba(201, 169, 110, 0.2) 100%);
    border-radius: 999px;
  }
  .accent-line-bottom {
    width: 100%;
    height: 1.5px;
    background: linear-gradient(90deg, transparent 0%, rgba(201, 169, 110, 0.75) 50%, transparent 100%);
  }
</style>
</head>
<body>
  <div class="accent-bar"></div>
  <!-- CANVA İÇİN EN GENİŞ BOŞ ALAN -->
  <div style="flex: 1;"></div>
  <div class="accent-line-bottom"></div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────
// 3. ŞABLON 3: SİTE AÇIK KREM & LÜKS KART (Hakkımda & Yazılar bölümlerinin açık teması)
// ─────────────────────────────────────────────────────────────
const html3 = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    background: #faf6ef;
    background-image:
      radial-gradient(circle at 90% 10%, rgba(10, 22, 40, 0.08) 0%, transparent 55%),
      radial-gradient(circle at 10% 90%, rgba(201, 169, 110, 0.16) 0%, transparent 50%),
      linear-gradient(160deg, #faf6ef 0%, #f4ede1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .cream-card {
    width: 900px;
    height: 900px;
    background: #ffffff;
    border: 1.5px solid rgba(201, 169, 110, 0.35);
    border-radius: 36px;
    box-shadow:
      0 30px 70px rgba(10, 22, 40, 0.07),
      0 4px 18px rgba(201, 169, 110, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px;
    position: relative;
  }
  .cream-pill {
    align-self: center;
    width: 140px;
    height: 28px;
    border-radius: 999px;
    background: #fbf9f5;
    border: 1px solid rgba(201, 169, 110, 0.4);
    margin-bottom: 24px;
  }
  .gold-divider {
    width: 100%;
    height: 1.5px;
    background: linear-gradient(90deg, transparent 0%, rgba(201, 169, 110, 0.7) 50%, transparent 100%);
  }
</style>
</head>
<body>
  <div class="cream-card">
    <div>
      <div class="cream-pill"></div>
      <div class="gold-divider"></div>
    </div>
    <!-- CANVA METİN ALANI -->
    <div style="flex: 1;"></div>
    <div>
      <div class="gold-divider"></div>
    </div>
  </div>
</body>
</html>`;

const templates = [
  { file: 'Site_Temali_Instagram_Sablon_1_Cam_Kart.png', html: html1 },
  { file: 'Site_Temali_Instagram_Sablon_2_Koyu_Degrade.png', html: html2 },
  { file: 'Site_Temali_Instagram_Sablon_3_Acik_Krem_Kart.png', html: html3 },
];

for (const t of templates) {
  const tempPath = path.join(__dirname, 'temp.html');
  fs.writeFileSync(tempPath, t.html, 'utf8');

  const destDesktop = path.join(desktopDir, t.file);
  const destPublic = path.join(publicDir, t.file);

  const fileUrl = 'file:///' + tempPath.replace(/\\/g, '/');
  const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${destDesktop}" --window-size=1080,1080 --hide-scrollbars "${fileUrl}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  fs.copyFileSync(destDesktop, destPublic);

  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  console.log('SUCCESS:', t.file, 'Size:', fs.statSync(destDesktop).size);
}

console.log('ALL_TEMPLATES_GENERATED_SUCCESSFULLY');
