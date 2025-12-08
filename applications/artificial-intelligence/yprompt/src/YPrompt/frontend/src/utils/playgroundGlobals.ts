import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import jsonLang from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import markdown from 'highlight.js/lib/languages/markdown'
import bash from 'highlight.js/lib/languages/bash'
import shell from 'highlight.js/lib/languages/shell'
import ruby from 'highlight.js/lib/languages/ruby'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import csharp from 'highlight.js/lib/languages/csharp'
import cssLang from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/github.css'

const win = typeof window !== 'undefined' ? window : undefined

if (win) {
  if (!win.marked) {
    win.marked = marked
  }

  if (!win.hljs) {
    hljs.registerLanguage('javascript', javascript)
    hljs.registerLanguage('typescript', typescript)
    hljs.registerLanguage('xml', xml)
    hljs.registerLanguage('json', jsonLang)
    hljs.registerLanguage('python', python)
    hljs.registerLanguage('markdown', markdown)
    hljs.registerLanguage('bash', bash)
    hljs.registerLanguage('shell', shell)
    hljs.registerLanguage('ruby', ruby)
    hljs.registerLanguage('go', go)
    hljs.registerLanguage('java', java)
    hljs.registerLanguage('csharp', csharp)
    hljs.registerLanguage('css', cssLang)
    hljs.registerLanguage('scss', scss)
    hljs.registerLanguage('sql', sql)
    win.hljs = hljs
  }

  if (!win.lucide) {
    win.lucide = { createIcons: () => {} }
  }
}
