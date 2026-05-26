import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projectsData from '../data/projects.json';
import loadMarkdown from '../utils/markdownLoader';
import { loadAndConvertAdoc } from '../utils/asciidocLoader';
import loadCloc from '../utils/clocLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SkillBadge from '../components/SkillBadge';
import { useMarkdownComponents } from '../utils/markdownComponents';
import { useEnsureImageViewerClass } from '../utils/imageViewerRenderers';
import AsciidocRenderer from '../utils/asciidocRenderer';
import CodeStats from '../components/CodeStats';
import clocLanguageMapping from '../data/cloc-mapping.json';
import useWindowSize from '../hooks/useWindowSize';
import { getProjectDateDisplay } from '../utils/dates';
import type { Project, ProjectsData } from '../types';

const isAdoc = (url?: string) => /\.adoc$/i.test(url ?? '');

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const projectList = (projectsData as ProjectsData).projects;
    const project = projectList.find((projectEntry: Project) => projectEntry.id === id);
    const skills = project?.skills ?? [];
    const dateDisplay = project ? getProjectDateDisplay(project) : null;

    // Determine next/previous projects based on the ordering in projects.json
    const { prevProject, nextProject } = React.useMemo(() => {
        if (!project) {
            return { prevProject: null as Project | null, nextProject: null as Project | null };
        }
        const idx = projectList.findIndex((projectEntry: Project) => projectEntry.id === project.id);
        const prev = idx > 0 ? projectList[idx - 1] : null;
        const next = idx >= 0 && idx < projectList.length - 1 ? projectList[idx + 1] : null;
        return { prevProject: prev, nextProject: next };
    }, [project, projectList]);

    const [md, setMd] = React.useState<string>('');
    const [adocHtml, setAdocHtml] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(false);
    const [cloc, setCloc] = React.useState<any | null>(null);
    const docUrl = project?.docUrl || project?.markdownUrl;
    const docIsAdoc = isAdoc(docUrl);
    const clocUrl = React.useMemo(() => {
        if (!docUrl) return undefined;
        return docUrl.replace(/README\.(md|adoc|asciidoc)$/i, 'cloc.json');
    }, [docUrl]);

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
            if (!docUrl) return;
            setLoading(true);
            if (docIsAdoc) {
                const html = await loadAndConvertAdoc(docUrl);
                if (mounted) { setAdocHtml(html); setLoading(false); }
            } else {
                const text = await loadMarkdown(docUrl);
                if (mounted) { setMd(text); setLoading(false); }
            }
        }
        run();
        return () => { mounted = false; };
    }, [docUrl, docIsAdoc]);

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

    const markdownComponents = useMarkdownComponents(docUrl || '');
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    useEnsureImageViewerClass(contentRef);

    // Match AllCodeStats behavior: collapsed on small screens, expanded on lg
    const { width } = useWindowSize();
    const isLg = width >= 1024;

    return (
        <div className="px-4 lg:px-8 pb-2 mt-2 lg:mt-6 max-w-6xl content-center mx-auto">
            {!project ? (
                <>
                    <p className="text-red-600">Project not found.</p>
                    <Link to="/projects" className="app-link hover:underline">Back to all projects</Link>
                </>
            ) : (
                <>
                    {/* Top navigation: Previous / Next controls */}
                    <div className="mb-4 top-12 z-40 sticky lg:relative md:top-0 flex items-center justify-between gap-3">
                        {prevProject ? (
                            <Link
                                to={prevProject.link}
                                className="btn-base btn-brand btn-solid btn-equal"
                                aria-label={`Go to previous project: ${prevProject.title}`}
                            >
                                ← previous
                            </Link>
                        ) : (
                            <span className="btn-base btn-disabled btn-equal pointer-events-none select-none" aria-disabled="true">← previous</span>
                        )}

                        {nextProject ? (
                            <Link
                                to={nextProject.link}
                                className="btn-base btn-brand btn-solid btn-equal"
                                aria-label={`Go to next project: ${nextProject.title}`}
                            >
                                next →
                            </Link>
                        ) : (
                            <span className="btn-base btn-disabled btn-equal pointer-events-none select-none" aria-disabled="true">next →</span>
                        )}
                    </div>

                    {/* Distinct small back link to all projects to avoid confusion with prev/next buttons */}
                    <Link to="/projects" className="inline-block mb-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-accent)]">← Back to all projects</Link>
                    <h1 className="text-2xl font-bold mb-1 text-[var(--color-text)]">{project.title}</h1>
                    {dateDisplay && (
                        <div className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">{dateDisplay}</div>
                    )}

                    {skills.length ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {skills.map((skill: string) => (
                                <SkillBadge key={skill}>{skill}</SkillBadge>
                            ))}
                        </div>
                    ) : null}

                    {/* Fallback to plain description while markdown loads or if none provided */}
                    {docUrl ? (
                        // Two-column layout on large screens; on small, CodeStats appears first below the title
                        <div className="" >
                            <div className="flex flex-col lg:flex-row items-center gap-6">
                                <aside className="order-1 lg:order-2 flex justify-center lg:justify-start flex-shrink-0 lg:self-start lg:sticky lg:top-4">
                                    <CodeStats
                                        clocData={cloc}
                                        languageMapping={clocLanguageMapping as Record<string, string>}
                                        overrides={(project as any)['cloc-mapping-overwrite'] as Record<string, string>}
                                        defaultCollapsed={!isLg}
                                    />
                                </aside>

                                <div
                                    ref={contentRef}
                                    className="order-2 lg:order-1 prose prose-sm sm:prose lg:prose-lg flex-1 dark:prose-invert markdown-wide max-w-full overflow-hidden"
                                >
                                    {loading && <p className="text-[var(--color-text-muted)]">Loading details…</p>}
                                    {!loading && docIsAdoc && adocHtml && (
                                        <AsciidocRenderer
                                            html={adocHtml}
                                            originPath={docUrl}
                                            className="adoc-content"
                                        />
                                    )}
                                    {!loading && !docIsAdoc && md && (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={markdownComponents}
                                        >
                                            {md}
                                        </ReactMarkdown>
                                    )}
                                    {!loading && !(docIsAdoc ? adocHtml : md) && (
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