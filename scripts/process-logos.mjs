import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const cursorAssets = path.join(
  'C:',
  'Users',
  'ACER',
  '.cursor',
  'projects',
  'd-v2',
  'assets'
);

const iconSource = path.join(
  cursorAssets,
  'c__Users_ACER_AppData_Roaming_Cursor_User_workspaceStorage_63b3a9a7784a40f7a461c090e298c1b7_images_Untitled_design__1_-769277d6-fa70-43f5-9b4c-5b60604a752c.png'
);

const outDir = path.join(root, 'assets');
fs.mkdirSync(outDir, { recursive: true });

function isBackgroundPixel(r, g, b, bg) {
  const dist = Math.sqrt(
    (r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2
  );
  return dist < 65;
}

async function removeBackground(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = Buffer.from(data);

  const sample = (x, y) => {
    const i = (y * width + x) * channels;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };
  const corners = [
    sample(0, 0),
    sample(width - 1, 0),
    sample(0, height - 1),
    sample(width - 1, height - 1),
  ];
  const bg = corners.reduce(
    (acc, c) => [acc[0] + c[0] / 4, acc[1] + c[1] / 4, acc[2] + c[2] / 4],
    [0, 0, 0]
  );

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const isBg = isBackgroundPixel(r, g, b, bg);
      pixels[i + 3] = isBg ? 0 : 255;
      if (!isBg) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const pad = 16;
  const crop = {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width - Math.max(0, minX - pad), maxX - minX + 1 + pad * 2),
    height: Math.min(height - Math.max(0, minY - pad), maxY - minY + 1 + pad * 2),
  };

  return sharp(pixels, { raw: { width, height, channels: 4 } }).extract(crop);
}

async function main() {
  const iconOut = path.join(outDir, 'logo-icon.png');
  const icon = await removeBackground(iconSource);
  await icon
    .resize(320, 320, { fit: 'inside', withoutEnlargement: false })
    .sharpen({ sigma: 1.5, m1: 1.4, m2: 0.65 })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(iconOut);
  console.log('Created:', iconOut);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
