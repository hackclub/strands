import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const STATIC = 'static/images';

async function convertToWebp(inputPath, quality = 80) {
  const outPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const info = await sharp(inputPath)
    .webp({ quality })
    .toFile(outPath);
  const origSize = (await stat(inputPath)).size;
  const ratio = ((1 - info.size / origSize) * 100).toFixed(1);
  console.log(`  ${basename(inputPath)} (${(origSize/1024).toFixed(0)}K) -> ${basename(outPath)} (${(info.size/1024).toFixed(0)}K) [${ratio}% smaller]`);
  return outPath;
}

async function processDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip orph directory - those are tiny GIFs for animation
      if (entry.name === 'orph') {
        console.log(`Skipping ${fullPath} (animation frames)`);
        continue;
      }
      await processDir(fullPath);
    } else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) {
      await convertToWebp(fullPath);
    }
  }
}

// Special handling for noise.jpg - it's 30MB, we need to aggressively compress
// It's a background texture so we can reduce resolution and quality significantly
console.log('=== Special: noise.jpg (30MB texture) ===');
const noiseInfo = await sharp(join(STATIC, 'noise.jpg')).metadata();
console.log(`  Original: ${noiseInfo.width}x${noiseInfo.height}`);
// Resize to 512x512 tile and compress heavily - it's just a subtle texture
await sharp(join(STATIC, 'noise.jpg'))
  .resize(512, 512, { fit: 'cover' })
  .webp({ quality: 50 })
  .toFile(join(STATIC, 'noise.webp'));
const noiseOut = (await stat(join(STATIC, 'noise.webp'))).size;
console.log(`  -> noise.webp (${(noiseOut/1024).toFixed(0)}K)`);

console.log('\n=== Converting all other images ===');
await processDir(STATIC);

// Also convert hero specifically with good quality since it's the main visual
console.log('\n=== Hero image: resize to max 1920px wide ===');
const heroMeta = await sharp(join(STATIC, 'hero.png')).metadata();
console.log(`  Original: ${heroMeta.width}x${heroMeta.height}`);
if (heroMeta.width > 1920) {
  await sharp(join(STATIC, 'hero.png'))
    .resize(1920, null, { withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(STATIC, 'hero-opt.webp'));
  const heroOut = (await stat(join(STATIC, 'hero-opt.webp'))).size;
  console.log(`  -> hero-opt.webp (${(heroOut/1024).toFixed(0)}K) [resized to 1920w]`);
}

console.log('\nDone!');
