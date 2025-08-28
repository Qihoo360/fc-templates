/**
 * 1. beforeHighlight and afterHighlight may be empty
 * 2. before reflyThinking and after reflyDocument should be summary of the content
 * 3. block content may contains multiple other blocks and should be follow user's instruction
 * 4. response's reflyDocument title should be the same as context's reflyDocument title
 */
export const noContextExamples = `
## Examples

<example index="1">
<query>
Add a comprehensive section about microservices architecture
</query>
<context>
<reflyArtifact identifier="tech-doc" type="document" title="System Architecture">
## System Overview
Our system uses modern cloud architecture.
<highlight></highlight>
## Deployment
</reflyArtifact>
</context>
<response>
## Microservices Architecture

Our microservices architecture follows industry best practices while incorporating custom optimizations for our specific needs.

### Core Principles
1. Service Independence
   - Autonomous deployment cycles
   - Independent scaling capabilities
   - Isolated failure domains

2. Communication Patterns
   - REST APIs for synchronous operations
   - Message queues for asynchronous processes
   - Event-driven architecture for complex workflows

### Implementation Details
[Note: Would continue with detailed implementation specifics, examples, and diagrams]
</response>
</example>

<example index="2">
<query>
Add API authentication code examples
</query>
<context>
<reflyArtifact identifier="api-docs" type="document" title="API Guide">
## Authentication Overview
<highlight></highlight>
## Endpoints
</reflyArtifact>
</context>
<response>
### Authentication Examples

Below are complete examples of API authentication in various languages:

#### JavaScript/Node.js
\`\`\`javascript
const authenticateAPI = async () => {
  // Authentication implementation
}
\`\`\`

#### Python
\`\`\`python
def authenticate_api():
    # Authentication implementation
\`\`\`

[Note: Would continue with more examples and detailed explanations, extending to appropriate length]
</response>
</example>`;

// contextualExamples.ts - 新增上下文相关的示例
export const contextualExamples = `
## Context-Aware Examples

<example index="1">
<context>
<documentContext>
<reflyArtifact identifier="tech-doc" type="document" title="System Architecture">
## System Overview
Our platform serves millions of users globally.

<highlight></highlight>

## Deployment Strategy
Our deployment process follows GitOps principles.
</reflyArtifact>
</documentContext>

<referenceContext>
<MentionedContext>
<UserSelectedContent>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='1' type='document' title='Best Practices'>
Modern microservices best practices include:
- Service isolation
- Independent scaling
- API-first design
</ContextItem>
...
</KnowledgeBaseDocuments>
</MentionedContext>
<OtherContext>
<KnowledgeBaseResources>
<ContextItem citationIndex='2' type='resource' title='Best Practices'>
Modern microservices best practices include:
- Service isolation
- Independent scaling
- API-first design
</ContextItem>
...
</KnowledgeBaseResources>
...
</OtherContext>
</referenceContext>
</context>

<query>
Add a section about microservices architecture
</query>
<response>
## Microservices Architecture

Our transition from a monolithic architecture to microservices will incorporate industry-standard patterns while following best practices.

### Architecture Evolution
- Current: Tightly coupled components with centralized processing
- Future: Service mesh architecture with independent scaling

### Implementation Strategy
1. Service Boundaries
   - API-first design approach
   - Circuit breaker implementation
   - Event-driven communication patterns

[Note: Would continue with detailed implementation specifics]
</response>
</example>

<example index="2">
<context>
<documentContext>
<reflyArtifact identifier="api-docs" type="document" title="API Authentication Guide">
## Security Overview
Our API requires secure authentication.

<highlight></highlight>

## API Endpoints
All endpoints require authentication.
</reflyArtifact>
</documentContext>

<referenceContext>
<MentionedContext>
</MentionedContext>
<OtherContext>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='1' type='document' title='Security Requirements'>
Security requirements for our API:
- Multi-factor authentication
- Rate limiting
- Request encryption
</ContextItem>
</KnowledgeBaseDocuments>
...
</OtherContext>
</referenceContext>
</context>

<query>
Add API authentication code examples
</query>
<response>
### Authentication Implementation

Our authentication system implements OAuth 2.0 best practices while meeting internal security requirements.

#### JavaScript Implementation
\`\`\`javascript
const authenticateAPI = async () => {
  // Token-based authentication with MFA
  const token = await getOAuthToken();
  await verifyMFA();
  // Implement rate limiting
  if (await checkRateLimit()) {
    throw new Error('Rate limit exceeded');
  }
}
\`\`\`

#### Python Implementation
\`\`\`python
def authenticate_api():
    # Secure token handling
    token = rotate_oauth_token()  # Regular rotation
    # Request encryption
    encrypted_request = encrypt_payload(request)
\`\`\`
</response>
</example>

<example index="3">
<chatHistory>
<ChatHistoryItem type="human">What's our deployment strategy?</ChatHistoryItem>
<ChatHistoryItem type="ai">We use GitOps with automated CI/CD pipelines .</ChatHistoryItem>
<ChatHistoryItem type="human">Can you update our deployment docs to reflect this?</ChatHistoryItem>
</chatHistory>
<context>
<documentContext>
<reflyArtifact type="document" title="Deployment Guide">
## Overview
<highlight>We manually deploy using FTP.</highlight>
## Release Process
</reflyArtifact>
</documentContext>
<referenceContext>
<MentionedContext>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='1' type='document' title='DevOps Update'>
New GitOps deployment process:
- ArgoCD for continuous deployment
- GitHub Actions for CI
- Automated rollbacks
</ContextItem>
</KnowledgeBaseDocuments>
</MentionedContext>
</referenceContext>
</context>
<response>
## Overview

We implement a modern GitOps deployment strategy using ArgoCD for continuous deployment and GitHub Actions for CI pipelines . This automated approach ensures:
- Consistent deployments across environments
- Version control for infrastructure
- Automated rollback capabilities
</response>
</example>

<example index="4">
<chatHistory>
<ChatHistoryItem type="human">Tell me about our database architecture.</ChatHistoryItem>
<ChatHistoryItem type="ai">We use a distributed PostgreSQL cluster with read replicas .</ChatHistoryItem>
<ChatHistoryItem type="human">And what about our caching strategy?</ChatHistoryItem>
<ChatHistoryItem type="ai">We implement Redis for distributed caching with a multi-tier strategy .</ChatHistoryItem>
<ChatHistoryItem type="human">Please update the database section to include both details.</ChatHistoryItem>
</chatHistory>
<context>
<documentContext>
<reflyArtifact type="document" title="System Architecture">
## Database Layer
<highlight>We use a single MySQL database.</highlight>
## Application Layer
</reflyArtifact>
</documentContext>
<referenceContext>
<MentionedContext>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='1' type='document' title='Database Architecture'>
PostgreSQL cluster configuration:
- Primary node for writes
- Multiple read replicas
- Automated failover
</ContextItem>
<ContextItem citationIndex='2' type='document' title='Caching Strategy'>
Redis implementation:
- L1: Application-level cache
- L2: Distributed Redis cluster
- Cache invalidation patterns
</ContextItem>
</KnowledgeBaseDocuments>
</MentionedContext>
</referenceContext>
</context>
<response>
## Database Layer

Our data infrastructure combines a distributed PostgreSQL cluster with a multi-tier caching strategy:

### Primary Database
We utilize a distributed PostgreSQL cluster with multiple read replicas and automated failover capabilities .

### Caching Layer
The system implements a sophisticated Redis-based caching solution with multiple tiers:
- Application-level caching for frequent requests
- Distributed Redis cluster for shared state
- Intelligent cache invalidation mechanisms 
</response>
</example>

<example index="5">
<chatHistory>
<ChatHistoryItem type="human">What monitoring tools do we use?</ChatHistoryItem>
<ChatHistoryItem type="ai">We use Prometheus and Grafana for metrics, with ELK stack for logs .</ChatHistoryItem>
<ChatHistoryItem type="human">Update the monitoring section and include alert thresholds.</ChatHistoryItem>
</chatHistory>
<context>
<documentContext>
<reflyArtifact type="document" title="Operations Guide">
## Monitoring
<highlight>Basic server monitoring with ping checks.</highlight>
## Maintenance
</reflyArtifact>
</documentContext>
<referenceContext>
<MentionedContext>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='1' type='document' title='Monitoring Setup'>
Monitoring stack:
- Prometheus for metrics collection
- Grafana dashboards
- ELK for log aggregation
</ContextItem>
<ContextItem citationIndex='2' type='document' title='Alert Thresholds'>
Standard thresholds:
- CPU: 80% utilization
- Memory: 90% usage
- Disk: 85% full
- Response time: >500ms
</ContextItem>
</KnowledgeBaseDocuments>
</MentionedContext>
</referenceContext>
</context>
<response>
## Monitoring

Our comprehensive monitoring infrastructure combines metrics, logging, and alerting:

### Monitoring Stack
We utilize industry-standard tools for complete observability :
- Prometheus for real-time metrics collection
- Grafana for visualization and dashboards
- ELK stack for centralized logging

### Alert Thresholds
System alerts are configured with the following thresholds :
- CPU utilization: 80%
- Memory usage: 90%
- Disk capacity: 85%
- Service response time: 500ms
</response>
</example>
`;
