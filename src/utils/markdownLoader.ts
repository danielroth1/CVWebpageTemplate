// Documentation loader that supports loading documentation either from:
// - a local path within src/data or src/data/projects (bundled as an asset)
// - an external http(s) URL
// Supports Markdown directly and delegates AsciiDoc conversion to asciidocLoader.ts.
// Returns the document content or an empty string on failure.

import resumeData from '../data/resume.json';

// Calculate years of experience based on earliest start date in resume (work only)
export function calculateYearsOfExperience(): string {
  try {
    const dates: Date[] = [];
    if (resumeData.work) {
      for (const job of resumeData.work) {
        const j: any = job;
        const raw = j.start ?? j.startYear ?? j.from ?? null;
        if (raw) {
          const d = parseDateString(String(raw));
          if (d) dates.push(d);
        }
      }
    }
    if (dates.length === 0) return '0';
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const now = new Date();
    const years = now.getFullYear() - earliest.getFullYear();
    const months = now.getMonth() - earliest.getMonth();
    if (months < 0) {
      return (years - 1).toString();
    }
    return years.toString();
  } catch (e) {
    console.error('Error calculating years of experience:', e);
    return '0';
  }
}

// Parse common date strings found in resume data: supports 'MM.YYYY', 'YYYY', 'MM/YYYY', and ISO strings
function parseDateString(s: string): Date | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  // Skip 'Present' or similar
  if (/present/i.test(trimmed)) return null;
  // MM.YYYY or M.YYYY or MM-YYYY or MM/YYYY
  const m1 = trimmed.match(/^(\d{1,2})[\.\/-](\d{4})$/);
  if (m1) {
    const month = parseInt(m1[1], 10);
    const year = parseInt(m1[2], 10);
    if (!Number.isNaN(month) && !Number.isNaN(year)) return new Date(year, Math.max(0, month - 1), 1);
  }
  // YYYY
  const m2 = trimmed.match(/^(\d{4})$/);
  if (m2) {
    const year = parseInt(m2[1], 10);
    if (!Number.isNaN(year)) return new Date(year, 0, 1);
  }
  // Fallback: try Date.parse
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  return null;
}

// Preprocess content to replace placeholders and custom tags
function preprocessContent(content: string): string {
  // Replace <YEARS_OF_EXPERIENCE /> (new XML-style tag - replace with actual number for non-Markdown processing)
  // For Markdown, this will be handled by the component system
  // For AsciiDoc, we replace it with the actual number
  content = content.replace(/<YEARS_OF_EXPERIENCE\s*\/>/g, calculateYearsOfExperience());
  return content;
}

const isExternal = (url: string) => /^https?:\/\//i.test(url);

// Import AsciiDoc utilities
import { adocToHtml } from './asciidocLoader';

function isAsciiDocFile(filename: string): boolean {
  return /\.(adoc|asciidoc)$/i.test(filename);
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

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
  // Load ALL markdown and asciidoc files under src/data (including projects subfolders)
  const raw = import.meta.glob('../data/**/*.{md,adoc,asciidoc}', { query: '?raw', import: 'default', eager: true });
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
    // Fallback for Webpack/CRA: search under data and its subfolders
    reqCtx = require.context('../data', true, /\.(md|adoc|asciidoc)$/);
  }
} catch {
  reqCtx = null;
}

function resolveLocalKey(markdownUrl: string): string | null {
  // If neither Vite nor Webpack contexts available, we can't resolve a bundled asset
  if (!viteMdModules && !reqCtx) return null;
  // Normalize to a suffix path under data/**
  // Accept inputs like:
  // - "/src/data/projects/CAE/README.md"
  // - "src/data/projects/CAE/README.md"
  // - "./src/data/ABOUT_ME.md"
  // - "data/RESUME.md"
  // - "ABOUT_ME.md" (will be interpreted as data/ABOUT_ME.md)
  let key = markdownUrl.replace(/^\.\//, '').replace(/^\//, '');
  key = key.replace(/^src\//i, '').replace(/^\.\/src\//i, '');
  if (!/^(data)\//i.test(key)) {
    // If path doesn't start with data/, assume it refers to a file in data/
    key = `data/${key}`;
  }
  if (!key.toLowerCase().match(/\.(md|adoc|asciidoc)$/)) return null;

  if (viteMdModules) {
    const keys = Object.keys(viteMdModules);
    // Attempt exact matches against several common prefixes
    const candidates = [
      key,
      `./${key}`,
      `/src/${key}`,
      `/src/${key}`.replace(/\\/g, '/'),
    ];
    for (const cand of candidates) {
      const exact = keys.find((x) => x.toLowerCase() === cand.toLowerCase());
      if (exact) return exact;
    }
    // Fallback: suffix search
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

export async function loadDocumentation(docUrl?: string): Promise<string> {
  if (!docUrl) return '';
  try {
    const fileExtension = getFileExtension(docUrl);
    const isAdoc = isAsciiDocFile(docUrl);
    
    if (isExternal(docUrl)) {
      const res = await fetch(docUrl);
      if (!res.ok) return '';
      const ct = res.headers.get('content-type') || '';
      // Only treat as documentation if not HTML
      if (/text\/html/i.test(ct)) {
        return '';
      }
      const content = await res.text();
      
      // Convert to HTML based on file type
      if (isAdoc || fileExtension === 'adoc' || fileExtension === 'asciidoc') {
        return await adocToHtml(preprocessContent(content), docUrl);
      }
      // For markdown, return as-is (will be processed by react-markdown)
      return preprocessContent(content);
    }

    const key = resolveLocalKey(docUrl);
    let content = '';
    
    if (viteMdModules && key && viteMdModules[key]) {
      // Vite eager raw content is already a string
      content = String(viteMdModules[key]);
    } else {
      const assetUrl = getMarkdownAssetUrl(docUrl);
      if (assetUrl) {
        const res = await fetch(assetUrl);
        if (!res.ok) return '';
        content = await res.text();
      } else {
        // Final fallback: attempt fetching a normalized public path
        const pub = toPublicPath(docUrl);
        if (pub) {
          const res = await fetch(pub);
          if (!res.ok) return '';
          content = await res.text();
        }
      }
    }
    
    // Convert to HTML based on file type
    if (isAdoc || fileExtension === 'adoc' || fileExtension === 'asciidoc') {
      return await adocToHtml(preprocessContent(content), docUrl);
    }
    
    // For markdown, return as-is (will be processed by react-markdown)
    return preprocessContent(content);

  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load documentation:', e);
    return '';
  }
}

// Backward compatibility: alias loadMarkdown to loadDocumentation
export const loadMarkdown = loadDocumentation;

export default loadMarkdown;
