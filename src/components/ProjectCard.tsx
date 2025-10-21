import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { getProjectPreviewUrl, getProjectPreviewVideoSources, type ProjectPreviewVideoSource } from '../utils/previews';
import SkillBadge from './SkillBadge';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const preview = React.useMemo(() => getProjectPreviewUrl(project), [project]);
    const videoSources = React.useMemo<ProjectPreviewVideoSource[]>(() => getProjectPreviewVideoSources(project), [project]);
    const skills = project.skills ?? [];
    const [hovered, setHovered] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);

    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (hovered) {
            // Attempt to play when hovered; ignore promise rejections from autoplay policies
            v.play().catch(() => {});
        } else {
            v.pause();
            try { v.currentTime = 0; } catch {}
        }
    }, [hovered]);
    return (
        // Make entire card clickable via Link for better discoverability.
        // NOTE: Avoid nesting another <Link> inside; replace the inline "View Project" link with a styled span.
        <Link
            to={project.link}
            className="group block rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 backdrop-blur p-4 shadow-elevate-sm hover:shadow-elevate-md transition-all duration-300 focus-visible:shadow-elevate-md relative cursor-pointer focus:outline-none focus-visible:ring focus-visible:ring-primary-500"
            aria-label={`View project: ${project.title}`}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
        >
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
            {skills.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <SkillBadge key={skill} className="hover:shadow-glow transition-shadow" >
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