import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projectsData from '../data/projects.json';
import loadMarkdown, { getMarkdownAssetUrl } from '../utils/markdownLoader';
import loadCloc from '../utils/clocLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SkillBadge, { SkillBadgeMarkdown } from '../components/SkillBadge';
import { YouTubeEmbedMarkdown } from '../components/YouTubeEmbed';
import {
    DownloadButtonMarkdown,
    GithubButtonMarkdown,
    IconButtonMarkdown,
    LinkedInButtonMarkdown,
} from '../components/IconButton';
import {
    WindowsButtonMarkdown,
    MacosButtonMarkdown,
    LinuxButtonMarkdown,
} from '../components/IconButton';
import resolveMarkdownImage from '../utils/markdownImageResolver';
import CodeStats from '../components/CodeStats';
import clocLanguageMapping from '../data/cloc-mapping.json';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const project = projectsData.projects.find((p) => p.id === id);
    const skills = project?.skills ?? [];

    // Markdown components will be created later (after markdownUrl is defined)
    type MarkdownComponents = Parameters<typeof ReactMarkdown>[0]['components'];

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

    // Create markdown components after markdownUrl is known so image resolution can use it
    const markdownComponents: Parameters<typeof ReactMarkdown>[0]['components'] = React.useMemo(() => {
        const comp: any = {
            skill: SkillBadgeMarkdown,
            youtube: YouTubeEmbedMarkdown,
            btn: IconButtonMarkdown,
            github: GithubButtonMarkdown,
            linkedin: LinkedInButtonMarkdown,
            download: DownloadButtonMarkdown,
            windows: WindowsButtonMarkdown,
            macos: MacosButtonMarkdown,
            linux: LinuxButtonMarkdown,
            img: (props: any) => {
                const node = props.node as any;
                const srcAttr = props.src ?? node?.properties?.src;
                const alt = props.alt ?? node?.properties?.alt;
                const widthAttr = props.width ?? node?.properties?.width;
                const heightAttr = props.height ?? node?.properties?.height;
                const styleAttr = node?.properties?.style ?? props.style;

                const resolved = resolveMarkdownImage(markdownUrl, srcAttr as string | undefined) || srcAttr;

                const parseStyle = (s: string | undefined) => {
                    if (!s || typeof s !== 'string') return undefined;
                    return s.split(';').reduce((acc: Record<string, string>, part) => {
                        const [k, v] = part.split(':');
                        if (!k || !v) return acc;
                        const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                        acc[key] = v.trim();
                        return acc;
                    }, {} as Record<string, string>);
                };

                const parsedStyle = parseStyle(styleAttr);

                const normalizeSize = (val: any) => {
                    if (val == null) return undefined;
                    const asNum = Number(val);
                    if (!Number.isNaN(asNum) && String(val).trim() !== '') return `${asNum}px`;
                    return String(val);
                };

                const explicitWidth = normalizeSize(widthAttr ?? parsedStyle?.width);
                const explicitHeight = normalizeSize(heightAttr ?? parsedStyle?.height);
                console.log('explicitWidth, explicitHeight:', explicitWidth, explicitHeight);
                const hasExplicitSize = !!(explicitWidth || explicitHeight);

                const style: Record<string, any> = {
                    ...(parsedStyle as Record<string, any>),
                    ...(explicitWidth ? { width: explicitWidth } : {}),
                    ...(explicitHeight ? { height: explicitHeight } : {}),
                };

                const className = hasExplicitSize ? 'h-auto rounded-md' : 'max-w-full h-auto rounded-md';

                return <img src={resolved} alt={alt as string | undefined} className={className} style={style} />;
            },
        };
        return comp as unknown as Parameters<typeof ReactMarkdown>[0]['components'];
    }, [markdownUrl]);

    return (
    <div className="w-full px-4">
            {!project ? (
                <>
                    <p className="text-red-600">Project not found.</p>
                    <Link to="/projects" className="app-link hover:underline">Back to projects</Link>
                </>
            ) : (
                <>
            {/* Top-left back navigation */}
            <Link to="/projects" className="inline-block mb-4 app-link hover:underline">← Back to projects</Link>
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
                // Two-column layout: markdown on the left, LOC summary on the right
                <div className="max-w-none">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="prose prose-sm sm:prose lg:prose-lg flex-1 dark:prose-invert max-w-none markdown-wide">
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
                    <div className="mt-4">
                        <a
                            href={getMarkdownAssetUrl(markdownUrl) ?? markdownUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm app-link hover:underline"
                        >
                            Open source markdown ↗
                        </a>
                    </div>
                        </div>

                        <aside className="w-full lg:w-64 flex-shrink-0 ">
                            <CodeStats
                                clocData={cloc}
                                languageMapping={clocLanguageMapping as Record<string, string>}
                                overrides={project['cloc-mapping-overwrite']}
                                defaultCollapsed={false}
                            />
                        </aside>
                    </div>
                </div>
            ) : (
                <p className="text-[var(--color-text-muted)] mb-4">{project.description}</p>
            )}
            <div className="mt-6">
                <Link to="/projects" className="app-link hover:underline">← Back to projects</Link>
            </div>
                </>
            )}
        </div>
    );
};

export default ProjectDetail;