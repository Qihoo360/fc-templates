/**
 * 从AI响应中提取并解析JSON
 * 处理markdown代码块包裹的JSON (```json\n{...}\n```)
 */
export function parseAIJsonResponse(content: string): any {
  if (!content) {
    throw new Error('Empty content')
  }

  // 尝试直接解析
  try {
    return JSON.parse(content)
  } catch {
    // 如果直接解析失败,尝试从markdown代码块中提取
  }

  // 匹配 ```json ... ``` 或 ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/
  const match = content.match(codeBlockRegex)
  
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim())
    } catch (e) {
      throw new Error(`Failed to parse JSON from code block: ${e}`)
    }
  }

  // 如果没有代码块,尝试找到第一个 { 和最后一个 }
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonStr = content.substring(firstBrace, lastBrace + 1)
      return JSON.parse(jsonStr)
    } catch (e) {
      throw new Error(`Failed to parse extracted JSON: ${e}`)
    }
  }

  throw new Error('No valid JSON found in content')
}
