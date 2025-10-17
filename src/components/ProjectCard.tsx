import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { getProjectPreviewUrl } from '../utils/previews';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const preview = React.useMemo(() => getProjectPreviewUrl(project), [project]);
    return (
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            {preview && (
                <div className="mb-3 -mt-1 -mx-1">
                    <img
                        src={preview}
                        alt={`${project.title} preview`}
                        className="w-full h-32 object-cover rounded"
                        loading="lazy"
                    />
                </div>
            )}
            <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{project.description}</p>
            <Link to={project.link} className="inline-block text-sm text-blue-600 hover:underline">View Project →</Link>
        </div>
    );
};

export default ProjectCard;