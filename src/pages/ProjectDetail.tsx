import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projects from '../data/projects.json';
import loadMarkdown, { getMarkdownAssetUrl } from '../utils/markdownLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const project = projects.find((p) => p.id === id);

    const [md, setMd] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(false);
    const markdownUrl = project?.markdownUrl;

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
            <h1 className="text-2xl font-bold mb-4">{project.title}</h1>

            {/* Fallback to plain description while markdown loads or if none provided */}
            {markdownUrl ? (
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                    {loading && <p className="text-gray-500">Loading details…</p>}
                    {!loading && md && (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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