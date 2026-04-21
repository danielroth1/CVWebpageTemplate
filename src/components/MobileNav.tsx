import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import { erpDocsToc } from '../utils/erpDocs';

const MobileNav: React.FC<{ isOpen: boolean; toggleNav: () => void }> = ({ isOpen, toggleNav }) => {
    const [erpOpen, setErpOpen] = React.useState(false);

    return (
        <div className={`md:hidden fixed inset-0 bg-black/40 z-40 ${isOpen ? '' : 'hidden'}`}>
            <div className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg overflow-y-auto">
                <button onClick={toggleNav} className="absolute right-2 top-2 text-gray-600">✕</button>
                <nav className="p-4 mt-8 space-y-2">
                    <Link to="/" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Home</Link>
                    {/* ERP Documentation expandable */}
                    <div>
                        <div className="flex items-stretch">
                            <Link
                                to="/erp-docs"
                                onClick={toggleNav}
                                className="flex-1 px-3 py-2 rounded-l hover:bg-gray-100"
                            >
                                ERP Documentation
                            </Link>
                            <button
                                type="button"
                                onClick={() => setErpOpen((o) => !o)}
                                aria-label={erpOpen ? 'Collapse ERP docs' : 'Expand ERP docs'}
                                className="px-2 py-2 rounded-r hover:bg-gray-100 flex items-center"
                            >
                                <FaChevronDown className={`transition-transform ${erpOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        {erpOpen && (
                            <ul className="ml-4 mt-1 space-y-1">
                                {erpDocsToc.map((entry) => (
                                    <li key={entry.slug} style={{ paddingLeft: `${(entry.level - 1) * 0.75}rem` }}>
                                        <Link
                                            to={`/erp-docs/${entry.slug}`}
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
                    <Link to="/projects" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Projects</Link>
                    <Link to="/about" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">About</Link>
                    <Link to="/resume" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Resume</Link>
                </nav>
            </div>
        </div>
    );
};

export default MobileNav;