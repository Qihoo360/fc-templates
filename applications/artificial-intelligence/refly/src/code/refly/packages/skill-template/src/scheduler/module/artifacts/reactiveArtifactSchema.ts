import { z } from 'zod';

export const REACTIVE_ARTIFACT_TOOL_SCHEMA = z.object({
  type: z
    .literal('react-component')
    .describe('The type of the reactive artifact being generated, always "react-component".'),

  language: z
    .enum(['typescript', 'javascript'])
    .describe('The programming language of the artifact. Should be "typescript" or "javascript".'),

  componentType: z
    .enum(['functional', 'class'])
    .optional()
    .describe('The type of React component to generate. Default is "functional".'),

  visualizationType: z
    .enum([
      'chart',
      'graph',
      'dashboard',
      'mindmap',
      'diagram',
      'interactive-ui',
      'animation',
      'other',
    ])
    .describe('The type of visualization the component represents.'),

  dataStructure: z
    .string()
    .optional()
    .describe(
      'Brief description of the data structure the component will visualize or manipulate.',
    ),

  artifact: z
    .string()
    .describe(
      'The actual React component code with all required imports, types, and implementations.',
    ),

  title: z
    .string()
    .describe('A short, descriptive title for the component. Should be less than 5 words.'),

  dependencies: z
    .array(z.string())
    .optional()
    .describe('List of external dependencies required by the component, if any.'),

  description: z
    .string()
    .optional()
    .describe('A brief description of what the component does and how to use it.'),

  isOptimized: z
    .boolean()
    .default(true)
    .describe(
      'Whether the component has been optimized for performance with React.memo, useMemo, useCallback, etc.',
    ),
});

export type ReactiveArtifactProps = z.infer<typeof REACTIVE_ARTIFACT_TOOL_SCHEMA>;
