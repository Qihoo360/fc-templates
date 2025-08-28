// Add new priority rules
export const editPriorityRulesPrompt = `
## Edit Priority Rules
1. Always interpret edit requests primarily based on highlighted content and its immediate context
2. Use original user query as the main instruction for changes
3. Consider rewritten query only as supplementary context
4. Maintain consistency with the surrounding content structure and style
5. For continuation/translation/modification requests:
   - Use highlighted content as the primary reference
   - Ensure seamless integration with existing content
   - Maintain document flow and coherence
`;

// Add highlight context emphasis
export const highlightContextEmphasisPrompt = `
## Primary Edit Context

Always prioritize the highlighted content and its surrounding context when interpreting the edit request
`;

// Add highlight operation types handling
export const highlightOperationRulesPrompt = `
## Highlight Operation Rules
1. For continuation requests ("continue", "expand", "write more"):
   - Use highlighted content as the foundation
   - Maintain same style, tone and context
   - Ensure seamless connection with existing content
   - Follow the established pattern or structure

2. For translation requests:
   - Keep original meaning and nuance
   - Maintain document formatting and structure
   - Preserve technical terms unless specified otherwise
   - Consider surrounding context for consistent terminology

3. For modification requests:
   - Use highlighted content as reference point
   - Preserve key information unless explicitly asked to change
   - Maintain connection with surrounding content
   - Keep consistent terminology and style

4. For formatting requests:
   - Apply changes while preserving content meaning
   - Maintain document hierarchy
   - Ensure compatibility with surrounding structure
   - Keep consistent styling throughout
`;

// Update existing importantRemindersPrompt
export const importantRemindersPrompt = `
## Important Reminders
1. Generate content at specified insertion point
2. Create comprehensive, well-structured blocks
3. Ensure proper integration with surrounding content
4. Support multiple block types and nested structures
5. Including detailed explanations and examples
6. Title is contextual information only - not for expansion
7. Ensure proper markdown formatting and structure
8. DO NOT include <response> tags in your output
9. Focus on highlighted content and immediate context
10. Maintain document's original style and tone
11. For continuation tasks, ensure smooth transition
12. For translations, preserve original meaning and structure
13. For modifications, maintain document coherence
`;

// Core block content generation instructions
export const buildBlockEditDocumentCoreInstructionsPrompt = () => `
## Core Block Content Generation Instructions

### Target Document Handling
1. Document Identification:
   - Focus ONLY on document marked with isCurrentContext=true
   - Identify highlight markers (<highlight></highlight>)
   - Preserve document structure and style
   - Maintain existing formatting

2. Edit Scope:
   - Edit ONLY content within highlight markers
   - Never modify content outside highlight tags
   - Support both full document and partial document scenarios
   - Preserve document coherence and flow

### Content Generation Rules
1. Generation Scope:
   - Generate content at specified insertion point
   - Handle both partial and full document scenarios
   - Never reduce content length unnecessarily
   - Support multiple block types (headings, paragraphs, lists, todo lists, code blocks, etc.)

2. Content Structure:
   - Create nested blocks when appropriate
   - Maintain proper heading hierarchy
   - Follow document's existing style
   - Ensure seamless integration with surrounding content

3. Format Requirements:
   - Use proper markdown formatting
   - Maintain consistent style
   - Output content directly without XML tags
   - Title is for context only - do not expand it

### Important Notes
1. DO NOT include <response> tags in output
2. Generate content ONLY within highlight tags
3. Preserve all content outside highlight tags
`;
