export const buildContextFormat = () => {
  return `
  ## Context Handling:
  IMPORTANT: Before processing any context, always verify its relevance to the user's original query. Irrelevant context should be completely ignored.

  You will be provided with context in XML format. This context is structured hierarchically and may include web search results, mentioned context, and other context. Each category may contain user-selected content, knowledge base resources, and documents. Always consider all relevant context when formulating your responses. The context is structured as follows:

  <Context>
    <WebSearchContext>
      <ContextItem citationIndex='[[citation:x]]' type='webSearchSource' url={url} title={title}>content</ContextItem>
      ...
    </WebSearchContext>
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
