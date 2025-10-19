import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projectsData from '../data/projects.json';
import loadMarkdown, { getMarkdownAssetUrl } from '../utils/markdownLoader';
import loadCloc from '../utils/clocLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SkillBadge, { SkillBadgeMarkdown } from '../components/SkillBadge';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const project = projectsData.projects.find((p) => p.id === id);
    const skills = project?.skills ?? [];

    type MarkdownComponents = Parameters<typeof ReactMarkdown>[0]['components'];

    const markdownComponents = React.useMemo(
        () => ({ skill: SkillBadgeMarkdown } as unknown as MarkdownComponents),
        [],
    );

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

    return (
        <div className="max-w-3xl mx-auto px-4">
            {!project ? (
                <>
                    <p className="text-red-600">Project not found.</p>
                    <Link to="/projects" className="text-blue-600 hover:underline">Back to projects</Link>
                </>
            ) : (
                <>
            <h1 className="text-2xl font-bold mb-3">{project.title}</h1>

            {skills.length ? (
                <div className="mb-4 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <SkillBadge key={skill}>{skill}</SkillBadge>
                    ))}
                </div>
            ) : null}

            {/* Fallback to plain description while markdown loads or if none provided */}
            {markdownUrl ? (
                // Two-column layout: markdown on the left, LOC summary on the right
                <div className="max-w-none">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="prose prose-sm sm:prose lg:prose-lg flex-1">
                    {loading && <p className="text-gray-500">Loading details…</p>}
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
                        <p className="text-gray-700">{project.description}</p>
                    )}
                    <div className="mt-4">
                        <a
                            href={getMarkdownAssetUrl(markdownUrl) ?? markdownUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Open source markdown ↗
                        </a>
                    </div>
                        </div>

                        <aside className="w-full lg:w-64 flex-shrink-0">
                            <div className="border border-gray-200 rounded p-4 bg-gray-50">
                                <h3 className="text-sm font-semibold mb-2">Code stats</h3>
                                {cloc ? (
                                    (() => {
                                        // Prefer summary.total or raw.SUM
                                        const total = cloc.summary?.total ?? cloc.raw?.SUM ?? null;
                                        const langs = cloc.summary?.languages ?? null;
                                        return (
                                            <div className="text-sm text-gray-800">
                                                {total ? (
                                                    <div className="mb-3 space-y-2">
                                                        <div className="flex justify-between">
                                                            <div className="text-xs text-gray-700">Files:</div>
                                                            <div className="text-xs font-mono"><strong>{total.nFiles ?? total.nFiles ?? total.nFiles}</strong></div>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <div className="text-xs text-gray-700">Total lines of code:</div>
                                                            <div className="text-xs font-mono"><strong className="text-xs font-mono">{total.code ?? total.code ?? total.code}</strong></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mb-3">No total summary available</div>
                                                )}
                                                {langs && Array.isArray(langs) ? (
                                                    <>
                                                        {/* separator between total summary and per-language list */}
                                                        <div className="my-2 border-t border-gray-200" />
                                                        <div className="space-y-2 max-h-48 overflow-auto">
                                                            {langs.map((l: any) => (
                                                                <div key={l.language} className="flex justify-between">
                                                                    <div className="text-xs text-gray-700">{l.language}</div>
                                                                    <div className="text-xs font-mono">{l.code}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="text-sm text-gray-600">No LOC data</div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            ) : (
                <p className="text-gray-700 mb-4">{project.description}</p>
            )}
            <div className="mt-6">
                <Link to="/projects" className="text-blue-600 hover:underline">← Back to projects</Link>
            </div>
                </>
            )}
        </div>
    );
};

export default ProjectDetail;