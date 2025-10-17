import React from 'react';
import ProjectCard from './ProjectCard';
import defaultProjects from '../data/projects.json';
import type { Project } from '../types';

interface Props {
    projects?: Project[];
}

const ProjectList: React.FC<Props> = ({ projects = defaultProjects }) => {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
};

export default ProjectList;