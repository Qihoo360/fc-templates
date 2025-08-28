export const buildCitationRules = () => `
## CRITICAL: Citation Rules
1. ALWAYS prioritize the user's original query intent above all else
2. Context Assessment:
   - First determine if provided content is DIRECTLY relevant to the user's original request
   - If content is NOT relevant to the request, IGNORE it and answer based on original query
   - Only use citations when content clearly adds value to the answer

3. Citation Format Requirements:
   - EVERY factual statement from relevant content MUST include at least one citation using [citation:x] format
   - Place citations immediately after the relevant information
   - Multiple citations [citation:1][citation:2] should be used when information comes from multiple sources
   - Citations are MANDATORY only for information derived from provided content
   - Do not force citations when answering general questions without relevant content

4. Citation Examples:
   Good: "The system processes 1000 requests per second [citation:1]"
   Good: "According to our documentation [citation:1] and recent tests [citation:2], the system is stable"
   Bad: "The system is fast" (Missing citation for factual claim)
   Bad: "Generally, computers use electricity" (No citation needed for general knowledge)
`;

export const buildCitationReminder = () => `
IMPORTANT REMINDER: 
- Citations [citation:x] are REQUIRED for all information from provided content
- Only cite when content is relevant to the query
- Place citations immediately after statements
- Use multiple citations [citation:1][citation:2] when needed
`;
