import React from 'react';
import { FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import loadMarkdown from '../utils/markdownLoader';
import { SkillBadgeMarkdown } from './SkillBadge';
import { useMarkdownComponents } from '../utils/markdownComponents';

const ABOUT_PATH = 'data/ABOUT_ME.md';

export type AboutSectionProps = {
  showTitle?: boolean;
  className?: string;
};

// markdownComponents must be created within a React component (not at module top level)

function extractHighlights(markdown: string, max = 3): string[] {
  // naive sentence split; prioritize sentences with first-person or strong verbs
  const sentences = markdown
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);
  const scored = sentences.map((s) => {
    let score = 0;
    if (/\bI\b|my\b|experience|built|designed|led|optimized|created/i.test(s)) score += 2;
    if (/\bReact|C\+\+|Java|TypeScript|Python|Spring|architecture|performance/i.test(s)) score += 1;
    if (s.length < 160) score += 1; // brevity bonus
    return { s, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.s);
}

const AboutSection: React.FC<AboutSectionProps> = ({ showTitle = false, className }) => {
  const [md, setMd] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const text = await loadMarkdown(ABOUT_PATH);
      if (mounted) {
        setMd(text);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const markdownComponents = useMarkdownComponents(ABOUT_PATH);
  const highlights = md ? extractHighlights(md, 3) : [];
  return (
    <div className={`relative ${className ?? ''}`}>
      {showTitle && (
        <h1 className="text-2xl font-bold mb-4 inline-flex items-center gap-2">
          <FaUser /> About
        </h1>
      )}
      {/* Highlights Pillars */}
      {/* {highlights.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 backdrop-blur px-4 py-3 shadow-elevate-sm hover:shadow-elevate-md transition focus-within:shadow-elevate-md"
              tabIndex={0}
            >
              <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:shadow-glow/10" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">
                {h}
              </p>
            </div>
          ))}
        </div>
      )} */}
  <div>
        {loading && <p className="text-gray-500">Loading…</p>}
        {!loading && md && (
          <div className="max-w-4xl">
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none w-full dark:prose-invert markdown-wide"
              style={{ maxWidth: 'none' }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {md}
              </ReactMarkdown>
            </div>
          </div>
        )}
        {!loading && !md && (
          <p className="text-gray-700">
            Create <code>src/data/ABOUT_ME.md</code> to add your bio.
          </p>
        )}
      </div>
    </div>
  );
};

export default AboutSection;
