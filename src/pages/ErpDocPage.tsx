import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { findErpDocBySlug, getAdjacentErpDocs } from '../utils/erpDocs';
import loadMarkdown from '../utils/markdownLoader';
import { useMarkdownComponents } from '../utils/markdownComponents';
import loadAndConvertAdoc from '../utils/asciidocLoader';
import AsciidocRenderer from '../utils/asciidocRenderer';

const ErpDocPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const entry = slug ? findErpDocBySlug(slug) : undefined;
    const { prev, next } = slug ? getAdjacentErpDocs(slug) : { prev: null, next: null };

    const [md, setMd] = React.useState<string>('');
    const [adocHtml, setAdocHtml] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(false);
    const docIsAdoc = (entry?.markdownUrl ?? '').endsWith('.adoc');

    React.useEffect(() => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        } catch {
            window.scrollTo(0, 0);
        }
    }, [slug]);

    React.useEffect(() => {
        if (!entry) return;
        let mounted = true;
        setLoading(true);
        if (docIsAdoc) {
            loadAndConvertAdoc(entry.markdownUrl).then((html) => {
                if (mounted) {
                    setAdocHtml(html);
                    setLoading(false);
                }
            });
        } else {
            loadMarkdown(entry.markdownUrl).then((text) => {
                if (mounted) {
                    setMd(text);
                    setLoading(false);
                }
            });
        }
        return () => { mounted = false; };
    }, [entry, docIsAdoc]);

    const markdownComponents = useMarkdownComponents(entry?.markdownUrl ?? '');

    if (!entry) {
        return (
            <div className="px-4 lg:px-8 pb-8 mt-6 max-w-4xl mx-auto">
                <p className="text-red-600">Page not found.</p>
                <Link to="/erp-docs" className="app-link hover:underline">Back to ERP Documentation</Link>
            </div>
        );
    }

    return (
        <div className="px-4 lg:px-8 pb-8 mt-2 lg:mt-6 max-w-4xl mx-auto">
            {/* Breadcrumb / top navigation */}
            <div className="mb-4 sticky top-12 lg:relative lg:top-0 z-40 flex items-center justify-between gap-3">
                {prev ? (
                    <Link
                        to={`/erp-docs/${prev.slug}`}
                        className="btn-base btn-brand btn-solid btn-equal"
                        aria-label={`Previous: ${prev.title}`}
                    >
                        ← previous
                    </Link>
                ) : (
                    <span className="btn-base btn-disabled btn-equal pointer-events-none select-none" aria-disabled="true">← previous</span>
                )}
                <Link to="/erp-docs" className="text-sm text-[var(--color-primary)] hover:underline">
                    ↑ Table of Contents
                </Link>
                {next ? (
                    <Link
                        to={`/erp-docs/${next.slug}`}
                        className="btn-base btn-brand btn-solid btn-equal"
                        aria-label={`Next: ${next.title}`}
                    >
                        next →
                    </Link>
                ) : (
                    <span className="btn-base btn-disabled btn-equal pointer-events-none select-none" aria-disabled="true">next →</span>
                )}
            </div>

            {/* Section number + title */}
            <div className="mb-4">
                <span className="font-mono text-sm text-[var(--color-text)] opacity-60 mr-2">{entry.number}</span>
                <span className="text-2xl font-bold text-[var(--color-text)]">{entry.title}</span>
            </div>

            {loading && <p className="text-[var(--color-text)] opacity-60">Loading…</p>}

            {!loading && docIsAdoc && adocHtml && (
                <article className="prose prose-neutral dark:prose-invert max-w-none markdown-wide">
                    <AsciidocRenderer html={adocHtml} originPath={entry.markdownUrl} className="adoc-content" />
                </article>
            )}

            {!loading && !docIsAdoc && md && (
                <article className="prose prose-neutral dark:prose-invert max-w-none markdown-wide">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                    >
                        {md}
                    </ReactMarkdown>
                </article>
            )}

            {!loading && (docIsAdoc ? !adocHtml : !md) && (
                <p className="text-[var(--color-text)] opacity-60 italic">No content yet.</p>
            )}
        </div>
    );
};

export default ErpDocPage;
