#!/usr/bin/env node
/*
scripts/run-multi-loc.js

Usage:
  node scripts/run-multi-loc.js [config.json]

Default config path: scripts/multi-loc-config.json

Config format: an array of objects:
[
  { "src": "/path/to/repo/src", "cv_project": "CAE" },
  { "src": "/path/to/other/src", "cv_project": "CardGame" }
]

For each entry the script will run:
  npm run loc -- <src> --output src/data/projects/<cv_project>/cloc.json

The output path is resolved relative to the repository root.
*/

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function readConfig(configPath) {
  if (!fs.existsSync(configPath)) throw new Error('Config not found: ' + configPath);
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function runEntry(repoRoot, entry, globalExcludes, globalExcludeExts, dryRun) {
  return new Promise((resolve) => {
    const src = entry.src;
    const cv = entry.cv_project;
    if (!src || !cv) {
      console.error('Invalid entry (requires src and cv_project):', JSON.stringify(entry));
      return resolve(false);
    }

    const outPath = path.resolve(repoRoot, 'src', 'data', 'projects', cv, 'cloc.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // build exclude list: global + entry-specific
  const excludes = [];
  if (Array.isArray(globalExcludes)) excludes.push(...globalExcludes);
  if (Array.isArray(entry.exclude)) excludes.push(...entry.exclude);
    // dedupe
    const uniqExcludes = [...new Set(excludes)].filter(Boolean);

  const npmArgs = ['run', 'loc', '--', src, '--output', outPath];
      if (uniqExcludes.length) {
        // convert exclude patterns into a single regex for --not-match-d
        // Escape regex special chars (except /) and replace / with a pattern matching both slashes
        const parts = uniqExcludes.map((p) => {
          const esc = String(p).replace(/[-\\^$+?()|[\]{}\\\\]/g, '\\$&');
          return esc.replace(/\//g, '[/\\\\]');
        });
        const combined = `(?:${parts.join('|')})`;
        npmArgs.push(`--not-match-d=${combined}`);
      }
      // handle exclude extensions (global + per-project)
      const exts = [];
      if (Array.isArray(globalExcludeExts)) exts.push(...globalExcludeExts);
      if (Array.isArray(entry.exclude_extensions)) exts.push(...entry.exclude_extensions);
      const uniqExts = [...new Set(exts.map((e) => String(e).replace(/^\./, '').trim()).filter(Boolean))];
      if (uniqExts.length) {
        npmArgs.push(`--exclude-ext=${uniqExts.join(',')}`);
      }

    console.log('\n-> Running: npm', npmArgs.join(' '));
    if (dryRun) {
      console.log('(dry-run) would run:', 'npm', npmArgs.join(' '));
      return resolve(true);
    }
    // Use spawn to run npm, forward stdio
    const child = spawn('npm', npmArgs, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('Success for', cv);
        resolve(true);
      } else {
        console.error('Failed for', cv, 'exit code', code);
        resolve(false);
      }
    });
  });
}

// Run tasks with limited concurrency.
async function runPool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= tasks.length) return;
      try {
        results[i] = await tasks[i]();
      } catch (e) {
        console.error('Task error:', e && e.message ? e.message : e);
        results[i] = false;
      }
    }
  }

  const workers = [];
  const w = Math.max(1, Math.min(concurrency || 1, tasks.length));
  for (let i = 0; i < w; i++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const repoRoot = process.cwd();
  // parse simple flags: [configPath] and optional --parallel N or -p N
  let provided = null;
  let parallel = 1;
  let dryRun = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--parallel' || a === '-p') {
      const n = Number(argv[i + 1]);
      if (Number.isInteger(n) && n > 0) {
        parallel = n;
        i++;
      } else {
        console.error('Invalid parallel value for', a);
        process.exit(2);
      }
    } else if (a === '--dry-run') {
      dryRun = true;
    } else if (!provided) {
      provided = a;
    } else {
      console.warn('Ignoring extra arg', a);
    }
  }

  const dataConfig = path.resolve(repoRoot, 'src', 'data', 'multi-loc-config.json');
  const scriptConfig = path.resolve(repoRoot, 'scripts', 'multi-loc-config.json');
  const configArg = provided || (fs.existsSync(dataConfig) ? dataConfig : scriptConfig);
  let config;
  try {
    config = readConfig(configArg);
  } catch (err) {
    console.error('Error reading config:', err.message);
    console.error('Provide a config file path or create scripts/multi-loc-config.json');
    process.exit(2);
  }

  // support two config shapes:
  // 1) array of entries (backwards compatible)
  // 2) object { exclude: [...], projects: [...] }
  let projects = [];
  let globalExcludes = [];
  let globalExcludeExts = [];
  if (Array.isArray(config)) {
    projects = config;
  } else if (config && Array.isArray(config.projects)) {
    projects = config.projects;
    if (Array.isArray(config.exclude)) globalExcludes = config.exclude;
    if (Array.isArray(config.exclude_extensions)) globalExcludeExts = config.exclude_extensions;
  } else {
    console.error('Invalid config - expected an array or an object with a "projects" array');
    process.exit(2);
  }

  let allOk = true;
  if (parallel > 1) {
    const tasks = projects.map((entry) => () => runEntry(repoRoot, entry, globalExcludes, globalExcludeExts, dryRun));
    const results = await runPool(tasks, parallel);
    allOk = results.every((r) => r === true);
  } else {
    for (const entry of projects) {
      const ok = await runEntry(repoRoot, entry, globalExcludes, globalExcludeExts, dryRun);
      if (!ok) allOk = false;
    }
  }

  process.exit(allOk ? 0 : 3);
}

if (require.main === module) main();
