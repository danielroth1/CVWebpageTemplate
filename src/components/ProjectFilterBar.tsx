import React from 'react';
import projectsData from '../data/projects.json';
import type { Project } from '../types';
import SkillBadge from './SkillBadge';
import skillsData from '../data/skills.json';
import {
  getSkillRingClass,
  getSkillBorderStrong,
  getSkillSelectedRing,
  getSkillBorderHover,
  getSkillBadgeHoverBg,
  getSkillChipClasses,
} from '../utils/skillColors';

interface ProjectFilterBarProps {
  active: string[];
  onChange: (skills: string[]) => void;
  className?: string;
  /** Current filter mode: 'OR' (ANY skill matches) or 'AND' (ALL skills required). */
  mode?: 'OR' | 'AND';
  onModeChange?: (mode: 'OR' | 'AND') => void;
}

function uniqueSkills(projects: Project[]): string[] {
  const set = new Set<string>();
  projects.forEach((p) => (p.skills || []).forEach((s) => set.add(s)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const allProjects: Project[] = (projectsData as any).projects;

// Build an order map from skills.json groups so we can sort skills by category order
const __orderMap: Map<string, { groupIdx: number; idx: number }> = new Map();
(skillsData.groups || []).forEach((group: string[], groupIdx: number) => {
  group.forEach((s, idx) => {
    __orderMap.set(s, { groupIdx, idx });
  });
});

function sortSkillsByCategories(skills: string[]): string[] {
  return skills.slice().sort((a, b) => {
    const oa = __orderMap.get(a);
    const ob = __orderMap.get(b);
    if (oa && ob) {
      if (oa.groupIdx !== ob.groupIdx) return oa.groupIdx - ob.groupIdx;
      if (oa.idx !== ob.idx) return oa.idx - ob.idx;
      return a.localeCompare(b);
    }
    if (oa && !ob) return -1; // known categories first
    if (!oa && ob) return 1;
    return a.localeCompare(b);
  });
}

const allSkills = sortSkillsByCategories(uniqueSkills(allProjects));

const ProjectFilterBar: React.FC<ProjectFilterBarProps> = ({ active, onChange, className, mode = 'OR', onModeChange }) => {
  const toggle = (skill: string) => {
    if (active.includes(skill)) {
      onChange(active.filter((s) => s !== skill));
    } else {
      onChange([...active, skill]);
    }
  };
  const clear = () => onChange([]);
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>Match:</span>
          <button
            type="button"
            onClick={() => onModeChange?.(mode === 'OR' ? 'AND' : 'OR')}
            className={`px-2 py-1 rounded border text-[11px] tracking-wide uppercase font-semibold transition
              ${mode === 'AND' ? 'bg-primary-600 text-white border-primary-600 dark:bg-primary-500 dark:border-primary-500' : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}
            `}
            aria-label={`Toggle filter mode. Current: ${mode === 'OR' ? 'ANY skill' : 'ALL skills'}`}
          >
            {mode === 'OR' ? 'ANY' : 'ALL'}
          </button>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">({mode === 'OR' ? 'project matches if it has ANY selected skill' : 'project must include ALL selected skills'})</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {allSkills.map((skill) => {
          const selected = active.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`group focus-visible:outline-none focus-visible:ring ${getSkillRingClass(skill)} rounded-full transition`}
              aria-pressed={selected}
              aria-label={`Filter by skill ${skill}`}
            >
              <SkillBadge
                className={`cursor-pointer select-none border-2 transition-all transform-gpu ${
                  selected
                    ? `${getSkillBorderStrong(skill)} dark:text-white dark:bg-slate-800 font-bold shadow-lg scale-105 ${getSkillSelectedRing(skill)}`
                    : `border-slate-300 dark:border-slate-600 ${getSkillBorderHover(skill)} ${getSkillBadgeHoverBg(skill)}`
                } `}
              >
                {skill}
              </SkillBadge>
            </button>
          );
        })}
        {active.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 underline ml-2"
          >
            Clear
          </button>
        )}
      </div>
      {active.length > 0 && (
        <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center flex-wrap gap-1" aria-live="polite">
          <span className="font-semibold mr-1">Active filters:</span>
          {active.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange(active.filter((s) => s !== f))}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition focus-visible:outline-none focus-visible:ring ${getSkillChipClasses(f)} ${getSkillRingClass(f)}`}
              aria-label={`Remove filter ${f}`}
              title="Remove filter"
            >
              <span>{f}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5 opacity-70"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectFilterBar;
