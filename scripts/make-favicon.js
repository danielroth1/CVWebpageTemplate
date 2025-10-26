#!/usr/bin/env node
/* eslint-disable */
// @ts-nocheck
// Generate a circular PNG favicon from src/data/logo.<ext>
// - Default output: src/data/favicon-preview.png at 32x32 (transparent corners)
// - Optional: generate multiple sizes with --multi --sizes "16,32,64,180"
// - Accepted inputs (first found): logo.jpg|jpeg|png|webp|avif|svg in src/data (or --input)
//
// Usage:
//   node scripts/make-favicon.js                # uses default size 32 -> src/data/favicon-preview.png
//   node scripts/make-favicon.js --size 32      # single output, 32x32 -> src/data/favicon-preview.png
//   node scripts/make-favicon.js --out path.png # custom single output path
//   node scripts/make-favicon.js --multi --sizes "16,32,64,180"  # multiple outputs -> src/data/favicon-preview-<size>.png + src/data/favicon.png
//   node scripts/make-favicon.js --input src/data/logo.png        # explicit input

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

function getArgVal(flag, def) {
  const arr = process.argv.slice(2);
  const idx = arr.indexOf(flag);
  if (idx >= 0 && idx + 1 < arr.length) return arr[idx + 1];
  return def;
}

const args = new Set(process.argv.slice(2));
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');
// Output directory changed to src/data per user request
const OUTPUT_DIR = path.join(ROOT, 'src', 'data');
const DEFAULT_SIZE = Number(getArgVal('--size', '32')) || 32;
const INPUT_CLI = getArgVal('--input');
const OUT_CLI = getArgVal('--out');
const MULTI = args.has('--multi');
const SIZES = String(getArgVal('--sizes', '16,32,64')).split(',').map(s => Number(s.trim())).filter(Boolean);

function log(...m) { console.log('[make-favicon]', ...m); }
function warn(...m) { console.warn('[make-favicon]', ...m); }
async function exists(p) { try { await fsp.access(p); return true; } catch { return false; } }

async function resolveInput() {
  if (INPUT_CLI) return INPUT_CLI;
  const order = ['jpg','jpeg','png','webp','avif','svg'];
  for (const ext of order) {
    const p = path.join(DATA_DIR, `logo.${ext}`);
    if (await exists(p)) return p;
  }
  return null;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function generateOne(sharp, input, size, outPath) {
  const r = size / 2;
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">\n` +
    `  <circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>\n` +
    `</svg>`
  );
  await ensureDir(path.dirname(outPath));
  await sharp(input)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  log('Wrote', path.relative(ROOT, outPath));
}

(async function main() {
  let sharp;
  try { sharp = require('sharp'); } catch (e) {
    warn('Missing dependency: sharp. Install it with `npm i -D sharp`.');
    process.exitCode = 1; return;
  }

  const input = await resolveInput();
  if (!input) {
    warn('No input logo found in src/data (logo.jpg|jpeg|png|webp|avif|svg).');
    process.exitCode = 1; return;
  }

  if (MULTI) {
    for (const sz of SIZES) {
      const out = path.join(OUTPUT_DIR, `favicon-preview-${sz}.png`);
      await generateOne(sharp, input, sz, out);
    }
    // Also write a default favicon.png using the default size
    const defOut = OUT_CLI || path.join(OUTPUT_DIR, 'favicon-preview.png');
    await generateOne(sharp, input, DEFAULT_SIZE, defOut);
  } else {
    const out = OUT_CLI || path.join(OUTPUT_DIR, 'favicon-preview.png');
    await generateOne(sharp, input, DEFAULT_SIZE, out);
  }

  log('Done.');
})();
