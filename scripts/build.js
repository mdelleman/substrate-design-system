#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

const ROOT = path.join(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'icons');
const DIST_DIR = path.join(ROOT, 'dist');
const PRIV_DIR = path.join(ROOT, 'priv');

const SIZES = [16, 20, 24, 32, 48];

function normalizeColors(svg) {
  return svg
    .replace(/\bfill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"')
    .replace(/\bstroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"');
}

function extractSvg(raw, size) {
  const viewBox = (raw.match(/viewBox="([^"]+)"/) || [])[1] || `0 0 ${size} ${size}`;
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s+|\s+$/g, '');
  return { viewBox, inner };
}

const icons = {};

// Clean priv/icons so removed files don't linger
const privIconsRoot = path.join(PRIV_DIR, 'icons');
if (fs.existsSync(privIconsRoot)) fs.rmSync(privIconsRoot, { recursive: true });

for (const size of SIZES) {
  const dir = path.join(ICONS_DIR, String(size));
  if (!fs.existsSync(dir)) continue;
  const privSizeDir = path.join(privIconsRoot, String(size));
  fs.mkdirSync(privSizeDir, { recursive: true });
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const name = path.basename(file, '.svg');
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const optimized = optimize(raw, { path: path.join(dir, file) }).data;
    const normalized = normalizeColors(optimized);
    fs.writeFileSync(path.join(privSizeDir, file), normalized);
    const { viewBox, inner } = extractSvg(normalized, size);
    (icons[name] ??= {})[size] = { viewBox, inner };
  }
}

const iconNames = Object.keys(icons).sort();
console.log(`Processing ${iconNames.length} icons...`);

// 1. SVG sprite
fs.mkdirSync(DIST_DIR, { recursive: true });
let sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<defs>\n`;
for (const name of iconNames) {
  for (const size of SIZES) {
    const icon = icons[name]?.[size];
    if (!icon) continue;
    sprite += `  <symbol id="${name}-${size}" viewBox="${icon.viewBox}">\n    ${icon.inner}\n  </symbol>\n`;
  }
}
sprite += `</defs>\n</svg>\n`;
fs.writeFileSync(path.join(DIST_DIR, 'sprite.svg'), sprite);

// 2. Raw SVGs — copy from priv/ (already optimised + normalised) so dist/ is consistent with the sprite
const iconsDistDir = path.join(DIST_DIR, 'icons');
if (fs.existsSync(iconsDistDir)) fs.rmSync(iconsDistDir, { recursive: true });
for (const size of SIZES) {
  const src = path.join(privIconsRoot, String(size));
  const dest = path.join(DIST_DIR, 'icons', String(size));
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src).filter(f => f.endsWith('.svg')))
    fs.copyFileSync(path.join(src, f), path.join(dest, f));
}

// 3. TypeScript / JS
const nameUnion = iconNames.length ? iconNames.map(n => `"${n}"`).join(' | ') : 'never';
fs.writeFileSync(path.join(DIST_DIR, 'index.d.ts'),
  `export type IconName = ${nameUnion};\nexport type IconSize = 16 | 20 | 24 | 32 | 48;\n`);
fs.writeFileSync(path.join(DIST_DIR, 'index.js'),
  `export const iconNames = ${JSON.stringify(iconNames)};\nexport const iconSizes = [16, 20, 24, 32, 48];\n`);

console.log(`Done. ${iconNames.length} icons → dist/ and priv/icons/`);
