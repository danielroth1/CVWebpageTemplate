/*
 * Resolve relative video paths (e.g., .webm) referenced from markdown files inside src/data/**
 * into Vite-served URLs using import.meta.glob with `query: '?url', import: 'default'`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Create a mapping of all .webm assets under src/data to their final URLs.
const videoModules: Record<string, string> = (() => {
  try {
    // Eagerly load URLs for video assets under data/**
    // @ts-ignore - import.meta.glob is supported by Vite and typed as any here
    const mods = import.meta.glob('../data/**/*.webm', { query: '?url', import: 'default', eager: true });
    return mods as Record<string, string>;
  } catch (e) {
    // If import.meta.glob isn't available (non-Vite environment), return empty mapping
    // eslint-disable-next-line no-console
    console.warn('markdownVideoResolver: import.meta.glob not available', e);
    return {};
  }
})();

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Resolve a video src referenced from a markdown file.
 *
 * @param markdownPath - original markdown path used to load the file, e.g. 'src/data/projects/OrigamiMapper/README.md'
 * @param vidSrc - the src attribute found in the markdown, e.g. './clip.webm' or '../assets/clip.webm'
 * @returns a URL string that can be used as a <source src>, or undefined if not resolvable
 */
export default function resolveMarkdownVideo(markdownPath: string | undefined, vidSrc: string | undefined): string | undefined {
  if (!vidSrc) return undefined;
  const s = String(vidSrc).trim();
  if (!markdownPath) return undefined;

  // External or absolute paths should be returned as-is
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;

  // Build candidate path relative to the markdown file
  const md = normalizePath(markdownPath.replace(/^\.\//, '').replace(/^\//, ''));
  const dir = md.replace(/\/[^/]*$/, '/');
  const rel = s.replace(/^\.\//, '');

  const candidates = [
    `src/${dir}${rel}`,
    `${dir}${rel}`,
    `${dir}${rel}`.replace(/^\.\//, ''),
    `./src/${dir}${rel}`,
    `../data/${dir}${rel}`,
  ].map(normalizePath);

  const keys = Object.keys(videoModules);
  for (const cand of candidates) {
    const found = keys.find((k) => normalizePath(k).toLowerCase().endsWith(cand.toLowerCase()));
    if (found) return videoModules[found];
  }

  // As a last resort, try suffix-only match on the src
  const found = keys.find((k) => normalizePath(k).toLowerCase().endsWith(rel.toLowerCase()));
  if (found) return videoModules[found];

  return undefined;
}
