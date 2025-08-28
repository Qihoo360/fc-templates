import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MonacoEditorProps } from './types';

// Fallback editor when Monaco fails to load - styled for code display
const FallbackEditor = ({
  content,
  onChange,
  readOnly,
  isGenerating,
  canvasReadOnly,
  language,
}: MonacoEditorProps) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  // Apply minimal syntax highlighting
  const getHighlightClass = () => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return 'bg-gray-50 text-blue-800 dark:bg-gray-900 dark:text-blue-100';
      case 'html':
        return 'bg-gray-50 text-red-800 dark:bg-gray-900 dark:text-red-100';
      case 'css':
        return 'bg-gray-50 text-purple-800 dark:bg-gray-900 dark:text-purple-100';
      default:
        return 'bg-gray-50 dark:bg-gray-900';
    }
  };

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded dark:border-gray-700">
      <div className="bg-blue-50 text-blue-800 px-4 py-2 text-sm flex items-center justify-between border-b border-gray-200 dark:bg-blue-900 dark:text-blue-100">
        <span>{t('codeArtifact.editor.fallbackMode')}</span>
        <span className="text-xs px-2 py-1 bg-blue-100 rounded dark:bg-blue-800">{language}</span>
      </div>
      <textarea
        ref={textareaRef}
        className={`w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 ${getHighlightClass()}`}
        value={content}
        onChange={handleChange}
        readOnly={readOnly || isGenerating || canvasReadOnly}
        style={{
          minHeight: '460px',
          lineHeight: '1.6',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        spellCheck="false"
      />
    </div>
  );
};

export default FallbackEditor;
