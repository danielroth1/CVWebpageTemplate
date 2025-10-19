import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projectsData from '../data/projects.json';
import loadMarkdown, { getMarkdownAssetUrl } from '../utils/markdownLoader';
import loadCloc from '../utils/clocLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SkillBadge, { SkillBadgeMarkdown } from '../components/SkillBadge';
import {
    DownloadButtonMarkdown,
    GithubButtonMarkdown,
    IconButtonMarkdown,
    LinkedInButtonMarkdown,
} from '../components/IconButton';
import CodeStats from '../components/CodeStats';
import clocLanguageMapping from '../data/cloc-mapping.json';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const project = projectsData.projects.find((p) => p.id === id);
    const skills = project?.skills ?? [];

    type MarkdownComponents = Parameters<typeof ReactMarkdown>[0]['components'];

    const markdownComponents = React.useMemo(
        () =>
            ({
                skill: SkillBadgeMarkdown,
                // generic button wrapper: <btn kind="github|linkedin|download" href="...">Text</btn>
                btn: IconButtonMarkdown,
                // convenience tags
                github: GithubButtonMarkdown,
                linkedin: LinkedInButtonMarkdown,
                download: DownloadButtonMarkdown,
            } as unknown as MarkdownComponents),
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
        <div className="max-w-6xl mx-auto px-4">
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
                            <CodeStats
                                clocData={cloc}
                                languageMapping={clocLanguageMapping as Record<string, string>}
                                overrides={project['cloc-mapping-overwrite']}
                            />
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