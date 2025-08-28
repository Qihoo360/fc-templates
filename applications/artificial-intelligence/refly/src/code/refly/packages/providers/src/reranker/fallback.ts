import { SearchResult } from '@refly/openapi-schema';
import { BaseReranker } from './base';

/**
 * FallbackReranker implementation that applies simple scoring based on original result order
 * Used as a backup when more sophisticated rerankers fail
 */
export class FallbackReranker extends BaseReranker {
  /**
   * Reranks search results using a simple fallback strategy
   * Maintains original order but adds default relevance scores
   *
   * @param query The user query (not used in fallback implementation)
   * @param results The search results to rerank
   * @param options Additional options (topN: limit results, relevanceThreshold: minimum score)
   * @returns Reranked search results with simple scoring
   */
  async rerank(
    _query: string,
    results: SearchResult[],
    options?: {
      topN?: number;
      relevanceThreshold?: number;
    },
  ): Promise<SearchResult[]> {
    // Apply the fallback ranking strategy from base class
    const rerankedResults = this.defaultFallback(results);

    // Apply additional filtering based on options
    let finalResults = [...rerankedResults];

    // Filter by relevance threshold if specified
    if (options?.relevanceThreshold !== undefined) {
      finalResults = finalResults.filter(
        (result) => (result.relevanceScore ?? 0) >= (options.relevanceThreshold ?? 0),
      );
    }

    // Limit to top N results if specified
    if (options?.topN !== undefined && options.topN > 0) {
      finalResults = finalResults.slice(0, options.topN);
    }

    return finalResults;
  }
}
