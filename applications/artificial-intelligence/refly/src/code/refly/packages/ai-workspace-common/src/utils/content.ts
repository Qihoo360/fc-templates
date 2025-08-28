/**
 * Utility functions for content handling
 */

/**
 * Maximum number of characters allowed for node content preview
 */
export const MAX_CONTENT_PREVIEW_LENGTH = 1000;

/**
 * Truncates content to a maximum length
 * @param content The content to truncate
 * @param maxLength Maximum length of the content
 * @returns Truncated content
 */
export const truncateContent = (
  content: string,
  maxLength = MAX_CONTENT_PREVIEW_LENGTH,
): string => {
  if (!content) return '';
  if (content.length <= maxLength) return content;

  return `${content.substring(0, maxLength)}...`;
};

/**
 * Removes all tool_use tags and their content from a string
 * @param content The content to process
 * @returns Content with all tool_use tags removed
 */
export const removeToolUseTags = (content: string): string => {
  if (!content) return '';

  // Remove all <tool_use> tags and their content (global match)
  const toolUseRegex = /<tool_use>[\s\S]*?<\/tool_use>/g;
  return content.replace(toolUseRegex, '');
};

/**
 * Processes an array of content strings, joins them, and truncates to max length
 * @param contents Array of content strings
 * @param separator Separator to use when joining content
 * @param maxLength Maximum length of the resulting content
 * @returns Truncated joined content
 */
export const processContentPreview = (
  contents: (string | undefined)[] = [],
  separator = '\n',
  maxLength = MAX_CONTENT_PREVIEW_LENGTH,
): string => {
  const filteredContents = contents.filter(Boolean) as string[];

  // Remove tool_use tags from each content item
  const processedContents = filteredContents.map(removeToolUseTags);

  const joinedContent = processedContents.join(separator);
  return truncateContent(joinedContent, maxLength);
};
