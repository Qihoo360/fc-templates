import { EditSection, EditResult } from './types';

// Helper function to extract content around selection
// TODO:  should handled in frontend
export const extractContentAroundSelection = (
  content: string,
  selection: { startIndex: number; endIndex: number },
  contextWindow = 500,
) => {
  const start = Math.max(0, selection.startIndex - contextWindow);
  const end = Math.min(content.length, selection.endIndex + contextWindow);

  return {
    beforeHighlight: content.slice(start, selection.startIndex),
    highlightedText: content.slice(selection.startIndex, selection.endIndex),
    afterHighlight: content.slice(selection.endIndex, end),
    // Add original positions for later reference
    originalPositions: {
      contextStart: start,
      selectionStart: selection.startIndex,
      selectionEnd: selection.endIndex,
      contextEnd: end,
    },
  };
};

// Helper function to extract edit sections from response
export const extractEditSections = (
  content: string,
  selectedContent?: ReturnType<typeof extractContentAroundSelection>,
): EditSection[] => {
  try {
    const editMatch = content.match(/<reflyEdit>([\s\S]*?)<\/reflyEdit>/);
    if (!editMatch) return [];

    const editResult = JSON.parse(editMatch[1]) as EditResult;

    if (selectedContent) {
      // If we have selectedContent, we need to adjust the indices
      return editResult.sections.map((section) => ({
        ...section,
        // Adjust indices relative to the original document
        startIndex: selectedContent.originalPositions.selectionStart,
        endIndex: selectedContent.originalPositions.selectionEnd,
        originalContent: selectedContent.highlightedText,
        // Keep the updated content as is
        updatedContent: section.updated.content,
      }));
    }

    return editResult.sections;
  } catch (error) {
    console.error('Failed to parse edit sections:', error);
    return [];
  }
};

// Helper function to extract thinking process from response
export const extractThinking = (content: string): string | null => {
  const thinkingMatch = content.match(/<reflyThinking>([\s\S]*?)<\/reflyThinking>/);
  return thinkingMatch ? thinkingMatch[1].trim() : null;
};
