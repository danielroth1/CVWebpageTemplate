import React from 'react';
import resume from '../data/resume.json';
import legal from '../data/legal.json';

const Footer: React.FC = () => {
    // Collect available legal links from JSON (omit if not provided)
    const links: { label: string; href: string }[] = [];
    if ((legal as any)?.dataSecurity) {
        links.push({ label: 'Data Security', href: (legal as any).dataSecurity });
    }
    if ((legal as any)?.legalNotice) {
        links.push({ label: 'Legal Notice', href: (legal as any).legalNotice });
    }

    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm">
                <p className="space-x-0">
                    <span>&copy; {new Date().getFullYear()} {resume.profile.name}. All rights reserved</span>
                    {links.length > 0 && <span> | </span>}
                    {links.map((link, idx) => (
                        <span key={link.label}>
                            <a
                                href={link.href}
                                className="text-gray-400 hover:text-gray-200 underline underline-offset-2"
                            >
                                {link.label}
                            </a>
                            {idx < links.length - 1 && <span> | </span>}
                        </span>
                    ))}
                </p>
            </div>
        </footer>
    );
};

export default Footer;