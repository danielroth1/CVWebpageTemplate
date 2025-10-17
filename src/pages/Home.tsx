import React from 'react';
import { Link } from 'react-router-dom';
import ProjectList from '../components/ProjectList';
import cv from '../data/cv.json';
import personal_photo from '../data/personal_photo.jpg';

const Home: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <header className="px-4 py-8 flex items-center gap-6">
                <img src={personal_photo} alt={`${cv.name} photo`} className="w-24 h-24 rounded-full object-cover shadow-sm" />
                <div>
                    <h1 className="text-3xl font-bold">{cv.name}</h1>
                    <p className="text-gray-600">{cv.title}</p>
                </div>
            </header>

            <section className="px-4 pb-8">
                <h2 className="text-xl font-semibold mb-2">Overview</h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <h3 className="font-medium">Education</h3>
                        <ul className="list-disc list-inside text-gray-700">
                            {cv.education.map((e, i) => (
                                <li key={i}>{e.degree} — {e.school} ({e.period})</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-medium">Work</h3>
                        <ul className="list-disc list-inside text-gray-700">
                            {cv.workHistory.map((w, i) => (
                                <li key={i}>{w.role} — {w.company} ({w.period})</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-medium">Skills</h3>
                        <p className="text-gray-700">{cv.skills.join(', ')}</p>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Projects</h2>
                    <Link to="/projects" className="text-blue-600 text-sm hover:underline">View all</Link>
                </div>
                <ProjectList />
            </section>
        </div>
    );
};

export default Home;