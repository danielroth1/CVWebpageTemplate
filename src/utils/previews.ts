import type { Project } from '../types';

// Eagerly import all preview images under data/projects/**/preview.<ext> as URLs
// Supported extensions: png, jpg, jpeg, gif, webp, svg
let previewEntries: Array<{ key: string; url: string; dir: string; folder: string; normFolder: string }> = [];
try {
  // @ts-ignore - Vite replaces this at build time
  const mods = import.meta.glob('../data/projects/**/preview.{png,jpg,jpeg,gif,webp,svg}', {
    eager: true,
    query: '?url', import: 'default',
  }) as Record<string, string>;
  previewEntries = Object.entries(mods).map(([key, url]) => {
    const normalizedKey = key.replace(/\\/g, '/');
    const dir = normalizedKey.replace(/\/[^/]*$/, ''); // strip file name
    const parts = dir.split('/');
    const folder = parts[parts.length - 1] ?? '';
    const normFolder = normalize(folder);
    return { key: normalizedKey, url, dir, folder, normFolder };
  });
} catch {
  previewEntries = [];
}

// Eagerly import preview videos under data/projects/**/preview.min.<ext> as URLs
// Supported extensions: mp4, webm, ogg. We only import preview.min.<ext> so non-min videos are not bundled.
type VideoEntry = { key: string; url: string; dir: string; folder: string; normFolder: string; type: string; isMin: boolean };
let previewVideoEntries: VideoEntry[] = [];
try {
  // @ts-ignore - Vite replaces this at build time
  const vmods = import.meta.glob('../data/projects/**/preview.min.{mp4,webm,ogg}', {
    eager: true,
    query: '?url', import: 'default',
  }) as Record<string, string>;
  previewVideoEntries = Object.entries(vmods).map(([key, url]) => {
    const normalizedKey = key.replace(/\\/g, '/');
    const dir = normalizedKey.replace(/\/[^/]*$/, '');
    const parts = dir.split('/');
    const folder = parts[parts.length - 1] ?? '';
    const normFolder = normalize(folder);
    const ext = normalizedKey.split('.').pop()?.toLowerCase() ?? '';
    const type = ext === 'mp4' ? 'video/mp4' : ext === 'webm' ? 'video/webm' : ext === 'ogg' ? 'video/ogg' : 'video/*';
    const isMin = /\/preview\.min\.(mp4|webm|ogg)$/i.test(normalizedKey);
    return { key: normalizedKey, url, dir, folder, normFolder, type, isMin };
  });
} catch {
  previewVideoEntries = [];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isExternal(url?: string): boolean {
  return !!url && /^https?:\/\//i.test(url);
}

function dirFromMarkdownUrl(markdownUrl?: string): string | null {
  if (!markdownUrl || isExternal(markdownUrl)) return null;
  // Normalize to use forward slashes and strip leading ./ or /
  let p = markdownUrl.replace(/\\/g, '/').replace(/^\.?\//, '');
  // Ensure it points under data/projects/**
  const idx = p.toLowerCase().indexOf('data/projects/');
  if (idx < 0) return null;
  p = p.substring(idx);
  // Remove trailing file name
  p = p.replace(/\/[^/]*$/, '');
  // Build comparable dir keys similar to previewEntries.dir which look like '../data/projects/<folder>'
  // We'll compare by suffix to avoid absolute/relative mismatches
  return p;
}

export function getProjectPreviewUrl(project: Project): string | undefined {
  if (!previewEntries.length) return undefined;

  // 1) If project has a local markdownUrl, try to use its directory
  const mdDir = dirFromMarkdownUrl(project.markdownUrl ?? '');
  if (mdDir) {
    const match = previewEntries.find((e) => e.dir.toLowerCase().endsWith(mdDir.toLowerCase()));
    if (match) return match.url;
  }

  // 2) Fallback: try matching by folder name against project id/title
  const candidates: string[] = [project.id, project.title];
  const normalized = candidates.map((c) => normalize(c));
  const byFolder = previewEntries.find((e) => normalized.includes(e.normFolder));
  if (byFolder) return byFolder.url;

  return undefined;
}

export default getProjectPreviewUrl;

export type ProjectPreviewVideoSource = { src: string; type: string };

export function getProjectPreviewVideoSources(project: Project): ProjectPreviewVideoSource[] {
  if (!previewVideoEntries.length) return [];

  // 1) Try to resolve by markdown directory (local paths only)
  const mdDir = dirFromMarkdownUrl(project.markdownUrl ?? '');
  let matches: VideoEntry[] = [];
  if (mdDir) {
    matches = previewVideoEntries.filter((e) => e.dir.toLowerCase().endsWith(mdDir.toLowerCase()));
  }

  // 2) Fallback: match by folder name against project id/title
  if (!matches.length) {
    const candidates: string[] = [project.id, project.title];
    const normalized = candidates.map((c) => normalize(c));
    matches = previewVideoEntries.filter((e) => normalized.includes(e.normFolder));
  }

  if (!matches.length) return [];

  // Deduplicate by type, preferring min variants when available; then sort by preferred order: webm, mp4, ogg
  const order = ['video/webm', 'video/mp4', 'video/ogg'];
  const grouped = new Map<string, VideoEntry[]>();
  for (const m of matches) {
    const arr = grouped.get(m.type) ?? [];
    arr.push(m);
    grouped.set(m.type, arr);
  }
  const chosen: ProjectPreviewVideoSource[] = [];
  grouped.forEach((arr, type) => {
    // Prefer min variant; fallback to any
    const min = arr.find((x: VideoEntry) => x.isMin);
    const pick = min ?? arr[0];
    chosen.push({ src: pick.url, type });
  });
  return chosen.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
}
