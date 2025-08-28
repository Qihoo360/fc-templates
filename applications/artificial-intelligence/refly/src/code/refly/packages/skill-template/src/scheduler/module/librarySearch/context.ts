export const buildContextFormat = () => {
  return `
  ## Context Format
<Context>
  <MentionedContext>
    <KnowledgeBaseDocuments>
      <ContextItem citationIndex='[[citation:x]]' type='document' entityId={id} title={title}>content</ContextItem>
    </KnowledgeBaseDocuments>
    <KnowledgeBaseResources>
      <ContextItem citationIndex='[[citation:x]]' type='resource' entityId={id} title={title}>content</ContextItem>
    </KnowledgeBaseResources>
  </MentionedContext>
  <OtherContext>
    ... (similar structure as MentionedContext)
  </OtherContext>
</Context>
  `;
};
