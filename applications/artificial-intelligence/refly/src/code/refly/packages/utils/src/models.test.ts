import { describe, it, expect } from 'vitest';
import { aggregateTokenUsage } from './models';
import type { TokenUsageItem } from '@refly/openapi-schema';

describe('aggregateTokenUsage', () => {
  it('should return empty array for empty input', () => {
    const result = aggregateTokenUsage([]);
    expect(result).toEqual([]);
  });

  it('should return empty array for array with null/undefined items', () => {
    const input = [null, undefined] as unknown as TokenUsageItem[];
    const result = aggregateTokenUsage(input);
    expect(result).toEqual([]);
  });

  it('should aggregate single item correctly', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 100,
      outputTokens: 50,
    });
  });

  it('should aggregate multiple items with same model name', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 200,
        outputTokens: 75,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 150,
        outputTokens: 25,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 450, // 100 + 200 + 150
      outputTokens: 150, // 50 + 75 + 25
    });
  });

  it('should aggregate multiple items with different model names', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
      {
        modelName: 'claude-3',
        modelProvider: 'anthropic',
        inputTokens: 200,
        outputTokens: 75,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 150,
        outputTokens: 25,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(2);

    // Find gpt-4 result
    const gpt4Result = result.find((item) => item.modelName === 'gpt-4');
    expect(gpt4Result).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 250, // 100 + 150
      outputTokens: 75, // 50 + 25
    });

    // Find claude-3 result
    const claudeResult = result.find((item) => item.modelName === 'claude-3');
    expect(claudeResult).toEqual({
      modelName: 'claude-3',
      modelProvider: 'anthropic',
      inputTokens: 200,
      outputTokens: 75,
    });
  });

  it('should handle items with zero tokens', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 0,
        outputTokens: 0,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 100, // 0 + 100
      outputTokens: 50, // 0 + 50
    });
  });

  it('should preserve model provider from first occurrence', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'anthropic', // Different provider
        inputTokens: 200,
        outputTokens: 75,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0].modelProvider).toBe('openai'); // Should preserve first occurrence
    expect(result[0].inputTokens).toBe(300); // 100 + 200
    expect(result[0].outputTokens).toBe(125); // 50 + 75
  });

  it('should handle mixed valid and invalid items', () => {
    const input = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
      null, // Invalid item
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 200,
        outputTokens: 75,
      },
      undefined, // Invalid item
    ] as unknown as TokenUsageItem[];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 300, // 100 + 200
      outputTokens: 125, // 50 + 75
    });
  });

  it('should handle large numbers correctly', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 1000000,
        outputTokens: 500000,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 2000000,
        outputTokens: 750000,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 3000000, // 1000000 + 2000000
      outputTokens: 1250000, // 500000 + 750000
    });
  });

  it('should maintain order of model names in output', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'claude-3',
        modelProvider: 'anthropic',
        inputTokens: 100,
        outputTokens: 50,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 200,
        outputTokens: 75,
      },
      {
        modelName: 'claude-3',
        modelProvider: 'anthropic',
        inputTokens: 150,
        outputTokens: 25,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(2);

    // Order should be based on first occurrence
    expect(result[0].modelName).toBe('claude-3');
    expect(result[1].modelName).toBe('gpt-4');
  });

  it('should handle negative token values', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: -50,
        outputTokens: -25,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 50, // -50 + 100
      outputTokens: 25, // -25 + 50
    });
  });

  it('should handle decimal token values', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 100.5,
        outputTokens: 50.25,
      },
      {
        modelName: 'gpt-4',
        modelProvider: 'openai',
        inputTokens: 200.75,
        outputTokens: 75.5,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: 'gpt-4',
      modelProvider: 'openai',
      inputTokens: 301.25, // 100.5 + 200.75
      outputTokens: 125.75, // 50.25 + 75.5
    });
  });

  it('should handle empty model names', () => {
    const input: TokenUsageItem[] = [
      {
        modelName: '',
        modelProvider: 'openai',
        inputTokens: 100,
        outputTokens: 50,
      },
      {
        modelName: '',
        modelProvider: 'anthropic',
        inputTokens: 200,
        outputTokens: 75,
      },
    ];

    const result = aggregateTokenUsage(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      modelName: '',
      modelProvider: 'openai', // Should preserve first occurrence
      inputTokens: 300, // 100 + 200
      outputTokens: 125, // 50 + 75
    });
  });
});
