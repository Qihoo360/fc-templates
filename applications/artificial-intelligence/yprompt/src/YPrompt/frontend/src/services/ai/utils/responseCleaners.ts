export class ResponseCleaners {
  static cleanResponse(response: string): string {
    try {
      let cleaned = response.replace(/<ASSESSMENT>[\s\S]*?<\/ASSESSMENT>/gi, '').trim()
      
      const assessmentStart = cleaned.indexOf('<ASSESSMENT>')
      if (assessmentStart !== -1) {
        cleaned = cleaned.substring(0, assessmentStart).trim()
      }
      
      const patterns = [
        /<ASSE[^>]*$/i,
        /<\/ASSE[^>]*$/i,
        /\n\n<ASSE/i,
        /CONTEXT:/i,
        /TASK:/i,
        /FORMAT:/i,
        /QUALITY:/i,
        /TURN_COUNT:/i,
        /DECISION:/i,
        /CONFIDENCE:/i
      ]
      
      for (const pattern of patterns) {
        const match = cleaned.search(pattern)
        if (match !== -1) {
          cleaned = cleaned.substring(0, match).trim()
          break
        }
      }
      
      return cleaned
    } catch (error) {
      return response
    }
  }
  
  static cleanThinkTagsFromFullText(text: string): string {
    if (!text) return text
    return text.replace(/<think>[\s\S]*?<\/think>/g, '')
  }
}
