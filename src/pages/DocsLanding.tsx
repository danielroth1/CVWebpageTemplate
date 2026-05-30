import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { DocsConfig, DocEntryWithNumber } from '../utils/docsLoader';
import loadMarkdown from '../utils/markdownLoader';
import { useMarkdownComponents } from '../utils/markdownComponents';
import loadAndConvertAdoc from '../utils/asciidocLoader';
import AsciidocRenderer from '../utils/asciidocRenderer';

const DocsLanding: React.FC<{ config: DocsConfig }> = ({ config }) => {
    const [content, setContent] = React.useState<string>('');
    const [adocHtml, setAdocHtml] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(true);
    const isAdoc = config.landing_page.endsWith('.adoc');

    React.useEffect(() => {
        let mounted = true;
        setLoading(true);
        if (isAdoc) {
            loadAndConvertAdoc(config.landing_page).then((html) => {
                if (mounted) { setAdocHtml(html); setLoading(false); }
            });
        } else {
            loadMarkdown(config.landing_page).then((text) => {
                if (mounted) { setContent(text); setLoading(false); }
            });
        }
        return () => { mounted = false; };
    }, [config.landing_page, isAdoc]);

    const markdownComponents = useMarkdownComponents(config.landing_page);

    return (
        <div className="px-4 lg:px-8 pb-8 mt-2 lg:mt-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-[var(--color-text)]">{config.title}</h1>

            {loading && <p className="text-[var(--color-text)] opacity-60">Loading…</p>}

            {!loading && isAdoc && adocHtml && (
                <div className="text-[var(--color-text)] opacity-80 mb-8 text-lg prose prose-neutral dark:prose-invert max-w-none">
                    <AsciidocRenderer html={adocHtml} originPath={config.landing_page} className="adoc-content" />
                </div>
            )}

            {!loading && !isAdoc && content && (
                <div className="text-[var(--color-text)] opacity-80 mb-8 text-lg prose prose-neutral dark:prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            )}

            <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">Table of Contents</h2>
            <nav aria-label="Table of contents">
                <ol className="space-y-1">
                    {config.entries.map((entry: DocEntryWithNumber) => (
                        <li
                            key={entry.slug}
                            style={{ paddingLeft: `${(entry.level - 1) * 1.5}rem` }}
                        >
                            <Link
                                to={`/${config.route}/${entry.slug}`}
                                className="inline-flex items-baseline gap-2 py-1 text-[var(--color-primary)] hover:text-[var(--color-primary-accent)] hover:underline transition-colors"
                            >
                                <span className="font-mono text-sm opacity-70 min-w-[2.5rem]">{entry.number}</span>
                                <span className={entry.level === 1 ? 'font-semibold' : ''}>{entry.title}</span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    );
};

export default DocsLanding;
