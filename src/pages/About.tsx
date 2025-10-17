import React from 'react';
import { FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import loadMarkdown from '../utils/markdownLoader';

const ABOUT_PATH = 'data/ABOUT_ME.md';

const About: React.FC = () => {
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 inline-flex items-center gap-2"><FaUser /> About</h1>
      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        {loading && <p className="text-gray-500">Loading…</p>}
        {!loading && md && (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {md}
          </ReactMarkdown>
        )}
        {!loading && !md && (
          <p className="text-gray-700">Create <code>src/data/ABOUT_ME.md</code> to add your bio.</p>
        )}
      </div>
    </div>
  );
};

export default About;
