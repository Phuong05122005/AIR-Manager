import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'assets');

const source = path.join(
  'C:',
  'Users',
  'ACER',
  '.cursor',
  'projects',
  'd-v2',
  'assets',
  'c__Users_ACER_AppData_Roaming_Cursor_User_workspaceStorage_63b3a9a7784a40f7a461c090e298c1b7_images_Screenshot_2026-05-20_212331-84ee7bc2-993f-4b6e-929f-b49c23afad14.png'
);

fs.mkdirSync(assetsDir, { recursive: true });

async function sampleBackgroundColor(inputPath) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  corners.forEach(([x, y]) => {
    const i = (y * width + x) * channels;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  });
  r = Math.round(r / 4);
  g = Math.round(g / 4);
  b = Math.round(b / 4);
  const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  return hex;
}

async function main() {
  const bgColor = await sampleBackgroundColor(source);
  console.log('Background color:', bgColor);

  const iconOut = path.join(assetsDir, 'icon.png');
  const splashOut = path.join(assetsDir, 'splash-icon.png');
  const adaptiveOut = path.join(assetsDir, 'adaptive-icon.png');

  await sharp(source)
    .resize(1024, 1024, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(iconOut);

  await sharp(source)
    .resize(400, 400, { fit: 'contain', background: bgColor })
    .png({ compressionLevel: 9 })
    .toFile(splashOut);

  await sharp(source)
    .resize(1024, 1024, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(adaptiveOut);

  console.log('Created:', iconOut, splashOut, adaptiveOut);
  console.log('Use backgroundColor:', bgColor);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
