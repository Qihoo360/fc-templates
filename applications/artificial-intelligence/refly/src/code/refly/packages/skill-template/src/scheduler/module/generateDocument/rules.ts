export const commonNote = () => `
Note: 
1. The <response> tags below are only used to structure these examples. DO NOT include these tags in your actual output.
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
