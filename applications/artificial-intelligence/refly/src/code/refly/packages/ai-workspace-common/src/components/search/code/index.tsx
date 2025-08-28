import copy from 'copy-to-clipboard';
import { Highlight, type Language } from 'prism-react-renderer';
import styles from './code.module.scss';
import { CopyIcon } from '../icons';

const theme = {
  plain: {
    color: 'var(--gray12)',
    fontSize: 12,
    fontFamily: 'Menlo, monospace',
  },
  styles: [
    {
      types: ['comment'],
      style: {
        color: 'var(--gray9)',
      },
    },
    {
      types: ['atrule', 'keyword', 'attr-name', 'selector'],
      style: {
        color: 'var(--gray10)',
      },
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: 'var(--gray9)',
      },
    },
    {
      types: ['class-name', 'function', 'tag'],
      style: {
        color: 'var(--gray12)',
      },
    },
  ],
};

export function Code({ children }: { children: string }) {
  return (
    <Highlight theme={theme} code={children} language={'jsx' as Language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${className} ${styles.root}`} style={style}>
          <button
            type="button"
            aria-label="Copy Code"
            onClick={() => {
              copy(children);
            }}
          >
            <CopyIcon />
          </button>
          <div className={styles.shine} />
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
