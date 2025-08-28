export const buildQueryProcessAndChatHistoryInstructions = () => {
  return `
  ## Query Processing with Chat History
1. First check if the current query is a follow-up to previous exchanges
2. For follow-up questions:
- Reference previous knowledge base citations when expanding on a topic
- Maintain consistency with previously provided information
- Clearly indicate when adding new knowledge base sources
3. For new queries:
- Start fresh while remaining aware of conversation context
- Consider previous topics for better context understanding

## Chat History Handling
1. ALWAYS consider the full conversation history when interpreting queries
2. For follow-up questions:
- Look for references to previous exchanges
- Maintain context continuity
- Resolve pronouns and references based on chat history
3. When encountering short queries like "tell me more" or "what about X":
- Check previous exchanges for context
- Build upon previous explanations
- Maintain topical consistency

## Chat History Handling
1. ALWAYS consider the full conversation history when interpreting queries
2. For follow-up questions:
- Look for references to previous exchanges
- Maintain context continuity
- Resolve pronouns and references based on chat history
3. When encountering short queries like "tell me more" or "what about X":
- Check previous exchanges for context
- Build upon previous explanations
- Maintain topical consistency
  `;
};

export const CHAT_HISTORY_EXAMPLES = `
### Example Conversations (For Training Only):
1. Translation Pattern:
   Human: "What is dependency injection?"
   Assistant: "依赖注入是一种软件设计模式，它允许我们将对象的创建和使用分离..."
   Human: "translate to english"
   Assistant: "Dependency injection is a software design pattern that allows us to separate the creation and usage of objects..."

2. Elaboration Pattern:
   Human: "What is Docker?"
   Assistant: "Docker是一个容器化平台，用于打包和运行应用程序..."
   Human: "tell me more"
   Assistant: [Expands on previous Docker explanation with more technical details and use cases]

3. Reference Resolution Pattern:
   Human: "What are the key features of Python?"
   Assistant: [Lists Python features like readability, dynamic typing, etc.]
   Human: "How do these compare with JavaScript?"
   Assistant: [Compares previously mentioned Python features with JavaScript equivalents]

4. Clarification Pattern:
   Human: "How does authentication work?"
   Assistant: [Explains basic authentication concepts]
   Human: "What about OAuth?"
   Assistant: [Explains OAuth while relating it to the previous authentication explanation]
`;

export const buildChatHistoryRules = () => {
  return `
  ## Chat History Handling:

  1. Conversation Context Awareness:
     - Always consider the full conversation history when interpreting queries
     - Identify if the current query is a follow-up question
     - Maintain context continuity across multiple exchanges
     - Resolve pronouns and references based on chat history

  2. Follow-up Question Handling:
     - When encountering short queries like "translate this" or "explain more", always check previous exchanges
     - For translation requests, look for the most recent content that needs translation
     - For clarification requests, reference your previous explanation
     - If context is ambiguous, politely ask for clarification
  `;
};

export const chatHistoryReminder = () => {
  return `
  ## Important Instructions

- Consider the FULL chat history when interpreting this query
- If this appears to be a follow-up question (e.g., "translate this", "tell me more", "what about X"), refer to the previous exchanges
- For translation requests, translate the most recently discussed content
- For elaboration requests, expand on your previous explanation
- If the query is ambiguous, check chat history before asking for clarification
  `;
};
