const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const desktopDir = path.join(process.env.USERPROFILE, 'Desktop');
const artDir = 'C:\\Users\\Eyüphan\\.gemini\\antigravity-ide\\brain\\b0019754-556a-4e2e-bd7d-a6c0fcaa17ad';
const inputImgPath = 'C:/Users/Eyüphan/.gemini/antigravity-ide/brain/b0019754-556a-4e2e-bd7d-a6c0fcaa17ad/.user_uploaded/media_1791481521899.jpg';

// HTML to clean the image on Canvas
const htmlInpaint = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { background: #000; overflow: hidden; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<img id="source" src="file:///${inputImgPath}">
<script>
window.onload = function() {
  const img = document.getElementById('source');
  const canvas = document.getElementById('canvas');
  const w = img.naturalWidth || 1024;
  const h = img.naturalHeight || 1024;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Sample background color from clean area (e.g. x: 50%, y: 35%)
  const sampleX = Math.round(w * 0.5);
  const sampleY = Math.round(h * 0.35);
  const p = ctx.getImageData(sampleX, sampleY, 1, 1).data;
  const bgColor = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';

  // Area 1: "Keder nahoş bir rehavettir." and "— Descartes"
  // From y: 40% to 68%, x: 5% to 95%
  const cleanTop = Math.round(h * 0.38);
  const cleanBottom = Math.round(h * 0.68);
  const cleanHeight = cleanBottom - cleanTop;

  // Fill text area with sampled background
  ctx.fillStyle = bgColor;
  ctx.fillRect(Math.round(w * 0.05), cleanTop, Math.round(w * 0.9), cleanHeight);

  // Add subtle natural noise so it matches the image texture seamlessly
  const patchData = ctx.getImageData(Math.round(w * 0.05), cleanTop, Math.round(w * 0.9), cleanHeight);
  for (let i = 0; i < patchData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 4;
    patchData.data[i] = Math.min(255, Math.max(0, p[0] + noise));
    patchData.data[i+1] = Math.min(255, Math.max(0, p[1] + noise));
    patchData.data[i+2] = Math.min(255, Math.max(0, p[2] + noise));
  }
  ctx.putImageData(patchData, Math.round(w * 0.05), cleanTop);
};
</script>
</body>
</html>`;

// HTML for Version 2: Also removing bottom handle @pskfurkanmanav
const htmlInpaintAll = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { background: #000; overflow: hidden; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<img id="source" src="file:///${inputImgPath}">
<script>
window.onload = function() {
  const img = document.getElementById('source');
  const canvas = document.getElementById('canvas');
  const w = img.naturalWidth || 1024;
  const h = img.naturalHeight || 1024;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const sampleX = Math.round(w * 0.5);
  const sampleY = Math.round(h * 0.35);
  const p = ctx.getImageData(sampleX, sampleY, 1, 1).data;
  const bgColor = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';

  // Remove main quote area
  const cleanTop = Math.round(h * 0.38);
  const cleanBottom = Math.round(h * 0.68);
  ctx.fillStyle = bgColor;
  ctx.fillRect(Math.round(w * 0.05), cleanTop, Math.round(w * 0.9), cleanBottom - cleanTop);

  // Remove bottom handle @pskfurkanmanav
  const bTop = Math.round(h * 0.84);
  const bBottom = Math.round(h * 0.94);
  ctx.fillRect(Math.round(w * 0.1), bTop, Math.round(w * 0.8), bBottom - bTop);
};
</script>
</body>
</html>`;

// HTML for Version 3: Crisp 1080x1080 Vector-perfect Recreation of this exact template
const htmlVector1080 = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    background: #394337;
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 100px 105px 60px;
  }
  /* Top thin line */
  .top-line {
    width: 100%;
    height: 1.5px;
    background: rgba(220, 212, 198, 0.45);
    margin-bottom: 110px;
  }
  /* Quote marks svg */
  .quote-icon {
    width: 82px;
    height: 70px;
    fill: #d8cebf;
    opacity: 0.95;
  }
  /* Bottom handle */
  .bottom-handle {
    margin-top: auto;
    text-align: center;
    color: rgba(220, 212, 198, 0.75);
    font-family: 'Times New Roman', Times, serif;
    font-size: 19px;
    letter-spacing: 0.22em;
    font-weight: 400;
  }
</style>
</head>
<body>
  <div class="top-line"></div>
  <svg class="quote-icon" viewBox="0 0 100 80">
    <!-- Double left quotation marks -->
    <path d="M0,45 C0,20 18,5 38,0 L42,12 C28,15 16,24 15,38 L38,38 L38,80 L0,80 Z" />
    <path d="M52,45 C52,20 70,5 90,0 L94,12 C80,15 68,24 67,38 L90,38 L90,80 L52,80 Z" />
  </svg>
  <div style="flex: 1;"></div>
  <div class="bottom-handle">@pskfurkanmanav</div>
</body>
</html>`;

const tasks = [
  {
    name: 'Instagram_Orijinal_Sablon_Yazisiz.png',
    html: htmlInpaint,
    width: 1024,
    height: 1024
  },
  {
    name: 'Instagram_Orijinal_Sablon_Tamamen_Bos.png',
    html: htmlInpaintAll,
    width: 1024,
    height: 1024
  },
  {
    name: 'Instagram_Orijinal_Sablon_1080p_HD.png',
    html: htmlVector1080,
    width: 1080,
    height: 1080
  }
];

for (const t of tasks) {
  const tempPath = path.join(__dirname, 'temp_inpaint.html');
  fs.writeFileSync(tempPath, t.html, 'utf8');

  const destDesktop = path.join(desktopDir, t.name);
  const destArt = path.join(artDir, t.name);

  const fileUrl = 'file:///' + tempPath.replace(/\\/g, '/');
  const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${destDesktop}" --window-size=${t.width},${t.height} --hide-scrollbars "${fileUrl}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  fs.copyFileSync(destDesktop, destArt);

  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  console.log('GENERATED:', t.name, 'Size:', fs.statSync(destDesktop).size);
}

console.log('ALL_SAVED_TO_DESKTOP_SUCCESSFULLY');
