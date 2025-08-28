import { BaseMessageChunk } from '@langchain/core/messages';

interface ChunkContent {
  content: string;
  reasoningContent?: string;
}

/**
 * Extract the content and reasoning content from a Langchain message chunk.
 * @param chunk - The chunk to extract the content and reasoning content from
 * @returns The content and reasoning content
 */
export const extractChunkContent = (chunk: BaseMessageChunk): ChunkContent => {
  if (typeof chunk.content === 'string') {
    return {
      content: chunk.content,
      reasoningContent: chunk.additional_kwargs?.reasoning_content?.toString(),
    };
  }

  // Then content is an array of complex objects
  let content = '';
  let reasoningContent = '';

  for (const item of chunk.content) {
    if (item.type === 'text') {
      content += item.text;
    } else if (item.type === 'reasoning_content') {
      reasoningContent += item.reasoningText?.text ?? '';
    }
  }

  return {
    content,
    reasoningContent,
  };
};
