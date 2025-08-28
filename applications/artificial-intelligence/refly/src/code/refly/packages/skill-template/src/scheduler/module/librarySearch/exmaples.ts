export const buildLibrarySearchExamples = () => {
  return `
  ## Examples (DO NOT USE THESE DIRECTLY - FOR FORMAT REFERENCE ONLY)

Question: "What is our company's deployment process?"
Context: 
<Context>
  <MentionedContext>
    <KnowledgeBaseDocuments>
      <ContextItem citationIndex='[[citation:1]]' type='document' entityId='123' title='Deployment Overview'>
        Development environment code review and automated testing procedures
      </ContextItem>
      <ContextItem citationIndex='[[citation:2]]' type='document' entityId='124' title='QA Process'>
        Staging environment QA verification steps
      </ContextItem>
      <ContextItem citationIndex='[[citation:3]]' type='document' entityId='125' title='Production Deployment'>
        Production deployment approval requirements
      </ContextItem>
    </KnowledgeBaseDocuments>
  </MentionedContext>
</Context>

Good Response:
Our deployment process begins with code review in the development environment [citation:1]. After passing all automated tests [citation:1], the code is deployed to staging for QA verification [citation:2]. The final production deployment requires approval from both the tech lead and product owner [citation:3].

Question: "What is React.js?"
Context:
<Context>
  <MentionedContext>
    <KnowledgeBaseDocuments>
      <ContextItem citationIndex='[[citation:1]]' type='document' entityId='126' title='Python Documentation'>
        Python programming language basics and best practices
      </ContextItem>
    </KnowledgeBaseDocuments>
  </MentionedContext>
</Context>

Good Response:
React.js is a JavaScript library for building user interfaces, developed by Facebook. It uses a virtual DOM for efficient rendering and supports component-based architecture. (NO CITATIONS - Context not relevant to query)
  `;
};

export const buildLibrarySearchChatHistoryExamples = () => {
  return `
  ## Examples with Chat History
  
  1. Direct Query (No Chat History Relevance):
  <ChatHistory>
  <ChatHistoryItem type={human}>What's the best way to optimize database queries?</ChatHistoryItem>
  <ChatHistoryItem type={ai}>Here are several techniques for query optimization...</ChatHistoryItem>
  <ChatHistoryItem type={human}>What is our company's security policy?</ChatHistoryItem>
  </ChatHistory>
  <Context>
  <MentionedContext>
  <KnowledgeBaseDocuments>
  <ContextItem citationIndex='1' type='document' title='Security Guidelines'>
  All external access requires VPN. Two-factor authentication is mandatory for all systems.
  </ContextItem>
  </KnowledgeBaseDocuments>
  </MentionedContext>
  </Context>
  
  Good Response:
  According to our security guidelines, we require VPN for all external access and two-factor authentication is mandatory for all systems [citation:1]. (Note: Previous discussion about database optimization is irrelevant to current query)
  
  2. Follow-up Question with Context:
  <ChatHistory>
  <ChatHistoryItem type={human}>What deployment environments do we have?</ChatHistoryItem>
  <ChatHistoryItem type={ai}>We have development, staging, and production environments [citation:1].</ChatHistoryItem>
  <ChatHistoryItem type={human}>How do we deploy to staging?</ChatHistoryItem>
  </ChatHistory>
  <Context>
  <MentionedContext>
  <KnowledgeBaseDocuments>
  <ContextItem citationIndex='1' type='document' title='Environment Overview'>
  We maintain three environments: development, staging, and production.
  </ContextItem>
  <ContextItem citationIndex='2' type='document' title='Staging Deployment'>
  Staging deployment requires: 1) Passing all tests 2) Code review approval 3) QA sign-off
  </ContextItem>
  </MentionedContext>
  </Context>
  
  Good Response:
  For staging deployment, our process requires three key steps [citation:2]:
  1. All tests must pass
  2. Code review approval is needed
  3. QA must sign off on the changes
  
  3. Ambiguous Follow-up with Multiple Contexts:
  <ChatHistory>
  <ChatHistoryItem type={human}>What testing frameworks do we use?</ChatHistoryItem>
  <ChatHistoryItem type={ai}>We use Jest for unit testing and Cypress for E2E testing [citation:1].</ChatHistoryItem>
  <ChatHistoryItem type={human}>how do we use it?</ChatHistoryItem>
  </ChatHistory>
  <Context>
  <MentionedContext>
  <KnowledgeBaseDocuments>
  <ContextItem citationIndex='1' type='document' title='Testing Overview'>
  Our testing stack includes Jest (unit) and Cypress (E2E).
  </ContextItem>
  <ContextItem citationIndex='2' type='document' title='Jest Guide'>
  Jest tests are written in __tests__ directories. Run with 'npm test'.
  </ContextItem>
  <ContextItem citationIndex='3' type='document' title='Cypress Guide'>
  Cypress tests are in cypress/integration. Run with 'npm run e2e'.
  </ContextItem>
  </MentionedContext>
  </Context>
  
  Good Response:
  Based on our previous discussion about testing frameworks, I'll explain how we use both:
  
  Jest (Unit Testing) [citation:2]:
  - Tests are located in __tests__ directories
  - Run tests using 'npm test'
  
  Cypress (E2E Testing) [citation:3]:
  - Tests are in cypress/integration directory
  - Execute with 'npm run e2e'
  
  4. Generic Follow-up with Specific Context:
  <ChatHistory>
  <ChatHistoryItem type={human}>What's our API rate limiting policy?</ChatHistoryItem>
  <ChatHistoryItem type={ai}>Our APIs are limited to 1000 requests per minute per client [citation:1].</ChatHistoryItem>
  <ChatHistoryItem type={human}>tell me more</ChatHistoryItem>
  </ChatHistory>
  <Context>
  <MentionedContext>
  <KnowledgeBaseDocuments>
  <ContextItem citationIndex='1' type='document' title='API Limits'>
  Standard rate limit: 1000 requests/minute/client
  </ContextItem>
  <ContextItem citationIndex='2' type='document' title='API Details'>
  Rate limiting includes:
  - Burst protection
  - IP-based tracking
  - Custom limits for premium clients
  </ContextItem>
  </MentionedContext>
  </Context>
  
  Good Response:
  Expanding on our API rate limiting policy, we implement several additional features [citation:2]:
  - Burst protection to prevent sudden spikes
  - IP-based tracking for better security
  - Custom rate limits available for premium clients
    `;
};
