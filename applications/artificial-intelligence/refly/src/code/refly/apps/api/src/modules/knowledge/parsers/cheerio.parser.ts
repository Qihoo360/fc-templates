import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseParser, ParserOptions, ParseResult } from './base';
import { PandocParser } from './pandoc.parser';

interface CheerioOptions extends ParserOptions {
  fetchTimeout?: number;
}

@Injectable()
export class CheerioParser extends BaseParser {
  private readonly fetchTimeout: number;
  private readonly pandocParser: PandocParser;
  private readonly logger = new Logger(CheerioParser.name);

  name = 'cheerio';

  constructor(options: CheerioOptions = {}) {
    super(options);
    this.fetchTimeout = options.fetchTimeout ?? 30000; // Default timeout: 30 seconds
    this.pandocParser = new PandocParser({
      format: 'html',
      extractMedia: true,
      ...options,
    });
  }

  async parse(input: string | Buffer): Promise<ParseResult> {
    if (this.options.mockMode) {
      return {
        content: 'Mocked cheerio content',
        metadata: { source: 'cheerio' },
      };
    }

    const url = input.toString();

    try {
      // Fetch the HTML content
      const response = await this.fetchWithTimeout(url, this.fetchTimeout);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      const html = await response.text();

      // Use cheerio to clean up the HTML
      const $ = cheerio.load(html);

      // Remove script, style and other non-content elements
      $(
        'script, style, meta, link, noscript, iframe, nav, footer, header, aside, [role="banner"], [role="navigation"]',
      ).remove();

      // Extract title
      const title = $('title').text().trim() || $('h1').first().text().trim();

      // Default to body content
      const mainElement = $('body');

      // Get the cleaned HTML for the main content
      const cleanedHtml = mainElement.html() || '';

      // Use PandocParser to convert HTML to markdown
      const pandocResult = await this.pandocParser.parse(cleanedHtml);

      // Combine results
      return {
        title,
        content: pandocResult.content,
        images: pandocResult.images,
        metadata: {
          source: 'cheerio',
          url,
          ...pandocResult.metadata,
        },
      };
    } catch (error) {
      this.logger.error(`Error parsing content with cheerio: ${(error as Error).message}`);
      return this.handleError(error as Error);
    }
  }

  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReflyBot/1.0)',
        },
      });
      return response;
    } finally {
      clearTimeout(id);
    }
  }
}
