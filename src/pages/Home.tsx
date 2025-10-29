import React from 'react';
import { Link } from 'react-router-dom';
import ProjectList from '../components/ProjectList';
import AllCodeStats from '../components/AllCodeStats';
import resume from '../data/resume.json';
import personal_photo from '../data/personal_photo.jpg';
import Resume from '../components/Resume';
import AboutSection from '../components/AboutSection';

const Home: React.FC = () => {
    // Profile information now lives in resume.json
    const profile = (resume as any).profile as { name: string; title: string; skills: string[] } | undefined;
    const work = (resume as any).work as Array<{ startYear: string; endYear: string; position: string; company: string }> | undefined;
    const education = (resume as any).education as Array<{ startYear: string; endYear: string; position: string; company: string }> | undefined;
    const showFullResume = true; // overview toggle removed
    // Project filters now handled internally by ProjectList; no local state needed
    return (
        <div className="mx-auto">
            {/* Overview toggle removed for streamlined UI */}
            <>
            {/* Show About markdown at the beginning of the overview */}
            <section className="px-4 lg:px-8 pb-2 mt-6 max-w-6xl content-center mx-auto">
                <AboutSection showTitle={false} />
            </section>
            {showFullResume && (
                <section className="px-4 lg:px-8 pb-2 mt-6 max-w-6xl content-center mx-auto">
                    {/* Render full Resume without title and without PDF preview on Home */}
                    <Resume showTitle={false} showPdfPreview={false} />
                </section>
            )}
            {!showFullResume && (
                <section className="px-4 lg:px-8 pb-6 mt-6 max-w-6xl content-center mx-auto">
                    <h2 className="text-xl font-semibold mb-2">Overview</h2>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <h3 className="font-medium">Education</h3>
                            <ul className="list-disc list-inside text-gray-700">
                                {education?.length ? (
                                    education.map((e, i) => (
                                        <li key={i}>
                                            {e.position} — {e.company} ({e.startYear} – {e.endYear})
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500">Add your education in src/data/resume.json</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium">Work</h3>
                            <ul className="list-disc list-inside text-gray-700">
                                {work?.length ? (
                                    work.map((w, i) => (
                                        <li key={i}>
                                            {w.position} — {w.company} ({w.startYear} – {w.endYear})
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500">Add your work history in src/data/resume.json</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium">Tech Stack</h3>
                            <p className="text-gray-700">{profile?.skills?.join(', ')}</p>
                        </div>
                    </div>
                </section>
            )}

                <section className="px-4 lg:px-8 pb-2 mt-10 mt-4 max-w-6xl content-center mx-auto">
                    {/* Projects section tightened with a max-width container */}
                    <div className="max-w-6xl space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h2 className="text-xl font-semibold">My Projects</h2>
                            <Link
                                to="/projects"
                                className="ml-auto text-sm text-[var(--color-text)] opacity-80 hover:opacity-100 underline underline-offset-4"
                            >
                                Explore all projects →
                            </Link>
                        </div>
                        {/* Project cards grid */}
                        <ProjectList showMaxNumProjects={3} showFilterBar={false} />
                    </div>
                </section>
            </>
        </div>
    );
};

export default Home;