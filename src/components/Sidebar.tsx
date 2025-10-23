import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaProjectDiagram, FaChevronDown, FaEnvelopeOpenText } from 'react-icons/fa';
import projectsData from '../data/projects.json';
import type { Project } from '../types';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = React.useState<boolean>(false);

    // Auto-open if currently on a project route including root /projects
    React.useEffect(() => {
        if (/^\/projects(\/|$)/.test(location.pathname)) {
            setOpen(true);
        }
    }, [location.pathname]);

    const handleProjectsNavigate = (e: React.MouseEvent) => {
        e.preventDefault();
        // Navigate to /projects and ensure open
        navigate('/projects');
        setOpen(true);
    };

    return (
        <nav className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--color-text)] dark:text-[var(--color-text)] opacity-80">Navigation</h2>
            <ul className="space-y-2 mb-1">
                <li>
                    <Link className="block px-3 py-2 rounded transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]" to="/">
                        <span className="inline-flex items-center gap-2"><FaHome /> Home</span>
                    </Link>
                </li>
                <li>
                    <div className="flex items-stretch">
                        {/* Navigation link */}
                        <a
                            href="/projects"
                            onClick={handleProjectsNavigate}
                            className="flex-1 px-3 py-2 rounded-l transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)] flex items-center gap-2 focus:outline-none"
                        >
                            <FaProjectDiagram /> <span>Projects</span>
                        </a>
                        {/* Toggle button only expands/collapses */}
                        <button
                            type="button"
                            onClick={() => setOpen((o) => !o)}
                            aria-label={open ? 'Collapse projects list' : 'Expand projects list'}
                            className="px-2 py-2 rounded-r transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)] flex items-center"
                        >
                            <FaChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    {open && (
                        <ul className="space-y-1 ml-4 mt-1">
                            {(projectsData as any).projects.map((p: Project) => (
                                <li key={p.id}>
                                    <Link
                                        className="block px-3 py-1.5 rounded text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-solid)]/70 transition-colors"
                                        to={p.link}
                                    >
                                        {p.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
                <li>
                    <Link className="block px-3 py-2 rounded transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]" to="/contact">
                        <span className="inline-flex items-center gap-2"><FaEnvelopeOpenText /> Contact</span>
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

export default Sidebar;