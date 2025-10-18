import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projectsData from '../data/projects.json';
import loadMarkdown, { getMarkdownAssetUrl } from '../utils/markdownLoader';
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
    const markdownUrl = project?.markdownUrl;

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
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
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