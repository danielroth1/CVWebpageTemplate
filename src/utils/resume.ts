// Utilities for resume rendering: date parsing, duration formatting, and image URL resolution

// Parse dates in formats: DD.MM.YYYY | MM.YYYY | YYYY | "Today"
export function parseResumeDate(s: string): Date {
  if (!s) return new Date();
  const t = s.trim();
  if (/^today$/i.test(t)) return new Date();

  const parts = t.split('.').map((p) => p.trim());
  if (parts.length === 3) {
    const [dStr, mStr, yStr] = parts;
    const d = Number(dStr) || 1;
    const m = Number(mStr) || 1;
    const y = Number(yStr) || new Date().getFullYear();
    return new Date(y, m - 1, d);
  }
  if (parts.length === 2) {
    const [mStr, yStr] = parts;
    const m = Number(mStr) || 1;
    const y = Number(yStr) || new Date().getFullYear();
    return new Date(y, m - 1, 1);
  }
  if (parts.length === 1) {
    const y = Number(parts[0]);
    if (!Number.isNaN(y)) return new Date(y, 0, 1);
  }
  // Fallback
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function formatDuration(startStr: string, endStr: string): string {
  const start = parseResumeDate(startStr);
  const end = parseResumeDate(endStr);

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const rem = months % 12;

  const yStr = years > 0 ? `${years} yr${years > 1 ? 's' : ''}` : '';
  const mStr = rem > 0 ? `${rem} mo${rem > 1 ? 's' : ''}` : '';

  return [yStr, mStr].filter(Boolean).join(' ');
}

// Vite: import all images under src/data/company_images and return URL strings
// @ts-ignore - Vite replaces this at build time
const imageModules = import.meta.glob('../data/company_images/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export function getCompanyImageUrl(fileName?: string): string | undefined {
  if (!fileName) return undefined;
  const entry = Object.entries(imageModules).find(([path]) => path.endsWith(`/${fileName}`));
  return entry?.[1];
}
