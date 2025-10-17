import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projects from '../data/projects.json';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const project = projects.find((p) => p.id === id);

    if (!project) {
        return (
            <div className="max-w-3xl mx-auto px-4">
                <p className="text-red-600">Project not found.</p>
                <Link to="/projects" className="text-blue-600 hover:underline">Back to projects</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
            <p className="text-gray-700 mb-4">{project.description}</p>
            <div className="flex gap-4">
                <Link to="/projects" className="text-blue-600 hover:underline">← Back to projects</Link>
            </div>
        </div>
    );
};

export default ProjectDetail;