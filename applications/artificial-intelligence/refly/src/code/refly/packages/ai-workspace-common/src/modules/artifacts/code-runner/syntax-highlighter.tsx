import { useState, useEffect } from 'react';
import { createHighlighter } from 'shiki/bundle/web';

const highlighterPromise = createHighlighter({
  langs: [
    'html',
    'css',
    'js',
    'graphql',
    'javascript',
    'json',
    'jsx',
    'markdown',
    'md',
    'mdx',
    'plaintext',
    'py',
    'python',
    'sh',
    'shell',
    'sql',
    'text',
    'ts',
    'tsx',
    'txt',
    'typescript',
    'zsh',
  ],
  themes: ['github-light-default'],
});

export default function SyntaxHighlighter({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function highlight() {
      try {
        const highlighter = await highlighterPromise;
        if (isMounted) {
          const highlightedHtml = highlighter.codeToHtml(code, {
            lang: language || 'plaintext',
            theme: 'github-light-default',
          });
          setHtml(highlightedHtml);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error highlighting code:', error);
        setIsLoading(false);
      }
    }

    highlight();

    return () => {
      isMounted = false;
    };
  }, [code, language]);

  if (isLoading) {
    return <div className="p-4 text-sm">Loading syntax highlighting...</div>;
  }

  // eslint-disable-next-line react/no-danger
  // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
  return <div className="p-4 text-sm" dangerouslySetInnerHTML={{ __html: html }} />;
}
