// Lightweight loader for cloc.json files under src/data/projects
// Similar approach to markdownLoader: support Vite's import.meta.glob eager imports
// and a Webpack require.context fallback. Also supports external URLs and public paths.

const isExternal = (url: string) => /^https?:\/\//i.test(url);

function toPublicPath(url: string): string | undefined {
  if (url.startsWith('/')) return url;
  const noDot = url.replace(/^\.\//, '');
  if (noDot.startsWith('public/')) return `/${noDot.substring('public/'.length)}`;
  return undefined;
}

// Try Vite glob for cloc.json files (eager, as json)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let viteClocModules: Record<string, any> | null = null;
try {
  // @ts-ignore
  const raw = import.meta.glob('../data/projects/**/cloc.json', { query: '?json', eager: true });
  viteClocModules = raw as Record<string, any>;
} catch {
  viteClocModules = null;
}

// Webpack fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;
let reqCtx: any = null;
try {
  if (!viteClocModules && typeof require !== 'undefined' && require.context) {
    reqCtx = require.context('../data/projects', true, /cloc\.json$/);
  }
} catch {
  reqCtx = null;
}

function resolveLocalKey(clocUrl: string): string | null {
  if (!viteClocModules && !reqCtx) return null;
  let key = clocUrl.replace(/^\.\//, '').replace(/^\//, '');
  key = key.replace(/^src\//i, '').replace(/^\.\/src\//i, '');
  if (!/^(data)\//i.test(key)) key = `data/${key}`;
  if (!key.toLowerCase().endsWith('.json')) return null;

  if (viteClocModules) {
    const keys = Object.keys(viteClocModules);
    const candidates = [key, `./${key}`, `/src/${key}`];
    for (const cand of candidates) {
      const exact = keys.find((x) => x.toLowerCase() === cand.toLowerCase());
      if (exact) return exact;
    }
    const found = keys.find((k) => k.toLowerCase().endsWith(key.toLowerCase()));
    return found ?? null;
  }

  if (reqCtx) {
    const available = reqCtx.keys();
    const direct = available.find((k: string) => k.toLowerCase() === `./${key}`.toLowerCase());
    if (direct) return direct;
    const found = available.find((k: string) => k.toLowerCase().endsWith(key.toLowerCase()));
    return found ?? null;
  }

  return null;
}

export async function loadCloc(clocUrl?: string): Promise<any | null> {
  if (!clocUrl) return null;
  try {
    if (isExternal(clocUrl)) {
      const res = await fetch(clocUrl);
      if (!res.ok) return null;
      return await res.json();
    }

    const key = resolveLocalKey(clocUrl);
    if (viteClocModules && key && viteClocModules[key]) {
      return viteClocModules[key];
    }

    if (reqCtx && key) {
      try {
        return reqCtx(key);
      } catch {
        // fallthrough
      }
    }

    const pub = toPublicPath(clocUrl);
    if (pub) {
      const res = await fetch(pub);
      if (!res.ok) return null;
      return await res.json();
    }

    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load cloc.json:', e);
    return null;
  }
}

export default loadCloc;

// Return all available cloc.json modules discovered at build time (Vite eager glob)
// or via require.context fallback. This is synchronous and only returns local files
// bundled with the app.
export function getAllCloc(): Array<{ key: string; data: any }> {
  const results: Array<{ key: string; data: any }> = [];
  try {
    if (viteClocModules) {
      for (const [key, data] of Object.entries(viteClocModules)) {
        results.push({ key, data });
      }
      return results;
    }
    if (reqCtx) {
      const keys = reqCtx.keys();
      for (const k of keys) {
        try {
          const data = reqCtx(k);
          results.push({ key: k, data });
        } catch {
          // ignore bad entries
        }
      }
      return results;
    }
  } catch {
    // ignore
  }
  return results;
}
