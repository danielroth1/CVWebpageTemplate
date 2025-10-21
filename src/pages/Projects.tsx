import React from 'react';
import ProjectList from '../components/ProjectList';
import AllCodeStats from '../components/AllCodeStats';
import projectsData from '../data/projects.json';

const Projects: React.FC = () => {
    React.useEffect(() => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        } catch (e) {
            window.scrollTo(0, 0);
        }
    }, []);
    return (
        <div className="max-w-none mx-auto">
            <h1 className="text-2xl font-bold mb-4">My Projects</h1>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0">
                    <ProjectList projects={(projectsData as any).projects} />
                </div>
                <aside className="flex-shrink-0 lg:self-start">
                    {/* Collapsed by default; when collapsed it only shows a button so width shrinks naturally */}
                    <AllCodeStats defaultCollapsed={false} />
                </aside>
            </div>
        </div>
    );
};

export default Projects;