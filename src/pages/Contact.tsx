import React from 'react';
import { FaEnvelopeOpenText } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import resume from '../data/resume.json';
import loadMarkdown from '../utils/markdownLoader';
import { loadAndConvertAdoc } from '../utils/asciidocLoader';
import { useMarkdownComponents } from '../utils/markdownComponents';
import AsciidocRenderer from '../utils/asciidocRenderer';

const CONTACT_MD_PATH = 'data/CONTACT.md';
const isAdoc = (p: string) => /\.adoc$/i.test(p);

const ContactPage: React.FC = () => {
  const profile = (resume as any).profile as { email?: string } | undefined;
  const [md, setMd] = React.useState<string>('');
  const [adocHtml, setAdocHtml] = React.useState<string>('');
  const docIsAdoc = isAdoc(CONTACT_MD_PATH);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (docIsAdoc) {
        const html = await loadAndConvertAdoc(CONTACT_MD_PATH);
        if (mounted) setAdocHtml(html);
      } else {
        const text = await loadMarkdown(CONTACT_MD_PATH);
        if (mounted) setMd(text);
      }
    })();
    return () => { mounted = false; };
  }, [docIsAdoc]);
  const markdownComponents = useMarkdownComponents(CONTACT_MD_PATH);

  return (
    <div className="p-4 lg:p-8 max-w-2xl content-center mx-auto">
      <h1 className="text-2xl mb-4 font-bold inline-flex items-center gap-2 text-[var(--color-text)] dark:text-[var(--color-text)]">
        <FaEnvelopeOpenText /> Contact
      </h1>
      {docIsAdoc && adocHtml && (
        <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none mb-4">
          <AsciidocRenderer html={adocHtml} originPath={CONTACT_MD_PATH} className="adoc-content" />
        </div>
      )}
      {!docIsAdoc && md && (
        <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none mb-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>{md}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default ContactPage;