// Lightweight loader that supports loading markdown either from:
// - a local path within src/data/projects (bundled as an asset)
// - an external http(s) URL
// Returns the markdown text or an empty string on failure.

const isExternal = (url: string) => /^https?:\/\//i.test(url);

// Webpack's require.context is available in CRA. Use it to include all md files under data/projects.
// Protect access in environments where `require` or `require.context` is undefined (e.g. some runtimes).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reqCtx: any = (typeof require !== 'undefined' && (require as any).context)
  ? (require as any).context('../data/projects', true, /\.md$/)
  : null;

function resolveLocalKey(markdownUrl: string): string | null {
  if (!reqCtx) return null;
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

  const available = reqCtx.keys();
  // Direct match
  if (available.includes(key)) return key;
  // Try to find by suffix match (in case of slight path differences)
  const found = available.find((k: string) => k.toLowerCase().endsWith(key.toLowerCase()));
  return found ?? null;
}

export function getMarkdownAssetUrl(markdownUrl?: string): string | undefined {
  if (!markdownUrl) return undefined;
  if (isExternal(markdownUrl)) return markdownUrl;
  const key = resolveLocalKey(markdownUrl);
  if (key && reqCtx) {
    try {
      const assetUrl: string = reqCtx(key);
      return assetUrl;
    } catch {
      return undefined;
    }
  }
  return undefined;
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

    const assetUrl = getMarkdownAssetUrl(markdownUrl);
    if (assetUrl) {
      const res = await fetch(assetUrl);
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
