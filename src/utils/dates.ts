import type { Project } from '../types';

/** Parse a flexible date string like "YYYY", "MM.YYYY", "DD.MM.YYYY" or with "/" separators. Also supports "today". */
export function parseFlexibleDate(input: string, opts?: { endOfPeriod?: boolean; now?: Date }): Date | null {
  if (!input) return null;
  const now = opts?.now ?? new Date();
  const s = input.trim().toLowerCase();
  if (s === 'today') return now;

  const norm = s.replace(/\//g, '.');
  const parts = norm.split('.').filter(Boolean);
  if (parts.length === 1) {
    // YYYY
    const y = parseInt(parts[0], 10);
    if (Number.isNaN(y)) return null;
    if (opts?.endOfPeriod) {
      return new Date(y, 11, 31, 23, 59, 59, 999);
    }
    return new Date(y, 0, 1);
  } else if (parts.length === 2) {
    // MM.YYYY (assume first is month)
    const m = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) return null;
    if (opts?.endOfPeriod) {
      // last day of month
      const last = new Date(y, m, 0).getDate();
      return new Date(y, m - 1, last, 23, 59, 59, 999);
    }
    return new Date(y, m - 1, 1);
  } else if (parts.length === 3) {
    // DD.MM.YYYY
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
    return new Date(y, Math.max(0, Math.min(11, m - 1)), Math.max(1, Math.min(31, d)));
  }
  return null;
}

/** Compute months difference between two dates treating partial months: if to.day < from.day, subtract 1 month. */
export function diffInMonths(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
}

export function formatDurationMonths(totalMonths: number): string {
  if (totalMonths <= 0) return '';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(years === 1 ? '1 year' : `${years} years`);
  if (months > 0) parts.push(months === 1 ? '1 month' : `${months} months`);
  return parts.join(' ');
}

export function buildDateSpanDisplay(project: Project, opts?: { now?: Date }): { dateText: string | null; durationText: string | null } {
  // If a single display date exists, use it exclusively
  if (project.date && project.date.trim()) return { dateText: project.date, durationText: null };
  const fromRaw = (project as any).date_from as string | undefined;
  const toRaw = (project as any).date_to as string | undefined;
  if (!fromRaw && !toRaw) return { dateText: null, durationText: null };
  if (fromRaw && !toRaw) return { dateText: fromRaw, durationText: null };
  if (!fromRaw && toRaw) return { dateText: toRaw, durationText: null };
  const now = opts?.now ?? new Date();
  const from = parseFlexibleDate(fromRaw!, { endOfPeriod: false, now });
  const to = parseFlexibleDate(toRaw!, { endOfPeriod: true, now });
  const dateText = `${fromRaw} – ${toRaw}`;
  if (!from || !to) return { dateText, durationText: null };
  const months = diffInMonths(from, to);
  const duration = formatDurationMonths(months);
  return { dateText, durationText: duration || null };
}

export function getProjectDateDisplay(project: Project, opts?: { now?: Date }): string | null {
  const { dateText, durationText } = buildDateSpanDisplay(project, opts);
  if (!dateText) return null;
  return durationText ? `${dateText} · ${durationText}` : dateText;
}
