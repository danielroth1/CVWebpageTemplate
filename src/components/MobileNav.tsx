import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import { projectDocsList } from '../utils/docsLoader';

const MobileNav: React.FC<{ isOpen: boolean; toggleNav: () => void }> = ({ isOpen, toggleNav }) => {
    const [openDocs, setOpenDocs] = React.useState<Set<string>>(new Set());

    return (
        <div className={`md:hidden fixed inset-0 bg-black/40 z-40 ${isOpen ? '' : 'hidden'}`}>
            <div className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg overflow-y-auto">
                <button onClick={toggleNav} className="absolute right-2 top-2 text-gray-600">✕</button>
                <nav className="p-4 mt-8 space-y-2">
                    <Link to="/" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Home</Link>
                    {/* Project documentation sections */}
                    {projectDocsList.map((config) => {
                        const isDocOpen = openDocs.has(config.route);
                        return (
                            <div key={config.route}>
                                <div className="flex items-stretch">
                                    <Link
                                        to={`/${config.route}`}
                                        onClick={toggleNav}
                                        className="flex-1 px-3 py-2 rounded-l hover:bg-gray-100"
                                    >
                                        {config.title}
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
                                        className="px-2 py-2 rounded-r hover:bg-gray-100 flex items-center"
                                    >
                                        <FaChevronDown className={`transition-transform ${isDocOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                                {isDocOpen && (
                                    <ul className="ml-4 mt-1 space-y-1">
                                        {config.entries.map((entry) => (
                                            <li key={entry.slug} style={{ paddingLeft: `${(entry.level - 1) * 0.75}rem` }}>
                                                <Link
                                                    to={`/${config.route}/${entry.slug}`}
                                                    onClick={toggleNav}
                                                    className="flex items-baseline gap-1.5 px-3 py-1.5 rounded text-sm hover:bg-gray-100"
                                                >
                                                    <span className="font-mono text-xs opacity-60 shrink-0">{entry.number}</span>
                                                    <span className={entry.level === 1 ? 'font-medium' : ''}>{entry.title}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                    <Link to="/projects" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Projects</Link>
                    <Link to="/about" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">About</Link>
                    <Link to="/resume" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Resume</Link>
                </nav>
            </div>
        </div>
    );
};

export default MobileNav;