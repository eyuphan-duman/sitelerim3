/**
 * Logos Android uygulamasını (Trusted Web Activity) üretir ve Play Store'a yüklenecek
 * imzalı .aab dosyasını derler.
 *
 *   node mobile/build-android.mjs
 *
 * Gerekenler (bir kez kurulur, %LOCALAPPDATA%\logos-build altında):
 *   jdk-17.*            Java 17
 *   sdk/                Android SDK (platforms;android-36, build-tools;36.1.0)
 *   bw/node_modules     @bubblewrap/core
 * İmza anahtarı ve şifresi depo dışında durur: Masaüstü\logos-android-anahtar\
 *
 * Yeni sürüm çıkarırken twa-manifest.json içindeki appVersionCode'u 1 artır,
 * appVersion'ı güncelle ve betiği yeniden çalıştır.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Android derlemesi Windows'ta Türkçe karakterli yollarda (ör. "Eyüphan") bozulur;
// her yol Windows'un kısa (8.3, yalnızca ASCII) adıyla kullanılır.
const short = (p) => {
  if (process.platform !== 'win32' || /^[\x00-\x7f]*$/.test(p)) return p;
  fs.mkdirSync(p, { recursive: true });
  return execSync(`cmd /c for %A in ("${p}") do @echo %~sA`, { encoding: 'utf8' }).trim();
};

const TOOLS = short(path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'logos-build'));
const require = createRequire(path.join(TOOLS, 'bw', 'package.json'));
const {
  TwaManifest, TwaGenerator, ConsoleLog, Config, JdkHelper, AndroidSdkTools,
} = require('@bubblewrap/core');

const log = new ConsoleLog('logos');
const projectDir = path.join(TOOLS, 'android');      // üretilen Android projesi (ASCII yol)
const gradleHome = path.join(TOOLS, 'gradle-home');
const outDir = path.join(here, 'cikti');              // .aab / .apk buraya kopyalanır

const jdkDir = fs.readdirSync(TOOLS).find(d => d.startsWith('jdk-17'));
if (!jdkDir) throw new Error(`JDK 17 bulunamadı: ${TOOLS}`);
const config = new Config(path.join(TOOLS, jdkDir), path.join(TOOLS, 'sdk'));

// Anahtar şifresi depo dışındaki dosyadan okunur, ekrana yazılmaz
const manifestJson = JSON.parse(fs.readFileSync(path.join(here, 'twa-manifest.json'), 'utf8'));
const keyPath = short(path.dirname(path.resolve(here, manifestJson.signingKey.path)));
const keyFile = path.join(keyPath, path.basename(manifestJson.signingKey.path));
const secretFile = path.join(keyPath, 'SIFRE-OKU.txt');
const pw = (process.env.LOGOS_KEY_PASSWORD
  || (fs.readFileSync(secretFile, 'utf8').match(/Anahtar deposu şifresi:\s*(\S+)/) || [])[1] || '').trim();
if (!pw) throw new Error('Anahtar şifresi bulunamadı (LOGOS_KEY_PASSWORD ya da SIFRE-OKU.txt).');

const twa = new TwaManifest({ ...manifestJson, signingKey: { path: keyFile, alias: manifestJson.signingKey.alias } });
const problem = twa.validate();
if (problem) throw new Error('twa-manifest.json geçersiz: ' + problem);

log.info(`Android projesi üretiliyor → ${projectDir}`);
fs.rmSync(projectDir, { recursive: true, force: true });
await new TwaGenerator().createTwaProject(projectDir, twa, log);
await twa.saveToFile(path.join(projectDir, 'twa-manifest.json'));
// Gradle kısa yolu uzun hâline çevirir; Türkçe karakter kontrolü kapatılır
fs.appendFileSync(path.join(projectDir, 'gradle.properties'), '\nandroid.overridePathCheck=true\n');

const jdk = new JdkHelper(process, config);
const sdk = await AndroidSdkTools.create(process, config, jdk, log);

log.info('Derleniyor (ilk seferde Gradle indirildiği için birkaç dakika sürebilir)…');
const gradleEnv = { ...sdk.getEnv(), GRADLE_USER_HOME: gradleHome };
for (const task of ['bundleRelease', 'assembleRelease']) {
  execFileSync(path.join(projectDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'), [task, '--console=plain', '-q', '--no-daemon'], {
    cwd: projectDir, env: gradleEnv, stdio: 'inherit', shell: process.platform === 'win32',
  });
}

const tag = `logos-${manifestJson.appVersion}-${manifestJson.appVersionCode}`;
const tmp = path.join(TOOLS, 'out');
fs.mkdirSync(tmp, { recursive: true });

// İmzalama: şifre komut satırına yazılmaz, ortam değişkeniyle verilir (hata mesajlarında görünmesin)
const signEnv = { ...gradleEnv, LOGOS_KEY_PW: pw };
const run = (file, args) => {
  try {
    execFileSync(file, args, { env: signEnv, stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    throw new Error(`${path.basename(file)} başarısız oldu: ${String(e.stderr || '').slice(0, 400)}`);
  }
};
const javaBin = path.join(config.jdkPath, 'bin');
const buildTools = path.join(config.androidSdkPath, 'build-tools',
  fs.readdirSync(path.join(config.androidSdkPath, 'build-tools')).sort().pop());

const aab = path.join(tmp, `${tag}.aab`);
fs.rmSync(aab, { force: true });
run(path.join(javaBin, 'jarsigner.exe'), [
  '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256',
  '-keystore', keyFile, '-storepass:env', 'LOGOS_KEY_PW', '-keypass:env', 'LOGOS_KEY_PW',
  '-signedjar', aab,
  path.join(projectDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'),
  twa.signingKey.alias,
]);

const aligned = path.join(tmp, 'aligned.apk');
const apk = path.join(tmp, `${tag}.apk`);
fs.rmSync(aligned, { force: true });
run(path.join(buildTools, 'zipalign.exe'), ['-p', '-f', '4',
  path.join(projectDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'), aligned]);
run(path.join(javaBin, 'java.exe'), ['-jar', path.join(buildTools, 'lib', 'apksigner.jar'), 'sign',
  '--ks', keyFile, '--ks-key-alias', twa.signingKey.alias,
  '--ks-pass', 'env:LOGOS_KEY_PW', '--key-pass', 'env:LOGOS_KEY_PW',
  '--out', apk, aligned]);

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(aab, path.join(outDir, `${tag}.aab`));
fs.copyFileSync(apk, path.join(outDir, `${tag}.apk`));
fs.copyFileSync(path.join(projectDir, 'store_icon.png'), path.join(outDir, 'play-store-ikon-512.png'));

log.info(`Hazır (${outDir}):\n  ${tag}.aab  → Play Console'a yüklenecek dosya\n  ${tag}.apk  → telefona doğrudan kurup denemek için`);
