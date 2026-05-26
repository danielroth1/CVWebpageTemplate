import React from 'react';
import { FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import loadMarkdown from '../utils/markdownLoader';
import { loadAndConvertAdoc } from '../utils/asciidocLoader';
import SkillBadge from './SkillBadge';
import { useMarkdownComponents } from '../utils/markdownComponents';
import resumeData from '../data/resume.json';
import AsciidocRenderer from '../utils/asciidocRenderer';

// Set to 'data/ABOUT_ME.adoc' to use AsciiDoc instead of Markdown
const ABOUT_PATH = 'data/ABOUT_ME.md';
const isAdoc = (p: string) => /\.adoc$/i.test(p);

export type AboutSectionProps = {
  showTitle?: boolean;
  className?: string;
};

// Calculate years of experience from resume.json startYears
function getYearsOfExperience(): number {
  const allItems = [...resumeData.work, ...resumeData.education];
  let minDate = new Date();

  allItems.forEach((item: any) => {
    if (item.startYear) {
      // Handle "MM.YYYY" or "YYYY"
      const parts = item.startYear.split('.');
      let year = 0;
      let month = 0; // 0-indexed
      if (parts.length === 2) {
        month = parseInt(parts[0], 10) - 1;
        year = parseInt(parts[1], 10);
      } else if (parts.length === 1) {
        year = parseInt(parts[0], 10);
      }
      
      if (year > 0) {
        const date = new Date(year, month, 1);
        if (date < minDate) {
          minDate = date;
        }
      }
    }
  });

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - minDate.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); 
  return Math.floor(diffYears);
}

// markdownComponents must be created within a React component (not at module top level)

// Extract highlights from markdown text
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

// AboutSection component
const AboutSection: React.FC<AboutSectionProps> = ({ showTitle = false, className }) => {
  const [md, setMd] = React.useState<string>('');
  const [adocHtml, setAdocHtml] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const docIsAdoc = isAdoc(ABOUT_PATH);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (docIsAdoc) {
        const html = await loadAndConvertAdoc(ABOUT_PATH);
        if (mounted) { setAdocHtml(html); setLoading(false); }
      } else {
        const text = await loadMarkdown(ABOUT_PATH);
        if (mounted) { setMd(text); setLoading(false); }
      }
    })();
    return () => { mounted = false; };
  }, [docIsAdoc]);

  const markdownComponents = useMarkdownComponents(ABOUT_PATH);
  return (
    <div className={`relative ${className ?? ''}`}>
      {showTitle && (
        <h1 className="text-2xl font-bold mb-4 inline-flex items-center gap-2">
          <FaUser /> About
        </h1>
      )}
  <div>
        {loading && <p className="text-gray-500">Loading…</p>}
        {!loading && docIsAdoc && adocHtml && (
          <div className="max-w-4xl">
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none w-full dark:prose-invert markdown-wide"
              style={{ maxWidth: 'none' }}
            >
              <AsciidocRenderer html={adocHtml} originPath={ABOUT_PATH} className="adoc-content" />
            </div>
          </div>
        )}
        {!loading && !docIsAdoc && md && (
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
            {/* Tech Stack section */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Tech Stack</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {resumeData.profile && resumeData.profile.skills && (
                  <>
                    {Array.isArray(resumeData.profile.skills) && (
                      <div className="md:col-span-2">
                        <h3 className="font-medium text-sm mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.profile.skills.map((s: string) => (
                            <SkillBadge key={s} skill={s} className="cursor-default">
                              {s}
                            </SkillBadge>
                          ))}
                        </div>
                      </div>
                    )}
                    {typeof resumeData.profile.skills === 'object' &&
                      !Array.isArray(resumeData.profile.skills) &&
                      Object.entries(resumeData.profile.skills).map(([category, skills]) => {
                        const list = Array.isArray(skills)
                          ? (skills as string[])
                          : String(skills)
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean);
                        return (
                          <div key={category}>
                            <h3 className="font-medium text-sm mb-2">{category}</h3>
                            <div className="flex flex-wrap gap-2">
                              {list.map((s) => (
                                <SkillBadge key={s} skill={s} className="cursor-default">
                                  {s}
                                </SkillBadge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {!loading && !(docIsAdoc ? adocHtml : md) && (
          <p className="text-gray-700">
            Create <code>{`src/${ABOUT_PATH}`}</code> to add your bio.
          </p>
        )}
      </div>
    </div>
  );
};

export default AboutSection;
