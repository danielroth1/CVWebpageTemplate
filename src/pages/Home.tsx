import React from 'react';
import { Link } from 'react-router-dom';
import ProjectList from '../components/ProjectList';
import resume from '../data/RESUME.json';
import personal_photo from '../data/personal_photo.jpg';
import Resume from '../components/Resume';
import AboutSection from '../components/AboutSection';

const Home: React.FC = () => {
    // Profile information now lives in RESUME.json
    const profile = (resume as any).profile as { name: string; title: string; skills: string[] } | undefined;
    const work = (resume as any).work as Array<{ startYear: string; endYear: string; position: string; company: string }> | undefined;
    const education = (resume as any).education as Array<{ startYear: string; endYear: string; position: string; company: string }> | undefined;
    const [showFullResume, setShowFullResume] = React.useState(true);
    return (
        <div className="max-w-6xl mx-auto">
            <header className="px-4 py-8 flex items-center gap-6">
                <img src={personal_photo} alt={`${profile?.name ?? 'Profile'} photo`} className="w-24 h-24 rounded-full object-cover shadow-sm" />
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{profile?.name}</h1>
                    <p className="text-gray-600">{profile?.title}</p>
                </div>
                <div className="px-4">
                    <button
                        type="button"
                        onClick={() => setShowFullResume((v) => !v)}
                        className="text-sm px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
                        aria-pressed={showFullResume}
                    >
                        {showFullResume ? 'Show overview' : 'Show full resume'}
                    </button>
                </div>
            </header>
            <>
            {/* Show About markdown at the beginning of the overview */}
            <section className="px-4 pb-10">
                <div className="mb-6">
                    <AboutSection showTitle={false} />
                </div>
            </section>
            {showFullResume && (
                <section className="px-4 pb-10">
                    {/* Render full Resume without title and without PDF preview on Home */}
                    <Resume showTitle={false} showPdfPreview={false} />
                </section>
            )}
            {!showFullResume && (
                <section className="px-4 pb-8">
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
                                    <li className="text-gray-500">Add your education in src/data/RESUME.json</li>
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
                                    <li className="text-gray-500">Add your work history in src/data/RESUME.json</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium">Skills</h3>
                            <p className="text-gray-700">{profile?.skills?.join(', ')}</p>
                        </div>
                    </div>
                </section>
            )}

                <section className="px-4 pb-10">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-semibold">Projects</h2>
                        <Link to="/projects" className="text-blue-600 text-sm hover:underline">View all</Link>
                    </div>
                    <ProjectList showMaxNumProjects={3}/>
                </section>
            </>
        </div>
    );
};

export default Home;