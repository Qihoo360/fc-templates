export type ArtifactType =
  | 'html'
  | 'drawio'
  | 'mermaid'
  | 'echarts'
  | 'svg'
  | 'markdown'
  | 'mindmap'
  | 'json'

export interface Artifact {
  type: ArtifactType
  content: string
}

const extractMarkdown = (text: string) => {
  const startRegex = /```(markdown|md)/gi
  let match: RegExpExecArray | null
  let lastStartIndex = -1
  let lastLang: string | null = null

  while ((match = startRegex.exec(text)) !== null) {
    lastStartIndex = match.index
    lastLang = match[1]
  }

  if (lastStartIndex === -1) return null

  const startFence = lastLang === 'md' ? '```md' : '```markdown'
  const contentStart = lastStartIndex + startFence.length

  const closingIndex = text.lastIndexOf('```')
  if (closingIndex <= contentStart) {
    return null
  }

  return text.slice(contentStart, closingIndex).trim()
}

export const extractArtifact = (text: string): Artifact | null => {
  const markdownContent = extractMarkdown(text)
  if (markdownContent) {
    return { type: 'markdown', content: markdownContent }
  }

  const xmlMatch = text.match(/```xml\s*([\s\S]*?)```/i)
  if (xmlMatch) {
    const content = xmlMatch[1].trim()
    if (content.includes('<mxfile') || content.includes('<mxGraphModel')) {
      return { type: 'drawio', content }
    }
  }

  const mermaidMatch = text.match(/```mermaid\s*([\s\S]*?)```/i)
  if (mermaidMatch) return { type: 'mermaid', content: mermaidMatch[1].trim() }

  const echartsMatch = text.match(/```echarts\s*([\s\S]*?)```/i)
  if (echartsMatch) return { type: 'echarts', content: echartsMatch[1].trim() }

  const svgMatch = text.match(/```(?:svg)\s*([\s\S]*?)```/i)
  if (svgMatch) {
    const content = svgMatch[1].trim()
    if (content.startsWith('<svg')) {
      return { type: 'svg', content }
    }
  }

  const htmlMatch = text.match(/```html\s*([\s\S]*?)```/i)
  if (htmlMatch) return { type: 'html', content: htmlMatch[1].trim() }

  const mdMatch = text.match(/```markdown\s*([\s\S]*?)```/i)
  if (mdMatch) return { type: 'markdown', content: mdMatch[1].trim() }

  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i)
  if (jsonMatch) {
    let content = jsonMatch[1].trim()
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonCandidate = content.substring(firstBrace, lastBrace + 1)

      try {
        const parsed = JSON.parse(jsonCandidate)
        const normalized = parsed && typeof parsed === 'object'
          ? (parsed.mindmap ?? parsed)
          : null

        if (normalized && typeof normalized === 'object') {
          const hasTreeStructure =
            Array.isArray(normalized.children) ||
            Array.isArray((normalized as any).nodes)

          const hasNaming =
            !!(normalized as any).name ||
            !!(normalized as any).title ||
            !!(parsed as any).mindmap

          if (hasTreeStructure && hasNaming) {
            return { type: 'mindmap', content: jsonCandidate }
          }
        }
      } catch {
        // ignore parse errors and fallback to string heuristics
      }

      if (jsonCandidate.includes('"series"') || jsonCandidate.includes('"xAxis"')) {
        return { type: 'echarts', content: jsonCandidate }
      }

      if (
        jsonCandidate.includes('"children"') &&
        (jsonCandidate.includes('"name"') || jsonCandidate.includes('"title"'))
      ) {
        return { type: 'mindmap', content: jsonCandidate }
      }

      if (jsonCandidate.includes('"mindmap"') && jsonCandidate.includes('"nodes"')) {
        return { type: 'mindmap', content: jsonCandidate }
      }

      return { type: 'json', content: jsonCandidate }
    }
  }

  return null
}
