import React from 'react';
import resume from '../data/RESUME.json';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} {resume.profile.name}. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;