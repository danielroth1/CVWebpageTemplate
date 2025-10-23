import React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import loadMarkdown from '../utils/markdownLoader';
import { SkillBadgeMarkdown } from './SkillBadge';

type ResumeJsonEntry = {
  startYear: string;
  endYear: string;
  position: string;
  company: string;
  bullets: string[];
  // New optional fields
  type?: string; // Full-time / Part-time etc.
  company_image?: string; // file name under src/data/company_images
};

type ResumeProfile = {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  contact?: string;
  skills?: string[] | Record<string, string[]>;
};

type ResumeJson = {
  profile?: ResumeProfile;
  work?: ResumeJsonEntry[];
  education?: ResumeJsonEntry[];
};

export type ResumeProps = {
  showTitle?: boolean;
  showPdfPreview?: boolean;
  className?: string;
};

const RESUME_MD_PATH = 'data/RESUME.md';
const RESUME_JSON_PATH = 'data/RESUME.json';

// Attempt to locate a resume PDF under src/data, e.g., src/data/resume.pdf
let resumePdfUrlFromSrc: string | null = null;
try {
  // @ts-ignore - Vite replaces this at build time; `as: "url"` returns string URLs
  const pdfMods = import.meta.glob('../data/**/*.pdf', { eager: true, query: '?url', import: 'default' });
  const entries = Object.entries(pdfMods) as Array<[string, string]>;
  const match =
    entries.find(([k]) => k.toLowerCase().endsWith('/resume.pdf')) ||
    entries.find(([k]) => /\/data\/resume\.pdf$/i.test(k));
  if (match) {
    resumePdfUrlFromSrc = match[1];
  }
} catch {
  // ignore
}

async function loadResumeJson(): Promise<ResumeJson | null> {
  // Try Vite eager glob from src first
  try {
    // @ts-ignore - Vite replaces this at build time
    const mods = import.meta.glob('../data/RESUME.json', { eager: true });
    const values = Object.values(mods) as unknown as Array<{ default: ResumeJson }>;
    if (values.length && values[0]?.default) {
      return values[0].default;
    }
  } catch {
    // ignore
  }
  // Fallback: try fetching from public/data/RESUME.json
  try {
    const res = await fetch('/data/RESUME.json');
    if (res.ok) {
      return (await res.json()) as ResumeJson;
    }
  } catch {
    // ignore
  }
  return null;
}

import { formatDuration, getCompanyImageUrl } from '../utils/resume';
import { DownloadButtonMarkdown, GithubButtonMarkdown, IconButtonMarkdown, LinkedInButtonMarkdown } from './IconButton';

type MarkdownComponents = Parameters<typeof ReactMarkdown>[0]['components'];

const baseMarkdownComponents = {
  skill: SkillBadgeMarkdown,
  btn: IconButtonMarkdown,
  github: GithubButtonMarkdown,
  linkedin: LinkedInButtonMarkdown,
  download: DownloadButtonMarkdown,
} as unknown as MarkdownComponents;

const Section: React.FC<{ title: string; items: ResumeJsonEntry[] }> = ({ title, items }) => (
  <section className="mt-6">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <ul className="space-y-4">
      {items.map((it, idx) => (
        <li key={`${title}-${it.company}-${idx}`} className="border-l-2 border-gray-300 pl-3">
          <div className="flex items-start gap-3">
            {/* Company image, fixed width, uniform scaling */}
            {it.company_image ? (
              <img
                src={getCompanyImageUrl(it.company_image)}
                alt={`${it.company} logo`}
                className="w-12 h-auto object-contain flex-shrink-0"
                loading="lazy"
              />
            ) : null}

            <div className="flex-1 min-w-0">
              <div>
                <div className="font-semibold">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={baseMarkdownComponents}
                  >
                    {it.position}
                  </ReactMarkdown>
                </div>
                <div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={baseMarkdownComponents}
                  >
                    {it.company}
                  </ReactMarkdown>
                </div>
                {/* Under the company: type · start–end · duration */}
                <div className="text-sm mt-0.5 text-gray-500 dark:text-[var(--color-text-muted)]">
                  {it.type ? (
                    <span>
                      {it.type}
                      <span className="mx-1">·</span>
                    </span>
                  ) : null}
                  <span>
                    {it.startYear} – {it.endYear}
                  </span>
                  <span className="mx-1">·</span>
                  <span>{formatDuration(it.startYear, it.endYear)}</span>
                </div>
              </div>

              {it.bullets?.length ? (
                <ul className="list-disc ml-5 mt-2 text-gray-700 dark:text-[var(--color-text)]">
                  {it.bullets.map((b, i) => (
                    <li key={i}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={baseMarkdownComponents}
                      >
                        {b}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

const Resume: React.FC<ResumeProps> = ({ showTitle = false, showPdfPreview = false, className }) => {
  const [md, setMd] = React.useState<string>('');
  const [json, setJson] = React.useState<ResumeJson | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // Try markdown first
      const text = await loadMarkdown(RESUME_MD_PATH);
      if (text) {
        if (mounted) {
          setMd(text);
          setLoading(false);
        }
        return;
      }
      // Fallback to JSON
      const j = await loadResumeJson();
      if (mounted) {
        setJson(j);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resumePdfUrl = resumePdfUrlFromSrc;

  return (
    <div className={`max-w-none mx-auto ${className ?? ''}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold inline-flex items-center gap-2">
            <FaFilePdf /> Resume
          </h1>
        </div>
      )}

      {/* Download link is available whenever a PDF is present */}
      {resumePdfUrl && (
        <div className="mb-4">
          <a
            href={resumePdfUrl}
            download
            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <FaFilePdf />
            <span>Download Resume</span>
          </a>
        </div>
      )}

      {/* Optional PDF preview */}
      {showPdfPreview && resumePdfUrl && (
        <div className="mb-6 border rounded overflow-hidden bg-white">
          <object data={resumePdfUrl} type="application/pdf" className="w-full" style={{ height: 360 }}>
            <iframe src={resumePdfUrl} className="w-full" style={{ height: 360 }} title="Resume preview" />
          </object>
        </div>
      )}

  {loading && <p className="text-gray-500">Loading…</p>}

      {/* Markdown mode */}
      {!loading && md && (
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={baseMarkdownComponents}
          >
            {md}
          </ReactMarkdown>
        </div>
      )}

      {/* JSON mode */}
      {!loading && !md && json && (
        <div>
          {/* Profile summary / skills */}
          {json.profile?.skills && (
            <section className="mt-2">
              <h2 className="text-xl font-semibold mb-3">Tech Stack</h2>
              {Array.isArray(json.profile.skills) ? (
                <div className="flex flex-wrap gap-2">
                  {json.profile.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 rounded bg-blue-600/10 text-blue-900 dark:text-blue-200 text-xs border border-blue-600/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(json.profile.skills).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-medium text-sm mb-1 text-blue-700 dark:text-blue-300">
                        {category}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map((s) => (
                          <span
                            key={category + s}
                            className="px-2 py-1 rounded bg-blue-600/10 text-blue-900 dark:text-blue-200 text-xs border border-blue-600/30"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {json.work?.length ? <Section title="Work" items={json.work} /> : null}
          {json.education?.length ? <Section title="Education" items={json.education} /> : null}
          {!json.work?.length && !json.education?.length && (
            <p className="text-gray-700">
              Your <code>src/{RESUME_JSON_PATH}</code> is empty.
            </p>
          )}
        </div>
      )}

      {!loading && !md && !json && (
        <p className="text-gray-700">
          Add either <code>src/{RESUME_MD_PATH}</code> or <code>src/{RESUME_JSON_PATH}</code> to
          populate this page.
        </p>
      )}
    </div>
  );
};

export default Resume;
