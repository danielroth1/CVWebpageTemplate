import type { Project } from '../types';

// Eagerly import all preview images under data/projects/**/preview.<ext> as URLs
// Supported extensions: png, jpg, jpeg, gif, webp, svg
let previewEntries: Array<{ key: string; url: string; dir: string; folder: string; normFolder: string }> = [];
try {
  // @ts-ignore - Vite replaces this at build time
  const mods = import.meta.glob('../data/projects/**/preview.{png,jpg,jpeg,gif,webp,svg}', {
    eager: true,
    as: 'url',
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
