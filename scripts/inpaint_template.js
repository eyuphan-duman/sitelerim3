const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputImgPath = 'C:/Users/Eyüphan/.gemini/antigravity-ide/brain/b0019754-556a-4e2e-bd7d-a6c0fcaa17ad/.user_uploaded/media_1791481521899.jpg';
const desktopDir = path.join(process.env.USERPROFILE, 'Desktop');
const artDir = 'C:\\Users\\Eyüphan\\.gemini\\antigravity-ide\\brain\\b0019754-556a-4e2e-bd7d-a6c0fcaa17ad';
const publicDir = path.join(__dirname, '..', 'public', 'instagram-sablonlari');

async function processTemplate() {
  const { data, info } = await sharp(inputImgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;

  // Clone buffer for Version 1: Remove quote + author, keep @pskfurkanmanav
  const buf1 = Buffer.from(data);

  // We want to seamlessly remove rows 440 to 635
  // We can interpolate from clean rows above (rows 350-440) and clean rows below (rows 635-725)
  for (let y = 430; y <= 635; y++) {
    const t = (y - 430) / (635 - 430); // 0 at top, 1 at bottom
    // clean source row above (around row 370-420)
    const srcYTop = 380 + (y % 40);
    // clean source row below (around row 650-700)
    const srcYBottom = 660 + (y % 40);

    for (let x = 0; x < w; x++) {
      const targetIdx = (y * w + x) * c;
      const topIdx = (srcYTop * w + x) * c;
      const botIdx = (srcYBottom * w + x) * c;

      for (let ch = 0; ch < c; ch++) {
        // Blend top and bottom clean background pixels
        buf1[targetIdx + ch] = Math.round(buf1[topIdx + ch] * (1 - t) + buf1[botIdx + ch] * t);
      }
    }
  }

  // Clone buffer for Version 2: Also remove bottom handle @pskfurkanmanav (rows 890 to 925)
  const buf2 = Buffer.from(buf1);
  for (let y = 885; y <= 930; y++) {
    const t = (y - 885) / (930 - 885);
    const srcYTop = 840 + (y % 30);
    const srcYBottom = 945 + (y % 30);

    for (let x = 0; x < w; x++) {
      const targetIdx = (y * w + x) * c;
      const topIdx = (srcYTop * w + x) * c;
      const botIdx = (srcYBottom * w + x) * c;

      for (let ch = 0; ch < c; ch++) {
        buf2[targetIdx + ch] = Math.round(buf2[topIdx + ch] * (1 - t) + buf2[botIdx + ch] * t);
      }
    }
  }

  // Output 1: Version with @pskfurkanmanav kept
  const out1Jpg = path.join(desktopDir, 'Instagram_Sablon_Yazisiz_Orijinal.jpg');
  const out1Png = path.join(desktopDir, 'Instagram_Sablon_Yazisiz_Orijinal.png');
  const art1Jpg = path.join(artDir, 'Instagram_Sablon_Yazisiz_Orijinal.jpg');

  await sharp(buf1, { raw: { width: w, height: h, channels: c } })
    .jpeg({ quality: 98 })
    .toFile(out1Jpg);
  await sharp(buf1, { raw: { width: w, height: h, channels: c } })
    .png()
    .toFile(out1Png);
  fs.copyFileSync(out1Jpg, art1Jpg);
  fs.copyFileSync(out1Jpg, path.join(publicDir, 'Instagram_Sablon_Yazisiz_Orijinal.jpg'));

  // Output 2: Version with all text removed (including handle)
  const out2Jpg = path.join(desktopDir, 'Instagram_Sablon_Tamamen_Yazisiz_Orijinal.jpg');
  const out2Png = path.join(desktopDir, 'Instagram_Sablon_Tamamen_Yazisiz_Orijinal.png');
  const art2Jpg = path.join(artDir, 'Instagram_Sablon_Tamamen_Yazisiz_Orijinal.jpg');

  await sharp(buf2, { raw: { width: w, height: h, channels: c } })
    .jpeg({ quality: 98 })
    .toFile(out2Jpg);
  await sharp(buf2, { raw: { width: w, height: h, channels: c } })
    .png()
    .toFile(out2Png);
  fs.copyFileSync(out2Jpg, art2Jpg);
  fs.copyFileSync(out2Jpg, path.join(publicDir, 'Instagram_Sablon_Tamamen_Yazisiz_Orijinal.jpg'));

  console.log('SUCCESS_CREATED:');
  console.log('1:', out1Jpg);
  console.log('2:', out2Jpg);
}

processTemplate().catch(console.error);
