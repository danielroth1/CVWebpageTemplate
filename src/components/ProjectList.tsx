import React from 'react';
import ProjectCard from './ProjectCard';
import { Link } from 'react-router-dom';
import projectsData from '../data/projects.json';
import type { Project } from '../types';
import ProjectFilterBar from './ProjectFilterBar';

interface Props {
    projects?: Project[];
    showMaxNumProjects?: number | null;
    /** Show the skill filter bar above the projects grid (defaults to true) */
    showFilterBar?: boolean;
    /** If parent wants to control active skills externally it can pass them; otherwise internal state is used */
    filterSkills?: string[];
    /** Optional callback if parent wants to observe filter changes */
    onFilterChange?: (skills: string[]) => void;
    /** Control filter mode externally (OR/AND). If omitted internal state used. */
    filterMode?: 'OR' | 'AND';
    onFilterModeChange?: (mode: 'OR' | 'AND') => void;
}

const ProjectList: React.FC<Props> = ({
    projects = (projectsData as any).projects,
    showMaxNumProjects = null,
    showFilterBar = true,
    filterSkills,
    onFilterChange,
    filterMode,
    onFilterModeChange,
}) => {
    // Internal state only used when parent does not supply filterSkills
    const [internalFilter, setInternalFilter] = React.useState<string[]>([]);
    const [internalMode, setInternalMode] = React.useState<'OR' | 'AND'>('OR');
    const activeFilters = filterSkills ?? internalFilter;
    const activeMode = filterMode ?? internalMode;

    const setFilters = (skills: string[]) => {
        if (!filterSkills) {
            setInternalFilter(skills);
        }
        onFilterChange?.(skills);
    };

    const setMode = (mode: 'OR' | 'AND') => {
        if (!filterMode) {
            setInternalMode(mode);
        }
        onFilterModeChange?.(mode);
    };

    const filtered = React.useMemo(() => {
        if (!activeFilters.length) return projects;
        return projects.filter((p: Project) => {
            const skills = p.skills || [];
            if (activeMode === 'AND') {
                return activeFilters.every((tag) => skills.includes(tag));
            }
            // OR mode: project matches if ANY selected skill is present
            return activeFilters.some((tag) => skills.includes(tag));
        });
    }, [projects, activeFilters, activeMode]);

    const projectsShown = showMaxNumProjects ? filtered.slice(0, showMaxNumProjects) : filtered;
    const hiddenCount = showMaxNumProjects ? Math.max(filtered.length - projectsShown.length, 0) : 0;
    return (
        <div className="space-y-4">
            {showFilterBar && (
                <ProjectFilterBar active={activeFilters} onChange={setFilters} mode={activeMode} onModeChange={setMode} />
            )}
            {/* Limit to at most 3 projects per row across breakpoints */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {projectsShown.map((project: Project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                {projectsShown.length === 0 && (
                    <p className="col-span-full text-sm text-slate-500">No projects match selected filters.</p>
                )}
                {hiddenCount > 0 && (
                    <Link
                        to="/projects"
                        className="group col-span-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/50 backdrop-blur p-4 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:border-primary-300 dark:hover:bg-slate-700 transition"
                    >
                        <span className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-300">+ {hiddenCount} more</span>
                        <span className="mt-2 text-xs text-slate-600 dark:text-slate-400">Explore all projects →</span>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default ProjectList;