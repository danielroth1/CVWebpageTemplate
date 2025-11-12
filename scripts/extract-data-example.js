#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Config
// We only care about whether src/data exists. If it does, we don't extract.
const ZIP_NAME = 'data_example.zip'; // zip expected to contain a top-level 'data' folder
const TARGET_DIR_NAME = 'data';
const TARGET_PARENT = path.resolve(__dirname, '..', 'src');
const ZIP_PATH = path.resolve(process.cwd(), ZIP_NAME);
const TARGET_DIR = path.join(TARGET_PARENT, TARGET_DIR_NAME);

// Detect silent mode: either passed as arg (--silent) or npm invoked with --silent (npm sets npm_config_loglevel)
const args = process.argv.slice(2);
const silentArg = args.includes('--silent') || args.includes('-s');
const npmSilent = process.env.npm_config_loglevel === 'silent' || process.env.npm_config_loglevel === 'silent';
const SILENT = silentArg || npmSilent;

function log(...msgs) {
  if (!SILENT) console.log(...msgs);
}
function error(...msgs) {
  if (!SILENT) console.error(...msgs);
}

// Ensure src exists
if (!fs.existsSync(TARGET_PARENT)) {
  try {
    fs.mkdirSync(TARGET_PARENT, { recursive: true });
    log('Created target parent folder:', TARGET_PARENT);
  } catch (err) {
    error('Failed to create src/ folder:', err.message);
    process.exit(1);
  }
}

// Check if src/data already exists; if so, refuse extraction.
if (fs.existsSync(TARGET_DIR)) {
  error(`Refusing to extract: folder already exists at ${TARGET_DIR}`);
  process.exit(1);
}

// Ensure zip exists
if (!fs.existsSync(ZIP_PATH)) {
  error(`Zip file not found at ${ZIP_PATH}. Nothing to extract.`);
  process.exit(1);
}

// Extract zip directly into src/ so that the contained 'data' folder lands at src/data.
// We do NOT create src/data ourselves; we assume the zip contains it.
// Exclude macOS resource-fork metadata and .DS_Store files to avoid creating
// `__MACOSX` and unnecessary system files inside `src/`.
const EXCLUDE_PATTERNS = ['__MACOSX/*', '*/.DS_Store', '.DS_Store'];
const excludeArgs = ['-x', ...EXCLUDE_PATTERNS];
const unzipArgs = SILENT
  ? ['-q', ZIP_PATH, ...excludeArgs, '-d', TARGET_PARENT]
  : [ZIP_PATH, ...excludeArgs, '-d', TARGET_PARENT];
const res = spawnSync('unzip', unzipArgs, { stdio: SILENT ? 'ignore' : 'inherit' });
if (res.error) {
  error('Failed to run unzip:', res.error.message);
  process.exit(1);
}
if (res.status !== 0) {
  error(`unzip exited with code ${res.status}`);
  process.exit(res.status || 1);
}

log(`Extracted ${ZIP_NAME} so that ${TARGET_DIR} now exists.`);
process.exit(0);
