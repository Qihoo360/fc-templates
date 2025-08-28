import { BaseMessageChunk } from '@langchain/core/messages';
import { extractChunkContent } from './llm';

// Create a minimal mock type that only includes the properties we need for testing
type MockChunk = {
  content:
    | string
    | Array<{
        type: string;
        text?: string;
        reasoningText?: { text?: string };
        [key: string]: any; // Allow additional properties for testing
      }>;
  additional_kwargs?: {
    reasoning_content?: any;
  };
};

describe('extractChunkContent', () => {
  describe('when chunk.content is a string', () => {
    it('should extract string content and reasoning content from additional_kwargs', () => {
      const mockChunk: MockChunk = {
        content: 'Hello, world!',
        additional_kwargs: {
          reasoning_content: 'This is reasoning content',
        },
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: 'This is reasoning content',
      });
    });

    it('should handle undefined reasoning content', () => {
      const mockChunk: MockChunk = {
        content: 'Hello, world!',
        additional_kwargs: {},
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: undefined,
      });
    });

    it('should handle missing additional_kwargs', () => {
      const mockChunk: MockChunk = {
        content: 'Hello, world!',
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: undefined,
      });
    });

    it('should convert non-string reasoning content to string', () => {
      const mockChunk: MockChunk = {
        content: 'Hello, world!',
        additional_kwargs: {
          reasoning_content: 123,
        },
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: '123',
      });
    });
  });

  describe('when chunk.content is an array', () => {
    it('should extract text content from array items', () => {
      const mockChunk: MockChunk = {
        content: [
          { type: 'text', text: 'Hello, ' },
          { type: 'text', text: 'world!' },
        ],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: '',
      });
    });

    it('should extract reasoning content from array items', () => {
      const mockChunk: MockChunk = {
        content: [
          { type: 'reasoning_content', reasoningText: { text: 'This is reasoning' } },
          { type: 'reasoning_content', reasoningText: { text: ' content' } },
        ],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: '',
        reasoningContent: 'This is reasoning content',
      });
    });

    it('should handle mixed content types', () => {
      const mockChunk: MockChunk = {
        content: [
          { type: 'text', text: 'Hello, ' },
          { type: 'reasoning_content', reasoningText: { text: 'This is reasoning' } },
          { type: 'text', text: 'world!' },
          { type: 'reasoning_content', reasoningText: { text: ' content' } },
        ],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: 'This is reasoning content',
      });
    });

    it('should handle undefined reasoningText', () => {
      const mockChunk: MockChunk = {
        content: [
          { type: 'reasoning_content', reasoningText: undefined },
          { type: 'reasoning_content', reasoningText: { text: ' content' } },
        ],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: '',
        reasoningContent: ' content',
      });
    });

    it('should handle undefined reasoningText.text', () => {
      const mockChunk: MockChunk = {
        content: [
          { type: 'reasoning_content', reasoningText: { text: undefined } },
          { type: 'reasoning_content', reasoningText: { text: ' content' } },
        ],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: '',
        reasoningContent: ' content',
      });
    });

    it('should handle unknown item types', () => {
      const mockChunk: MockChunk = {
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'unknown_type', someProperty: 'value' },
          { type: 'reasoning_content', reasoningText: { text: 'reasoning' } },
        ],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello',
        reasoningContent: 'reasoning',
      });
    });

    it('should handle empty array', () => {
      const mockChunk: MockChunk = {
        content: [],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: '',
        reasoningContent: '',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null reasoning content', () => {
      const mockChunk: MockChunk = {
        content: 'Hello, world!',
        additional_kwargs: {
          reasoning_content: null,
        },
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: undefined,
      });
    });

    it('should handle empty string reasoning content', () => {
      const mockChunk: MockChunk = {
        content: 'Hello, world!',
        additional_kwargs: {
          reasoning_content: '',
        },
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello, world!',
        reasoningContent: '',
      });
    });

    it('should handle empty text in array items', () => {
      const mockChunk: MockChunk = {
        content: [
          { type: 'text', text: '' },
          { type: 'text', text: 'Hello' },
          { type: 'text', text: '' },
        ],
      };

      const result = extractChunkContent(mockChunk as BaseMessageChunk);

      expect(result).toEqual({
        content: 'Hello',
        reasoningContent: '',
      });
    });
  });
});
