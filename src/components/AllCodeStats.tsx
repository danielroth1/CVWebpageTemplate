import React from 'react';
import SkillBadge from './SkillBadge';
import { getAllCloc } from '../utils/clocLoader';
import clocLanguageMapping from '../data/cloc-mapping.json';
import projectsData from '../data/projects.json';

// Types that match cloc.json summary shape
interface ClocLanguageEntry { language: string; code?: number; files?: number; }
interface ClocSummary { total?: { nFiles?: number; code?: number }; languages?: ClocLanguageEntry[] }
interface ClocData { summary?: ClocSummary; raw?: { SUM?: { nFiles?: number; code?: number } } }

// Map project folder names (under src/data/projects/<Folder>) to project id from projects.json
function buildFolderToOverrides(): Record<string, Record<string, string>> {
  const res: Record<string, Record<string, string>> = {};
  const list = (projectsData as any).projects as Array<any>;
  for (const p of list) {
    const md: string | undefined = p.markdownUrl;
    if (!md) continue;
    // markdownUrl: src/data/projects/<Folder>/README.md
    const m = md.match(/src\/data\/projects\/([^/]+)\//i);
    const folder = m?.[1];
    if (!folder) continue;
    if (p['cloc-mapping-overwrite']) {
      res[folder] = p['cloc-mapping-overwrite'] as Record<string, string>;
    }
  }
  return res;
}

// Extract <skill>Skill</skill> from a mapping label. If present, we return that pure skill name.
// Otherwise, we return null to indicate non-skill label (or free text only).
function extractSkill(label: string): string | null {
  if (!label) return null;
  const m = label.match(/<skill>(.*?)<\/skill>/i);
  if (!m) return null;
  return m[1].trim();
}

// Resolve language -> label using mapping + optional per-project overrides
function resolveLabel(language: string, overrides?: Record<string, string>): string {
  if (overrides && overrides[language]) return overrides[language];
  const base = (clocLanguageMapping as Record<string, string>)[language];
  return base ?? language;
}

// We only sum by skills that are explicitly tagged with <skill>..</skill>.
// Any surrounding text is ignored when summing; only the skill tag determines the category.
function aggregateAll(): { skills: Array<{ skill: string; code: number }>; totalCode: number; totalFiles: number } {
  const entries = getAllCloc();
  const folderToOverrides = buildFolderToOverrides();

  const perSkill = new Map<string, number>();
  let totalCode = 0;
  let totalFiles = 0;

  for (const { key, data } of entries) {
    const cloc = data as ClocData;
    const total = cloc?.summary?.total ?? cloc?.raw?.SUM ?? undefined;
    if (total?.code) totalCode += total.code;
    if (total?.nFiles) totalFiles += total.nFiles;

    const languages = Array.isArray(cloc?.summary?.languages) ? cloc!.summary!.languages! : [];

    // Determine project folder from key like '../data/projects/CAE/cloc.json'
    const km = key.replace(/\\/g, '/').match(/data\/projects\/([^/]+)\//i);
    const folder = km?.[1];
    const overrides = folder ? folderToOverrides[folder] : undefined;

    for (const lang of languages) {
      const langName = lang.language;
      const code = typeof lang.code === 'number' ? lang.code : 0;
      if (!code) continue;
      const label = resolveLabel(langName, overrides);
      const skill = extractSkill(label);
      if (!skill) continue; // skip entries that don't map to a skill tag
      perSkill.set(skill, (perSkill.get(skill) ?? 0) + code);
    }
  }

  const skills = Array.from(perSkill.entries())
    .map(([skill, code]) => ({ skill, code }))
    .sort((a, b) => b.code - a.code);

  return { skills, totalCode, totalFiles };
}

interface AllCodeStatsProps {
  /** Whether the aggregated stats panel should start collapsed */
  defaultCollapsed?: boolean;
  /** Callback when user toggles collapsed state */
  onToggleCollapsed?: (collapsed: boolean) => void;
}

const AllCodeStats: React.FC<AllCodeStatsProps> = ({ defaultCollapsed = false, onToggleCollapsed }) => {
  const { skills, totalCode, totalFiles } = React.useMemo(() => aggregateAll(), []);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [animatedTotals, setAnimatedTotals] = React.useState({ files: 0, code: 0 });
  const [animatedSkills, setAnimatedSkills] = React.useState<Record<string, number>>({});

  // IntersectionObserver triggers first-time animation
  React.useEffect(() => {
    if (!ref.current || visible) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible]);

  // Run count-up when visible first time
  React.useEffect(() => {
    if (!visible) return;
    const duration = 2000; // ms full duration for largest number
    const start = performance.now();
    const skillTargets = skills.reduce((acc, s) => { acc[s.skill] = s.code; return acc; }, {} as Record<string, number>);
    const maxValue = Math.max(totalFiles || 0, totalCode || 0, ...skills.map(s => s.code));
    function tick(now: number) {
      const elapsed = now - start;
      const baseProgress = Math.min(1, elapsed / duration); // 0->1 over full duration
      // Each value uses a linear mapping so smaller values finish earlier (they reach target once fraction >= value/maxValue)
      const totalFilesValue = Math.round(Math.min(1, baseProgress * (maxValue / (totalFiles || 1))) * (totalFiles || 0));
      const totalCodeValue = Math.round(Math.min(1, baseProgress * (maxValue / (totalCode || 1))) * (totalCode || 0));
      setAnimatedTotals({ files: totalFilesValue, code: totalCodeValue });
      const perSkillEntries = Object.entries(skillTargets).map(([k, v]) => {
        const scaled = Math.round(Math.min(1, baseProgress * (maxValue / (v || 1))) * v);
        return [k, scaled];
      });
      setAnimatedSkills(Object.fromEntries(perSkillEntries));
      if (baseProgress < 1) requestAnimationFrame(tick);
    }
    const r = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r);
  }, [visible, skills, totalCode, totalFiles]);

  const [collapsed, setCollapsed] = React.useState<boolean>(defaultCollapsed);
  const toggle = () => setCollapsed(c => { const next = !c; onToggleCollapsed?.(next); return next; });

  return (
  <div ref={ref} className={(collapsed ? '' : 'app-border border rounded-xl p-4 app-surface min-w-[14rem]') + ' lg:sticky lg:top-4'}>
      {collapsed ? (
        <button
          type="button"
          onClick={toggle}
          className="text-xs px-2 py-1 rounded border app-border hover:bg-[var(--color-bg-muted)] transition"
          aria-expanded={!collapsed}
          aria-label="Show all projects code statistics"
        >
          Show Stats
        </button>
      ) : (
        <>
        <div className="flex items-start justify-between mb-2 mr-3">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Code stats</h3>
            {/* Info icon with tooltip & click details */}
            <InfoIcon />
          </div>
          <button
            type="button"
            onClick={toggle}
            className="text-xs px-2 py-1 rounded border app-border hover:bg-[var(--color-bg-muted)] transition"
            aria-expanded={!collapsed}
            aria-label="Hide all projects code statistics"
          >
            Hide
          </button>
        </div>
        <div className="text-sm text-[var(--color-text)]">
          <div className="mb-3 space-y-2 mr-4">
            <div className="flex justify-between">
              <div className="text-xs text-[var(--color-text-muted)]">Total number of files:</div>
              <div className="text-xs font-mono"><strong>{visible ? animatedTotals.files : 0}</strong></div>
            </div>
            <div className="flex justify-between">
              <div className="text-xs text-[var(--color-text-muted)]">Total lines of code:</div>
              <div className="text-xs font-mono"><strong>{visible ? animatedTotals.code : 0}</strong></div>
            </div>
          </div>
          {skills.length ? (
            <>
              <div className="my-2 border-t app-border" />
              <div className="space-y-2 overflow-auto">
                {skills.map((s) => (
                  <div key={s.skill} className="flex justify-between gap-3 mr-4">
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <SkillBadge>{s.skill}</SkillBadge>
                    </div>
                    <div className="text-xs font-mono">{visible ? animatedSkills[s.skill] ?? 0 : 0}</div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
        </>
      )}
    </div>
  );
};

export default AllCodeStats;

// ---------------------- Info components ----------------------
// Refactored to use shared <Tooltip /> component.
import Tooltip from './Tooltip';

/** Inline info icon with tooltip and click popover */
const InfoIcon: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen(o => !o);

  return (
    <div className="relative inline-block">
      <Tooltip
        content="See how the code statistics are generated."
        delay={600}
        placement="bottom"
        disabled={open}
        maxWidthClass="max-w-xl"
        minWidthClass="min-w-[14rem]"
      >
        <button
          type="button"
          aria-expanded={open}
          aria-label="More information about code stats"
          onClick={toggle}
          className="w-4 h-4 flex items-center justify-center rounded-full border app-border text-[10px] font-bold cursor-pointer select-none bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
        >
          i
        </button>
  </Tooltip>
      {open && (
        <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 w-64 text-[11px] p-3 rounded border app-border bg-[var(--color-bg)] shadow-xl space-y-2">
          <p>
            The code stats have been calculated with{' '}
            <a
              href="https://github.com/AlDanial/cloc"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              cloc
            </a>
            . The lines of code represent the actual lines of code of all my Open Source projects (empty spaces and comments are not included). I have written most of that code.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] px-2 py-1 rounded border app-border hover:bg-[var(--color-bg-muted)]"
              aria-label="Close code stats info"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

