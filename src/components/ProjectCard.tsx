import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { getProjectPreviewUrl, getProjectPreviewVideoSources, type ProjectPreviewVideoSource } from '../utils/previews';
import SkillBadge from './SkillBadge';
import { getSkillBadgeHoverBg, getSkillBorderHover } from '../utils/skillColors';
import { getAllCloc } from '../utils/clocLoader';
import Tooltip from './Tooltip';
import { getProjectDateDisplay } from '../utils/dates';

// Cache computed LOC map globally to avoid recomputation per card re-render.
let __cachedLocMap: Record<string, number> | null = null;
function getFolderLocMap(): Record<string, number> {
    if (__cachedLocMap) return __cachedLocMap;
    const entries = getAllCloc();
    const map: Record<string, number> = {};
    for (const { key, data } of entries) {
        // Key examples: '../data/projects/CAE/cloc.json'
        const norm = key.replace(/\\/g, '/');
        const m = norm.match(/data\/projects\/([^/]+)\//i);
        const folder = m?.[1];
        if (!folder) continue;
        const total = data?.summary?.total ?? data?.raw?.SUM ?? null;
        const code: number | undefined = total?.code;
        if (typeof code === 'number') map[folder] = code;
    }
    __cachedLocMap = map;
    return map;
}

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const preview = React.useMemo(() => getProjectPreviewUrl(project), [project]);
    const videoSources = React.useMemo<ProjectPreviewVideoSource[]>(() => getProjectPreviewVideoSources(project), [project]);
    const skills = project.skills ?? [];
    const [hovered, setHovered] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const cardRef = React.useRef<HTMLAnchorElement | null>(null);
    const previewStart = React.useMemo(() => {
        const raw = (project as any)?.preview_start;
        const n = typeof raw === 'string' ? Number(raw) : raw;
        return Number.isFinite(n) && n >= 0 ? (n as number) : undefined;
    }, [project]);
    const locMap = React.useMemo(() => getFolderLocMap(), []);
    const dateDisplay = React.useMemo(() => getProjectDateDisplay(project), [project]);
    // Derive folder from markdownUrl to match how ProjectDetail resolves cloc.json
    // Derive total LOC; if project lacks markdown or cloc file we simply omit the badge (no placeholder shown).
    const totalLoc = React.useMemo(() => {
        const md = project.markdownUrl;
        if (!md) return null;
        const m = md.match(/src\/data\/projects\/([^/]+)\//i);
        const folder = m?.[1];
        if (!folder) return null;
        return locMap[folder] ?? null;
    }, [project.markdownUrl, locMap]);

    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (hovered) {
            // Attempt to play when hovered; ignore promise rejections from autoplay policies
            try {
                if (previewStart != null) v.currentTime = previewStart;
            } catch {}
            v.play().catch(() => {});
        } else {
            v.pause();
            try { v.currentTime = 0; } catch {}
        }
    }, [hovered, previewStart]);

    // When hovered via pointer, keep playing even if the pointer leaves the window.
    // Desktop: stop when the pointer enters another area (pointerover onto an element outside this card).
    // Mobile (touch): ignore pointerover/leave during scroll; stop only when user starts a new touch outside the card.
    React.useEffect(() => {
        if (!hovered) return;
        const el = cardRef.current;
        if (!el) return;
        const onDocPointerOver = (ev: PointerEvent) => {
            // Only consider mouse/pen for hover transitions; ignore touch to prevent stopping during scroll.
            if (ev.pointerType !== 'mouse' && ev.pointerType !== 'pen') return;
            const target = ev.target as Node | null;
            if (!target) return;
            if (el.contains(target)) return; // still inside the card; ignore
            setHovered(false);
        };
        document.addEventListener('pointerover', onDocPointerOver, true);
        return () => {
            document.removeEventListener('pointerover', onDocPointerOver, true);
        };
    }, [hovered]);

    // Touch-specific outside detection: stop preview when user starts a NEW touch outside the card.
    React.useEffect(() => {
        if (!hovered) return;
        const el = cardRef.current;
        if (!el) return;
        const onTouchStart = (ev: TouchEvent) => {
            const target = ev.target as Node | null;
            if (target && !el.contains(target)) {
                setHovered(false);
            }
        };
        document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
        return () => {
            // Remove with same capture flag
            document.removeEventListener('touchstart', onTouchStart, true);
        };
    }, [hovered]);
    return (
        // Make entire card clickable via Link for better discoverability.
        // NOTE: Avoid nesting another <Link> inside; replace the inline "View Project" link with a styled span.
        <Link
            to={project.link}
            className="group block rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 backdrop-blur p-4 shadow-elevate-sm hover:shadow-elevate-md transition-all duration-300 focus-visible:shadow-elevate-md relative cursor-pointer focus:outline-none focus-visible:ring focus-visible:ring-primary-500"
            aria-label={`View project: ${project.title}`}
            ref={cardRef}
            onPointerEnter={() => setHovered(true)}
            onPointerDown={() => setHovered(true)}
            onPointerLeave={(e) => {
                // For touch, ignore leave to avoid stopping when starting a scroll gesture.
                if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
                    // If relatedTarget is null, the pointer likely left the document/window.
                    // Keep playing in that case; we'll stop when it next enters another area.
                    const rt = (e as React.PointerEvent<HTMLAnchorElement>).relatedTarget as Node | null;
                    if (rt == null) return;
                    setHovered(false);
                }
            }}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
        >
            {dateDisplay && (
                <div className="-mt-1 mb-2 text-xs font-medium text-slate-600 dark:text-slate-300 tracking-tight">
                    {dateDisplay}
                </div>
            )}
            {(preview || videoSources.length) && (
                <div 
                    className="mb-3 -mt-1 -mx-1 relative h-32 overflow-hidden rounded"
                >
                    {/* Image poster */}
                    {preview && (
                        <img
                            src={preview}
                            alt={`${project.title} preview`}
                            className={`w-auto h-32 object-cover transition-opacity duration-200 ${hovered && videoSources.length ? 'opacity-0' : 'opacity-100'}`}
                            loading="lazy"
                        />
                    )}
                    {/* Hover video overlay */}
                    {videoSources.length > 0 && (
                        <video
                            ref={videoRef}
                            className={`absolute inset-0 w-auto h-32 object-cover ${hovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            poster={preview}
                            onLoadedMetadata={(e) => {
                                if (previewStart == null) return;
                                try {
                                    const v = e.currentTarget as HTMLVideoElement;
                                    if (v && v.readyState >= 1) v.currentTime = previewStart;
                                } catch {}
                            }}
                        >
                            {videoSources.map((s) => (
                                <source key={s.type} src={s.src} type={s.type} />
                            ))}
                        </video>
                    )}
                </div>
            )}
            <h3 className="text-base font-semibold mb-2 text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                {project.title}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-3">
                {project.description}
            </p>
            {typeof totalLoc === 'number' && totalLoc > 0 && (
                <div className="mb-2 -mt-1">
                    {/* Distinct styling from skill badges: square-ish chip, subtle border, monospace emphasis */}
                    <Tooltip
                        content={
                            <span>
                                Lines of code measured with <a className="underline" href="https://github.com/AlDanial/cloc" target="_blank" rel="noopener noreferrer">cloc</a>. Empty lines & comments excluded.
                            </span>
                        }
                        delay={500}
                        placement="bottom"
                        maxWidthClass="max-w-xs"
                    >
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 shadow-sm cursor-help">
                            <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3 h-3 text-primary-600 dark:text-primary-300">
                                <path fill="currentColor" d="M2 2.75A.75.75 0 0 1 2.75 2h10.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H2.75a.75.75 0 0 1-.75-.75V2.75Zm1 .75v9.5h9.5V3.5H3Zm2 2.25A.75.75 0 0 1 5.75 5h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 5.75Zm0 3A.75.75 0 0 1 5.75 8h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 5 8.75Z" />
                            </svg>
                            <span className="uppercase tracking-wide font-semibold">LOC</span>
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-100">{totalLoc}</span>
                        </span>
                    </Tooltip>
                </div>
            )}
            {skills.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <SkillBadge
                            key={skill}
                            skill={skill}
                            className={`hover:shadow-glow transition-shadow border-slate-300 dark:border-slate-600 ${getSkillBorderHover(skill)} ${getSkillBadgeHoverBg(skill)}`}
                        >
                            <span title={skill}>{skill}</span>
                        </SkillBadge>
                    ))}
                </div>
            ) : null}
                            {/* Removed explicit "View Project" call to action; entire card is now clickable */}
        </Link>
    );
};

export default ProjectCard;