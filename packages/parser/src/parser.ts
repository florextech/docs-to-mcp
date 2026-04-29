import { load } from 'cheerio';
import TurndownService from 'turndown';
import type { CrawlResult, ParsedDocument } from '@florexlabs/docs-to-mcp-types';

const REMOVE_SELECTORS = [
  'nav', 'footer', 'header', 'aside', 'script', 'style', 'noscript',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  '.sidebar', '.nav', '.menu', '.ads', '.advertisement', '.cookie-banner',
].join(', ');

const CONTENT_SELECTORS = ['main', 'article', '[role="main"]', '.content', '.docs-content', '#content'];

export function parse(result: CrawlResult): ParsedDocument {
  const $ = load(result.html);
  $(REMOVE_SELECTORS).remove();

  let contentHtml = '';
  for (const sel of CONTENT_SELECTORS) {
    const el = $(sel);
    if (el.length) {
      contentHtml = el.html() ?? '';
      break;
    }
  }
  if (!contentHtml) contentHtml = $('body').html() ?? '';

  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  td.addRule('preserveTables', {
    filter: ['table'],
    replacement(_content, node) {
      return '\n\n' + (node as unknown as HTMLElement).outerHTML + '\n\n';
    },
  });

  const markdown = td.turndown(contentHtml).trim();

  return {
    url: result.url,
    title: result.title,
    markdown,
  };
}
