export const importantCitationRules = `
## Important Citation Rules:
1. Use the citation format [citation:x] at the end of each sentence or paragraph that references information from the context, where x is the citation index provided in the context.
2. If a sentence or paragraph draws from multiple sources, list all applicable citations, like [citation:3][citation:5].
3. Maintain natural flow while incorporating citations
5. Ensure all factual claims are properly cited
`;

export const commonQueryAndContextPriorityRules = () => `
## Query Priority and Context Relevance
1. ALWAYS prioritize the user's original query intent above all else
2. Context Assessment:
   - First determine if provided context is DIRECTLY relevant to the user's original request
   - If context is NOT relevant to the request, IGNORE it completely and generate content based on original query
   - Only use context when it clearly adds value to the requested content
3. Examples of Query Priority:
   - Query: "Write a guide about React" + Context about "Python" => Write React guide, ignore Python context
   - Query: "Create a marketing plan" + Context about "technical specs" => Focus on marketing plan, ignore tech specs
   - Query: "Write about this document" + Context with relevant document => Use context for content`;

export const commonImportantNotes = () => `
## Important Notes
 1. The <response> tags in examples are for demonstration purposes only
 2. Keep minimum content length of 2000 words`;

export const referenceContextHandlingPrompt = `
## Reference Context Handling Instructions

### Context Integration Capabilities
1. Analyze and incorporate provided context
2. Synthesize information from multiple sources
3. Connect related concepts across sources
4. Generate original content that builds upon context

### Context Handling Guidelines
1. Prioritize context in order: MentionedContext > OtherContext
2. Connect information across different context sources
3. Use context to enrich examples and explanations

### Context Structure Guidelines
You will be provided with context in XML format. This context is structured hierarchically and may include mentioned context, and other context. Each category may contain user-selected content, knowledge base resources, documents. Always consider all relevant context when formulating your responses. The context is structured as follows:

<referenceContext>
   <MentionedContext>
      <UserSelectedContent>
         <ContextItem citationIndex='[[citation:x]]' type='selectedContent' from={domain} entityId={id} title={title} weblinkUrl={url}>content</ContextItem>
         ...
      </UserSelectedContent>
      <KnowledgeBaseDocuments>
         <ContextItem citationIndex='[[citation:x]]' type='document' entityId={id} title={title}>content</ContextItem>
         ...
      </KnowledgeBaseDocuments>
      <KnowledgeBaseResources>
         <ContextItem citationIndex='[[citation:x]]' type='resource' entityId={id} title={title}>content</ContextItem>
         ...
      </KnowledgeBaseResources>
   </MentionedContext>
   <OtherContext>
      ... (similar structure as MentionedContext)
   </OtherContext>
</referenceContext>
`;

export const editDocumentCommonRules = `
## Core Editing Rules
1. Focus on Precision
   - Edit only the highlighted section
   - Maintain document style and tone
   - Preserve important existing information
   - Integrate new content seamlessly

2. Context Integration
   - Use knowledge base context when relevant
   - Consider chat history for continuity
   - Maintain document coherence
   - Cite sources appropriately

3. Quality Standards
   - Ensure grammatical accuracy
   - Maintain consistent formatting
   - Preserve document structure
   - Follow markdown conventions

4. Content Enhancement
   - Improve clarity and readability
   - Add relevant examples when needed
   - Expand on complex concepts
   - Update outdated information
`;

export const editDocumentContextRules = `
## Context Handling Rules

1. Knowledge Base Priority
   - Prioritize recent knowledge base updates
   - Use most relevant context sections
   - Cross-reference multiple sources when applicable
   - Maintain citation accuracy

2. Chat History Integration
   - Consider recent relevant discussions
   - Maintain conversation continuity
   - Reference previous clarifications
   - Ensure consistent information

3. Document Context
   - Preserve document structure
   - Maintain section relationships
   - Keep consistent terminology
   - Respect existing formatting
`;

// TODO: future add source reference rules
// 4. Source Management
//    - Cite knowledge base sources
//    - Reference chat history when relevant
//    - Maintain clear source attribution
//    - Update outdated information
