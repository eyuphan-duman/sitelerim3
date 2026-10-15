const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imgPath = 'C:/Users/Eyüphan/.gemini/antigravity-ide/brain/b0019754-556a-4e2e-bd7d-a6c0fcaa17ad/.user_uploaded/media_1791481521899.jpg';

const html = `<!DOCTYPE html>
<html><body>
<img id="img" src="file:///${imgPath}">
<canvas id="c"></canvas>
<div id="output"></div>
<script>
window.onload = function() {
  var img = document.getElementById('img');
  var c = document.getElementById('c');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  var ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  var bg = ctx.getImageData(Math.round(c.width * 0.5), Math.round(c.height * 0.35), 1, 1).data;
  var quote = ctx.getImageData(Math.round(c.width * 0.12), Math.round(c.height * 0.24), 1, 1).data;
  var handle = ctx.getImageData(Math.round(c.width * 0.5), Math.round(c.height * 0.88), 1, 1).data;

  function toHex(r, g, b) {
    return '#' + [r, g, b].map(function(x) {
      return ('0' + x.toString(16)).slice(-2);
    }).join('');
  }

  var res = {
    w: img.naturalWidth,
    h: img.naturalHeight,
    bgHex: toHex(bg[0], bg[1], bg[2]),
    quoteHex: toHex(quote[0], quote[1], quote[2]),
    handleHex: toHex(handle[0], handle[1], handle[2])
  };
  document.getElementById('output').innerText = 'RESULT:' + JSON.stringify(res);
};
</script>
</body></html>`;

fs.writeFileSync('sample_test.html', html, 'utf8');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const out = execSync(`"${edgePath}" --headless --dump-dom sample_test.html`).toString();
fs.unlinkSync('sample_test.html');
console.log(out.match(/RESULT:\{.*?\}/)?.[0]);
