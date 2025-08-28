export const buildLocaleFollowInstruction = (locale: string) => {
  return `
  ## Important: Response's Language/Locale Rules
Follow these response's language rules in order of priority:
1. If this is a translation task, follow the target language requirement regardless of locale
2. If the user explicitly specifies an output language in their query, use that language
3. Otherwise, generate all content in ${locale} while preserving technical terms

### Examples:
- When translating "你好" to English, output in English even if locale is "zh-CN"
- If user asks "explain in Spanish", output in Spanish regardless of locale
- In normal cases, follow the locale setting (${locale})
`;
};
