import React from 'react';
import ProjectList from '../components/ProjectList';
import projectsData from '../data/projects.json';

const Projects: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4">My Projects</h1>
            <ProjectList projects={(projectsData as any).projects} />
        </div>
    );
};

export default Projects;