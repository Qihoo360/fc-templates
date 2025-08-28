import { Injectable } from '@nestjs/common';
import { WebSearchRequest, WebSearchResult, BatchWebSearchRequest } from '@refly/openapi-schema';
import { BaseWebSearcher } from './base';

/**
 * Response interface for Serper.dev API
 */
interface SerperSearchResult {
  searchParameters: {
    q: string;
    hl: string;
    type: string;
    num: number;
    location: string;
    engine: string;
    gl: string;
  };
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    sitelinks?: { title: string; link: string }[];
    position: number;
  }>;
  knowledgeGraph?: {
    title: string;
    type: string;
    description?: string;
    descriptionUrl?: string;
    website?: string;
    imageUrl?: string;
    attributes?: Record<string, string>;
  };
  answerBox?: {
    title?: string;
    url?: string;
    snippet?: string;
    answer?: string;
  };
  peopleAlsoAsk?: Array<{
    question: string;
    link: string;
    snippet: string;
    title: string;
  }>;
  relatedSearches?: Array<{
    query: string;
  }>;
}

/**
 * Serper.dev implementation of the web searcher
 */
@Injectable()
export class SerperWebSearcher extends BaseWebSearcher {
  private readonly apiEndpoint = 'https://google.serper.dev/search';

  /**
   * Perform web search using Serper.dev API.
   *
   * @param req The search request (single or batch)
   * @returns Web search results
   */
  async search(req: WebSearchRequest | BatchWebSearchRequest): Promise<WebSearchResult[]> {
    const limit = req?.limit || this.config.defaultLimit;

    try {
      const queries: WebSearchRequest[] = 'queries' in req ? req.queries : [req];
      const queryPayload = queries.map((query) => ({
        ...query,
        num: limit,
        gl: query.gl || this.config.defaultCountry,
        location: query.location || this.config.defaultLocation,
      }));

      // Call Serper API
      const res = await fetch(this.apiEndpoint, {
        method: 'post',
        headers: {
          'X-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryPayload),
      });

      if (!res.ok) {
        throw new Error(`Serper API returned ${res.status}: ${await res.text()}`);
      }

      const jsonContent = await res.json();
      const results = this.parseSearchResults(jsonContent);

      return 'queries' in req ? results : results?.slice(0, limit);
    } catch (error) {
      this.logger.error(`Web search error: ${error.stack}`);
      return this.defaultFallback(error);
    }
  }

  /**
   * Parse search results from Serper API
   *
   * @param jsonContent The JSON response from Serper API
   * @returns Processed web search results
   */
  private parseSearchResults(jsonContent: any): WebSearchResult[] {
    const contexts: WebSearchResult[] = [];

    if (Array.isArray(jsonContent)) {
      // Handle batch results
      for (const result of jsonContent) {
        contexts.push(...this.parseSingleSearchResult(result));
      }
    } else {
      // Handle single result
      contexts.push(...this.parseSingleSearchResult(jsonContent));
    }

    return contexts;
  }

  /**
   * Parse a single search result from Serper API
   *
   * @param result The Serper search result
   * @returns Processed web search results
   */
  private parseSingleSearchResult(result: SerperSearchResult): WebSearchResult[] {
    const contexts: WebSearchResult[] = [];
    const searchLocale = result.searchParameters?.hl || this.config.defaultLocale;

    // Extract knowledge graph results
    if (result.knowledgeGraph) {
      const url = result.knowledgeGraph.descriptionUrl || result.knowledgeGraph.website;
      const snippet = result.knowledgeGraph.description;
      if (url && snippet) {
        contexts.push({
          name: result.knowledgeGraph.title || '',
          url,
          snippet,
          locale: searchLocale,
        });
      }
    }

    // Extract answer box results
    if (result.answerBox) {
      const url = result.answerBox.url;
      const snippet = result.answerBox.snippet || result.answerBox.answer;
      if (url && snippet) {
        contexts.push({
          name: result.answerBox.title || '',
          url,
          snippet,
          locale: searchLocale,
        });
      }
    }

    // Extract organic search results
    if (result.organic?.length) {
      for (const item of result.organic) {
        contexts.push({
          name: item.title,
          url: item.link,
          snippet: item.snippet || '',
          locale: searchLocale,
        });
      }
    }

    return contexts;
  }
}
