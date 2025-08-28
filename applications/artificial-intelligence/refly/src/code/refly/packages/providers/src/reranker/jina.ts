import { SearchResult } from '@refly/openapi-schema';
import { BaseReranker } from './base';

/**
 * Response interface for Jina Reranker API
 */
interface JinaRerankerResponse {
  results: {
    document: { text: string };
    relevance_score: number;
  }[];
}

/**
 * Jina-specific implementation of the reranker
 */
export class JinaReranker extends BaseReranker {
  private readonly apiEndpoint = 'https://api.jina.ai/v1/rerank';

  /**
   * Rerank search results using Jina Reranker.
   *
   * @param query The user query
   * @param results The search results to rerank
   * @param options Additional options for reranking
   * @returns Reranked search results
   */
  async rerank(
    query: string,
    results: SearchResult[],
    options?: {
      topN?: number;
      relevanceThreshold?: number;
      modelId?: string;
    },
  ): Promise<SearchResult[]> {
    const topN = options?.topN || this.config.topN;
    const relevanceThreshold = options?.relevanceThreshold || this.config.relevanceThreshold;
    const model = options?.modelId || this.config.modelId;

    // Create a map to reference original results by their combined snippets
    const contentMap = new Map<string, SearchResult>();
    for (const r of results) {
      contentMap.set(r.snippets.map((s) => s.text).join('\n\n'), r);
    }

    // Prepare payload for Jina API
    const payload = JSON.stringify({
      query,
      model,
      top_n: topN,
      documents: Array.from(contentMap.keys()),
    });

    try {
      // Call Jina API
      const res = await fetch(this.apiEndpoint, {
        method: 'post',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!res.ok) {
        throw new Error(`Jina API returned ${res.status}: ${await res.text()}`);
      }

      const data: JinaRerankerResponse = await res.json();

      // Process results and filter by relevance threshold
      return data.results
        .filter((r) => r.relevance_score >= relevanceThreshold)
        .map((r) => {
          const originalResult = contentMap.get(r.document.text);
          return {
            ...originalResult,
            relevanceScore: r.relevance_score, // Add relevance score to the result
          } as SearchResult;
        });
    } catch (e) {
      console.error(`Reranker failed, fallback to default: ${e.stack}`);
      // Use the fallback from the base class
      return this.defaultFallback(results);
    }
  }
}
