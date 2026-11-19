// Draws the installable-app icons in public/icons from the logo: a white wallet
// (the lucide "wallet" glyph the Logo component uses) on the brand teal gradient.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../public/icons/", import.meta.url));

const WALLET = `
  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>`;

// `glyph` is the wallet's share of the icon's width; `radius` rounds the tile
// (0 = full bleed, for the maskable and Apple icons which the OS crops itself).
function svg(size, { glyph, radius }) {
  const g = size * glyph;
  const scale = g / 24;
  const offset = (size - g) / 2;
  const stroke = 1.75; // the glyph's stroke, in its own 24-unit space
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#0f766e"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="url(#g)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#fff"
     stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${WALLET}</g>
</svg>`);
}

const icons = [
  { file: "icon-192.png", size: 192, glyph: 0.5, radius: 0.22 },
  { file: "icon-512.png", size: 512, glyph: 0.5, radius: 0.22 },
  // Android crops this one; the wallet stays inside the central 80% safe zone.
  { file: "icon-maskable-512.png", size: 512, glyph: 0.42, radius: 0 },
  { file: "apple-touch-icon.png", size: 180, glyph: 0.5, radius: 0 },
];

for (const { file, size, ...look } of icons) {
  await sharp(svg(size, look)).png().toFile(OUT + file);
  console.log("wrote", file);
}
