# @refly/utils

Refly Code Utils - A collection of utility functions for the Refly project.

## Testing

This package uses Vitest for unit testing.

### Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage (requires @vitest/coverage-v8)
pnpm test:coverage
```

### Test Structure

Tests are located in `src/**/*.test.ts` files alongside the source code they test.

## Available Functions

### `aggregateTokenUsage`

Aggregates token usage items by model name, summing input and output tokens for each unique model.

**Parameters:**
- `usageItems: TokenUsageItem[]` - Array of token usage items to aggregate

**Returns:**
- `TokenUsageItem[]` - Aggregated token usage items

**Example:**
```typescript
import { aggregateTokenUsage } from '@refly/utils';

const usage = [
  { modelName: 'gpt-4', modelProvider: 'openai', inputTokens: 100, outputTokens: 50 },
  { modelName: 'gpt-4', modelProvider: 'openai', inputTokens: 200, outputTokens: 75 }
];

const aggregated = aggregateTokenUsage(usage);
// Result: [{ modelName: 'gpt-4', modelProvider: 'openai', inputTokens: 300, outputTokens: 125 }]
```

## Development

### Adding New Functions

1. Create the function in the appropriate file under `src/`
2. Export it from `src/index.ts`
3. Add comprehensive unit tests in a `.test.ts` file
4. Update this README with documentation

### Testing Guidelines

- Write tests for all edge cases and error conditions
- Use descriptive test names that explain the expected behavior
- Test both valid and invalid inputs
- Ensure 100% function coverage
- Follow the existing test patterns and structure 