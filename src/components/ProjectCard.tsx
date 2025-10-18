import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { getProjectPreviewUrl, getProjectPreviewVideoSources, type ProjectPreviewVideoSource } from '../utils/previews';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const preview = React.useMemo(() => getProjectPreviewUrl(project), [project]);
    const videoSources = React.useMemo<ProjectPreviewVideoSource[]>(() => getProjectPreviewVideoSources(project), [project]);
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
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            {(preview || videoSources.length) && (
                <div 
                    className="mb-3 -mt-1 -mx-1 relative h-32 overflow-hidden rounded"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onFocus={() => setHovered(true)}
                    onBlur={() => setHovered(false)}
                    tabIndex={0}
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
            <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{project.description}</p>
            <Link to={project.link} className="inline-block text-sm text-blue-600 hover:underline">View Project →</Link>
        </div>
    );
};

export default ProjectCard;