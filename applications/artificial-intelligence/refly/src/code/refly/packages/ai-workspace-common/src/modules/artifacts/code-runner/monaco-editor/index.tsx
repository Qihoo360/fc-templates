import { loader } from '@monaco-editor/react';
import { isBrowserEnv, PRIMARY_CDN } from './constants';
import MonacoEditorComponent from './MonacoEditorComponent';
import './index.scss';

// Configure Monaco loader with timeout option
if (isBrowserEnv) {
  try {
    // Set up feature detection for loader
    loader.config({
      paths: {
        vs: PRIMARY_CDN,
      },
      // Fix for language bundle loading issues
      'vs/nls': {
        availableLanguages: {},
      },
    });
  } catch (error) {
    console.error('Failed to configure Monaco loader:', error);
  }
}

export default MonacoEditorComponent;
