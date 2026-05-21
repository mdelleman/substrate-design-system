#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'icons');
const DIST_DIR = path.join(ROOT, 'dist');
const LIB_DIR = path.join(ROOT, 'lib', 'substrate_design_system');
const SIZES = [16, 20, 24, 32];

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

for (const size of SIZES) {
  const dir = path.join(ICONS_DIR, String(size));
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const name = path.basename(file, '.svg');
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { viewBox, inner } = extractSvg(raw, size);
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

// 2. Raw SVGs
for (const size of SIZES) {
  const src = path.join(ICONS_DIR, String(size));
  const dest = path.join(DIST_DIR, 'icons', String(size));
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src).filter(f => f.endsWith('.svg')))
    fs.copyFileSync(path.join(src, f), path.join(dest, f));
}

// 3. TypeScript / JS
const nameUnion = iconNames.length ? iconNames.map(n => `"${n}"`).join(' | ') : 'never';
fs.writeFileSync(path.join(DIST_DIR, 'index.d.ts'),
  `export type IconName = ${nameUnion};\nexport type IconSize = 16 | 20 | 24 | 32;\n`);
fs.writeFileSync(path.join(DIST_DIR, 'index.js'),
  `export const iconNames = ${JSON.stringify(iconNames)};\nexport const iconSizes = [16, 20, 24, 32];\n`);

// 4. Phoenix HEEx component
fs.mkdirSync(LIB_DIR, { recursive: true });
const entries = [];
for (const name of iconNames) {
  for (const size of SIZES) {
    const icon = icons[name]?.[size];
    if (!icon) continue;
    const safeContent = icon.inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    entries.push(`    {"${name}", ${size}} => {"${icon.viewBox}", "${safeContent}"}`);
  }
}

const exFile = `# THIS FILE IS GENERATED — do not edit by hand
# Run: node scripts/build.js

defmodule SubstrateDesignSystem.Icons do
  use Phoenix.Component

  @icons %{
${entries.join(',\n')}
  }

  attr :name, :string, required: true
  attr :size, :integer, default: 24
  attr :class, :string, default: nil
  attr :rest, :global

  def icon(assigns) do
    {viewbox, svg_content} = Map.fetch!(@icons, {assigns.name, assigns.size})

    assigns =
      assigns
      |> assign(:viewbox, viewbox)
      |> assign(:svg_content, svg_content)

    ~H"""
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={@size}
      height={@size}
      viewBox={@viewbox}
      class={@class}
      {@rest}
    ><%= {:safe, @svg_content} %></svg>
    """
  end
end
`;
fs.writeFileSync(path.join(LIB_DIR, 'icons.ex'), exFile);

console.log(`Done. ${iconNames.length} icons → dist/ and lib/`);
