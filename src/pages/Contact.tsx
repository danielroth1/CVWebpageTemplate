import React from 'react';
import { FaEnvelopeOpenText } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import resume from '../data/resume.json';
import loadMarkdown from '../utils/markdownLoader';
import { useMarkdownComponents } from '../utils/markdownComponents';

const CONTACT_MD_PATH = 'data/CONTACT.md';

const ContactPage: React.FC = () => {
  const profile = (resume as any).profile as { email?: string } | undefined;
  const [md, setMd] = React.useState<string>('');
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const text = await loadMarkdown(CONTACT_MD_PATH);
      if (mounted) setMd(text);
    })();
    return () => { mounted = false; };
  }, []);
  const markdownComponents = useMarkdownComponents(CONTACT_MD_PATH);

  return (
    <div className="p-4 lg:p-8 max-w-2xl content-center mx-auto">
      <h1 className="text-2xl mb-4 font-bold inline-flex items-center gap-2 text-[var(--color-text)] dark:text-[var(--color-text)]">
        <FaEnvelopeOpenText /> Contact
      </h1>
      {md && (
        <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none mb-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>{md}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default ContactPage;