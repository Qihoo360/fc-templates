/**
 * Process polyfill for browser environments
 * This is used to provide a 'process' global that some libraries expect to exist
 */

// Simply providing minimal process shim
// @ts-ignore - Ignoring type errors to create a simple shim
if (typeof window !== 'undefined') {
  // @ts-ignore - Using any to bypass strict type checking
  window.process = window.process || {
    env: {},
    version: '0.0.0',
  };
}

export {};
