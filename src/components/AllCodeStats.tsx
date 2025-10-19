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

const AllCodeStats: React.FC = () => {
  const { skills, totalCode, totalFiles } = React.useMemo(() => aggregateAll(), []);

  return (
    <div className="border border-gray-200 rounded p-4 bg-gray-50">
      <h3 className="text-sm font-semibold mb-2">All projects – code stats</h3>
      <div className="text-sm text-gray-800">
        <div className="mb-3 space-y-2">
          <div className="flex justify-between">
            <div className="text-xs text-gray-700">Files (sum of projects):</div>
            <div className="text-xs font-mono"><strong>{totalFiles || 0}</strong></div>
          </div>
          <div className="flex justify-between">
            <div className="text-xs text-gray-700">Total lines of code:</div>
            <div className="text-xs font-mono"><strong>{totalCode || 0}</strong></div>
          </div>
        </div>
        {skills.length ? (
          <>
            <div className="my-2 border-t border-gray-200" />
            <div className="space-y-2 max-h-60 overflow-auto">
              {skills.map((s) => (
                <div key={s.skill} className="flex justify-between gap-3">
                  <div className="flex items-center gap-1 text-xs text-gray-700">
                    <SkillBadge>{s.skill}</SkillBadge>
                  </div>
                  <div className="text-xs font-mono">{s.code}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AllCodeStats;
