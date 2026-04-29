import { chromium, type Browser } from 'playwright';
import type { CrawlResult } from '@florexlabs/docs-to-mcp-types';
import { normalizeUrl, shouldFollow } from './utils.js';

export interface CrawlOptions {
  depth?: number;
  limit?: number;
  verbose?: boolean;
}

export async function crawl(
  startUrl: string,
  options: CrawlOptions = {},
): Promise<CrawlResult[]> {
  const { depth = 3, limit = 50, verbose = false } = options;
  const visited = new Set<string>();
  const results: CrawlResult[] = [];
  const queue: { url: string; currentDepth: number }[] = [
    { url: normalizeUrl(startUrl), currentDepth: 0 },
  ];

  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'docs-to-mcp-crawler/0.1',
    });

    while (queue.length > 0 && results.length < limit) {
      const item = queue.shift()!;
      if (visited.has(item.url) || item.currentDepth > depth) continue;
      visited.add(item.url);

      if (verbose) console.log(`[crawl] ${item.url}`);

      try {
        const page = await context.newPage();
        await page.goto(item.url, {
          waitUntil: 'domcontentloaded',
          timeout: 15_000,
        });

        const title = await page.title();
        const html = await page.content();
        const text = await page.innerText('body').catch(() => '');
        const canonical = await page
          .$eval('link[rel="canonical"]', (el) =>
            el.getAttribute('href'),
          )
          .catch(() => null);

        results.push({
          url: item.url,
          canonicalUrl: canonical ?? undefined,
          title,
          html,
          text,
        });

        if (item.currentDepth < depth) {
          const hrefs = await page.$$eval('a[href]', (anchors) =>
            anchors.map((a) => a.getAttribute('href')).filter(Boolean),
          );
          for (const href of hrefs as string[]) {
            if (!shouldFollow(item.url, href)) continue;
            const resolved = normalizeUrl(new URL(href, item.url).href);
            if (!visited.has(resolved)) {
              queue.push({ url: resolved, currentDepth: item.currentDepth + 1 });
            }
          }
        }

        await page.close();
      } catch (err) {
        if (verbose) console.warn(`[crawl] failed: ${item.url}`, err);
      }
    }
  } finally {
    await browser?.close();
  }

  return results;
}
