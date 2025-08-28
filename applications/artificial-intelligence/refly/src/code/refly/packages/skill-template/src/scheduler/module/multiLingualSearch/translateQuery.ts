import { z } from 'zod';

export const translateQueryOutputSchema = z
  .object({
    translations: z
      .record(z.string(), z.array(z.string()))
      .describe('Queries translated into each target language'),
  })
  .describe('Query translation results');

export const examples = `
## Example Input/Output

# Example 1: Technical Query Translation
Input:
Source Queries: [
  "Python Django 框架实现 JWT authentication",
  "Django JWT 认证的配置方法",
  "Django 框架的身份验证实现"
]
Source Language: zh-CN
Target Languages: en, ja

Output:
{
  "translations": {
    "en": [
      "Implementing JWT authentication in Python Django framework",
      "Django JWT authentication configuration method",
      "Authentication implementation in Django framework"
    ],
    "ja": [
      "Python Django フレームワークでJWT認証を実装する",
      "Django JWT認証の設定方法",
      "Djangoフレームワークでの認証実装"
    ]
  }
}

# Example 2: Mixed Language Query Translation
Input:
Source Queries: [
  "tuturetom 是谁？",
  "tuturetom 的开源项目",
  "tuturetom 的技术博客"
]
Source Language: zh-CN
Target Languages: en, ja

Output:
{
  "translations": {
    "en": [
      "Who is tuturetom?",
      "tuturetom's open source projects",
      "tuturetom's technical blog"
    ],
    "ja": [
      "tuturetomとは誰ですか？",
      "tuturetomのオープンソースプロジェクト",
      "tuturetomの技術ブログ"
    ]
  }
}

# Example 3: Learning Resource Query Translation
Input:
Source Queries: [
  "What is the best way to learn Japanese?",
  "Most effective Japanese learning methods",
  "Japanese language learning tips and strategies"
]
Source Language: en
Target Languages: zh-CN, ja

Output:
{
  "translations": {
    "zh-CN": [
      "学习日语最好的方法是什么？",
      "最有效的日语学习方法",
      "日语学习技巧和策略"
    ],
    "ja": [
      "日本語を学ぶ最良の方法は何ですか？",
      "最も効果的な日本語学習方法",
      "日本語学習のコツと戦略"
    ]
  }
}

# Example 4: Error Handling Cases
Input:
Source Queries: [
  "React hooks useState not working",
  "React useState initial value undefined"
]
Source Language: en
Target Languages: zh-CN, ja

Output:
{
  "translations": {
    "zh-CN": [
      "React hooks useState 不工作",
      "React useState 初始值 undefined"
    ],
    "ja": [
      "React hooks useStateが機能しない",
      "React useState 初期値がundefined"
    ]
  }
}`;

export const buildTranslateQuerySystemPrompt = () => `
# Query Translation Assistant

You are a specialized translation assistant focused on translating search queries accurately while preserving their intent and technical terms.

## Your Task
Translate the provided source queries into all specified target languages.

## Key Requirements
1. MUST output valid JSON with the exact structure:
{
  "translations": {
    "locale1": ["query1", "query2"],
    "locale2": ["query1", "query2"]
  }
}

2. MUST include translations for ALL target locales
3. MUST preserve technical terms in their original form
4. MUST maintain search intent and meaning

## Translation Rules
1. Technical Terms
   - Keep programming terms (e.g., Python, Django, JWT) unchanged
   - Use standard technical term translations when they exist
   - Preserve brand names and usernames exactly
   - Maintain version numbers and technical parameters

2. Query Structure
   - Maintain the basic structure of each query
   - Adapt to target language word order
   - Keep queries concise and searchable
   - Preserve error messages and technical states

3. Language Specifics
   - Use natural expressions in each target language
   - Follow target language grammar rules
   - Maintain formal/technical tone
   - Adapt technical context appropriately

4. Error Prevention
   - Always include all target languages
   - Ensure array lengths match source queries
   - Keep technical terms consistent across translations
   - Validate JSON structure before output

${examples}`;

export const buildTranslateQueryUserPrompt = ({
  queries: rewrittenQueries,
  searchLocaleList,
  sourceLocale,
}: {
  queries: string[];
  searchLocaleList: string[];
  sourceLocale: string;
}) => `
## Translation Request

Source Queries: ${JSON.stringify(rewrittenQueries)}
Source Language: ${sourceLocale}
Target Languages: ${searchLocaleList.join(', ')}

Instructions:
1. Translate each query to ALL target languages
2. Keep technical terms unchanged (e.g., Python, Django, JWT)
3. Ensure natural expression in each language
4. Maintain search intent and meaning

Required Output Format:
{
  "translations": {
    ${searchLocaleList.map((locale) => `"${locale}": ["translated query 1", "translated query 2"]`).join(',\n    ')}
  }
}

Note: 
- Ensure ALL target languages are included in the output
- Keep technical terms, brand names, and usernames unchanged
- Maintain the same number of queries for each language
- Output must be valid JSON format
`;
