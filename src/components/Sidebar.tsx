import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaProjectDiagram, FaUser, FaFileAlt } from 'react-icons/fa';
import projectsData from '../data/projects.json';
import type { Project } from '../types';

const Sidebar: React.FC = () => {
    return (
        <nav className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--color-text)] dark:text-[var(--color-text)] opacity-80">Navigation</h2>
            <ul className="space-y-2 mb-6">
                <li>
                    <Link className="block px-3 py-2 rounded transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]" to="/">
                        <span className="inline-flex items-center gap-2"><FaHome /> Home</span>
                    </Link>
                </li>
                <li>
                    <Link className="block px-3 py-2 rounded transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]" to="/projects">
                        <span className="inline-flex items-center gap-2"><FaProjectDiagram /> Projects</span>
                    </Link>
                </li>
                <li>
                    <Link className="block px-3 py-2 rounded transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]" to="/about">
                        <span className="inline-flex items-center gap-2"><FaUser /> About</span>
                    </Link>
                </li>
                <li>
                    <Link className="block px-3 py-2 rounded transition-colors hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]" to="/resume">
                        <span className="inline-flex items-center gap-2"><FaFileAlt /> Resume</span>
                    </Link>
                </li>
            </ul>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--color-text)] opacity-80">
                <Link to="/projects" className="hover:underline app-link">Projects</Link>
            </h3>
            <ul className="space-y-1">
                {(projectsData as any).projects.map((p: Project) => (
                    <li key={p.id}>
                        <Link className="block px-3 py-1.5 rounded text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-solid)]/70 transition-colors" to={p.link}>{p.title}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Sidebar;