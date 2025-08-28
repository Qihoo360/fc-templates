import { Source } from '@refly/openapi-schema';

// Mock search steps that match the search process
export const mockSearchSteps = [
  {
    step: 'rewriteQuery',
    duration: 234,
    result: {
      rewrittenQueries: ['how to use React hooks', 'React hooks tutorial'],
      outputLocale: 'en',
      searchLocales: ['en', 'zh-CN', 'ja'],
    },
  },
  {
    step: 'translateQuery',
    duration: 456,
    result: {
      translatedQueries: {
        en: ['how to use React hooks', 'React hooks tutorial'],
        'zh-CN': ['如何使用 React hooks', 'React hooks 教程'],
        ja: ['React フックの使い方', 'React フックのチュートリアル'],
      },
    },
  },
  {
    step: 'webSearch',
    duration: 789,
    result: {
      length: 15,
      localeLength: 3,
    },
  },
  {
    step: 'translateResults',
    duration: 678,
    result: {
      length: 15,
      localeLength: 3,
    },
  },
  {
    step: 'rerank',
    duration: 345,
    result: {
      length: 10,
    },
  },
  {
    step: 'finish',
    duration: 2502,
  },
];

// Mock search results that match the Source type
export const mockResults: Source[] = [
  {
    url: 'https://react.dev/learn/hooks-overview',
    title: 'React Hooks Overview',
    pageContent:
      'Hooks are functions that let you "hook into" React state and lifecycle features from function components. Hooks don\'t work inside classes — they let you use React without classes.',
    score: 0.95,
    metadata: {
      publishedTime: '2023-12-01',
      entityId: '1',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/reference/react/useState',
    title: 'useState Hook Reference',
    pageContent:
      'useState is a React Hook that lets you add a state variable to your component. const [state, setState] = useState(initialState)',
    score: 0.92,
    metadata: {
      publishedTime: '2023-11-15',
      entityId: '2',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/useeffect',
    title: 'useEffect Hook Guide',
    pageContent:
      'The Effect Hook lets you perform side effects in function components. Data fetching, subscriptions, or manually changing the DOM are all examples of side effects.',
    score: 0.88,
    metadata: {
      publishedTime: '2023-10-20',
      entityId: '3',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/usememo',
    title: 'useMemo Hook Performance Guide',
    pageContent:
      'useMemo is a React Hook that lets you cache the result of a calculation between re-renders. It helps optimize expensive calculations and prevent unnecessary re-renders.',
    score: 0.87,
    metadata: {
      publishedTime: '2023-10-15',
      entityId: '4',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/usecallback',
    title: 'useCallback Hook Guide',
    pageContent:
      'useCallback is a React Hook that lets you cache a function definition between re-renders. It is useful when passing callbacks to optimized child components.',
    score: 0.85,
    metadata: {
      publishedTime: '2023-10-10',
      entityId: '5',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/useref',
    title: 'useRef Hook Deep Dive',
    pageContent:
      'useRef returns a mutable ref object that persists for the full lifetime of the component. Commonly used to access DOM elements directly.',
    score: 0.84,
    metadata: {
      publishedTime: '2023-09-28',
      entityId: '6',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/usecontext',
    title: 'Context and useContext Guide',
    pageContent:
      'Context provides a way to pass data through the component tree without having to pass props manually at every level. useContext is the hook to consume context.',
    score: 0.82,
    metadata: {
      publishedTime: '2023-09-20',
      entityId: '7',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/usereducer',
    title: 'useReducer State Management',
    pageContent:
      'useReducer is usually preferable to useState when you have complex state logic that involves multiple sub-values or when the next state depends on the previous one.',
    score: 0.81,
    metadata: {
      publishedTime: '2023-09-15',
      entityId: '8',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/custom-hooks',
    title: 'Building Custom Hooks',
    pageContent:
      'Custom Hooks let you extract component logic into reusable functions. They start with "use" and can call other hooks. Perfect for sharing logic between components.',
    score: 0.79,
    metadata: {
      publishedTime: '2023-09-10',
      entityId: '9',
      entityType: 'tutorial',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-testing',
    title: 'Testing Hooks with React Testing Library',
    pageContent:
      'Learn how to properly test React hooks using React Testing Library. Includes examples of testing useState, useEffect, and custom hooks.',
    score: 0.77,
    metadata: {
      publishedTime: '2023-09-05',
      entityId: '10',
      entityType: 'tutorial',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-rules',
    title: 'Rules of Hooks',
    pageContent:
      'Hooks must be called at the top level of your components. They cannot be called inside loops, conditions, or nested functions. This ensures hooks work correctly.',
    score: 0.75,
    metadata: {
      publishedTime: '2023-08-30',
      entityId: '11',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-data-fetching',
    title: 'Data Fetching with Hooks',
    pageContent:
      'Learn patterns for fetching data with React hooks. Covers loading states, error handling, and how to properly clean up effects.',
    score: 0.73,
    metadata: {
      publishedTime: '2023-08-25',
      entityId: '12',
      entityType: 'tutorial',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-performance',
    title: 'Hook Performance Optimization',
    pageContent:
      'Optimize your React components using hooks like useMemo and useCallback. Learn when to use them and common performance pitfalls to avoid.',
    score: 0.71,
    metadata: {
      publishedTime: '2023-08-20',
      entityId: '13',
      entityType: 'tutorial',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-typescript',
    title: 'Using Hooks with TypeScript',
    pageContent:
      'Best practices for using React hooks with TypeScript. Learn about proper typing for useState, useEffect, and custom hooks.',
    score: 0.69,
    metadata: {
      publishedTime: '2023-08-15',
      entityId: '14',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-debugging',
    title: 'Debugging React Hooks',
    pageContent:
      'Common debugging techniques for React hooks. Learn how to use React DevTools and debugging strategies for hook-related issues.',
    score: 0.67,
    metadata: {
      publishedTime: '2023-08-10',
      entityId: '15',
      entityType: 'tutorial',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-migration',
    title: 'Migrating to Hooks',
    pageContent:
      'Guide for migrating class components to function components with hooks. Includes patterns for converting lifecycle methods to useEffect.',
    score: 0.65,
    metadata: {
      publishedTime: '2023-08-05',
      entityId: '16',
      entityType: 'guide',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-composition',
    title: 'Hook Composition Patterns',
    pageContent:
      'Advanced patterns for composing multiple hooks together. Learn how to build complex custom hooks by combining simpler ones.',
    score: 0.63,
    metadata: {
      publishedTime: '2023-07-30',
      entityId: '17',
      entityType: 'guide',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-testing-library',
    title: 'Testing Library Hook Testing',
    pageContent:
      'Comprehensive guide to testing React hooks using the @testing-library/react-hooks package. Includes real-world testing scenarios.',
    score: 0.61,
    metadata: {
      publishedTime: '2023-07-25',
      entityId: '18',
      entityType: 'documentation',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-ecosystem',
    title: 'React Hooks Ecosystem',
    pageContent:
      'Overview of popular third-party hooks and hook libraries in the React ecosystem. Includes when and how to use them effectively.',
    score: 0.59,
    metadata: {
      publishedTime: '2023-07-20',
      entityId: '19',
      entityType: 'guide',
      originalLocale: 'en',
      translatedDisplayLocale: 'ja',
    },
  },
  {
    url: 'https://react.dev/learn/hooks-best-practices',
    title: 'React Hooks Best Practices',
    pageContent:
      'Collection of best practices and common patterns when working with React hooks. Includes real-world examples and anti-patterns to avoid.',
    score: 0.57,
    metadata: {
      publishedTime: '2023-07-15',
      entityId: '20',
      entityType: 'guide',
      originalLocale: 'en',
      translatedDisplayLocale: 'zh-CN',
    },
  },
];
