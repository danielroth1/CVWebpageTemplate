import React from 'react';
import { Link } from 'react-router-dom';
import projects from '../data/projects.json';

const Sidebar: React.FC = () => {
    return (
        <nav className="p-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Navigation</h2>
            <ul className="space-y-2 mb-6">
                <li>
                    <Link className="block px-3 py-2 rounded hover:bg-gray-200" to="/">Home</Link>
                </li>
                <li>
                    <Link className="block px-3 py-2 rounded hover:bg-gray-200" to="/projects">Projects</Link>
                </li>
            </ul>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Projects</h3>
            <ul className="space-y-1">
                {projects.map(p => (
                    <li key={p.id}>
                        <Link className="block px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-200" to={p.link}>{p.title}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Sidebar;