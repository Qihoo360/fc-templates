import { CodeArtifactType } from '@refly/openapi-schema';

// Function to map CodeArtifactType to appropriate Monaco editor language
export const getLanguageFromType = (type: CodeArtifactType, language: string): string => {
  const languageMap: Record<string, string> = {
    'application/refly.artifacts.react': 'typescript',
    'image/svg+xml': 'xml',
    'application/refly.artifacts.mermaid': 'markdown',
    'text/markdown': 'markdown',
    'application/refly.artifacts.code': language,
    'text/html': 'html',
    'application/refly.artifacts.mindmap': 'json',
  };

  return languageMap[type] ?? language;
};

// Primary CDN URL
export const PRIMARY_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs'; // Use older version that's more stable
// Fallback CDN URL #1
export const FALLBACK_CDN2 = 'https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.36.1/min/vs'; // Alternative CDN
// Fallback CDN URL #2
export const FALLBACK_CDN3 = 'https://unpkg.com/monaco-editor@0.30.1/min/vs'; // Last resort CDN

// Maximum number of CDN fallback attempts
export const MAX_LOAD_ATTEMPTS = 4;

// Check if we're in browser environment
export const isBrowserEnv = typeof window !== 'undefined';
