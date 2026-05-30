import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaProjectDiagram, FaChevronDown, FaEnvelopeOpenText, FaBook } from 'react-icons/fa';
import projectsData from '../data/projects.json';
import { projectDocsList } from '../utils/docsLoader';
import type { Project } from '../types';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = React.useState<boolean>(false);
    const [openDocs, setOpenDocs] = React.useState<Set<string>>(new Set());

    // Auto-open if currently on a project route including root /projects
    React.useEffect(() => {
        if (/^\/projects(\/|$)/.test(location.pathname)) {
            setOpen(true);
        }
    }, [location.pathname]);

    // Auto-open the matching docs section when navigating to a docs route
    React.useEffect(() => {
        projectDocsList.forEach((config) => {
            if (location.pathname.startsWith(`/${config.route}`)) {
                setOpenDocs((prev) => {
                    const next = new Set(prev);
                    next.add(config.route);
                    return next;
                });
            }
        });
    }, [location.pathname]);

    const handleProjectsNavigate = (e: React.MouseEvent) => {
        e.preventDefault();
        // Navigate to /projects and ensure open
        navigate('/projects');
        setOpen(true);
    };

    const active = 'bg-primary-200 dark:bg-primary-700 font-semibold';
    const base = 'transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]';

    const isHome = location.pathname === '/';
    const isProjects = location.pathname.startsWith('/projects');
    const isContact = location.pathname === '/contact';

    return (
        <nav className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--color-text)] dark:text-[var(--color-text)] opacity-80">Navigation</h2>
            <ul className="space-y-2 mb-1">
                <li>
                    <Link className={`block px-3 py-2 rounded ${base} ${isHome ? active : ''}`} to="/">
                        <span className="inline-flex items-center gap-2"><FaHome /> Home</span>
                    </Link>
                </li>
                {/* Project documentation sections */}
                {projectDocsList.map((config) => {
                    const isDocActive = location.pathname.startsWith(`/${config.route}`);
                    const isDocOpen = openDocs.has(config.route);
                    return (
                        <li key={config.route}>
                            <div className={`flex items-stretch rounded ${isDocActive ? active : ''}`}>
                                <Link
                                    to={`/${config.route}`}
                                    className={`flex-1 px-3 py-2 rounded-l ${base} flex items-center gap-2 focus:outline-none`}
                                >
                                    <FaBook /> <span>{config.title}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setOpenDocs((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(config.route)) next.delete(config.route);
                                        else next.add(config.route);
                                        return next;
                                    })}
                                    aria-label={isDocOpen ? `Collapse ${config.title}` : `Expand ${config.title}`}
                                    className={`px-2 py-2 rounded-r ${base} flex items-center`}
                                >
                                    <FaChevronDown className={`transition-transform ${isDocOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            {isDocOpen && (
                                <ul className="space-y-1 ml-4 mt-1">
                                    {config.entries.map((entry) => {
                                        const isActivePage = location.pathname === `/${config.route}/${entry.slug}`;
                                        return (
                                            <li key={entry.slug} style={{ paddingLeft: `${(entry.level - 1) * 0.75}rem` }}>
                                                <Link
                                                    className={`flex items-baseline gap-1.5 px-3 py-1.5 rounded text-sm ${base} ${isActivePage ? active : ''}`}
                                                    to={`/${config.route}/${entry.slug}`}
                                                >
                                                    <span className="font-mono text-xs opacity-60 shrink-0">{entry.number}</span>
                                                    <span className={entry.level === 1 ? 'font-medium' : ''}>{entry.title}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </li>
                    );
                })}
                <li>
                    <div className={`flex items-stretch rounded ${isProjects ? active : ''}`}>
                        {/* Navigation link */}
                        <a
                            href="/projects"
                            onClick={handleProjectsNavigate}
                            className={`flex-1 px-3 py-2 rounded-l ${base} flex items-center gap-2 focus:outline-none`}
                        >
                            <FaProjectDiagram /> <span>Projects</span>
                        </a>
                        {/* Toggle button only expands/collapses */}
                        <button
                            type="button"
                            onClick={() => setOpen((o) => !o)}
                            aria-label={open ? 'Collapse projects list' : 'Expand projects list'}
                            className={`px-2 py-2 rounded-r ${base} flex items-center`}
                        >
                            <FaChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    {open && (
                        <ul className="space-y-1 ml-4 mt-1">
                            {(projectsData as any).projects.map((p: Project) => {
                                const isActivePage = location.pathname === p.link;
                                return (
                                    <li key={p.id}>
                                        <Link
                                            className={`block px-3 py-1.5 rounded text-sm ${base} ${isActivePage ? active : ''}`}
                                            to={p.link}
                                        >
                                            {p.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </li>
                <li>
                    <Link className={`block px-3 py-2 rounded ${base} ${isContact ? active : ''}`} to="/contact">
                        <span className="inline-flex items-center gap-2"><FaEnvelopeOpenText /> Contact</span>
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

export default Sidebar;