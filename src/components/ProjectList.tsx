import React from 'react';
import ProjectCard from './ProjectCard';
import projectsData from '../data/projects.json';
import type { Project } from '../types';

interface Props {
    projects?: Project[];
    showMaxNumProjects?: number;
}

const ProjectList: React.FC<Props> = ({ projects = (projectsData as any).projects, showMaxNumProjects = null }) => {
    const projectsShown = showMaxNumProjects ? projects.slice(0, showMaxNumProjects) : projects;
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectsShown.map((project: Project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
};

export default ProjectList;