// Lightweight loader that supports loading markdown either from:
// - a local path within src/data/projects (bundled as an asset)
// - an external http(s) URL
// Returns the markdown text or an empty string on failure.

const isExternal = (url: string) => /^https?:\/\//i.test(url);

// If a path points to something inside the public folder, normalize to a URL the browser can fetch.
function toPublicPath(url: string): string | undefined {
  // Absolute path starting with '/' is already a public URL in CRA
  if (url.startsWith('/')) return url;
  // Strip a possible leading './'
  const noDot = url.replace(/^\.\//, '');
  // If someone specified a path starting with 'public/', serve it from root
  if (noDot.startsWith('public/')) return `/${noDot.substring('public/'.length)}`;
  return undefined;
}

// Try Vite's glob import first. If not available (CRA), fall back to Webpack's require.context.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let viteMdModules: Record<string, any> | null = null;
try {
  // In Vite, this will be statically analyzed and replaced.
  // Note: two globs - one for raw content, one for asset URLs (if needed later)
  // @ts-ignore
  const raw = import.meta.glob('../data/projects/**/*.md', { as: 'raw', eager: true });
  viteMdModules = raw as Record<string, string>;
} catch {
  viteMdModules = null;
}

// Webpack fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let reqCtx: any = null;
try {
  if (!viteMdModules && typeof require !== 'undefined' && require.context) {
    reqCtx = require.context('../data/projects', true, /\.md$/);
  }
} catch {
  reqCtx = null;
}

function resolveLocalKey(markdownUrl: string): string | null {
  // If neither Vite nor Webpack contexts available, we can't resolve a bundled asset
  if (!viteMdModules && !reqCtx) return null;
  // Normalize to the path relative to src/data/projects
  // Accept inputs like:
  // - "/src/data/projects/CAE/README.md"
  // - "src/data/projects/CAE/README.md"
  // - "./src/data/projects/CAE/README.md"
  // - "./data/projects/CAE/README.md"
  // - "data/projects/CAE/README.md"
  // - "projects/CAE/README.md"
  // - "CAE/README.md"
  let key = markdownUrl
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .replace(/^src\//, '')
    .replace(/^\.\/src\//, '')
    .replace(/^data\//, 'data/')
    .replace(/^projects\//, 'projects/');

  // Strip leading "data/projects/" if present to get path relative to that folder
  const idx = key.indexOf('data/projects/');
  if (idx >= 0) {
    key = key.substring(idx + 'data/projects/'.length);
  }

  // If still contains any leading segments before actual project folder, attempt to trim
  // Ensure it starts with './'
  if (!key.startsWith('./')) key = `./${key}`;

  // Ensure it points to a .md under the context
  if (!key.endsWith('.md')) return null;

  if (viteMdModules) {
    // Vite keys are like '/src/data/projects/CAE/README.md' relative to project root when using this glob.
    const keys = Object.keys(viteMdModules);
    let candidates = [key, key.replace(/^\.\//, '/src/data/projects/')];
    for (const k of candidates) {
      const exact = keys.find((x) => x.toLowerCase() === k.toLowerCase());
      if (exact) return exact;
    }
    const found = keys.find((k) => k.toLowerCase().endsWith(key.replace(/^\.\//, '').toLowerCase()));
    return found ?? null;
  }

  if (reqCtx) {
    const available = reqCtx.keys();
    // Direct match
    if (available.includes(key)) return key;
    // Try to find by suffix match (in case of slight path differences)
    const found = available.find((k: string) => k.toLowerCase().endsWith(key.toLowerCase()));
    return found ?? null;
  }

  return null;
}

export function getMarkdownAssetUrl(markdownUrl?: string): string | undefined {
  if (!markdownUrl) return undefined;
  if (isExternal(markdownUrl)) return markdownUrl;
  const key = resolveLocalKey(markdownUrl);
  if (key) {
    if (viteMdModules && viteMdModules[key]) {
      // For Vite raw modules we already have the content; return undefined so loadMarkdown uses content path
      // Here, we can't produce a URL; loadMarkdown will use the raw content path.
      return undefined;
    }
    if (reqCtx) {
      try {
        const assetUrl: string = reqCtx(key);
        return assetUrl;
      } catch {
        // fallthrough
      }
    }
  }
  // Fallback: if it's a public path, allow consumers to link directly
  const pub = toPublicPath(markdownUrl);
  return pub;
}

export async function loadMarkdown(markdownUrl?: string): Promise<string> {
  if (!markdownUrl) return '';
  try {
    if (isExternal(markdownUrl)) {
      const res = await fetch(markdownUrl);
      if (!res.ok) return '';
      const ct = res.headers.get('content-type') || '';
      // Only treat as markdown if not HTML
      if (/text\/html/i.test(ct)) {
        return '';
      }
      // Accept text/markdown, text/plain, or unknown types
      return await res.text();
    }

    const key = resolveLocalKey(markdownUrl);
    if (viteMdModules && key && viteMdModules[key]) {
      // Vite eager raw content is already a string
      return String(viteMdModules[key]);
    }

    const assetUrl = getMarkdownAssetUrl(markdownUrl);
    if (assetUrl) {
      const res = await fetch(assetUrl);
      if (!res.ok) return '';
      return await res.text();
    }
    // Final fallback: attempt fetching a normalized public path
    const pub = toPublicPath(markdownUrl);
    if (pub) {
      const res = await fetch(pub);
      if (!res.ok) return '';
      return await res.text();
    }

    return '';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load markdown:', e);
    return '';
  }
}

export default loadMarkdown;
