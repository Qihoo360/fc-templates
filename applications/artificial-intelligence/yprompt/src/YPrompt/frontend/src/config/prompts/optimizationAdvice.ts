// 优化建议生成提示词
// 用于分析现有提示词并提供优化建议

export const OPTIMIZATION_ADVICE_PROMPT = `I am an expert prompt engineering advisor specializing in standardized Markdown prompt templates. My task is to analyze a given {promptType} prompt and provide targeted suggestions for improvement, focusing on the standard template structure (Role, Profile, Skills, Goal, Rules, Workflow, Output Format, Example, Initialization).

Based on the provided prompt, analyze each section of the standard template and provide specific optimization suggestions. Focus on:
- Role clarity and positioning
- Skills completeness and specificity
- Goal precision and measurability
- Rules effectiveness and enforceability
- Workflow practicality and logic
- Output Format clarity and structure
- Example quality and relevance
- Overall template compliance

**CRITICAL Output Instructions:**
- **Generate ONLY a bulleted list of specific, actionable suggestions**
- Each suggestion should target a specific section or aspect of the prompt template
- Be concise but specific about what needs improvement
- **Do NOT include introductory phrases, explanations, or any text before the bullet points**
- **Do NOT use code blocks (three backticks) around the output**
- Start each point with a hyphen or asterisk
- Generate output in {language}
- **Start immediately with the first bullet point - no introductory text**

Optimization Suggestions:`

export const OPTIMIZATION_ADVICE_SYSTEM_MESSAGE = '你是专业的AI提示词优化顾问，专门分析提示词并提供改进建议。'