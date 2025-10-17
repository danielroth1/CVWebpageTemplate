import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    return (
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{project.description}</p>
            <Link to={project.link} className="inline-block text-sm text-blue-600 hover:underline">View Project →</Link>
        </div>
    );
};

export default ProjectCard;