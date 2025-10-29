import skillsData from '../data/skills.json';

/**
 * Palette of distinct, accessible Tailwind colors.
 * Index corresponds to the order of groups in skills.json.
 * We provide 10 colors to allow growth; groups can be fewer.
 */
const palette = [
  {
    name: 'sky',
    dot: 'bg-sky-500 dark:bg-sky-400',
    ring: 'focus-visible:ring-sky-500',
    selectedRing: 'ring-4 ring-sky-400/30',
    borderStrong: '!border-sky-600 dark:!border-sky-500',
    borderHover: 'hover:border-sky-500 dark:hover:border-sky-300',
    badgeHoverBg: 'hover:bg-sky-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-sky-600/10 dark:bg-sky-400/20',
    chipText: 'text-sky-700 dark:text-sky-200',
    chipBorder: 'border-sky-400/40',
    chipHoverBg: 'hover:bg-sky-600/20 dark:hover:bg-sky-400/30',
  },
  {
    name: 'orange',
    dot: 'bg-orange-500 dark:bg-orange-400',
    ring: 'focus-visible:ring-orange-500',
    selectedRing: 'ring-4 ring-orange-400/30',
    borderStrong: '!border-orange-600 dark:!border-orange-500',
    borderHover: 'hover:border-orange-500 dark:hover:border-orange-300',
    badgeHoverBg: 'hover:bg-orange-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-orange-600/10 dark:bg-orange-400/20',
    chipText: 'text-orange-700 dark:text-orange-200',
    chipBorder: 'border-orange-400/40',
    chipHoverBg: 'hover:bg-orange-600/20 dark:hover:bg-orange-400/30',
  },
  {
    name: 'emerald',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    ring: 'focus-visible:ring-emerald-500',
    selectedRing: 'ring-4 ring-emerald-400/30',
    borderStrong: '!border-emerald-600 dark:!border-emerald-500',
    borderHover: 'hover:border-emerald-500 dark:hover:border-emerald-300',
    badgeHoverBg: 'hover:bg-emerald-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-emerald-600/10 dark:bg-emerald-400/20',
    chipText: 'text-emerald-700 dark:text-emerald-200',
    chipBorder: 'border-emerald-400/40',
    chipHoverBg: 'hover:bg-emerald-600/20 dark:hover:bg-emerald-400/30',
  },
  {
    name: 'violet',
    dot: 'bg-violet-500 dark:bg-violet-400',
    ring: 'focus-visible:ring-violet-500',
    selectedRing: 'ring-4 ring-violet-400/30',
    borderStrong: '!border-violet-600 dark:!border-violet-500',
    borderHover: 'hover:border-violet-500 dark:hover:border-violet-300',
    badgeHoverBg: 'hover:bg-violet-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-violet-600/10 dark:bg-violet-400/20',
    chipText: 'text-violet-700 dark:text-violet-200',
    chipBorder: 'border-violet-400/40',
    chipHoverBg: 'hover:bg-violet-600/20 dark:hover:bg-violet-400/30',
  },
  {
    name: 'rose',
    dot: 'bg-rose-500 dark:bg-rose-400',
    ring: 'focus-visible:ring-rose-500',
    selectedRing: 'ring-4 ring-rose-400/30',
    borderStrong: '!border-rose-600 dark:!border-rose-500',
    borderHover: 'hover:border-rose-500 dark:hover:border-rose-300',
    badgeHoverBg: 'hover:bg-rose-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-rose-600/10 dark:bg-rose-400/20',
    chipText: 'text-rose-700 dark:text-rose-200',
    chipBorder: 'border-rose-400/40',
    chipHoverBg: 'hover:bg-rose-600/20 dark:hover:bg-rose-400/30',
  },
  {
    name: 'amber',
    dot: 'bg-amber-500 dark:bg-amber-400',
    ring: 'focus-visible:ring-amber-500',
    selectedRing: 'ring-4 ring-amber-400/30',
    borderStrong: '!border-amber-600 dark:!border-amber-500',
    borderHover: 'hover:border-amber-500 dark:hover:border-amber-300',
    badgeHoverBg: 'hover:bg-amber-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-amber-600/10 dark:bg-amber-400/20',
    chipText: 'text-amber-700 dark:text-amber-200',
    chipBorder: 'border-amber-400/40',
    chipHoverBg: 'hover:bg-amber-600/20 dark:hover:bg-amber-400/30',
  },
  {
    name: 'lime',
    dot: 'bg-lime-500 dark:bg-lime-400',
    ring: 'focus-visible:ring-lime-500',
    selectedRing: 'ring-4 ring-lime-400/30',
    borderStrong: '!border-lime-600 dark:!border-lime-500',
    borderHover: 'hover:border-lime-500 dark:hover:border-lime-300',
    badgeHoverBg: 'hover:bg-lime-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-lime-600/10 dark:bg-lime-400/20',
    chipText: 'text-lime-700 dark:text-lime-200',
    chipBorder: 'border-lime-400/40',
    chipHoverBg: 'hover:bg-lime-600/20 dark:hover:bg-lime-400/30',
  },
  {
    name: 'fuchsia',
    dot: 'bg-fuchsia-500 dark:bg-fuchsia-400',
    ring: 'focus-visible:ring-fuchsia-500',
    selectedRing: 'ring-4 ring-fuchsia-400/30',
    borderStrong: '!border-fuchsia-600 dark:!border-fuchsia-500',
    borderHover: 'hover:border-fuchsia-500 dark:hover:border-fuchsia-300',
    badgeHoverBg: 'hover:bg-fuchsia-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-fuchsia-600/10 dark:bg-fuchsia-400/20',
    chipText: 'text-fuchsia-700 dark:text-fuchsia-200',
    chipBorder: 'border-fuchsia-400/40',
    chipHoverBg: 'hover:bg-fuchsia-600/20 dark:hover:bg-fuchsia-400/30',
  },
  {
    name: 'teal',
    dot: 'bg-teal-500 dark:bg-teal-400',
    ring: 'focus-visible:ring-teal-500',
    selectedRing: 'ring-4 ring-teal-400/30',
    borderStrong: '!border-teal-600 dark:!border-teal-500',
    borderHover: 'hover:border-teal-500 dark:hover:border-teal-300',
    badgeHoverBg: 'hover:bg-teal-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-teal-600/10 dark:bg-teal-400/20',
    chipText: 'text-teal-700 dark:text-teal-200',
    chipBorder: 'border-teal-400/40',
    chipHoverBg: 'hover:bg-teal-600/20 dark:hover:bg-teal-400/30',
  },
  {
    name: 'indigo',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    ring: 'focus-visible:ring-indigo-500',
    selectedRing: 'ring-4 ring-indigo-400/30',
    borderStrong: '!border-indigo-600 dark:!border-indigo-500',
    borderHover: 'hover:border-indigo-500 dark:hover:border-indigo-300',
    badgeHoverBg: 'hover:bg-indigo-50/60 dark:hover:bg-slate-700',
    chipBg: 'bg-indigo-600/10 dark:bg-indigo-400/20',
    chipText: 'text-indigo-700 dark:text-indigo-200',
    chipBorder: 'border-indigo-400/40',
    chipHoverBg: 'hover:bg-indigo-600/20 dark:hover:bg-indigo-400/30',
  },
] as const;

export type PaletteEntry = typeof palette[number];

// Map skills to palette entry based on ordered groups from JSON
const skillToPalette = new Map<string, PaletteEntry>();

(skillsData.groups || []).forEach((group: string[], idx: number) => {
  const color = palette[idx % palette.length];
  group.forEach((s) => {
    skillToPalette.set(s, color);
  });
});

const DEFAULT_DOT = 'bg-primary-500 dark:bg-primary-400';
const DEFAULT_RING = 'focus-visible:ring-primary-500';
const DEFAULT_SELECTED_RING = 'ring-4 ring-primary-400/30';
const DEFAULT_BORDER_STRONG = '!border-primary-600 dark:!border-primary-500';
const DEFAULT_BORDER_HOVER = 'hover:border-primary-500 dark:hover:border-primary-300';
const DEFAULT_BADGE_HOVER_BG = 'hover:bg-primary-50/60 dark:hover:bg-slate-700';
const DEFAULT_CHIP_BG = 'bg-primary-600/10 dark:bg-primary-400/20';
const DEFAULT_CHIP_TEXT = 'text-primary-700 dark:text-primary-200';
const DEFAULT_CHIP_BORDER = 'border-primary-400/40';
const DEFAULT_CHIP_HOVER_BG = 'hover:bg-primary-600/20 dark:hover:bg-primary-400/30';

export function getSkillPalette(skill: string): PaletteEntry | undefined {
  return skillToPalette.get(skill);
}

export function getSkillDotClasses(skill: string): string {
  return skillToPalette.get(skill)?.dot ?? DEFAULT_DOT;
}

export function getSkillRingClass(skill: string): string {
  return skillToPalette.get(skill)?.ring ?? DEFAULT_RING;
}

export function getSkillSelectedRing(skill: string): string {
  return skillToPalette.get(skill)?.selectedRing ?? DEFAULT_SELECTED_RING;
}

export function getSkillBorderStrong(skill: string): string {
  return skillToPalette.get(skill)?.borderStrong ?? DEFAULT_BORDER_STRONG;
}

export function getSkillBorderHover(skill: string): string {
  return skillToPalette.get(skill)?.borderHover ?? DEFAULT_BORDER_HOVER;
}

export function getSkillBadgeHoverBg(skill: string): string {
  return skillToPalette.get(skill)?.badgeHoverBg ?? DEFAULT_BADGE_HOVER_BG;
}

export function getSkillChipClasses(skill: string): string {
  const p = skillToPalette.get(skill);
  if (!p) {
    return [DEFAULT_CHIP_BG, DEFAULT_CHIP_TEXT, DEFAULT_CHIP_BORDER, DEFAULT_CHIP_HOVER_BG].join(' ');
  }
  return [p.chipBg, p.chipText, p.chipBorder, p.chipHoverBg].join(' ');
}
