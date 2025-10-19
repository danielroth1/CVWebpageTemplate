#!/usr/bin/env node
/*
Reusable script to run cloc on a repository and produce a richer LOC breakdown.

Usage:
  node scripts/count-loc.js [path] [--output file.json]

If no path is provided the current working directory is used.

This script uses `npx cloc --json` so cloc does not need to be installed globally.
*/

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { repoPath: process.cwd(), output: null, excludeDirs: [], notMatchD: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--output' || a === '-o') {
      out.output = args[i + 1];
      i++;
    } else if (a.startsWith('--exclude-dir=')) {
      out.excludeDirs.push(a.split('=')[1]);
    } else if (a.startsWith('--not-match-d=')) {
      out.notMatchD = a.split('=')[1];
    } else if (!out._positionalUsed) {
      out.repoPath = path.resolve(a);
      out._positionalUsed = true;
    }
  }
  return out;
}

function runCloc(repoPath, extraArgs = []) {
  // Strategy: try system `cloc` first, then fall back to `npx -y cloc`.
  const tryCmd = (cmd, args) =>
    new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
    });

  return new Promise(async (resolve, reject) => {
    try {
      // 1) try system cloc
  let r = await tryCmd('cloc', ['--json', ...extraArgs, repoPath]);
      if (r.code === 0) {
        try {
          return resolve(JSON.parse(r.stdout));
        } catch (e) {
          return reject(new Error('Failed to parse cloc JSON output from system cloc: ' + e.message));
        }
      }

      // 2) try npx cloc
      const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  r = await tryCmd(npx, ['-y', 'cloc', '--json', ...extraArgs, repoPath]);
      if (r.code === 0) {
        try {
          return resolve(JSON.parse(r.stdout));
        } catch (e) {
          return reject(new Error('Failed to parse cloc JSON output from npx cloc: ' + e.message));
        }
      }

      // If we reach here both attempts failed. Provide helpful diagnostics.
      let msg = `cloc failed. System cloc exit code ${r.code}.`;
      msg += '\n--- stderr from last attempt ---\n' + (r.stderr || '(no stderr)');

      // macOS Homebrew cloc often relies on Perl; detect common "bad interpreter" error
      if (/bad interpreter/i.test(r.stderr || '')) {
        msg += '\n\nIt looks like the cloc script references a Perl interpreter that is missing on this machine.\nOn macOS you can try:\n  brew reinstall perl\n  brew reinstall cloc\nOr run cloc via Docker (if installed):\n  docker run --rm -v "' + repoPath + ':/src" nolancon/docker-cloc /src --json\n';
      } else {
        msg += '\n\nTo fix this, you can:\n  - Install cloc (Homebrew): brew install cloc\n  - Or ensure Perl is available if cloc complains about /usr/bin/perl\n  - Or run this script with Docker (see Docker image instructions)\n';
      }

      return reject(new Error(msg));
    } catch (err) {
      return reject(err);
    }
  });
}

function summarize(clocJson) {
  // cloc JSON includes a 'header' and then language keys and a 'SUM' key.
  const languages = Object.keys(clocJson).filter((k) => k !== 'header' && k !== 'SUM');
  const sum = clocJson.SUM || { code: 0, comment: 0, blank: 0, files: 0 };

  const langStats = languages.map((lang) => {
    const s = clocJson[lang];
    return {
      language: lang,
      files: s.nFiles || s.files || s.code ? s.nFiles || s.files || 0 : 0,
      code: s.code || 0,
      comment: s.comment || 0,
      blank: s.blank || 0,
    };
  }).sort((a,b) => b.code - a.code);

  return { total: sum, languages: langStats };
}

function printSummary(summary, repoPath) {
  const total = summary.total;
  const totalLines = (total.code || 0) + (total.comment || 0) + (total.blank || 0);
  console.log('Repository:', repoPath);
  console.log('Files counted:', total.files || 0);
  console.log('Lines (code + comment + blank):', totalLines);
  console.log(`  Code: ${total.code || 0}`);
  console.log(`  Comments: ${total.comment || 0}`);
  console.log(`  Blanks: ${total.blank || 0}`);
  console.log('Top languages by code lines:');
  const top = summary.languages.slice(0, 10);
  top.forEach((l, i) => {
    const pct = total.code ? ((l.code / total.code) * 100).toFixed(2) : '0.00';
    console.log(`  ${i+1}. ${l.language.padEnd(15)} Code: ${String(l.code).padStart(7)} (${pct}%)  Files: ${l.files}`);
  });
}

async function main() {
  const args = parseArgs();
  try {
    const extraClocArgs = [];
    if (args.notMatchD) {
      extraClocArgs.push(`--not-match-d=${args.notMatchD}`);
    } else if (args.excludeDirs && args.excludeDirs.length) {
      // backward-compatible: if excludeDirs were passed, convert to a single not-match regex that matches any of them
      const escaped = args.excludeDirs.map((p) => {
        // escape regex special chars except '/'
        const esc = p.replace(/[-\\^$*+?.()|[\]{}\\\\]/g, '\\$&');
        // convert path separators into a pattern matching both / and \\ (cross-platform)
        return esc.replace(/\//g, '[/\\\\]');
      });
      const combined = `(?:${escaped.join('|')})`;
      extraClocArgs.push(`--not-match-d=${combined}`);
    }
    const json = await runCloc(args.repoPath, extraClocArgs);
    const summary = summarize(json);
    printSummary(summary, args.repoPath);
    if (args.output) {
      const outPath = path.resolve(args.output);
      fs.writeFileSync(outPath, JSON.stringify({ raw: json, summary }, null, 2));
      console.log('Wrote JSON output to', outPath);
    }
    else {
      console.log('No output file specified; skipping JSON output.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(2);
  }
}

if (require.main === module) main();
