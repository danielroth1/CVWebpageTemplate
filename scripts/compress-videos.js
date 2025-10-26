#!/usr/bin/env node
/* eslint-disable */
// @ts-nocheck
// Compress project videos and create Safari-friendly fallbacks.
//
// - Input:  src/data/**/*.webm  (will also process .mp4 if you pass --include-mp4)
// - Output: beside each input:
//     [name].min.webm  (VP9/Opus, CRF 32, max-width 720)
//     [name].min.mp4   (H.264/AAC, CRF 24, max-width 720, +faststart)
//
// Why: iOS Safari has weak/spotty WebM support and large files may crash the page.
// Adding a smaller H.264 MP4 fallback and limiting resolution/bitrate improves stability.
//
// Requirements:
//   - ffmpeg installed and on PATH (macOS: `brew install ffmpeg`)
//
// Usage:
//   node scripts/compress-videos.js               # process all .webm under src/data
//   node scripts/compress-videos.js --dry-run     # show what would be done
//   node scripts/compress-videos.js --mute        # strip audio to reduce size further
//   node scripts/compress-videos.js --maxw 640    # change max width (default 720)
//   node scripts/compress-videos.js --include-mp4 # also compress .mp4 files
//
// Recommended command:
// node scripts/compress-videos.js --maxw 640 --include-mp4
//

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');

const args = new Set(process.argv.slice(2));
function getArgVal(flag, def) {
  const arr = process.argv.slice(2);
  const idx = arr.indexOf(flag);
  if (idx >= 0 && idx + 1 < arr.length) return arr[idx + 1];
  return def;
}
const DRY_RUN = args.has('--dry-run');
const STRIP_AUDIO = args.has('--mute');
const INCLUDE_MP4 = args.has('--include-mp4') || true;
const MAXW = Number(getArgVal('--maxw', '640')) || 640;

function log(...m) { console.log('[compress-videos]', ...m); }
function warn(...m) { console.warn('[compress-videos]', ...m); }

async function exists(p) { try { await fsp.access(p); return true; } catch { return false; } }
async function statSafe(p) { try { return await fsp.stat(p); } catch { return undefined; } }

async function* walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

function run(cmd, args, opts) {
  return new Promise((resolve) => {
    if (DRY_RUN) {
      log('DRY', cmd, args.join(' '));
      return resolve({ code: 0 });
    }
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => resolve({ code }));
  });
}

function buildWebmCmd(input, output) {
  const vf = `scale='min(${MAXW},iw)':-2`;
  const audio = STRIP_AUDIO ? ['-an'] : ['-c:a', 'libopus', '-b:a', '64k'];
  return ['-y', '-i', input,
    '-vf', vf,
    '-c:v', 'libvpx-vp9',
    '-b:v', '0',
    '-crf', '32',
    '-row-mt', '1',
    '-deadline', 'good',
    '-cpu-used', '4',
    ...audio,
    output,
  ];
}

function buildMp4Cmd(input, output) {
  const vf = `scale='min(${MAXW},iw)':-2`;
  const audio = STRIP_AUDIO ? ['-an'] : ['-c:a', 'aac', '-b:a', '96k'];
  return ['-y', '-i', input,
    '-vf', vf,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level', '4.1',
    '-pix_fmt', 'yuv420p',
    '-preset', 'slow',
    '-crf', '24',
    ...audio,
    '-movflags', '+faststart',
    output,
  ];
}

async function processOne(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.webm' && !(INCLUDE_MP4 && ext === '.mp4')) return;

  const dir = path.dirname(file);
  const base = path.basename(file, ext);
  const outWebm = path.join(dir, `${base}.min.webm`);
  const outMp4 = path.join(dir, `${base}.min.mp4`);

  const inStat = await statSafe(file);
  const webmStat = await statSafe(outWebm);
  const mp4Stat = await statSafe(outMp4);

  // Skip if outputs exist and are newer than input
  const isFresh = (st) => inStat && st && st.mtimeMs >= inStat.mtimeMs;

  if (!isFresh(webmStat)) {
    log('Compress WEBM ->', path.relative(ROOT, outWebm));
    const { code } = await run('ffmpeg', buildWebmCmd(file, outWebm));
    if (code !== 0) warn('ffmpeg webm failed for', file);
  } else {
    log('Skip fresh', path.relative(ROOT, outWebm));
  }

  if (!isFresh(mp4Stat)) {
    log('Create MP4 fallback ->', path.relative(ROOT, outMp4));
    const { code } = await run('ffmpeg', buildMp4Cmd(file, outMp4));
    if (code !== 0) warn('ffmpeg mp4 failed for', file);
  } else {
    log('Skip fresh', path.relative(ROOT, outMp4));
  }
}

(async function main() {
  // Sanity check ffmpeg
  const which = process.platform === 'win32' ? 'where' : 'which';
  const { code } = await run(which, ['ffmpeg']);
  if (code !== 0) {
    warn('ffmpeg not found on PATH. Install it first (macOS: brew install ffmpeg).');
    process.exitCode = 1;
    return;
  }

  const start = Date.now();
  let count = 0;

  if (!(await exists(DATA_DIR))) {
    warn('Data directory not found:', DATA_DIR);
    process.exitCode = 1;
    return;
  }

  for await (const file of walk(DATA_DIR)) {
    const low = file.toLowerCase();
    if (low.endsWith('.webm') || (INCLUDE_MP4 && low.endsWith('.mp4'))) {
      // Avoid processing already-minified outputs
      if (/\.min\.(webm|mp4)$/.test(low)) continue;
      try {
        await processOne(file);
        count += 1;
      } catch (e) {
        warn('Failed processing', file, e);
      }
    }
  }

  log(`Done. Processed ${count} file(s) in ${Math.round((Date.now() - start) / 1000)}s.`);
})();
