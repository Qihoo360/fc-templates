export const buildCommonQnAExamples = () => {
  return `
  ## Examples (DO NOT USE THESE DIRECTLY - FOR FORMAT REFERENCE ONLY)

Question: "How do I deploy to production?"
Context:
<Context>
  <MentionedContext>
    <KnowledgeBaseDocuments>
      <ContextItem citationIndex='[[citation:1]]' type='document' entityId='deploy-123' title='Production Deployment Guide'>
        Production deployment requires: 1) All tests passing 2) DevOps approval 3) Change request ticket
      </ContextItem>
      <ContextItem citationIndex='[[citation:2]]' type='document' entityId='deploy-124' title='Deployment Checklist'>
        Pre-deployment checklist: verify staging tests, backup database, notify stakeholders
      </ContextItem>
    </KnowledgeBaseDocuments>
  </MentionedContext>
</Context>

Good Response:
To deploy to production, you need to follow these steps:
1. Ensure all tests are passing
2. Get DevOps approval
3. Create a change request ticket [citation:1]

Before deployment, make sure to:
- Verify staging tests
- Backup the database
- Notify all stakeholders [citation:2]

Question: "What's our tech stack?"
Context:
<Context>
  <OtherContext>
    <KnowledgeBaseResources>
      <ContextItem citationIndex='[[citation:1]]' type='resource' entityId='stack-101' title='Technology Overview'>
        No relevant content found
      </ContextItem>
    </KnowledgeBaseResources>
  </OtherContext>
</Context>

Good Response:
I apologize, but I don't see any relevant information about our tech stack in the provided context. Please check our technical documentation or ask the development team for this information. (NO CITATIONS - Context not relevant)

Question: "Can you explain this code snippet?"
Context:
<Context>
  <MentionedContext>
    <UserSelectedContent>
      <ContextItem citationIndex='[[citation:1]]' type='selectedContent' from='github' entityId='code-123' title='Authentication Middleware' weblinkUrl='github.com/repo/auth'>
        function authMiddleware(req, res, next) {
          const token = req.headers.authorization;
          if (!token) return res.status(401).json({ error: 'No token provided' });
          // Verify token logic
        }
      </ContextItem>
    </UserSelectedContent>
  </MentionedContext>
</Context>

Good Response:
This code shows an authentication middleware function [citation:1] that:
1. Extracts the authorization token from request headers
2. Checks if the token exists
3. Returns a 401 error if no token is found
The comment indicates there's additional token verification logic not shown in this snippet.
`;
};

export const buildCommonQnAChatHistoryExamples = () => {
  return `
  ## Examples with Chat History

1. Direct Technical Question:
<ChatHistory>
<ChatHistoryItem type={human}>What's our database backup schedule?</ChatHistoryItem>
<ChatHistoryItem type={ai}>Backups run daily at midnight and weekly on Sundays [citation:1].</ChatHistoryItem>
<ChatHistoryItem type={human}>Where are the backups stored?</ChatHistoryItem>
</ChatHistory>
<Context>
<MentionedContext>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='[[citation:1]]' type='document' entityId='backup-123' title='Backup Policy'>
Backups are stored in AWS S3 with 30-day retention policy. Encrypted at rest.
</ContextItem>
</KnowledgeBaseDocuments>
</MentionedContext>
</Context>

Good Response:
Our backups are stored in AWS S3 with encryption at rest and a 30-day retention policy [citation:1].

2. Context-Dependent Follow-up:
<ChatHistory>
<ChatHistoryItem type={human}>What testing frameworks do we use?</ChatHistoryItem>
<ChatHistoryItem type={ai}>We use Jest for unit testing and Cypress for E2E testing [citation:1].</ChatHistoryItem>
<ChatHistoryItem type={human}>Show me an example test</ChatHistoryItem>
</ChatHistory>
<Context>
<MentionedContext>
<KnowledgeBaseResources>
<ContextItem citationIndex='[[citation:1]]' type='resource' entityId='test-123' title='Testing Examples'>
describe('sum', () => {
  it('adds two numbers correctly', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
</ContextItem>
</KnowledgeBaseResources>
</MentionedContext>
</Context>

Good Response:
Here's a simple Jest test example [citation:1]:
\`\`\`javascript
describe('sum', () => {
  it('adds two numbers correctly', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
\`\`\`

3. Mixed Context Sources:
<ChatHistory>
<ChatHistoryItem type={human}>What's our API structure?</ChatHistoryItem>
<ChatHistoryItem type={ai}>We use a RESTful API structure with versioning [citation:1].</ChatHistoryItem>
<ChatHistoryItem type={human}>What authentication do we use?</ChatHistoryItem>
</ChatHistory>
<Context>
<MentionedContext>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='[[citation:1]]' type='document' entityId='auth-123' title='API Authentication'>
JWT-based authentication with refresh tokens.
</ContextItem>
</KnowledgeBaseDocuments>
</MentionedContext>
<OtherContext>
<UserSelectedContent>
<ContextItem citationIndex='[[citation:2]]' type='selectedContent' from='confluence' entityId='auth-456' title='Security Standards'>
All APIs require OAuth2.0 for third-party integrations.
</ContextItem>
</UserSelectedContent>
</OtherContext>
</Context>

Good Response:
We implement two authentication methods:
1. JWT-based authentication with refresh tokens for internal use [citation:1]
2. OAuth2.0 for third-party integrations [citation:2]
`;
};
