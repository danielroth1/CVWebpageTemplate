/*
 * Resolve relative video paths (e.g., .webm) referenced from markdown files inside src/data/**
 * into Vite-served URLs using import.meta.glob with `query: '?url', import: 'default'`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Create a mapping of all .webm/.mp4 assets under src/data to their final URLs.
const videoModules: Record<string, string> = (() => {
  try {
    // Eagerly load URLs for *minified* video assets under data/**
    // We only import `.min.webm` and `.min.mp4` so Vite only bundles the small versions
    // @ts-ignore - import.meta.glob is supported by Vite and typed as any here
    const mods = import.meta.glob('../data/**/*.min.{webm,mp4}', { query: '?url', import: 'default', eager: true });
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

  // If the markdown references the non-minified name (e.g. "clip.webm") try the
  // corresponding .min variant first ("clip.min.webm") so we resolve to the
  // smaller file that is actually bundled.
  const relMin = rel.replace(/\.(webm|mp4)$/i, '.min.$1');
  const minCandidates = [
    `src/${dir}${relMin}`,
    `${dir}${relMin}`,
    `${dir}${relMin}`.replace(/^\.\//, ''),
    `./src/${dir}${relMin}`,
    `../data/${dir}${relMin}`,
  ].map(normalizePath);

  // Prefer minCandidates first
  const probeList = [...minCandidates, ...candidates];

  const keys = Object.keys(videoModules);
  for (const cand of probeList) {
    const found = keys.find((k) => normalizePath(k).toLowerCase().endsWith(cand.toLowerCase()));
    if (found) return videoModules[found];
  }

  // As a last resort, try suffix-only match on the src or the .min variant
  const found = keys.find((k) => {
    const lk = normalizePath(k).toLowerCase();
    return lk.endsWith(rel.toLowerCase()) || lk.endsWith(relMin.toLowerCase());
  });
  if (found) return videoModules[found];

  return undefined;
}

/**
 * Resolve sibling variants for a given video src.
 * For an input like "clip.webm", we will look for (in same folder relative to the markdown):
 * - clip.min.mp4
 * - clip.mp4
 * - clip.min.webm
 * - clip.webm
 * Returns any found as an object of URLs.
 */
export function resolveVideoVariants(
  markdownPath: string | undefined,
  vidSrc: string | undefined,
): { mp4Min?: string; mp4?: string; webmMin?: string; webm?: string } {
  const out: { mp4Min?: string; mp4?: string; webmMin?: string; webm?: string } = {};
  if (!vidSrc || !markdownPath) return out;

  const s = String(vidSrc).trim();
  // External or absolute paths: we can't infer siblings, just return the given as best-effort
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) {
    const lower = s.toLowerCase();
    if (lower.endsWith('.mp4')) out.mp4 = s;
    if (lower.endsWith('.webm')) out.webm = s;
    return out;
  }

  // Build base (without extension) for sibling probing
  const md = normalizePath(markdownPath.replace(/^\.\//, '').replace(/^\//, ''));
  const dir = md.replace(/\/[^/]*$/, '/');
  const rel = s.replace(/^\.\//, '');

  const base = rel.replace(/\.(webm|mp4)$/i, '');
  const candidates = [
    `${base}.min.mp4`,
    `${base}.mp4`,
    `${base}.min.webm`,
    `${base}.webm`,
  ];

  const makeCandidates = (fname: string) => [
    `src/${dir}${fname}`,
    `${dir}${fname}`,
    `${dir}${fname}`.replace(/^\.\//, ''),
    `./src/${dir}${fname}`,
    `../data/${dir}${fname}`,
  ].map(normalizePath);

  const keys = Object.keys(videoModules);
  const find = (fname: string): string | undefined => {
    for (const cand of makeCandidates(fname)) {
      const found = keys.find((k) => normalizePath(k).toLowerCase().endsWith(cand.toLowerCase()));
      if (found) return videoModules[found];
    }
    return undefined;
  };

  const [mp4Min, mp4, webmMin, webm] = candidates.map(find);
  if (mp4Min) out.mp4Min = mp4Min;
  if (mp4) out.mp4 = mp4;
  if (webmMin) out.webmMin = webmMin;
  if (webm) out.webm = webm;
  return out;
}
