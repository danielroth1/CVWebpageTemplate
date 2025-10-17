import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaHome, FaProjectDiagram, FaUser, FaFileAlt } from 'react-icons/fa';

const Header: React.FC = () => {
    return (
        <header className="bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="text-lg font-semibold">My Personal CV</Link>
                <nav className="hidden md:block">
                    <ul className="flex items-center gap-4 text-sm">
                        <li>
                            <NavLink className={({isActive}) => `hover:underline inline-flex items-center gap-2 ${isActive ? 'font-semibold' : ''}`} to="/">
                                <FaHome /> <span>Home</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className={({isActive}) => `hover:underline inline-flex items-center gap-2 ${isActive ? 'font-semibold' : ''}`} to="/projects">
                                <FaProjectDiagram /> <span>Projects</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className={({isActive}) => `hover:underline inline-flex items-center gap-2 ${isActive ? 'font-semibold' : ''}`} to="/about">
                                <FaUser /> <span>About</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className={({isActive}) => `hover:underline inline-flex items-center gap-2 ${isActive ? 'font-semibold' : ''}`} to="/resume">
                                <FaFileAlt /> <span>Resume</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;