import { describe, it, expect } from 'vitest';
import { parse } from './parser.js';
import type { CrawlResult } from '@florexlabs/docs-to-mcp-types';

const makeResult = (html: string): CrawlResult => ({
  url: 'https://docs.example.com/page',
  title: 'Test Page',
  html,
  text: '',
});

describe('parse', () => {
  it('removes nav, footer, header, script, style', () => {
    const result = parse(
      makeResult(`
      <html><body>
        <nav>nav</nav>
        <header>header</header>
        <main><p>Content here</p></main>
        <footer>footer</footer>
        <script>alert(1)</script>
        <style>.x{}</style>
      </body></html>
    `),
    );
    expect(result.markdown).toContain('Content here');
    expect(result.markdown).not.toContain('nav');
    expect(result.markdown).not.toContain('footer');
    expect(result.markdown).not.toContain('alert');
  });

  it('prefers main content', () => {
    const result = parse(
      makeResult(`
      <html><body>
        <div>Sidebar stuff</div>
        <main><h1>Main Content</h1><p>Important text</p></main>
      </body></html>
    `),
    );
    expect(result.markdown).toContain('Main Content');
    expect(result.markdown).toContain('Important text');
  });

  it('converts headings to ATX style', () => {
    const result = parse(
      makeResult('<html><body><main><h2>Section</h2></main></body></html>'),
    );
    expect(result.markdown).toContain('## Section');
  });

  it('preserves code blocks', () => {
    const result = parse(
      makeResult(
        '<html><body><main><pre><code>const x = 1;</code></pre></main></body></html>',
      ),
    );
    expect(result.markdown).toContain('const x = 1;');
  });

  it('preserves URL and title', () => {
    const result = parse(
      makeResult('<html><body><p>text</p></body></html>'),
    );
    expect(result.url).toBe('https://docs.example.com/page');
    expect(result.title).toBe('Test Page');
  });
});
