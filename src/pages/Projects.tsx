import React from 'react';
import ProjectList from '../components/ProjectList';
import AllCodeStats from '../components/AllCodeStats';
import projectsData from '../data/projects.json';
import useWindowSize from '../hooks/useWindowSize';

const Projects: React.FC = () => {
    React.useEffect(() => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        } catch (e) {
            window.scrollTo(0, 0);
        }
    }, []);
    const { width } = useWindowSize();
    const isLg = width >= 1024; // Tailwind's default 'lg' breakpoint

    return (
        <div className="max-w-none mx-auto p-4 lg:p-8">
            <h1 className="text-2xl font-bold mb-4">My Projects</h1>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* AllCodeStats should be on top and centered on small screens, after on large screens */}
                <aside className="order-1 lg:order-2 w-full lg:w-auto flex justify-center lg:justify-start flex-shrink-0 lg:self-start lg:sticky lg:top-4">
                    {/* Collapsed by default on small; expanded on lg */}
                    <AllCodeStats defaultCollapsed={!isLg} />
                </aside>
                <div className="order-2 lg:order-1 flex-1 min-w-0">
                    <ProjectList projects={(projectsData as any).projects} />
                </div>
            </div>
        </div>
    );
};

export default Projects;