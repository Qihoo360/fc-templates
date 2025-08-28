import { z } from 'zod';

// Define the schema for rewrite output
export const rewriteQueryOutputSchema = z
  .object({
    analysis: z
      .object({
        queryAnalysis: z.string().describe('Understanding of the search intent'),
        queryRewriteStrategy: z.string().describe('Strategy for query optimization'),
      })
      .describe('Analysis of the search query'),

    queries: z
      .object({
        rewrittenQueries: z
          .array(z.string())
          .describe('Original query rewritten into focused aspects'),
      })
      .describe('Generated queries for search execution'),
  })
  .describe('Query analysis and rewrite result');

export const examples = `
## Example Input/Output

# Example 1: Technical Query
Input:
Query: Python Django 框架怎么实现 JWT authentication?

Output:
{
  "analysis": {
    "queryAnalysis": "Technical query about JWT authentication implementation in Django framework",
    "queryRewriteStrategy": "Break down into implementation and configuration aspects"
  },
  "queries": {
    "rewrittenQueries": [
      "Python Django 框架实现 JWT authentication",
      "Django JWT 认证的配置方法",
      "Django 框架的身份验证实现"
    ]
  }
}

# Example 2: Learning Resource Query
Input:
Query: What is the best way to learn Japanese?

Output:
{
  "analysis": {
    "queryAnalysis": "Query seeking advice on Japanese language learning methods",
    "queryRewriteStrategy": "Break down into specific aspects of language learning"
  },
  "queries": {
    "rewrittenQueries": [
      "What is the best way to learn Japanese?",
      "Most effective Japanese learning methods",
      "Japanese language learning tips and strategies"
    ]
  }
}`;

export const buildRewriteQuerySystemPrompt = () => `
# Query Analysis and Rewrite Assistant

## Core Capabilities
1. Query Analysis
   - Understand main search intent
   - Identify key aspects to cover
   - Consider domain-specific context
   - Handle technical terms appropriately

2. Query Rewriting
   - Break down complex queries
   - Generate focused sub-queries
   - Maintain original search intent
   - Optimize for search effectiveness
   - Preserve technical terms

## Technical Term Handling
1. Technical Terms
   - Preserve original form when appropriate
   - Maintain consistency across rewrites
   - Consider industry standard terminology

2. Mixed Content
   - Handle technical terms appropriately
   - Maintain proper context
   - Ensure search effectiveness

## Output Format
1. Analysis Section
   - Clear query intent analysis
   - Detailed rewrite strategy

2. Queries Section
   - Multiple focused rewrites
   - Preserved technical terms
   - Optimized search patterns

${examples}`;

export const buildRewriteQueryUserPrompt = ({ query }: { query: string }) => `
## Search Parameters
Query: ${query}

Please provide a comprehensive analysis including:
1. Query Intent Analysis
   - Main search purpose
   - Key concepts and terms
   - Technical or domain context

2. Optimized Search Queries
   - Multiple focused aspects
   - Key concept variations
   - Search pattern optimization

Remember to:
- Preserve technical terms and proper nouns
- Consider search engine patterns
- Maintain query intent across rewrites
- Optimize for search effectiveness
`;
