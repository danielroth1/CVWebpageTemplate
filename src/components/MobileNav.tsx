import React from 'react';
import { Link } from 'react-router-dom';

const MobileNav: React.FC<{ isOpen: boolean; toggleNav: () => void }> = ({ isOpen, toggleNav }) => {
    return (
        <div className={`md:hidden fixed inset-0 bg-black/40 z-40 ${isOpen ? '' : 'hidden'}`}>
            <div className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg">
                <button onClick={toggleNav} className="absolute right-2 top-2 text-gray-600">✕</button>
                <nav className="p-4 mt-8 space-y-2">
                    <Link to="/" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Home</Link>
                    <Link to="/projects" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Projects</Link>
                    <Link to="/about" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">About</Link>
                    <Link to="/resume" onClick={toggleNav} className="block px-3 py-2 rounded hover:bg-gray-100">Resume</Link>
                </nav>
            </div>
        </div>
    );
};

export default MobileNav;