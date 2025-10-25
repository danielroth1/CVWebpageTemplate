import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projectsData from '../data/projects.json';
import loadMarkdown, { getMarkdownAssetUrl } from '../utils/markdownLoader';
import loadCloc from '../utils/clocLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SkillBadge from '../components/SkillBadge';
import { useMarkdownComponents } from '../utils/markdownComponents';
import CodeStats from '../components/CodeStats';
import clocLanguageMapping from '../data/cloc-mapping.json';
import useWindowSize from '../hooks/useWindowSize';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const project = projectsData.projects.find((p) => p.id === id);
    const skills = project?.skills ?? [];

    // Determine next/previous projects based on the ordering in projects.json
    const { prevProject, nextProject } = React.useMemo(() => {
        if (!project) return { prevProject: null as any, nextProject: null as any };
        const list = projectsData.projects;
        const idx = list.findIndex((p) => p.id === project.id);
        const prev = idx > 0 ? list[idx - 1] : null;
        const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
        return { prevProject: prev, nextProject: next };
    }, [project]);

    // Shared markdown components mapping

    const [md, setMd] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(false);
    const [cloc, setCloc] = React.useState<any | null>(null);
    const markdownUrl = project?.markdownUrl;
    // derive cloc.json path from markdown or project folder: expect cloc at src/data/projects/<Folder>/cloc.json
    const clocUrl = React.useMemo(() => {
        if (!project?.markdownUrl) return undefined;
        // markdownUrl is like 'src/data/projects/CAE/README.md' => replace README.md with cloc.json
        return project.markdownUrl.replace(/README\.md$/i, 'cloc.json');
    }, [project]);

    // Scroll to top whenever this detail page mounts or the project id changes
    React.useEffect(() => {
        try {
            // Modern browsers
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        } catch (e) {
            // Fallback for older browsers
            window.scrollTo(0, 0);
        }
    }, [id]);

    React.useEffect(() => {
        let mounted = true;
        async function run() {
            if (!markdownUrl) return;
            setLoading(true);
            const text = await loadMarkdown(markdownUrl);
            if (mounted) {
                setMd(text);
                setLoading(false);
            }
        }
        run();
        return () => {
            mounted = false;
        };
    }, [markdownUrl]);

    React.useEffect(() => {
        let mounted = true;
        async function run() {
            if (!clocUrl) return;
            const data = await loadCloc(clocUrl);
            if (mounted) setCloc(data);
        }
        run();
        return () => {
            mounted = false;
        };
    }, [clocUrl]);

    const markdownComponents = useMarkdownComponents(markdownUrl || '');

    // Match AllCodeStats behavior: collapsed on small screens, expanded on lg
    const { width } = useWindowSize();
    const isLg = width >= 1024;

    return (
        <div className="p-4 lg:px-8 pb-2 mt-6 max-w-6xl content-center mx-auto">
            {!project ? (
                <>
                    <p className="text-red-600">Project not found.</p>
                    <Link to="/projects" className="app-link hover:underline">Back to all projects</Link>
                </>
            ) : (
                <>
                    {/* Top navigation: Previous / Next controls */}
                    <div className="mb-4 flex items-center justify-between gap-3">
                        {prevProject ? (
                            <Link
                                to={prevProject.link}
                                className="btn-base btn-brand"
                                aria-label={`Go to previous project: ${prevProject.title}`}
                            >
                                ← previous project
                            </Link>
                        ) : (
                            <span className="btn-base opacity-50 pointer-events-none select-none" aria-disabled="true">← previous project</span>
                        )}

                        {nextProject ? (
                            <Link
                                to={nextProject.link}
                                className="btn-base btn-brand"
                                aria-label={`Go to next project: ${nextProject.title}`}
                            >
                                next project →
                            </Link>
                        ) : (
                            <span className="btn-base opacity-50 pointer-events-none select-none" aria-disabled="true">next project →</span>
                        )}
                    </div>

                    {/* Distinct small back link to all projects to avoid confusion with prev/next buttons */}
                    <Link to="/projects" className="inline-block mb-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-accent)]">← Back to all projects</Link>
                    <h1 className="text-2xl font-bold mb-3 text-[var(--color-text)]">{project.title}</h1>

                    {skills.length ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <SkillBadge key={skill}>{skill}</SkillBadge>
                            ))}
                        </div>
                    ) : null}

                    {/* Fallback to plain description while markdown loads or if none provided */}
                    {markdownUrl ? (
                        // Two-column layout on large screens; on small, CodeStats appears first below the title
                        <div className="" >
                            <div className="flex flex-col lg:flex-row items-center gap-6">
                                <aside className="order-1 lg:order-2 flex justify-center lg:justify-start flex-shrink-0 lg:self-start lg:sticky lg:top-4">
                                    <CodeStats
                                        clocData={cloc}
                                        languageMapping={clocLanguageMapping as Record<string, string>}
                                        overrides={project['cloc-mapping-overwrite']}
                                        defaultCollapsed={!isLg}
                                    />
                                </aside>

                                <div className="order-2 lg:order-1 prose prose-sm sm:prose lg:prose-lg flex-1 dark:prose-invert markdown-wide">
                                    {loading && <p className="text-[var(--color-text-muted)]">Loading details…</p>}
                                    {!loading && md && (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={markdownComponents}
                                        >
                                            {md}
                                        </ReactMarkdown>
                                    )}
                                    {!loading && !md && (
                                        <p className="text-[var(--color-text-muted)]">{project.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[var(--color-text-muted)] mb-4">{project.description}</p>
                    )}
                    <div className="mt-6">
                        <Link to="/projects" className="app-link hover:underline">← Back to all projects</Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProjectDetail;