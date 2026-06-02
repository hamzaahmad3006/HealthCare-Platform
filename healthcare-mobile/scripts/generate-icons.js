/**
 * Generates HomeHealth Android app icons at all required mipmap resolutions.
 * Run: node scripts/generate-icons.js
 *
 * Produces:
 *  - ic_launcher.png      (square with rounded corners, green bg + white cross)
 *  - ic_launcher_round.png (circular version)
 */

const sharp = require('sharp');
const path = require('path');

const SIZES = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

const RES_DIR = path.join(
  __dirname,
  '../android/app/src/main/res',
);

const GREEN = '#047857';
const WHITE = '#FFFFFF';

function makeSvgSquare(size) {
  const radius      = Math.round(size * 0.22);
  const crossW      = Math.round(size * 0.15);   // bar thickness
  const crossLen    = Math.round(size * 0.46);   // bar length
  const crossR      = Math.round(crossW * 0.35); // bar corner radius
  const cx          = size / 2;
  const cy          = size / 2;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${GREEN}"/>
  <!-- Horizontal bar -->
  <rect
    x="${cx - crossLen / 2}" y="${cy - crossW / 2}"
    width="${crossLen}" height="${crossW}"
    rx="${crossR}" ry="${crossR}"
    fill="${WHITE}"
  />
  <!-- Vertical bar -->
  <rect
    x="${cx - crossW / 2}" y="${cy - crossLen / 2}"
    width="${crossW}" height="${crossLen}"
    rx="${crossR}" ry="${crossR}"
    fill="${WHITE}"
  />
</svg>`;
}

function makeSvgRound(size) {
  const r           = size / 2;
  const crossW      = Math.round(size * 0.15);
  const crossLen    = Math.round(size * 0.46);
  const crossR      = Math.round(crossW * 0.35);
  const cx          = size / 2;
  const cy          = size / 2;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Circular background -->
  <circle cx="${r}" cy="${r}" r="${r}" fill="${GREEN}"/>
  <!-- Horizontal bar -->
  <rect
    x="${cx - crossLen / 2}" y="${cy - crossW / 2}"
    width="${crossLen}" height="${crossW}"
    rx="${crossR}" ry="${crossR}"
    fill="${WHITE}"
  />
  <!-- Vertical bar -->
  <rect
    x="${cx - crossW / 2}" y="${cy - crossLen / 2}"
    width="${crossW}" height="${crossLen}"
    rx="${crossR}" ry="${crossR}"
    fill="${WHITE}"
  />
</svg>`;
}

async function generate() {
  console.log('Generating HomeHealth app icons...\n');

  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(RES_DIR, folder);

    const squareSvg = Buffer.from(makeSvgSquare(size));
    const roundSvg  = Buffer.from(makeSvgRound(size));

    await sharp(squareSvg).png().toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(roundSvg).png().toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log(`  ✓ ${folder} (${size}x${size})`);
  }

  console.log('\nDone! Rebuild the Android app to see the new icon.');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
