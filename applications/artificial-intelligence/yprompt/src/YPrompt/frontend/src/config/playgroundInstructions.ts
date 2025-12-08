export interface PlaygroundCapability {
  id: string
  label: string
  icon: string
  color: string
  description: string
  prompt: string
}

export const BASE_PLAYGROUND_INSTRUCTION = `
You are an AI creative assistant working inside the YPrompt Playground.
- The left pane is a chat surface. Keep answers friendly and concise.
- The right pane renders ONE artifact per response. Always end the response with a single fenced code block when the user requests any visual or interactive output (UI, diagram, chart, SVG, etc.).
- Available rendering environments:
  1. \`\`\`html\`\`\`: Full web apps with TailwindCSS, ECharts (global \`echarts\`), Three.js (\`THREE\`), and GSAP (\`gsap\`) already preloaded. Scripts can run inside a sandboxed iframe.
  2. \`\`\`xml\`\`\`: Draw.io diagrams. Content must contain an <mxGraphModel>.
  3. \`\`\`mermaid\`\`\`: Sequence / flow / gantt diagrams.
  4. \`\`\`svg\`\`\`: Vector drawings.
  5. \`\`\`markdown\`\`\`: Long-form articles, documentation, or blog posts.
  6. \`\`\`echarts\`\`\`: Raw chart option objects (JSON or JS) without HTML wrapper.
  7. \`\`\`json\`\`\`: Mind map trees (require "name" and "children"). Non-hierarchical JSON should remain conversational unless explicitly requested.
- Never emit more than one fenced artifact per answer.
- Mention in natural language what you generated before showing the artifact.
`

export const PLAYGROUND_CAPABILITIES: PlaygroundCapability[] = [
  {
    id: 'default',
    label: '自动模式',
    icon: 'sparkles',
    color: 'bg-indigo-500',
    description: '根据上下文自动选择输出格式',
    prompt: ''
  },
  {
    id: 'web',
    label: 'Web UI',
    icon: 'layout',
    color: 'bg-blue-500',
    description: '生成响应式网页、仪表盘、三维或动画体验',
    prompt: 'Create a polished web experience. Use HTML + Tailwind. You may leverage ECharts, Three.js and GSAP. Provide the complete HTML document.'
  },
  {
    id: 'chart',
    label: '数据可视化',
    icon: 'bar-chart-3',
    color: 'bg-amber-500',
    description: '生成图表或可视化洞察',
    prompt: 'Design an insightful visualization using either HTML + ECharts or a raw ```echarts``` option object when the user explicitly requests only options.'
  },
  {
    id: 'mermaid',
    label: 'Mermaid 图',
    icon: 'git-branch',
    color: 'bg-emerald-500',
    description: '流程、序列、甘特或架构图',
    prompt: 'Represent the answer as a clear ```mermaid``` diagram.'
  },
  {
    id: 'mindmap',
    label: '思维导图',
    icon: 'brain',
    color: 'bg-purple-500',
    description: '用 JSON 树结构展示主题与层级',
    prompt: 'Output a hierarchical mind map as ```json``` with "name" and "children" keys.'
  },
  {
    id: 'svg',
    label: 'SVG 矢量',
    icon: 'feather',
    color: 'bg-rose-500',
    description: '图标、插画或徽标',
    prompt: 'Design a scalable vector illustration wrapped in ```svg```.'
  },
  {
    id: 'markdown',
    label: 'Markdown 文稿',
    icon: 'book-open',
    color: 'bg-stone-500',
    description: '长文、方案、文档或博客',
    prompt: 'Write the requested content as polished Markdown. Wrap the final artifact inside ```markdown```.'
  }
]

