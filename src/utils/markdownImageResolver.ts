/*
 * Resolve relative image paths referenced from markdown files inside src/data/**
 * into Vite-served URLs using import.meta.glob with `as: 'url'`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Create a mapping of all common image assets under src/data to their final URLs.
const imageModules: Record<string, string> = (() => {
  try {
    // Eagerly load URLs for image assets under data/**
    // @ts-ignore - import.meta.glob is supported by Vite and typed as any here
    const mods = import.meta.glob('../data/**/*.{png,jpg,jpeg,gif,svg,webp,avif}', { as: 'url', eager: true });
    return mods as Record<string, string>;
  } catch (e) {
    // If import.meta.glob isn't available (non-Vite environment), return empty mapping
    // eslint-disable-next-line no-console
    console.warn('markdownImageResolver: import.meta.glob not available', e);
    return {};
  }
})();

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Resolve an image src referenced from a markdown file.
 *
 * @param markdownPath - original markdown path used to load the file, e.g. 'src/data/projects/OrigamiMapper/README.md'
 * @param imgSrc - the src attribute found in the markdown, e.g. './preview.png' or '../images/foo.png'
 * @returns a URL string that can be used as an img src, or undefined if not resolvable
 */
export default function resolveMarkdownImage(markdownPath: string | undefined, imgSrc: string | undefined): string | undefined {
  if (!imgSrc) return undefined;
  const s = String(imgSrc).trim();
  if (!markdownPath) return undefined;

  // External or absolute paths should be returned as-is
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;

  // Build candidate path relative to the markdown file
  // Normalize markdownPath to a directory
  const md = normalizePath(markdownPath.replace(/^\.\//, '').replace(/^\//, ''));
  const dir = md.replace(/\/[^/]*$/, '/');

  // Remove any leading ./ from the img src
  const rel = s.replace(/^\.\//, '');

  // Candidate relative path under src/ (the keys from import.meta.glob are like '../data/...')
  // We'll try several variants to match possible keys.
  const candidates = [
    `src/${dir}${rel}`,
    `${dir}${rel}`,
    `${dir}${rel}`.replace(/^\.\//, ''),
    `./src/${dir}${rel}`,
    `../data/${dir}${rel}`,
  ].map(normalizePath);

  // Try to find a matching key in the imageModules mapping by suffix match
  const keys = Object.keys(imageModules);
  for (const cand of candidates) {
    const found = keys.find((k) => normalizePath(k).toLowerCase().endsWith(cand.toLowerCase()));
    if (found) return imageModules[found];
  }

  // As a last resort, try suffix-only match on the img src
  const found = keys.find((k) => normalizePath(k).toLowerCase().endsWith(rel.toLowerCase()));
  if (found) return imageModules[found];

  return undefined;
}
