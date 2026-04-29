import { describe, it, expect } from 'vitest';
import { chunk } from './chunker.js';
import type { ParsedDocument } from '@florexlabs/docs-to-mcp-types';

const doc: ParsedDocument = {
  url: 'https://docs.example.com/guide',
  title: 'Guide',
  markdown: `# Introduction

This is the intro paragraph with enough content to be a valid chunk.

## Getting Started

Follow these steps to get started with the project setup.

### Installation

Run npm install to install all dependencies for the project.

## Configuration

Configure the project by editing the config file with your settings.`,
};

describe('chunk', () => {
  it('splits by headings', () => {
    const chunks = chunk(doc);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('preserves heading metadata', () => {
    const chunks = chunk(doc);
    const headings = chunks.map((c) => c.metadata.heading).filter(Boolean);
    expect(headings).toContain('Introduction');
    expect(headings).toContain('Getting Started');
  });

  it('preserves source URL', () => {
    const chunks = chunk(doc);
    for (const c of chunks) {
      expect(c.metadata.url).toBe('https://docs.example.com/guide');
    }
  });

  it('preserves title', () => {
    const chunks = chunk(doc);
    for (const c of chunks) {
      expect(c.metadata.title).toBe('Guide');
    }
  });

  it('generates unique IDs', () => {
    const chunks = chunk(doc);
    const ids = new Set(chunks.map((c) => c.id));
    expect(ids.size).toBe(chunks.length);
  });

  it('respects maxSize', () => {
    const chunks = chunk(doc, { maxSize: 100 });
    for (const c of chunks) {
      expect(c.content.length).toBeLessThanOrEqual(150); // some tolerance for heading line
    }
  });

  it('filters tiny chunks', () => {
    const tinyDoc: ParsedDocument = {
      url: 'https://example.com',
      title: 'T',
      markdown: '# H\n\nok',
    };
    const chunks = chunk(tinyDoc, { minSize: 100 });
    expect(chunks.length).toBe(0);
  });
});
