import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="text-lg font-semibold">My Personal CV</Link>
                <nav className="hidden md:block">
                    <ul className="flex items-center gap-4 text-sm">
                        <li><Link className="hover:underline" to="/">Home</Link></li>
                        <li><Link className="hover:underline" to="/projects">Projects</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;