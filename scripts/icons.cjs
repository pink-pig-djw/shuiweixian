const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.join(__dirname, '..');
const input = path.join(root, 'assets/icon-source.png');
async function png(file, size, inset = false) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  let p = sharp(input).resize(size, size, { fit: 'contain', background: '#153b41' });
  if (inset) {
    const inner = await sharp(input).resize(Math.round(size * .66), Math.round(size * .66), { fit: 'contain', background: '#153b41' }).png().toBuffer();
    p = sharp({ create: { width: size, height: size, channels: 4, background: '#153b41' } }).composite([{ input: inner, gravity: 'centre' }]);
  }
  await p.png().toFile(file);
}
(async () => {
  for (const s of [32,48,72,96,128,144,152,192,256,384,512]) await png(path.join(root, `web/icons/${s === 32 ? 'favicon-32' : 'icon-' + s}.png`), s);
  await png(path.join(root, 'web/icons/apple-touch-icon.png'), 180);
  for (const s of [192,512]) await png(path.join(root, `web/icons/maskable-${s}.png`), s, true);
  await png(path.join(root, 'assets/icon-512.png'), 512);
  const sizes = [16,24,32,48,64,128,256];
  const images = await Promise.all(sizes.map(size => sharp(input).resize(size, size, { fit: 'contain', background: '#153b41' }).png().toBuffer()));
  const header = Buffer.alloc(6 + sizes.length * 16); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((buffer, i) => { const at = 6 + i * 16; header[at] = header[at+1] = sizes[i] % 256; header.writeUInt16LE(1, at+4); header.writeUInt16LE(32, at+6); header.writeUInt32LE(buffer.length, at+8); header.writeUInt32LE(offset, at+12); offset += buffer.length; });
  await fs.writeFile(path.join(root, 'assets/icon.ico'), Buffer.concat([header, ...images]));
  for (const [density, size] of Object.entries({ mdpi:48, hdpi:72, xhdpi:96, xxhdpi:144, xxxhdpi:192 })) {
    await png(path.join(root, `android/app/src/main/res/mipmap-${density}/ic_launcher.png`), size);
    await png(path.join(root, `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`), Math.round(size * 108 / 48), true);
  }
  console.log('Windows、Android 和网页图标已生成。');
})();
