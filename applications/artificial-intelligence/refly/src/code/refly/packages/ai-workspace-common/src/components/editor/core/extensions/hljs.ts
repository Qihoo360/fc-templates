import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import go from 'highlight.js/lib/languages/go';
import css from 'highlight.js/lib/languages/css';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';
import php from 'highlight.js/lib/languages/php';
import rust from 'highlight.js/lib/languages/rust';
import shell from 'highlight.js/lib/languages/shell';
import swift from 'highlight.js/lib/languages/swift';
import ruby from 'highlight.js/lib/languages/ruby';

let configuredHljs: any = null;

export const configureHighlightJs = async () => {
  if (configuredHljs) return configuredHljs;

  const hljs = (await import('highlight.js/lib/core')).default;

  const languages = {
    java,
    javascript,
    python,
    go,
    css,
    c,
    cpp,
    csharp,
    json,
    markdown,
    sql,
    typescript,
    yaml,
    php,
    rust,
    shell,
    swift,
    ruby,
  };

  for (const [name, language] of Object.entries(languages)) {
    hljs.registerLanguage(name, language);
  }

  configuredHljs = hljs;
  return configuredHljs;
};
