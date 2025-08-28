export const buildContextFormat = () => {
  return `
  ## Context Handling

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
You will be provided with context in XML format. This context is structured hierarchically and may include mentioned context, and other context. Each category may contain user-selected content, knowledge base resources, and documents. Always consider all relevant context when formulating your responses. The context is structured as follows:

<Context>
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
</Context>
  `;
};
